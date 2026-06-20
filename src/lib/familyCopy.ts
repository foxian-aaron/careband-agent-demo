import type {
  CareEvent,
  CareTask,
  DailySnapshot,
  ElderProfile,
  RiskResult,
} from "../types";
import type { CareLoopStatus, DisplayStatus } from "./displayStatus";
import { formatClock } from "./dateUtils";

const latestVoiceSymptom = (events: CareEvent[]) =>
  events
    .filter((event) => event.eventType === "voice_symptom" && event.rawText)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

export const buildFamilyStatusMessage = (
  profile: ElderProfile,
  riskResult: RiskResult,
  displayStatus: DisplayStatus,
  snapshot: DailySnapshot,
  events: CareEvent[],
  activeTask?: CareTask,
  careLoopStatus: CareLoopStatus = "none",
) => {
  const voiceEvent = latestVoiceSymptom(events);
  const inCenterText =
    snapshot.safeZoneStatus === "inside"
      ? `${profile.name}仍在长者中心内`
      : `${profile.name}的位置需要护工确认`;
  const fallText = snapshot.fallDetected ? "跌倒检测需要确认" : "未检测到跌倒";

  if (careLoopStatus === "completed" || displayStatus.tone === "follow_up") {
    return `护工已查看${profile.name}，晚药已确认，目前${profile.name}在房间休息，系统将继续观察明早活动与睡眠情况。`;
  }

  if (careLoopStatus === "medication_confirmed") {
    return "晚药已确认，护工正在完成处理记录。";
  }

  if (careLoopStatus === "checked") {
    return `护工已到场查看${profile.name}，正在确认用药和休息情况。`;
  }

  if (careLoopStatus === "in_progress" || activeTask?.status === "in_progress") {
    return `护工已接单，正在查看${profile.name}情况。`;
  }

  if (voiceEvent?.rawText) {
    return `今晚 ${formatClock(voiceEvent.timestamp)}，${profile.name}反馈“${voiceEvent.rawText}”。系统已提醒护工查看，目前${inCenterText}，${fallText}。`;
  }

  if (riskResult.riskLevel === "data_insufficient") {
    return `${profile.name}今日数据暂不完整，系统建议先确认设备佩戴或数据同步。`;
  }

  return `${profile.name}今日活动量较平时偏低，晚药尚未确认，护工端已收到关注提醒。`;
};
