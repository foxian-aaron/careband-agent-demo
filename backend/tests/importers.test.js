import assert from "node:assert/strict";
import test from "node:test";
import {
  parseAppleHealthXml,
  previewAppleHealthXml,
} from "../src/importers/appleHealthXml.js";
import { parseDailySnapshotsCsv } from "../src/importers/csvImporter.js";

test("CSV importer parses daily snapshot rows", () => {
  const csv = [
    "elder_id,date,data_source,heart_rate_avg,resting_heart_rate,steps,active_minutes,sleep_duration,wear_time_hours,data_quality",
    "E001,2026-06-19,Apple Health Export,84,72,980,24,5.1,18.2,88",
  ].join("\n");
  const rows = parseDailySnapshotsCsv(csv);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].data_source, "Apple Health Export");
  assert.equal(rows[0].steps, 980);
});

test("Apple Health XML importer counts asleep sleep and ignores inBed", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData>
  <Record type="HKQuantityTypeIdentifierStepCount" startDate="2026-06-19 09:00:00 +0800" endDate="2026-06-19 09:10:00 +0800" value="1000"/>
  <Record type="HKCategoryTypeIdentifierSleepAnalysis" startDate="2026-06-19 00:00:00 +0800" endDate="2026-06-19 01:00:00 +0800" value="HKCategoryValueSleepAnalysisInBed"/>
  <Record type="HKCategoryTypeIdentifierSleepAnalysis" startDate="2026-06-19 01:00:00 +0800" endDate="2026-06-19 03:00:00 +0800" value="HKCategoryValueSleepAnalysisAsleepCore"/>
</HealthData>`;

  const rows = parseAppleHealthXml(xml, { elderId: "E001" });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].steps, 1000);
  assert.equal(rows[0].sleep_duration, 2);
});

test("Apple Health XML importer merges overlapping asleep intervals and applies quality formula", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData>
  <Record type="HKQuantityTypeIdentifierStepCount" sourceName="Apple Watch" startDate="2026-06-18 09:00:00 +0800" endDate="2026-06-18 09:10:00 +0800" value="1200"/>
  <Record type="HKQuantityTypeIdentifierHeartRate" sourceName="Apple Watch" startDate="2026-06-18 10:00:00 +0800" endDate="2026-06-18 10:01:00 +0800" value="80"/>
  <Record type="HKQuantityTypeIdentifierHeartRate" sourceName="Apple Watch" startDate="2026-06-18 10:02:00 +0800" endDate="2026-06-18 10:03:00 +0800" value="90"/>
  <Record type="HKQuantityTypeIdentifierRestingHeartRate" sourceName="Apple Watch" startDate="2026-06-18 08:00:00 +0800" endDate="2026-06-18 08:01:00 +0800" value="66"/>
  <Record type="HKQuantityTypeIdentifierAppleExerciseTime" sourceName="Apple Watch" unit="min" startDate="2026-06-18 18:00:00 +0800" endDate="2026-06-18 18:30:00 +0800" value="30"/>
  <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Apple Watch" startDate="2026-06-18 00:00:00 +0800" endDate="2026-06-18 02:00:00 +0800" value="HKCategoryValueSleepAnalysisAsleepCore"/>
  <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Apple Watch" startDate="2026-06-18 01:00:00 +0800" endDate="2026-06-18 03:00:00 +0800" value="HKCategoryValueSleepAnalysisAsleepDeep"/>
  <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Apple Watch" startDate="2026-06-18 03:00:00 +0800" endDate="2026-06-18 04:00:00 +0800" value="HKCategoryValueSleepAnalysisAwake"/>
</HealthData>`;

  const rows = parseAppleHealthXml(xml, { elderId: "TEST001" });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].snapshot_id, "APPLE-TEST001-2026-06-18");
  assert.equal(rows[0].heart_rate_avg, 85);
  assert.equal(rows[0].resting_heart_rate, 66);
  assert.equal(rows[0].active_minutes, 30);
  assert.equal(rows[0].sleep_duration, 3);
  assert.equal(rows[0].data_quality, 100);
});

test("Apple Health XML preview returns safe summary, limit days and duplicate source warnings", () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData>
  <Record type="HKQuantityTypeIdentifierStepCount" sourceName="Apple Watch" startDate="2026-06-17 09:00:00 +0800" endDate="2026-06-17 09:10:00 +0800" value="1000"/>
  <Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" startDate="2026-06-17 09:00:00 +0800" endDate="2026-06-17 09:10:00 +0800" value="1000"/>
  <Record type="HKQuantityTypeIdentifierStepCount" sourceName="Apple Watch" startDate="2026-06-18 09:00:00 +0800" endDate="2026-06-18 09:10:00 +0800" value="40000"/>
  <Record type="HKQuantityTypeIdentifierHeartRate" sourceName="Apple Watch" startDate="2026-06-18 10:00:00 +0800" endDate="2026-06-18 10:01:00 +0800" value="999"/>
  <Record type="HKQuantityTypeIdentifierAppleExerciseTime" sourceName="Apple Watch" unit="count" startDate="2026-06-18 18:00:00 +0800" endDate="2026-06-18 18:30:00 +0800" value="30"/>
</HealthData>`;

  const preview = previewAppleHealthXml(xml, { elderId: "TEST001", limitDays: 1 });

  assert.equal(preview.days_detected, 2);
  assert.equal(preview.sample_daily_snapshots.length, 1);
  assert.equal(preview.sample_daily_snapshots[0].date, "2026-06-18");
  assert.deepEqual(preview.source_names, ["Apple Watch", "iPhone"]);
  assert.equal(preview.record_counts.steps, 3);
  assert(preview.warnings.some((warning) => warning.includes("duplicated")));
  assert(preview.warnings.some((warning) => warning.includes("Unusually high steps")));
  assert(preview.warnings.some((warning) => warning.includes("impossible heart-rate")));
  assert(preview.warnings.some((warning) => warning.includes("non-minute units")));
});
