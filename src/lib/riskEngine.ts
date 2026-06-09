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

const hasSymptomEvent = (events: CareEvent[]) =>
  events.find(
    (event) =>
      event.eventType === "voice_symptom" &&
      symptomKeywords.some((keyword) => event.rawText?.includes(keyword)),
  );

const hasEventType = (events: CareEvent[], type: CareEvent["eventType"]) =>
  events.some((event) => event.eventType === type);

export const calculateRisk = ({
  profile,
  baseline,
  snapshot,
  events,
}: RiskInput): RiskResult => {
  if (snapshot.dataCompleteness < 0.4) {
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
      keyReasons: ["今日数据完整度不足，需先确认设备佩戴或数据同步"],
      triggeredRules: ["数据完整度低于 40%"],
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
  const dimensions: RiskDimensions = {
    vitals: "normal",
    activity: "normal",
    sleep: "normal",
    medication:
      snapshot.medicationMorning === "confirmed" ||
      snapshot.medicationEvening === "confirmed"
        ? "confirmed"
        : "normal",
    safety: "normal",
  };

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
    triggeredRules.push("步数明显低于个人基线");
    score += 20;
  } else if (mildActivityDrop) {
    dimensions.activity = "below_baseline";
    keyReasons.push("今日活动量低于本人近期基线，建议继续观察");
    triggeredRules.push("活动量低于个人基线");
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
    triggeredRules.push("睡眠低于个人基线 1.5 小时以上");
    score += 15;
  }

  if (snapshot.medicationEvening === "not_confirmed") {
    dimensions.medication = "not_confirmed";
    keyReasons.push("晚药尚未确认");
    triggeredRules.push("晚药提醒后未确认");
    score += 15;
  } else if (snapshot.medicationEvening === "delayed") {
    dimensions.medication = "needs_attention";
    keyReasons.push("晚药确认延迟，建议复核");
    triggeredRules.push("晚药确认延迟");
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
  } else if (snapshot.heartRate === null) {
    dimensions.vitals = "data_insufficient";
  }

  if (snapshot.safeZoneStatus === "outside") {
    dimensions.safety = "needs_attention";
    keyReasons.push("当前位置已离开预设安全区域");
    triggeredRules.push("安全区域异常");
    score += 20;
  } else if (snapshot.safeZoneStatus === "unknown") {
    dimensions.safety = "data_insufficient";
  }

  if (events.some((event) => event.title.includes("夜间离床"))) {
    dimensions.safety = "needs_attention";
    keyReasons.push("夜间离床次数较平时增加");
    triggeredRules.push("夜间离床关注");
    score += 15;
  }

  if (events.some((event) => event.title.includes("连续两天下降"))) {
    keyReasons.push("活动量连续两天下降，但暂无主诉和用药异常");
    triggeredRules.push("活动趋势连续下降");
    score += 5;
  }

  const symptomEvent = hasSymptomEvent(events);
  if (symptomEvent?.rawText) {
    keyReasons.push(`老人主动反馈：${symptomEvent.rawText}`);
    triggeredRules.push("识别到老人主动反馈不适");
    score += 25;
  }

  if (
    symptomEvent &&
    profile.chronicConditions.some(
      (condition) => condition === "高血压" || condition === "冠心病史",
    )
  ) {
    triggeredRules.push("慢病标签 + 主诉不适，提升关注优先级");
    score += 10;
  }

  const hasSos = hasEventType(events, "sos");
  const hasFall = snapshot.fallDetected || hasEventType(events, "fall_detected");
  const comboHighRisk =
    activeDrop &&
    snapshot.medicationEvening === "not_confirmed" &&
    Boolean(
      symptomEvent?.rawText &&
        ["头晕", "不舒服", "胸闷"].some((keyword) =>
          symptomEvent.rawText?.includes(keyword),
        ),
    );

  if (hasFall) {
    dimensions.safety = "high_risk";
    keyReasons.push("检测到跌倒相关事件，需照护人员确认现场情况");
    triggeredRules.push("跌倒事件触发高风险");
    score = Math.max(score, 75);
  }

  if (hasSos) {
    dimensions.safety = "high_risk";
    keyReasons.push("触发 SOS 求助事件");
    triggeredRules.push("SOS 直接升级为紧急");
    score = Math.max(score, 90);
  }

  if (keyReasons.length === 0) {
    keyReasons.push("今日状态接近本人近期基线");
    triggeredRules.push("未发现明显偏离个人基线");
  }

  let riskScore = clampScore(score);
  if (!hasSos) {
    riskScore = Math.min(riskScore, 89);
  }

  let riskLevel = getRiskLevelFromScore(riskScore);
  if (hasSos) riskLevel = "urgent";
  if (!hasSos && (comboHighRisk || hasFall)) riskLevel = "high_risk";

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
  if (comboHighRisk) {
    recommendedAction =
      "请护工立即查看，确认是否已进食和服药，并观察不适是否持续。";
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
    confidence: Number(
      Math.min(snapshot.dataCompleteness, baseline.baselineConfidence).toFixed(2),
    ),
    medicalDisclaimer,
  };
};
