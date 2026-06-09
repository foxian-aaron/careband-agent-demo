import type { PersonalBaseline } from "../types";

export const mockBaselines: PersonalBaseline[] = [
  {
    elderId: "E001",
    avgSteps7d: 2150,
    avgSleep7d: 6.5,
    avgActiveMinutes7d: 46,
    restingHrBaseline: 72,
    medicationOnTimeRate: 0.95,
    baselineConfidence: 0.91,
  },
  {
    elderId: "E002",
    avgSteps7d: 1680,
    avgSleep7d: 6.2,
    avgActiveMinutes7d: 38,
    restingHrBaseline: 76,
    medicationOnTimeRate: 0.9,
    baselineConfidence: 0.88,
  },
  {
    elderId: "E003",
    avgSteps7d: 2450,
    avgSleep7d: 6.9,
    avgActiveMinutes7d: 58,
    restingHrBaseline: 70,
    medicationOnTimeRate: 0.93,
    baselineConfidence: 0.86,
  },
  {
    elderId: "E004",
    avgSteps7d: 1900,
    avgSleep7d: 7.1,
    avgActiveMinutes7d: 42,
    restingHrBaseline: 68,
    medicationOnTimeRate: 0.98,
    baselineConfidence: 0.94,
  },
  {
    elderId: "E005",
    avgSteps7d: 1750,
    avgSleep7d: 6.4,
    avgActiveMinutes7d: 36,
    restingHrBaseline: 74,
    medicationOnTimeRate: 0.86,
    baselineConfidence: 0.58,
  },
];
