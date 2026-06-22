import type { ElderTrend } from "../types";

export const mockTrends: ElderTrend[] = [
  {
    elderId: "E001",
    points: [
      { date: "06/04", steps: 2280, sleepHours: 6.8, medicationOnTimeRate: 1, riskLevel: "stable" },
      { date: "06/05", steps: 2110, sleepHours: 6.4, medicationOnTimeRate: 1, riskLevel: "stable" },
      { date: "06/06", steps: 2360, sleepHours: 6.7, medicationOnTimeRate: 1, riskLevel: "stable" },
      { date: "06/07", steps: 1980, sleepHours: 6.3, medicationOnTimeRate: 0.9, riskLevel: "observation" },
      { date: "06/08", steps: 2180, sleepHours: 6.6, medicationOnTimeRate: 1, riskLevel: "stable" },
      { date: "06/09", steps: 2140, sleepHours: 6.4, medicationOnTimeRate: 0.95, riskLevel: "stable" },
      { date: "今日", steps: 820, sleepHours: 4.8, medicationOnTimeRate: 0.5, riskLevel: "attention" },
    ],
  },
  {
    elderId: "E002",
    points: [
      { date: "06/04", steps: 1640, sleepHours: 6.1, medicationOnTimeRate: 1, riskLevel: "stable" },
      { date: "06/05", steps: 1705, sleepHours: 6.4, medicationOnTimeRate: 0.9, riskLevel: "stable" },
      { date: "06/06", steps: 1550, sleepHours: 5.9, medicationOnTimeRate: 0.9, riskLevel: "observation" },
      { date: "06/07", steps: 1760, sleepHours: 6.3, medicationOnTimeRate: 1, riskLevel: "stable" },
      { date: "06/08", steps: 1660, sleepHours: 5.8, medicationOnTimeRate: 0.9, riskLevel: "observation" },
      { date: "06/09", steps: 1740, sleepHours: 6.0, medicationOnTimeRate: 1, riskLevel: "stable" },
      { date: "今日", steps: 1180, sleepHours: 4.4, medicationOnTimeRate: 1, riskLevel: "attention" },
    ],
  },
  {
    elderId: "E003",
    points: [
      { date: "06/04", steps: 2500, sleepHours: 7.1, medicationOnTimeRate: 1, riskLevel: "stable" },
      { date: "06/05", steps: 2420, sleepHours: 6.7, medicationOnTimeRate: 0.9, riskLevel: "stable" },
      { date: "06/06", steps: 2630, sleepHours: 7.2, medicationOnTimeRate: 1, riskLevel: "stable" },
      { date: "06/07", steps: 2380, sleepHours: 6.9, medicationOnTimeRate: 0.9, riskLevel: "stable" },
      { date: "06/08", steps: 2140, sleepHours: 6.8, medicationOnTimeRate: 1, riskLevel: "observation" },
      { date: "06/09", steps: 1900, sleepHours: 6.7, medicationOnTimeRate: 0.9, riskLevel: "observation" },
      { date: "今日", steps: 1520, sleepHours: 6.4, medicationOnTimeRate: 1, riskLevel: "observation" },
    ],
  },
  {
    elderId: "E004",
    points: [
      { date: "06/04", steps: 1880, sleepHours: 7.0, medicationOnTimeRate: 1, riskLevel: "stable" },
      { date: "06/05", steps: 1930, sleepHours: 7.2, medicationOnTimeRate: 1, riskLevel: "stable" },
      { date: "06/06", steps: 1810, sleepHours: 7.3, medicationOnTimeRate: 1, riskLevel: "stable" },
      { date: "06/07", steps: 1950, sleepHours: 7.0, medicationOnTimeRate: 1, riskLevel: "stable" },
      { date: "06/08", steps: 1890, sleepHours: 7.1, medicationOnTimeRate: 1, riskLevel: "stable" },
      { date: "06/09", steps: 1920, sleepHours: 7.2, medicationOnTimeRate: 1, riskLevel: "stable" },
      { date: "今日", steps: 1840, sleepHours: 7.0, medicationOnTimeRate: 1, riskLevel: "stable" },
    ],
  },
  {
    elderId: "E005",
    points: [
      { date: "06/04", steps: 1720, sleepHours: 6.5, medicationOnTimeRate: 0.9, riskLevel: "stable" },
      { date: "06/05", steps: 1800, sleepHours: 6.7, medicationOnTimeRate: 0.8, riskLevel: "observation" },
      { date: "06/06", steps: 1690, sleepHours: 6.1, medicationOnTimeRate: 0.9, riskLevel: "stable" },
      { date: "06/07", steps: 1740, sleepHours: 6.3, medicationOnTimeRate: 0.9, riskLevel: "stable" },
      { date: "06/08", steps: 1810, sleepHours: 6.6, medicationOnTimeRate: 1, riskLevel: "stable" },
      { date: "06/09", steps: 1720, sleepHours: 6.2, medicationOnTimeRate: 0.8, riskLevel: "observation" },
      { date: "今日", steps: 430, sleepHours: 0, medicationOnTimeRate: 0, riskLevel: "data_insufficient" },
    ],
  },
];
