import fs from "node:fs";
import readline from "node:readline";
import { XMLParser } from "fast-xml-parser";
import { snapshotSchema } from "../validators.js";

const types = {
  steps: "HKQuantityTypeIdentifierStepCount",
  heartRate: "HKQuantityTypeIdentifierHeartRate",
  restingHeartRate: "HKQuantityTypeIdentifierRestingHeartRate",
  exercise: "HKQuantityTypeIdentifierAppleExerciseTime",
  sleep: "HKCategoryTypeIdentifierSleepAnalysis",
};

const supportedTypes = new Set(Object.values(types));

const asleepValues = new Set([
  "HKCategoryValueSleepAnalysisAsleep",
  "HKCategoryValueSleepAnalysisAsleepCore",
  "HKCategoryValueSleepAnalysisAsleepDeep",
  "HKCategoryValueSleepAnalysisAsleepREM",
  "HKCategoryValueSleepAnalysisAsleepUnspecified",
]);

const csvHeaders = [
  "elder_id",
  "date",
  "data_source",
  "heart_rate_avg",
  "resting_heart_rate",
  "steps",
  "active_minutes",
  "sleep_duration",
  "wear_time_hours",
  "data_quality",
];

const pad = (value) => String(value).padStart(2, "0");
const dateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseAppleDate = (value) => {
  if (!value || typeof value !== "string") return null;
  const localPart = value.slice(0, 19).replace(" ", "T");
  const parsed = new Date(localPart);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const numberOrNull = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const average = (values) =>
  values.length
    ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1))
    : null;

const normalizeLimitDays = (value, fallback = null) => {
  if (value === undefined || value === null || value === "") return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : fallback;
};

const sanitizeSourceName = (record) => {
  const source = `${record.sourceName ?? ""} ${record.device ?? ""}`.toLowerCase();
  if (source.includes("watch")) return "Apple Watch";
  if (source.includes("iphone")) return "iPhone";
  if (source.includes("ipad")) return "iPad";
  if (source.includes("health")) return "Apple Health";
  return "Other Apple Health Source";
};

const createRecordCounts = () => ({
  steps: 0,
  heart_rate: 0,
  resting_heart_rate: 0,
  exercise_time: 0,
  sleep: 0,
});

const createState = (byteLength = 0) => ({
  days: new Map(),
  sourceNames: new Set(),
  warnings: [],
  recordCounts: createRecordCounts(),
  invalidHeartRateCount: 0,
  invalidRestingHeartRateCount: 0,
  nonMinuteExerciseCount: 0,
  hasExplicitTimezone: false,
  byteLength,
});

const ensureDay = (days, date) => {
  const key = typeof date === "string" ? date : dateKey(date);
  if (!days.has(key)) {
    days.set(key, {
      date: key,
      steps: 0,
      stepSources: new Set(),
      heartRates: [],
      restingHeartRates: [],
      activeMinutes: 0,
      sleepIntervals: [],
    });
  }
  return days.get(key);
};

const mergeIntervals = (intervals) => {
  if (!intervals.length) return [];
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged = [sorted[0]];

  for (const interval of sorted.slice(1)) {
    const current = merged[merged.length - 1];
    if (interval.start <= current.end) {
      current.end = Math.max(current.end, interval.end);
    } else {
      merged.push({ ...interval });
    }
  }

  return merged;
};

const intervalHours = (intervals) =>
  mergeIntervals(intervals).reduce((sum, interval) => sum + (interval.end - interval.start) / 36e5, 0);

function splitSleepIntoDays(days, start, end) {
  let cursor = new Date(start);
  const finish = new Date(end);
  while (cursor < finish) {
    const nextMidnight = new Date(cursor);
    nextMidnight.setHours(24, 0, 0, 0);
    const segmentEnd = nextMidnight < finish ? nextMidnight : finish;
    if (segmentEnd > cursor) {
      const day = ensureDay(days, cursor);
      day.sleepIntervals.push({
        start: cursor.getTime(),
        end: segmentEnd.getTime(),
      });
    }
    cursor = segmentEnd;
  }
}

const dataQualityForDay = (snapshot) =>
  Math.min(
    100,
    (snapshot.steps !== null ? 25 : 0) +
      (snapshot.heart_rate_avg !== null ? 25 : 0) +
      (snapshot.sleep_duration !== null ? 25 : 0) +
      (snapshot.active_minutes !== null ? 15 : 0) +
      (snapshot.resting_heart_rate !== null ? 10 : 0),
  );

const filterAndLimitSnapshots = (snapshots, { startDate, endDate, limitDays } = {}) => {
  const filtered = snapshots.filter((snapshot) => {
    if (startDate && snapshot.date < startDate) return false;
    if (endDate && snapshot.date > endDate) return false;
    return true;
  });
  const limit = normalizeLimitDays(limitDays);
  return limit ? filtered.slice(-limit) : filtered;
};

const makeSnapshot = (day, elderId) => {
  const sleepHours = Number(intervalHours(day.sleepIntervals).toFixed(2));
  const snapshot = {
    snapshot_id: `APPLE-${elderId}-${day.date}`,
    elder_id: elderId,
    date: day.date,
    data_source: "Apple Health Export",
    heart_rate_avg: average(day.heartRates),
    resting_heart_rate: average(day.restingHeartRates),
    steps: Math.round(day.steps) || null,
    active_minutes: Number(day.activeMinutes.toFixed(1)) || null,
    sleep_duration: sleepHours || null,
    wear_time_hours: null,
    data_quality: 0,
  };
  snapshot.data_quality = dataQualityForDay(snapshot);
  return snapshotSchema.parse(snapshot);
};

const sampleSnapshot = (snapshot) => ({
  date: snapshot.date,
  data_source: snapshot.data_source,
  heart_rate_avg: snapshot.heart_rate_avg,
  resting_heart_rate: snapshot.resting_heart_rate,
  steps: snapshot.steps,
  active_minutes: snapshot.active_minutes,
  sleep_duration: snapshot.sleep_duration,
  data_quality: snapshot.data_quality,
});

const addSnapshotWarnings = (warnings, snapshots, days) => {
  const missingHeartRate = snapshots.filter((snapshot) => snapshot.heart_rate_avg === null).length;
  const missingSleep = snapshots.filter((snapshot) => snapshot.sleep_duration === null).length;
  if (missingHeartRate) warnings.push(`${missingHeartRate} day(s) missing average heart rate.`);
  if (missingSleep) warnings.push(`${missingSleep} day(s) missing asleep duration.`);

  for (const snapshot of snapshots) {
    if (typeof snapshot.steps === "number" && snapshot.steps > 30000) {
      warnings.push(`Unusually high steps detected on ${snapshot.date}.`);
    }
    if (typeof snapshot.sleep_duration === "number" && snapshot.sleep_duration > 12) {
      warnings.push(`Sleep duration above 12 hours detected on ${snapshot.date}.`);
    }
    if (
      typeof snapshot.heart_rate_avg === "number" &&
      (snapshot.heart_rate_avg < 40 || snapshot.heart_rate_avg > 140)
    ) {
      warnings.push(`Average heart rate outside review range on ${snapshot.date}.`);
    }
    if (
      typeof snapshot.resting_heart_rate === "number" &&
      (snapshot.resting_heart_rate < 35 || snapshot.resting_heart_rate > 120)
    ) {
      warnings.push(`Resting heart rate outside review range on ${snapshot.date}.`);
    }
    if (snapshot.data_quality < 40) {
      warnings.push(`Data quality below 40 on ${snapshot.date}.`);
    }
    if ((days.get(snapshot.date)?.stepSources.size ?? 0) > 1) {
      warnings.push(`Possible duplicated step sources on ${snapshot.date}.`);
    }
  }
};

function processRecord(record, state) {
  if (!record || !record.type) return;
  const sourceName = sanitizeSourceName(record);
  const startDate = parseAppleDate(record.startDate);
  const endDate = parseAppleDate(record.endDate) ?? startDate;
  if (/\s[+-]\d{4}$/.test(record.startDate ?? "")) state.hasExplicitTimezone = true;

  if (supportedTypes.has(record.type)) {
    state.sourceNames.add(sourceName);
  }

  if (!startDate) return;

  if (record.type === types.steps) {
    state.recordCounts.steps += 1;
    const value = numberOrNull(record.value);
    if (value !== null && value >= 0) {
      const day = ensureDay(state.days, startDate);
      day.steps += value;
      day.stepSources.add(sourceName);
    }
  }

  if (record.type === types.heartRate) {
    state.recordCounts.heart_rate += 1;
    const value = numberOrNull(record.value);
    if (value !== null && value >= 30 && value <= 220) {
      ensureDay(state.days, startDate).heartRates.push(value);
    } else {
      state.invalidHeartRateCount += 1;
    }
  }

  if (record.type === types.restingHeartRate) {
    state.recordCounts.resting_heart_rate += 1;
    const value = numberOrNull(record.value);
    if (value !== null && value >= 25 && value <= 180) {
      ensureDay(state.days, startDate).restingHeartRates.push(value);
    } else {
      state.invalidRestingHeartRateCount += 1;
    }
  }

  if (record.type === types.exercise) {
    state.recordCounts.exercise_time += 1;
    const value = numberOrNull(record.value);
    if (record.unit && record.unit !== "min") state.nonMinuteExerciseCount += 1;
    if (value !== null && value >= 0) {
      ensureDay(state.days, startDate).activeMinutes += value;
    }
  }

  if (record.type === types.sleep) {
    state.recordCounts.sleep += 1;
    if (asleepValues.has(record.value) && endDate && endDate > startDate) {
      splitSleepIntoDays(state.days, startDate, endDate);
    }
  }
}

function finalizeState(state, options = {}) {
  if (state.byteLength > 80 * 1024 * 1024) {
    state.warnings.push("Very large XML file; streaming parse was used or is recommended for production use.");
  }
  if (state.hasExplicitTimezone) {
    state.warnings.push("Apple Health dates include timezone offsets; snapshots are grouped by recorded local calendar day.");
  }
  if (state.invalidHeartRateCount) state.warnings.push(`${state.invalidHeartRateCount} impossible heart-rate record(s) ignored.`);
  if (state.invalidRestingHeartRateCount) state.warnings.push(`${state.invalidRestingHeartRateCount} impossible resting heart-rate record(s) ignored.`);
  if (state.nonMinuteExerciseCount) state.warnings.push(`${state.nonMinuteExerciseCount} exercise record(s) used non-minute units; please review unit handling.`);
  if (state.sourceNames.has("Apple Watch") && state.sourceNames.has("iPhone")) {
    state.warnings.push("Both Apple Watch and iPhone sources were detected; step counts may be inflated by duplicated sources.");
  }

  const elderId = options.elderId ?? "TEST001";
  const allSnapshots = [...state.days.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((day) => makeSnapshot(day, elderId));
  const snapshots = filterAndLimitSnapshots(allSnapshots, options);
  addSnapshotWarnings(state.warnings, snapshots, state.days);

  const start = allSnapshots[0]?.date ?? null;
  const end = allSnapshots[allSnapshots.length - 1]?.date ?? null;
  if (!allSnapshots.length) state.warnings.push("No supported Apple Health daily data found.");
  if (end) {
    const last = new Date(`${end}T00:00:00`);
    const staleDays = (Date.now() - last.getTime()) / 86400000;
    if (staleDays > 30) state.warnings.push("No recent data found in the last 30 days.");
  }

  return {
    snapshots,
    allSnapshots,
    preview: {
      days_detected: allSnapshots.length,
      date_range: { start, end },
      source_names: [...state.sourceNames].sort(),
      record_counts: state.recordCounts,
      sample_daily_snapshots: snapshots.slice(-5).map(sampleSnapshot),
      warnings: [...new Set(state.warnings)],
    },
  };
}

export function analyzeAppleHealthXml(xmlText, options = {}) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    parseAttributeValue: false,
  });
  const doc = parser.parse(xmlText);
  const rawRecords = doc?.HealthData?.Record ?? [];
  const records = Array.isArray(rawRecords) ? rawRecords : [rawRecords].filter(Boolean);
  const state = createState(Buffer.byteLength(xmlText, "utf8"));
  for (const record of records) processRecord(record, state);
  return finalizeState(state, options);
}

const parseRecordTag = (tag) => {
  const record = {};
  const attrPattern = /([A-Za-z0-9_:-]+)="([^"]*)"/g;
  let match = attrPattern.exec(tag);
  while (match) {
    record[match[1]] = match[2];
    match = attrPattern.exec(tag);
  }
  return record;
};

export async function analyzeAppleHealthXmlFile(filePath, options = {}) {
  const state = createState(fs.statSync(filePath).size);
  const stream = fs.createReadStream(filePath, { encoding: "utf8", highWaterMark: 1024 * 1024 });
  const lines = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let buffer = "";

  for await (const line of lines) {
    const recordStart = buffer ? 0 : line.indexOf("<Record ");
    if (recordStart === -1) continue;

    buffer += buffer ? line : line.slice(recordStart);
    const recordEnd = buffer.indexOf(">");
    if (recordEnd === -1) continue;

    const tag = buffer.slice(0, recordEnd + 1);
    processRecord(parseRecordTag(tag), state);
    buffer = "";
  }

  return finalizeState(state, options);
}

export function previewAppleHealthXml(xmlText, options = {}) {
  return analyzeAppleHealthXml(xmlText, options).preview;
}

export function parseAppleHealthXml(xmlText, options = {}) {
  const elderId = options.elderId ?? options.elder_id;
  if (!elderId) throw new Error("Apple Health XML import requires elder_id.");
  return analyzeAppleHealthXml(xmlText, { ...options, elderId }).snapshots;
}

const csvValue = (value) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function snapshotsToCsv(snapshots) {
  return [
    csvHeaders.join(","),
    ...snapshots.map((snapshot) =>
      csvHeaders.map((header) => csvValue(snapshot[header])).join(","),
    ),
  ].join("\n");
}
