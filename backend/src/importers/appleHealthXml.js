import fs from "node:fs";
import readline from "node:readline";
import { XMLParser } from "fast-xml-parser";
import { snapshotSchema } from "../validators.js";

export const APPLE_HEALTH_TYPES = {
  steps: "HKQuantityTypeIdentifierStepCount",
  heartRate: "HKQuantityTypeIdentifierHeartRate",
  restingHeartRate: "HKQuantityTypeIdentifierRestingHeartRate",
  exercise: "HKQuantityTypeIdentifierAppleExerciseTime",
  sleep: "HKCategoryTypeIdentifierSleepAnalysis",
};

const supportedTypes = new Set(Object.values(APPLE_HEALTH_TYPES));

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

const appleTimestampPattern =
  /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\s*([+-])(\d{2})(\d{2}))?$/;

export function getAppleLocalDateTimeParts(value) {
  if (!value || typeof value !== "string") return null;
  const match = value.match(appleTimestampPattern);
  if (!match) return null;

  const [, year, month, day, hour, minute, second, sign, offsetHour, offsetMinute] = match;
  const offsetMinutes =
    sign && offsetHour && offsetMinute
      ? (sign === "-" ? -1 : 1) * (Number(offsetHour) * 60 + Number(offsetMinute))
      : null;

  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
    offsetMinutes,
    dateKey: `${year}-${month}-${day}`,
    hasExplicitTimezone: offsetMinutes !== null,
  };
}

export function parseAppleHealthTimestamp(value) {
  const parts = getAppleLocalDateTimeParts(value);
  if (!parts) return null;

  const utcMillis = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  const offsetMillis = (parts.offsetMinutes ?? 0) * 60 * 1000;
  const parsed = new Date(utcMillis - offsetMillis);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getAppleLocalDateKey(value) {
  return getAppleLocalDateTimeParts(value)?.dateKey ?? null;
}

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

const normalizeStepSourceStrategy = (value) => {
  const strategy = value ?? process.env.APPLE_HEALTH_STEP_SOURCE_STRATEGY ?? "prefer_watch";
  return ["prefer_watch", "all_sources", "manual_review"].includes(strategy)
    ? strategy
    : "prefer_watch";
};

const sanitizeSourceName = (record) => {
  const source = `${record.sourceName ?? ""} ${record.device ?? ""}`.toLowerCase();
  if (source.includes("watch")) return "Apple Watch";
  if (source.includes("iphone")) return "iPhone";
  if (source.includes("ipad")) return "iPad";
  if (source.includes("health")) return "Apple Health";
  return "Other Apple Health Source";
};

const sourceIdentity = (record) =>
  `${record.sourceName ?? "unknown"}|${record.device ?? "unknown"}`.slice(0, 240);

export function normalizeExerciseMinutes(value, unit) {
  const numeric = numberOrNull(value);
  if (numeric === null || numeric < 0) return { minutes: null, warning: "invalid" };

  const normalizedUnit = String(unit ?? "min").trim().toLowerCase();
  if (["min", "minute", "minutes"].includes(normalizedUnit)) {
    return { minutes: numeric, warning: null };
  }
  if (["s", "sec", "second", "seconds"].includes(normalizedUnit)) {
    return { minutes: numeric / 60, warning: "converted" };
  }
  if (["h", "hr", "hour", "hours"].includes(normalizedUnit)) {
    return { minutes: numeric * 60, warning: "converted" };
  }
  return { minutes: null, warning: "unknown" };
}

const createRecordCounts = () => ({
  steps: 0,
  heart_rate: 0,
  resting_heart_rate: 0,
  exercise_time: 0,
  sleep: 0,
});

const createState = (byteLength = 0, options = {}) => ({
  days: new Map(),
  sourceNames: new Set(),
  warnings: [],
  recordCounts: createRecordCounts(),
  invalidHeartRateCount: 0,
  invalidRestingHeartRateCount: 0,
  convertedExerciseUnitCount: 0,
  skippedExerciseUnitCount: 0,
  hasExplicitTimezone: false,
  byteLength,
  stepSourceStrategy: normalizeStepSourceStrategy(options.stepSourceStrategy),
});

const ensureDay = (days, dateKey) => {
  if (!dateKey) return null;
  if (!days.has(dateKey)) {
    days.set(dateKey, {
      date: dateKey,
      stepRecordsBySource: new Map(),
      stepSourceIdentities: new Map(),
      hasStepRecord: false,
      heartRates: [],
      hasHeartRateRecord: false,
      restingHeartRates: [],
      hasRestingHeartRateRecord: false,
      activeMinutes: 0,
      hasExerciseRecord: false,
      sleepIntervals: [],
      hasSleepRecord: false,
    });
  }
  return days.get(dateKey);
};

const mergeIntervals = (intervals) => {
  if (!intervals.length) return [];
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged = [{ ...sorted[0] }];

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

const sumMapValues = (map) => [...map.values()].reduce((sum, value) => sum + value, 0);

const chooseSteps = (day, state) => {
  if (!day.hasStepRecord) return null;

  const watchSteps = day.stepRecordsBySource.get("Apple Watch");
  const hasWatch = typeof watchSteps === "number";
  const hasNonWatch = [...day.stepRecordsBySource.keys()].some((source) => source !== "Apple Watch");

  if (state.stepSourceStrategy === "prefer_watch" && hasWatch) {
    if (hasNonWatch) {
      state.warnings.push(
        `Mixed step sources on ${day.date}; prefer_watch used Apple Watch and ignored non-watch step records.`,
      );
    }
    if ((day.stepSourceIdentities.get("Apple Watch")?.size ?? 0) > 1) {
      state.warnings.push(`Multiple Apple Watch step sources detected on ${day.date}; summed watch records.`);
    }
    return Math.round(watchSteps);
  }

  if (state.stepSourceStrategy === "manual_review") {
    state.warnings.push(`manual_review step source strategy used on ${day.date}; review step source mix before sharing.`);
  }

  return Math.round(sumMapValues(day.stepRecordsBySource));
};

const dataQualityForDay = (day) =>
  Math.min(
    100,
    (day.hasStepRecord ? 25 : 0) +
      (day.hasHeartRateRecord ? 25 : 0) +
      (day.hasSleepRecord ? 25 : 0) +
      (day.hasExerciseRecord ? 15 : 0) +
      (day.hasRestingHeartRateRecord ? 10 : 0),
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

const makeSnapshot = (day, elderId, state) => {
  const sleepHours = Number(intervalHours(day.sleepIntervals).toFixed(2));
  const activeMinutes = Number(day.activeMinutes.toFixed(1));
  const snapshot = {
    snapshot_id: `APPLE-${elderId}-${day.date}`,
    elder_id: elderId,
    date: day.date,
    data_source: "Apple Health Export",
    heart_rate_avg: day.hasHeartRateRecord ? average(day.heartRates) : null,
    resting_heart_rate: day.hasRestingHeartRateRecord ? average(day.restingHeartRates) : null,
    steps: chooseSteps(day, state),
    active_minutes: day.hasExerciseRecord ? activeMinutes : null,
    sleep_duration: day.hasSleepRecord ? sleepHours : null,
    wear_time_hours: null,
    data_quality: dataQualityForDay(day),
  };
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
    const day = days.get(snapshot.date);
    if ((day?.stepRecordsBySource.size ?? 0) > 1) {
      warnings.push(`Possible duplicated step sources on ${snapshot.date}.`);
    }
  }
};

function processRecord(record, state) {
  if (!record || !record.type) return;
  const sourceName = sanitizeSourceName(record);
  const startDate = parseAppleHealthTimestamp(record.startDate);
  const endDate = parseAppleHealthTimestamp(record.endDate) ?? startDate;
  const startDateKey = getAppleLocalDateKey(record.startDate);
  const endDateKey = getAppleLocalDateKey(record.endDate) ?? startDateKey;
  const startParts = getAppleLocalDateTimeParts(record.startDate);
  if (startParts?.hasExplicitTimezone) state.hasExplicitTimezone = true;

  if (supportedTypes.has(record.type)) {
    state.sourceNames.add(sourceName);
  }

  if (!startDate || !startDateKey) return;

  if (record.type === APPLE_HEALTH_TYPES.steps) {
    state.recordCounts.steps += 1;
    const value = numberOrNull(record.value);
    if (value !== null && value >= 0) {
      const day = ensureDay(state.days, startDateKey);
      day.hasStepRecord = true;
      day.stepRecordsBySource.set(sourceName, (day.stepRecordsBySource.get(sourceName) ?? 0) + value);
      if (!day.stepSourceIdentities.has(sourceName)) day.stepSourceIdentities.set(sourceName, new Set());
      day.stepSourceIdentities.get(sourceName).add(sourceIdentity(record));
    }
  }

  if (record.type === APPLE_HEALTH_TYPES.heartRate) {
    state.recordCounts.heart_rate += 1;
    const value = numberOrNull(record.value);
    if (value !== null && value >= 30 && value <= 220) {
      const day = ensureDay(state.days, startDateKey);
      day.hasHeartRateRecord = true;
      day.heartRates.push(value);
    } else {
      state.invalidHeartRateCount += 1;
    }
  }

  if (record.type === APPLE_HEALTH_TYPES.restingHeartRate) {
    state.recordCounts.resting_heart_rate += 1;
    const value = numberOrNull(record.value);
    if (value !== null && value >= 25 && value <= 180) {
      const day = ensureDay(state.days, startDateKey);
      day.hasRestingHeartRateRecord = true;
      day.restingHeartRates.push(value);
    } else {
      state.invalidRestingHeartRateCount += 1;
    }
  }

  if (record.type === APPLE_HEALTH_TYPES.exercise) {
    state.recordCounts.exercise_time += 1;
    const result = normalizeExerciseMinutes(record.value, record.unit);
    if (result.warning === "converted") state.convertedExerciseUnitCount += 1;
    if (result.warning === "unknown") state.skippedExerciseUnitCount += 1;
    if (result.minutes !== null) {
      const day = ensureDay(state.days, startDateKey);
      day.hasExerciseRecord = true;
      day.activeMinutes += result.minutes;
    }
  }

  if (record.type === APPLE_HEALTH_TYPES.sleep) {
    state.recordCounts.sleep += 1;
    if (asleepValues.has(record.value) && endDate && endDateKey && endDate >= startDate) {
      const day = ensureDay(state.days, endDateKey);
      day.hasSleepRecord = true;
      day.sleepIntervals.push({
        start: startDate.getTime(),
        end: endDate.getTime(),
      });
    }
  }
}

function finalizeState(state, options = {}) {
  if (state.byteLength > 80 * 1024 * 1024) {
    state.warnings.push("Very large XML file; use local preview/derive script and import daily CSV for demos.");
  }
  if (state.hasExplicitTimezone) {
    state.warnings.push(
      "Apple Health dates include timezone offsets; quantity records use recorded local start date, sleep uses wake-date strategy.",
    );
  }
  if (state.invalidHeartRateCount) state.warnings.push(`${state.invalidHeartRateCount} impossible heart-rate record(s) ignored.`);
  if (state.invalidRestingHeartRateCount) state.warnings.push(`${state.invalidRestingHeartRateCount} impossible resting heart-rate record(s) ignored.`);
  if (state.convertedExerciseUnitCount) state.warnings.push(`${state.convertedExerciseUnitCount} non-minute exercise record(s) converted to minutes.`);
  if (state.skippedExerciseUnitCount) state.warnings.push(`${state.skippedExerciseUnitCount} exercise record(s) with unknown unit skipped.`);
  if (state.sourceNames.has("Apple Watch") && state.sourceNames.has("iPhone")) {
    state.warnings.push(`Both Apple Watch and iPhone sources were detected; step strategy is ${state.stepSourceStrategy}.`);
  }

  const elderId = options.elderId ?? "TEST001";
  const allSnapshots = [...state.days.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((day) => makeSnapshot(day, elderId, state));
  const snapshots = filterAndLimitSnapshots(allSnapshots, options);
  addSnapshotWarnings(state.warnings, snapshots, state.days);

  const start = allSnapshots[0]?.date ?? null;
  const end = allSnapshots[allSnapshots.length - 1]?.date ?? null;
  if (!allSnapshots.length) state.warnings.push("No supported Apple Health daily data found.");
  if (end) {
    const last = new Date(`${end}T00:00:00Z`);
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
      step_source_strategy: state.stepSourceStrategy,
      sleep_grouping_strategy: "wake_date",
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
  const state = createState(Buffer.byteLength(xmlText, "utf8"), options);
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
  const state = createState(fs.statSync(filePath).size, options);
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
