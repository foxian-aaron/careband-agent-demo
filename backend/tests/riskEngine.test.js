import assert from "node:assert/strict";
import test from "node:test";
import { evaluateRisk } from "../src/rules/riskEngine.js";

const elder = { elder_id: "E001", name: "陈伯" };
const baseline = {
  avg_steps_7d: 2000,
  avg_sleep_7d: 8,
  avg_active_minutes_7d: 40,
  resting_hr_baseline: 70,
};
const snapshot = {
  data_quality: 88,
  steps: 900,
  sleep_duration: 5.5,
  active_minutes: 20,
  heart_rate_avg: 76,
};

test("sos_long_press creates high_risk instead of medical diagnosis", () => {
  const result = evaluateRisk({
    elder,
    baseline,
    snapshot,
    events: [{ event_type: "sos_long_press", raw_text: "SOS 长按求助", payload: {} }],
  });

  assert.equal(result.status_level, "high_risk");
  assert.equal(result.safety_disclaimer, "本結果僅為照護風險提示，不構成醫療診斷。");
});

test("fall_detected creates urgent", () => {
  const result = evaluateRisk({
    elder,
    baseline,
    snapshot,
    events: [{ event_type: "fall_detected", raw_text: "检测到跌倒", payload: {} }],
  });

  assert.equal(result.status_level, "urgent");
});

test("low data quality becomes insufficient_data when no hard event exists", () => {
  const result = evaluateRisk({
    elder,
    baseline,
    snapshot: { ...snapshot, data_quality: 32 },
    events: [],
  });

  assert.equal(result.status_level, "insufficient_data");
});
