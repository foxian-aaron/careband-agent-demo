import { SAFETY_DISCLAIMER } from "../constants.js";

const symptomKeywords = ["頭暈", "头晕", "胸悶", "胸闷", "跌倒", "不舒服"];
const dizzinessKeywords = ["頭暈", "头晕"];

const hasAnyKeyword = (text = "", keywords) =>
  keywords.some((keyword) => text.includes(keyword));

const eventText = (event) =>
  [
    event.raw_text,
    event.payload?.note,
    ...(event.payload?.symptom_keywords ?? []),
    ...(event.payload?.symptomKeywords ?? []),
  ]
    .filter(Boolean)
    .join(" ");

const hasMedicationConfirmed = (events) =>
  events.some((event) => event.event_type === "medication_confirmed");

const hasMedicationNotConfirmedSignal = (events) =>
  events.some(
    (event) =>
      event.event_type === "medication_reminder" &&
      (event.payload?.medication_confirmed === false ||
        event.raw_text?.includes("未確認") ||
        event.raw_text?.includes("未确认") ||
        event.raw_text?.toLowerCase().includes("not confirmed")),
  );

const buildResult = ({
  elder,
  statusLevel,
  riskScore,
  keyReasons,
  triggeredRules,
  recommendedAction,
  dataQuality,
}) => ({
  elder_id: elder.elder_id,
  status_level: statusLevel,
  risk_score: Math.max(0, Math.min(100, Math.round(riskScore))),
  key_reasons: keyReasons,
  triggered_rules: triggeredRules,
  recommended_action: recommendedAction,
  data_quality: dataQuality,
  safety_disclaimer: SAFETY_DISCLAIMER,
});

export function evaluateRisk({ elder, snapshot, baseline, events = [] }) {
  const dataQuality = Number(snapshot?.data_quality ?? 0);
  const latestText = events.map(eventText).join(" ");
  const fallEvent = events.find((event) => event.event_type === "fall_detected");
  const sosEvent = events.find((event) => event.event_type === "sos_long_press");
  const symptomEvent = [...events].reverse().find((event) =>
    hasAnyKeyword(eventText(event), symptomKeywords),
  );

  if (fallEvent) {
    return buildResult({
      elder,
      statusLevel: "urgent",
      riskScore: 92,
      keyReasons: ["偵測到跌倒事件，需要立即確認現場狀況。"],
      triggeredRules: ["fall_detected => urgent"],
      recommendedAction: "立即通知護工和機構負責人，並依照機構應急流程處理。",
      dataQuality,
    });
  }

  if (sosEvent) {
    return buildResult({
      elder,
      statusLevel: "high_risk",
      riskScore: 84,
      keyReasons: ["長者觸發 SOS 長按求助。"],
      triggeredRules: ["sos_long_press => high_risk"],
      recommendedAction: "請護工立即查看長者位置與現場狀態，並記錄處理結果。",
      dataQuality,
    });
  }

  if (dataQuality < 40) {
    return buildResult({
      elder,
      statusLevel: "insufficient_data",
      riskScore: Math.max(10, dataQuality),
      keyReasons: ["今日數據品質低於 40%，需要先確認設備佩戴或資料同步。"],
      triggeredRules: ["data_quality < 40 => insufficient_data"],
      recommendedAction: "請先確認設備佩戴和資料同步，再結合現場情況判斷是否需要跟進。",
      dataQuality,
    });
  }

  const steps = snapshot?.steps;
  const sleep = snapshot?.sleep_duration;
  const activeMinutes = snapshot?.active_minutes;
  const heartRateAvg = snapshot?.heart_rate_avg;
  const baselineSteps = Number(baseline?.avg_steps_7d ?? 0);
  const baselineSleep = Number(baseline?.avg_sleep_7d ?? 0);
  const baselineActive = Number(baseline?.avg_active_minutes_7d ?? 0);
  const baselineRestingHr = Number(baseline?.resting_hr_baseline ?? 0);

  const stepsDrop =
    typeof steps === "number" && baselineSteps > 0 && steps < baselineSteps * 0.5;
  const sleepDrop =
    typeof sleep === "number" && baselineSleep > 0 && sleep < baselineSleep * 0.75;
  const mildActivityDrop =
    !stepsDrop && typeof steps === "number" && baselineSteps > 0 && steps < baselineSteps * 0.75;
  const mildSleepDrop =
    !sleepDrop && typeof sleep === "number" && baselineSleep > 0 && sleep < baselineSleep * 0.9;
  const mildHeartRate =
    typeof heartRateAvg === "number" &&
    baselineRestingHr > 0 &&
    heartRateAvg - baselineRestingHr >= 12;
  const activeMinutesDrop =
    typeof activeMinutes === "number" &&
    baselineActive > 0 &&
    activeMinutes < baselineActive * 0.6;

  const medicationNotConfirmed =
    hasMedicationNotConfirmedSignal(events) && !hasMedicationConfirmed(events);

  const keyReasons = [];
  const triggeredRules = [];
  let score = 12;

  if (symptomEvent) {
    keyReasons.push(`主訴或事件文字包含照護關鍵詞：「${eventText(symptomEvent)}」。`);
    triggeredRules.push("raw_text contains 頭暈/胸悶/跌倒/不舒服 => attention at minimum");
    score = Math.max(score, 55);
  }

  if (medicationNotConfirmed && hasAnyKeyword(latestText, dizzinessKeywords)) {
    keyReasons.push("頭暈反饋與用藥未確認信號同時出現。");
    triggeredRules.push("medication not confirmed + raw_text contains 頭暈 => high_risk");
    score = Math.max(score, 78);
  }

  if (stepsDrop && sleepDrop) {
    const stepsDropPercent = Math.round((1 - steps / baselineSteps) * 100);
    const sleepDropPercent = Math.round((1 - sleep / baselineSleep) * 100);
    keyReasons.push(`步數較個人基線下降約 ${stepsDropPercent}%，睡眠較基線下降約 ${sleepDropPercent}%。`);
    triggeredRules.push("steps 50% lower and sleep 25% lower than baseline => attention");
    score = Math.max(score, 62);
  } else if (stepsDrop) {
    const stepsDropPercent = Math.round((1 - steps / baselineSteps) * 100);
    keyReasons.push(`步數較個人基線下降約 ${stepsDropPercent}%。`);
    triggeredRules.push("single strong activity abnormality => observe");
    score = Math.max(score, 38);
  } else if (sleepDrop) {
    const sleepDropPercent = Math.round((1 - sleep / baselineSleep) * 100);
    keyReasons.push(`睡眠較個人基線下降約 ${sleepDropPercent}%。`);
    triggeredRules.push("single strong sleep abnormality => observe");
    score = Math.max(score, 38);
  }

  const mildCount = [
    mildActivityDrop,
    mildSleepDrop,
    mildHeartRate,
    activeMinutesDrop,
  ].filter(Boolean).length;
  if (mildCount === 1 && score < 45) {
    keyReasons.push("有一項輕度偏離個人基線。");
    triggeredRules.push("only one mild abnormality => observe");
    score = Math.max(score, 30);
  } else if (mildCount >= 2 && score < 45) {
    keyReasons.push("有多項輕度偏離個人基線，建議巡查複核。");
    triggeredRules.push("multiple mild abnormalities => attention");
    score = Math.max(score, 48);
  }

  if (medicationNotConfirmed && score < 45) {
    keyReasons.push("晚間用藥暫未確認。");
    triggeredRules.push("medication not confirmed => observe");
    score = Math.max(score, 32);
  }

  let statusLevel = "stable";
  if (score >= 80) statusLevel = "high_risk";
  else if (score >= 45) statusLevel = "attention";
  else if (score >= 25) statusLevel = "observe";

  let recommendedAction = "保持常規照護與日常觀察。";
  if (statusLevel === "observe") {
    recommendedAction = "建議護工在例行巡查中關注變化，必要時複核資料。";
  }
  if (statusLevel === "attention") {
    recommendedAction = "建議護工今日內查看狀態，並確認休息、活動與用藥情況。";
  }
  if (statusLevel === "high_risk") {
    recommendedAction = "請護工立即查看，並觀察不適是否持續。";
  }

  if (keyReasons.length === 0) {
    keyReasons.push("今日關鍵指標接近個人基線。");
    triggeredRules.push("otherwise stable");
  }

  return buildResult({
    elder,
    statusLevel,
    riskScore: score,
    keyReasons,
    triggeredRules,
    recommendedAction,
    dataQuality,
  });
}
