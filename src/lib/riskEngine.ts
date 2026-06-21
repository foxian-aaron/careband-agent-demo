import type {
  CareEvent,
  DailySnapshot,
  ElderProfile,
  PersonalBaseline,
  RiskDimensions,
  RiskLevel,
  RiskResult,
} from "../types";
import { medicalDisclaimer } from "./statusLabels";

export interface RiskInput {
  profile: ElderProfile;
  baseline: PersonalBaseline;
  snapshot: DailySnapshot;
  events: CareEvent[];
}

const symptomKeywords = [
  "头晕",
  "不舒服",
  "胸闷",
  "心口痛",
  "摔倒",
  "走不动",
  "喘不过气",
];

const severeSymptomKeywords = ["救命", "摔倒了", "胸口痛", "喘不过气", "动不了"];

const clampScore = (score: number) => Math.max(0, Math.min(100, Math.round(score)));

const toHoursDiff = (baseline: number, current: number) =>
  Math.max(0, baseline - current).toFixed(1);

const getRiskLevelFromScore = (score: number): RiskLevel => {
  if (score >= 90) return "urgent";
  if (score >= 70) return "high_risk";
  if (score >= 45) return "attention";
  if (score >= 25) return "observation";
  return "stable";
};

const createBaseDimensions = (snapshot: DailySnapshot): RiskDimensions => ({
  vitals: snapshot.heartRate === null ? "data_insufficient" : "normal",
  activity: snapshot.stepsToday === null ? "data_insufficient" : "normal",
  sleep: snapshot.sleepDuration === null ? "data_insufficient" : "normal",
  medication:
    snapshot.medicationMorning === "confirmed" ||
    snapshot.medicationEvening === "confirmed"
      ? "confirmed"
      : "normal",
  safety:
    snapshot.safeZoneStatus === "unknown" ? "data_insufficient" : "normal",
});

const eventText = (event: CareEvent) =>
  [event.rawText, ...(event.payload?.symptomKeywords ?? [])].filter(Boolean).join(" ");

const hasKeyword = (event: CareEvent, keywords: string[]) =>
  keywords.some((keyword) => eventText(event).includes(keyword));

const findSymptomEvent = (events: CareEvent[], keywords = symptomKeywords) =>
  events.find(
    (event) => event.eventType === "voice_symptom" && hasKeyword(event, keywords),
  );

const confidence = (snapshot: DailySnapshot, baseline: PersonalBaseline) =>
  Number(Math.min(snapshot.dataCompleteness, baseline.baselineConfidence).toFixed(2));

const hardResult = (
  profile: ElderProfile,
  baseline: PersonalBaseline,
  snapshot: DailySnapshot,
  riskLevel: RiskLevel,
  riskScore: number,
  dimensions: RiskDimensions,
  keyReasons: string[],
  triggeredRules: string[],
  recommendedAction: string,
): RiskResult => ({
  elderId: profile.elderId,
  riskLevel,
  riskScore: clampScore(riskScore),
  dimensions,
  keyReasons,
  triggeredRules,
  recommendedAction,
  dataCompleteness: snapshot.dataCompleteness,
  confidence: confidence(snapshot, baseline),
  medicalDisclaimer,
});

export const calculateRisk = ({
  profile,
  baseline,
  snapshot,
  events,
}: RiskInput): RiskResult => {
  const dimensions = createBaseDimensions(snapshot);
  const sosEvent = events.find((event) =>
    ["sos", "sos_long_press", "sos_triple_press"].includes(event.eventType),
  );
  const fallEvent = events.find((event) =>
    ["fall_detected", "inactivity_after_fall", "no_response_after_fall"].includes(
      event.eventType,
    ),
  );
  const locationOutsideEvent = events.find(
    (event) =>
      ["location_alert", "geofence_exit", "wandering_help"].includes(
        event.eventType,
      ) &&
      event.payload?.safeZoneStatus === "outside",
  );
  const severeVoiceEvent = findSymptomEvent(events, severeSymptomKeywords);

  if (sosEvent) {
    dimensions.safety = "high_risk";
    const keyReasons = ["触发 SOS 求助事件"];
    if (snapshot.dataCompleteness < 0.4) {
      keyReasons.push("虽然今日数据完整度不足，但老人触发了 SOS，需优先按应急流程处理。");
    }
    return hardResult(
      profile,
      baseline,
      snapshot,
      "urgent",
      95,
      dimensions,
      keyReasons,
      ["R8 SOS 事件直接进入紧急流程"],
      "立即通知护工和机构负责人，并按机构应急流程处理。",
    );
  }

  if (snapshot.fallDetected || fallEvent) {
    dimensions.safety = "high_risk";
    const noResponseSeconds = fallEvent?.payload?.noResponseSeconds ?? 0;
    const isUrgent = noResponseSeconds >= 30;
    return hardResult(
      profile,
      baseline,
      snapshot,
      isUrgent ? "urgent" : "high_risk",
      isUrgent ? 92 : 78,
      dimensions,
      [
        isUrgent
          ? `检测到跌倒相关事件，且 ${noResponseSeconds} 秒内未确认回应`
          : "检测到跌倒相关事件，需照护人员确认现场情况",
      ],
      [
        isUrgent
          ? "R8 跌倒事件 + 未回应升级为紧急"
          : "R8 跌倒事件触发高风险",
      ],
      isUrgent
        ? "立即通知护工和机构负责人，并按机构应急流程处理。"
        : "请护工立即查看现场情况，并确认是否需要联系专业人员判断。",
    );
  }

  if (locationOutsideEvent) {
    dimensions.safety = "high_risk";
    return hardResult(
      profile,
      baseline,
      snapshot,
      "high_risk",
      80,
      dimensions,
      ["位置事件显示已离开预设安全区域"],
      ["R8 安全区域离开触发高风险"],
      "请护工立即确认长者当前位置，并按机构安全巡查流程处理。",
    );
  }

  if (severeVoiceEvent?.rawText) {
    dimensions.safety = "high_risk";
    return hardResult(
      profile,
      baseline,
      snapshot,
      "urgent",
      90,
      dimensions,
      [`老人主动反馈：${severeVoiceEvent.rawText}`],
      ["R8 严重主诉关键词直接进入紧急流程"],
      "立即通知护工和机构负责人，并按机构应急流程处理。",
    );
  }

  const deviceNotWornEvent = events.find((event) => event.eventType === "device_not_worn");

  if (snapshot.dataCompleteness < 0.4 || deviceNotWornEvent) {
    return {
      elderId: profile.elderId,
      riskLevel: "data_insufficient",
      riskScore: Math.min(30, clampScore(snapshot.dataCompleteness * 75)),
      dimensions: {
        vitals: "data_insufficient",
        activity: "data_insufficient",
        sleep: "data_insufficient",
        medication: "data_insufficient",
        safety: "data_insufficient",
      },
      keyReasons: [
        deviceNotWornEvent
          ? "设备未佩戴或佩戴状态异常，需先确认设备"
          : "今日数据完整度不足，需先确认设备佩戴或数据同步",
      ],
      triggeredRules: [
        deviceNotWornEvent ? "R1 设备未佩戴" : "R1 数据完整度低于 40%",
      ],
      recommendedAction:
        "请先确认设备佩戴和数据同步，再由照护人员结合现场情况判断是否需要跟进。",
      dataCompleteness: snapshot.dataCompleteness,
      confidence: snapshot.dataCompleteness,
      medicalDisclaimer,
    };
  }

  let score = 5;
  const keyReasons: string[] = [];
  const triggeredRules: string[] = [];
  const stepsToday = snapshot.stepsToday;
  const activeDrop =
    stepsToday !== null &&
    baseline.avgSteps7d > 0 &&
    stepsToday < baseline.avgSteps7d * 0.5;
  const mildActivityDrop =
    !activeDrop &&
    stepsToday !== null &&
    baseline.avgSteps7d > 0 &&
    stepsToday < baseline.avgSteps7d * 0.75;

  if (activeDrop && stepsToday !== null) {
    const dropPercent = Math.round((1 - stepsToday / baseline.avgSteps7d) * 100);
    dimensions.activity = "significantly_low";
    keyReasons.push(`今日步数低于本人 7 日平均约 ${dropPercent}%`);
    triggeredRules.push("R2 活动明显下降");
    score += 20;
  } else if (mildActivityDrop) {
    dimensions.activity = "below_baseline";
    keyReasons.push("今日活动量低于本人近期基线，建议继续观察");
    triggeredRules.push("R2 活动低于个人基线");
    score += 15;
  }

  if (
    snapshot.sleepDuration !== null &&
    snapshot.sleepDuration < baseline.avgSleep7d - 1.5
  ) {
    dimensions.sleep = "below_baseline";
    keyReasons.push(
      `昨晚睡眠低于本人基线 ${toHoursDiff(
        baseline.avgSleep7d,
        snapshot.sleepDuration,
      )} 小时`,
    );
    triggeredRules.push("R3 睡眠偏低");
    score += 15;
  }

  if (snapshot.medicationEvening === "not_confirmed") {
    dimensions.medication = "not_confirmed";
    keyReasons.push("晚药尚未确认");
    triggeredRules.push("R4 晚药未确认");
    score += 15;
  } else if (snapshot.medicationEvening === "delayed") {
    dimensions.medication = "needs_attention";
    keyReasons.push("晚药确认延迟，建议复核");
    triggeredRules.push("R4 晚药确认延迟");
    score += 8;
  }

  if (
    snapshot.heartRate !== null &&
    snapshot.heartRate - baseline.restingHrBaseline >= 12
  ) {
    dimensions.vitals = "slightly_high";
    keyReasons.push(
      `当前心率较本人静息基线偏高 ${
        snapshot.heartRate - baseline.restingHrBaseline
      } bpm`,
    );
    triggeredRules.push("心率较个人静息基线偏高");
    score += 5;
  }

  if (snapshot.safeZoneStatus === "outside") {
    dimensions.safety = "needs_attention";
    keyReasons.push("当前位置已离开预设安全区域");
    triggeredRules.push("安全区域异常");
    score += 20;
  }

  const nightWakeupEvent = events.find((event) => event.eventType === "night_wakeup");
  if (nightWakeupEvent) {
    dimensions.safety = "needs_attention";
    keyReasons.push(
      `夜间离床次数较平时增加${
        nightWakeupEvent.payload?.nightWakeupCount
          ? `，记录 ${nightWakeupEvent.payload.nightWakeupCount} 次`
          : ""
      }`,
    );
    triggeredRules.push("夜间离床关注");
    score += 15;
  }

  const lowActivityEvent = events.find((event) => event.eventType === "low_activity");
  if (lowActivityEvent) {
    keyReasons.push(
      lowActivityEvent.payload?.activityDropPercent
        ? `活动量连续下降，较平时下降约 ${lowActivityEvent.payload.activityDropPercent}%`
        : "活动量连续下降，但暂无主诉和用药异常",
    );
    triggeredRules.push("活动趋势连续下降");
    score += 5;
  }

  const symptomEvent = findSymptomEvent(events);
  if (symptomEvent?.rawText) {
    keyReasons.push(`老人主动反馈：${symptomEvent.rawText}`);
    triggeredRules.push("R5 主诉症状");
    score += 25;
  }

  if (
    symptomEvent &&
    profile.chronicConditions.some(
      (condition) => condition === "高血压" || condition === "冠心病史",
    )
  ) {
    triggeredRules.push("R6 慢病标签 + 主诉不适，提升关注优先级");
    score += 10;
  }

  const comboHighRisk =
    activeDrop &&
    snapshot.medicationEvening === "not_confirmed" &&
    Boolean(
      symptomEvent?.rawText &&
        ["头晕", "不舒服", "胸闷"].some((keyword) =>
          symptomEvent.rawText?.includes(keyword),
        ),
    );

  if (comboHighRisk) {
    triggeredRules.push("R7 组合高风险");
    score = Math.max(score, 76);
  }

  if (keyReasons.length === 0) {
    keyReasons.push("今日状态接近本人近期基线");
    triggeredRules.push("R9 未发现明显偏离个人基线");
  }

  const riskScore = Math.min(clampScore(score), 89);
  let riskLevel = getRiskLevelFromScore(riskScore);
  if (comboHighRisk) riskLevel = "high_risk";

  let recommendedAction = "保持常规照护与日常观察。";
  if (riskLevel === "observation") {
    recommendedAction = "建议护工在例行巡查中关注变化，必要时复核数据。";
  }
  if (riskLevel === "attention") {
    recommendedAction = "建议护工今日内查看状态，并确认用药、休息和活动情况。";
  }
  if (riskLevel === "high_risk") {
    recommendedAction =
      "请护工立即查看，确认是否已进食和服药，并观察不适是否持续。";
  }
  if (riskLevel === "urgent") {
    recommendedAction =
      "立即通知护工和机构负责人，并按机构应急流程处理。";
  }

  return {
    elderId: profile.elderId,
    riskLevel,
    riskScore,
    dimensions,
    keyReasons,
    triggeredRules,
    recommendedAction,
    dataCompleteness: snapshot.dataCompleteness,
    confidence: confidence(snapshot, baseline),
    medicalDisclaimer,
  };
};
