import type { WearableDailySnapshot, WearableDataSource } from "../types";

export const wearableCsvExample = `date,steps,heart_rate_avg,sleep_duration,active_minutes,wear_time_hours
2026-07-01,2100,76,6.4,38,18
2026-07-02,1980,78,6.1,35,17
2026-07-03,820,86,4.8,18,15`;

export const chenWearableSevenDayCsv = `date,steps,heart_rate_avg,sleep_duration,active_minutes,wear_time_hours
2026-06-04,2280,74,6.8,44,19
2026-06-05,2110,75,6.4,40,18
2026-06-06,2360,73,6.7,46,19
2026-06-07,1980,77,6.3,35,17
2026-06-08,1620,79,5.7,30,16
2026-06-09,1140,82,5.1,24,15
2026-06-10,820,86,4.8,18,15`;

const parseNumber = (value: string, fallback = 0) => {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : fallback;
};

const computeDataQuality = (wearTimeHours: number) =>
  Number(Math.min(1, Math.max(0.15, wearTimeHours / 22)).toFixed(2));

export const parseWearableCsv = (
  elderId: string,
  csvText: string,
  source: WearableDataSource,
): WearableDailySnapshot[] => {
  const lines = csvText
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const [headerLine, ...rows] = lines;
  if (!headerLine || rows.length === 0) return [];

  const headers = headerLine.split(",").map((header) => header.trim());
  const getValue = (values: string[], key: string) => values[headers.indexOf(key)] ?? "";
  const importedAt = "2026-06-10T20:38:00+08:00";

  return rows.map((row, index) => {
    const values = row.split(",").map((value) => value.trim());
    const wearTimeHours = parseNumber(getValue(values, "wear_time_hours"));
    const heartRateAvg = parseNumber(getValue(values, "heart_rate_avg"));
    return {
      id: `WDS-${elderId}-${index + 1}`,
      elderId,
      date: getValue(values, "date"),
      dataSource: source,
      heartRateAvg,
      restingHeartRate: Math.max(55, heartRateAvg - 10),
      steps: parseNumber(getValue(values, "steps")),
      activeMinutes: parseNumber(getValue(values, "active_minutes")),
      sleepDuration: parseNumber(getValue(values, "sleep_duration")),
      wearTimeHours,
      dataQuality: computeDataQuality(wearTimeHours),
      importedAt,
    };
  });
};

export const latestWearableSnapshot = (snapshots: WearableDailySnapshot[]) =>
  snapshots.slice().sort((a, b) => a.date.localeCompare(b.date))[
    snapshots.length - 1
  ];
