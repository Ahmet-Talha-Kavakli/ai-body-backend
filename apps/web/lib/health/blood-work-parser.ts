export interface BloodWorkResult {
  testName: string;
  value: number;
  unit: string;
  referenceRange?: string;
  isAbnormal: boolean;
}

export interface BloodWorkAnalysis {
  testDate: Date;
  results: BloodWorkResult[];
  summary: {
    totalTests: number;
    abnormalCount: number;
    keyMetrics: {
      hemoglobin?: number;
      creatinine?: number;
      glucose?: number;
      cholesterol?: number;
      ldl?: number;
      hdl?: number;
      triglycerides?: number;
    };
  };
}

export class BloodWorkParser {
  /**
   * Parse blood work data from text
   */
  static parseFromText(text: string): BloodWorkAnalysis {
    const results: BloodWorkResult[] = [];

    // Common blood work patterns
    const patterns = [
      {
        name: "hemoglobin",
        regex: /hemoglobin[:\s]+([0-9.]+)\s*(g\/dL|g\/dl)/i,
        unit: "g/dL",
        normalRange: [13.5, 17.5],
      },
      {
        name: "creatinine",
        regex: /creatinine[:\s]+([0-9.]+)\s*(mg\/dL|mg\/dl)/i,
        unit: "mg/dL",
        normalRange: [0.74, 1.35],
      },
      {
        name: "glucose",
        regex: /glucose[:\s]+([0-9.]+)\s*(mg\/dL|mg\/dl)/i,
        unit: "mg/dL",
        normalRange: [70, 100],
      },
      {
        name: "total_cholesterol",
        regex:
          /(?:total\s+)?cholesterol[:\s]+([0-9.]+)\s*(mg\/dL|mg\/dl)/i,
        unit: "mg/dL",
        normalRange: [0, 200],
      },
      {
        name: "ldl",
        regex: /ldl[:\s]+([0-9.]+)\s*(mg\/dL|mg\/dl)/i,
        unit: "mg/dL",
        normalRange: [0, 100],
      },
      {
        name: "hdl",
        regex: /hdl[:\s]+([0-9.]+)\s*(mg\/dL|mg\/dl)/i,
        unit: "mg/dL",
        normalRange: [40, 300],
      },
      {
        name: "triglycerides",
        regex: /triglycerides[:\s]+([0-9.]+)\s*(mg\/dL|mg\/dl)/i,
        unit: "mg/dL",
        normalRange: [0, 150],
      },
    ];

    const keyMetrics: any = {};

    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match) {
        const value = parseFloat(match[1]);
        const isAbnormal =
          value < pattern.normalRange[0] || value > pattern.normalRange[1];

        results.push({
          testName: pattern.name,
          value,
          unit: pattern.unit,
          referenceRange: `${pattern.normalRange[0]}-${pattern.normalRange[1]}`,
          isAbnormal,
        });

        keyMetrics[pattern.name] = value;
      }
    }

    // Try to extract date
    const dateMatch = text.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/);
    const testDate = dateMatch
      ? new Date(dateMatch[0])
      : new Date();

    return {
      testDate,
      results,
      summary: {
        totalTests: results.length,
        abnormalCount: results.filter((r) => r.isAbnormal).length,
        keyMetrics,
      },
    };
  }

  /**
   * Generate health insights from blood work
   */
  static generateInsights(analysis: BloodWorkAnalysis): string[] {
    const insights: string[] = [];

    const metrics = analysis.summary.keyMetrics;

    if (metrics.hemoglobin && metrics.hemoglobin < 12) {
      insights.push(
        "Low hemoglobin detected. Consider iron supplementation and consult your doctor."
      );
    }

    if (metrics.glucose && metrics.glucose > 125) {
      insights.push(
        "Elevated glucose. Focus on cardiovascular training and reduced sugar intake."
      );
    }

    if (
      metrics.ldl &&
      metrics.ldl > 130 &&
      metrics.ldl - (metrics.hdl || 40) > 90
    ) {
      insights.push(
        "Unfavorable cholesterol ratio. Increase aerobic exercise and reduce saturated fats."
      );
    }

    if (metrics.triglycerides && metrics.triglycerides > 200) {
      insights.push(
        "Elevated triglycerides. Reduce alcohol and refined carbohydrate intake."
      );
    }

    if (metrics.creatinine && metrics.creatinine > 1.2) {
      insights.push(
        "Elevated creatinine. Ensure adequate hydration and monitor kidney function."
      );
    }

    if (insights.length === 0) {
      insights.push("Blood work looks good overall! Keep up your training.");
    }

    return insights;
  }
}

export function createBloodWorkParser(): typeof BloodWorkParser {
  return BloodWorkParser;
}
