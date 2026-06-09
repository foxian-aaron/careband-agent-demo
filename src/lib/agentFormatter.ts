import type {
  AgentRoleSummaries,
  CareEvent,
  DailySnapshot,
  ElderProfile,
  PersonalBaseline,
  RiskResult,
} from "../types";
import { formatClock } from "./dateUtils";
import { medicationLabels, operationalLabels, riskLabels } from "./statusLabels";

type TaskState = "pending" | "in_progress" | "completed" | "normal" | "follow_up";

const findSymptomEvent = (events: CareEvent[]) =>
  events.find((event) => event.eventType === "voice_symptom" && event.rawText);

const taskStateText = (taskState: TaskState) => {
  if (taskState === "completed" || taskState === "follow_up") {
    return "护工已查看并记录，正在持续观察。";
  }
  if (taskState === "in_progress") return "护工已接单，正在查看。";
  if (taskState === "pending") return "护工已收到提醒，等待处理。";
  return "暂无待处理任务。";
};

export const generateAgentSummaries = (
  profile: ElderProfile,
  baseline: PersonalBaseline,
  snapshot: DailySnapshot,
  events: CareEvent[],
  riskResult: RiskResult,
  taskState: TaskState = "normal",
): AgentRoleSummaries => {
  const symptomEvent = findSymptomEvent(events);
  const symptomText = symptomEvent?.rawText
    ? `，并在 ${formatClock(symptomEvent.timestamp)} 反馈“${symptomEvent.rawText}”`
    : "";
  const stepDrop =
    snapshot.stepsToday === null
      ? "步数数据暂不完整"
      : `今日步数 ${snapshot.stepsToday} 步，7 日平均 ${baseline.avgSteps7d} 步`;
  const sleepText =
    snapshot.sleepDuration === null
      ? "睡眠数据暂不完整"
      : `昨晚睡眠 ${snapshot.sleepDuration} 小时，个人基线 ${baseline.avgSleep7d} 小时`;
  const taskText = taskStateText(taskState);

  const caregiverSummary = `${profile.name}${stepDrop}，${sleepText}，晚药状态为“${medicationLabels[snapshot.medicationEvening]}”${symptomText}。当前风险为“${riskLabels[riskResult.riskLevel]}”，建议动作：${riskResult.recommendedAction}`;

  const familySummary =
    taskState === "completed" || taskState === "follow_up"
      ? `护工已查看${profile.name}，晚药已确认，目前${profile.name}在房间休息，系统将继续观察明早活动与睡眠情况。`
      : symptomEvent?.rawText
        ? `今晚 ${formatClock(symptomEvent.timestamp)}，${profile.name}反馈有点头晕。系统已提醒护工查看，目前${taskText}${profile.name}仍在长者中心内，未检测到跌倒。`
        : `${profile.name}今日活动量较平时偏低，晚药尚未确认，护工端已收到关注提醒。${profile.name}仍在长者中心内，未检测到跌倒。`;

  const institutionSummary = `${profile.name}当前风险等级为“${riskLabels[riskResult.riskLevel]}”，运营状态为“${operationalLabels[taskState === "completed" ? "follow_up" : taskState]}”。${taskText}建议机构在晚间巡查中优先核对用药、活动和休息状态。`;

  const decisionTrace = [
    `读取老人档案：${profile.name}，${profile.age} 岁，房间 ${profile.room}，慢病标签 ${profile.chronicConditions.join("、") || "无"}。`,
    `读取个人基线：7 日平均步数 ${baseline.avgSteps7d} 步，平均睡眠 ${baseline.avgSleep7d} 小时，静息心率基线 ${baseline.restingHrBaseline} bpm。`,
    `对比今日步数：${snapshot.stepsToday ?? "缺失"} 步，活动状态为 ${riskResult.dimensions.activity}。`,
    `对比睡眠：${snapshot.sleepDuration ?? "缺失"} 小时，睡眠状态为 ${riskResult.dimensions.sleep}。`,
    `检查用药：早药 ${medicationLabels[snapshot.medicationMorning]}，晚药 ${medicationLabels[snapshot.medicationEvening]}。`,
    `检查事件：共 ${events.length} 条事件${
      symptomEvent?.rawText ? `，包含语音反馈“${symptomEvent.rawText}”` : ""
    }。`,
    `触发规则：${riskResult.triggeredRules.join("；")}。`,
    `规则引擎输出：${riskLabels[riskResult.riskLevel]}，风险分 ${riskResult.riskScore}，置信度 ${Math.round(riskResult.confidence * 100)}%。`,
    `输出给护工：${caregiverSummary}`,
    `输出给家属：${familySummary}`,
    `输出给机构：${institutionSummary}`,
  ];

  return {
    caregiverSummary,
    familySummary,
    institutionSummary,
    decisionTrace,
  };
};
