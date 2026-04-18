import { openDatabaseSync } from 'expo-sqlite'
import type { MealLog, FoodItem } from '../types/nutrition'

const db = openDatabaseSync('nutrition.db')

export async function createNutritionTables(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS meal_logs (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      mealType TEXT NOT NULL,
      totalCalories REAL NOT NULL,
      totalProteinG REAL NOT NULL,
      totalCarbsG REAL NOT NULL,
      totalFatG REAL NOT NULL,
      totalFiberG REAL NOT NULL,
      loggedAt TEXT NOT NULL,
      aiAnalyzed INTEGER NOT NULL,
      photoUrl TEXT,
      photoPath TEXT,
      notes TEXT,
      synced INTEGER NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meal_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mealLogId TEXT NOT NULL,
      name TEXT NOT NULL,
      calories REAL NOT NULL,
      proteinG REAL NOT NULL,
      carbsG REAL NOT NULL,
      fatG REAL NOT NULL,
      fiberG REAL NOT NULL,
      glycemicIndex REAL,
      allergens TEXT,
      portionSize REAL,
      portionUnit TEXT,
      barcode TEXT,
      servingSize REAL,
      servingSizeUnit TEXT,
      FOREIGN KEY (mealLogId) REFERENCES meal_logs(id)
    );

    CREATE TABLE IF NOT EXISTS recent_foods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      calories REAL NOT NULL,
      proteinG REAL NOT NULL,
      carbsG REAL NOT NULL,
      fatG REAL NOT NULL,
      fiberG REAL NOT NULL,
      glycemicIndex REAL,
      allergens TEXT,
      portionSize REAL,
      portionUnit TEXT,
      barcode TEXT,
      servingSize REAL,
      servingSizeUnit TEXT,
      lastUsed TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_meal_logs_userId ON meal_logs(userId);
    CREATE INDEX IF NOT EXISTS idx_meal_logs_loggedAt ON meal_logs(loggedAt);
    CREATE INDEX IF NOT EXISTS idx_meal_items_mealLogId ON meal_items(mealLogId);
  `)
}

export async function saveMealLog(log: MealLog): Promise<void> {
  await db.withTransactionAsync(async () => {
    // Save meal log
    await db.runAsync(
      `INSERT OR REPLACE INTO meal_logs
       (id, userId, mealType, totalCalories, totalProteinG, totalCarbsG, totalFatG, totalFiberG, loggedAt, aiAnalyzed, photoUrl, photoPath, notes, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        log.id,
        log.userId,
        log.mealType,
        log.totalCalories,
        log.totalProteinG,
        log.totalCarbsG,
        log.totalFatG,
        log.totalFiberG,
        log.loggedAt,
        log.aiAnalyzed ? 1 : 0,
        log.photoUrl || null,
        log.photoPath || null,
        log.notes || null,
        log.synced ? 1 : 0,
      ]
    )

    // Save meal items
    for (const item of log.items) {
      await db.runAsync(
        `INSERT INTO meal_items
         (mealLogId, name, calories, proteinG, carbsG, fatG, fiberG, glycemicIndex, allergens, portionSize, portionUnit, barcode, servingSize, servingSizeUnit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          log.id,
          item.name,
          item.calories,
          item.proteinG,
          item.carbsG,
          item.fatG,
          item.fiberG,
          item.glycemicIndex || null,
          item.allergens ? JSON.stringify(item.allergens) : null,
          item.portionSize || null,
          item.portionUnit || null,
          item.barcode || null,
          item.servingSize || null,
          item.servingSizeUnit || null,
        ]
      )
    }
  })
}

export async function getMealLogsForDate(date: string): Promise<MealLog[]> {
  const results = await db.getAllAsync(
    `SELECT * FROM meal_logs WHERE date(loggedAt) = ? ORDER BY loggedAt DESC`,
    [date]
  )

  const meals: MealLog[] = []

  for (const row of results as any[]) {
    const items = await db.getAllAsync(`SELECT * FROM meal_items WHERE mealLogId = ?`, [row.id])

    meals.push({
      id: row.id,
      userId: row.userId,
      mealType: row.mealType,
      items: items.map((item: any) => ({
        name: item.name,
        calories: item.calories,
        proteinG: item.proteinG,
        carbsG: item.carbsG,
        fatG: item.fatG,
        fiberG: item.fiberG,
        glycemicIndex: item.glycemicIndex,
        allergens: item.allergens ? JSON.parse(item.allergens) : undefined,
        portionSize: item.portionSize,
        portionUnit: item.portionUnit,
        barcode: item.barcode,
        servingSize: item.servingSize,
        servingSizeUnit: item.servingSizeUnit,
      })),
      totalCalories: row.totalCalories,
      totalProteinG: row.totalProteinG,
      totalCarbsG: row.totalCarbsG,
      totalFatG: row.totalFatG,
      totalFiberG: row.totalFiberG,
      loggedAt: row.loggedAt,
      aiAnalyzed: row.aiAnalyzed === 1,
      photoUrl: row.photoUrl,
      photoPath: row.photoPath,
      notes: row.notes,
      synced: row.synced === 1,
    })
  }

  return meals
}

export async function deleteMealLog(id: string): Promise<void> {
  await db.withTransactionAsync(async () => {
    // Delete items first
    await db.runAsync(`DELETE FROM meal_items WHERE mealLogId = ?`, [id])
    // Delete meal log
    await db.runAsync(`DELETE FROM meal_logs WHERE id = ?`, [id])
  })
}

export async function addRecentFood(food: FoodItem): Promise<void> {
  await db.runAsync(
    `INSERT INTO recent_foods
     (name, calories, proteinG, carbsG, fatG, fiberG, glycemicIndex, allergens, portionSize, portionUnit, barcode, servingSize, servingSizeUnit)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      food.name,
      food.calories,
      food.proteinG,
      food.carbsG,
      food.fatG,
      food.fiberG,
      food.glycemicIndex || null,
      food.allergens ? JSON.stringify(food.allergens) : null,
      food.portionSize || null,
      food.portionUnit || null,
      food.barcode || null,
      food.servingSize || null,
      food.servingSizeUnit || null,
    ]
  )
}

export async function getRecentFoods(limit: number = 50): Promise<FoodItem[]> {
  const results = await db.getAllAsync(
    `SELECT * FROM recent_foods ORDER BY lastUsed DESC LIMIT ?`,
    [limit]
  )

  return results.map((row: any) => ({
    name: row.name,
    calories: row.calories,
    proteinG: row.proteinG,
    carbsG: row.carbsG,
    fatG: row.fatG,
    fiberG: row.fiberG,
    glycemicIndex: row.glycemicIndex,
    allergens: row.allergens ? JSON.parse(row.allergens) : undefined,
    portionSize: row.portionSize,
    portionUnit: row.portionUnit,
    barcode: row.barcode,
    servingSize: row.servingSize,
    servingSizeUnit: row.servingSizeUnit,
  }))
}
