const { openDatabaseSync } = require('expo-sqlite');

const db = openDatabaseSync('nutrition.db');

async function test() {
  try {
    console.log('Creating tables...');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS coach_questions (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        question TEXT NOT NULL,
        inputType TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        synced INTEGER NOT NULL DEFAULT 0,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Inserting test data...');
    await db.runAsync(
      `INSERT OR REPLACE INTO coach_questions (id, userId, question, inputType, createdAt, synced)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['test-1', 'user-1', 'Test question', 'text', new Date().toISOString(), 0]
    );
    
    console.log('Querying data...');
    const result = await db.getFirstAsync(
      `SELECT * FROM coach_questions WHERE id = ?`,
      ['test-1']
    );
    
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
