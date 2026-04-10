export interface BloodWorkResult {
  hemoglobin: number;
  hematocrit: number;
  whiteBloodCells: number;
  platelets: number;
  glucose: number;
  creatinine: number;
  urea: number;
  totalProtein: number;
  albumin: number;
  cholesterol: number;
  triglycerides: number;
  ldl: number;
  hdl: number;
  iron: number;
  magnesium: number;
  calcium: number;
  potassium: number;
  sodium: number;
  chloride: number;
  phosphorus: number;
  albumin_globulin_ratio: number;
  ast: number;
  alt: number;
  ggt: number;
  alkaline_phosphatase: number;
  bilirubin: number;
  testDate: Date;
  laboratory: string;
  referenceValues: Record<string, { min: number; max: number }>;
}

export async function parseBloodWorkPDF(pdfPath: string): Promise<BloodWorkResult> {
  // PDF parsing stub - would use pdf-parse library
  return {
    hemoglobin: 15.2,
    hematocrit: 45.6,
    whiteBloodCells: 7.2,
    platelets: 250,
    glucose: 95,
    creatinine: 0.9,
    urea: 20,
    totalProtein: 7.2,
    albumin: 4.0,
    cholesterol: 180,
    triglycerides: 100,
    ldl: 100,
    hdl: 50,
    iron: 100,
    magnesium: 2.3,
    calcium: 9.5,
    potassium: 4.2,
    sodium: 138,
    chloride: 102,
    phosphorus: 3.5,
    albumin_globulin_ratio: 1.5,
    ast: 28,
    alt: 32,
    ggt: 35,
    alkaline_phosphatase: 60,
    bilirubin: 0.8,
    testDate: new Date(),
    laboratory: 'Lab Name',
    referenceValues: {
      hemoglobin: { min: 13.5, max: 17.5 },
      glucose: { min: 70, max: 100 },
    },
  };
}

export function analyzeBloodWork(results: BloodWorkResult): {
  healthScore: number;
  alerts: string[];
  recommendations: string[];
} {
  const alerts: string[] = [];
  const recommendations: string[] = [];
  let healthScore = 100;

  // Hemoglobin check
  if (results.hemoglobin < 13.5) {
    alerts.push('Düşük hemoglobin - anemi riski');
    healthScore -= 15;
    recommendations.push('Demir alımını artır, doktor danışmanı');
  }
  if (results.hemoglobin > 17.5) {
    healthScore -= 5;
  }

  // Glucose check
  if (results.glucose > 100 && results.glucose < 126) {
    alerts.push('Yüksek açlık glukozu - prediabetes riski');
    healthScore -= 10;
    recommendations.push('Kardio artır, şeker tüketimini azalt');
  }
  if (results.glucose >= 126) {
    alerts.push('UYARI: Yüksek glukozu - doktor danışmanı gerekli');
    healthScore -= 25;
  }

  // Cholesterol check
  if (results.cholesterol > 200) {
    alerts.push('Yüksek kolesterol');
    healthScore -= 10;
    recommendations.push('Lemak tüketimini azalt, aerobik egzersiz yap');
  }

  // Triglycerides check
  if (results.triglycerides > 150) {
    alerts.push('Yüksek trigliserit');
    healthScore -= 8;
    recommendations.push('Karbohidrat ve alkol azalt');
  }

  // Creatinine check (kidney)
  if (results.creatinine > 1.2) {
    alerts.push('Yüksek kreatinin - böbrek fonksiyonu kontrol et');
    healthScore -= 15;
    recommendations.push('Doktor danışmanı, protein tüketimini kontrol et');
  }

  // Liver markers
  if (results.alt > 40 || results.ast > 40) {
    alerts.push('Yüksek karaciğer enzimleri');
    healthScore -= 10;
    recommendations.push('Alkol tüketimini azalt, doktor danışmanı');
  }

  // Protein check
  if (results.totalProtein < 6.0) {
    alerts.push('Düşük toplam protein - beslenme problemi');
    healthScore -= 12;
    recommendations.push('Protein alımını artır (tavuk, balık, yumurta)');
  }

  // Iron check
  if (results.iron < 60) {
    alerts.push('Düşük demir seviyeleri');
    healthScore -= 10;
    recommendations.push('Demir açısından zengin gıdalar tüket (kırmızı et, spinat)');
  }

  // Normalize score
  healthScore = Math.max(0, Math.min(100, healthScore));

  return { healthScore, alerts, recommendations };
}
