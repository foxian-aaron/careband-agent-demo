import type { CareEvent, CareTask, RiskResult } from "../types";
import { getActiveTaskForElder, getLatestTaskForElder } from "./taskSelectors";

export type CareLoopStatus =
  | "none"
  | "pending"
  | "in_progress"
  | "checked"
  | "medication_confirmed"
  | "follow_up"
  | "completed";

export type DisplayStatus = {
  label: string;
  shortLabel: string;
  tone:
    | "stable"
    | "observation"
    | "attention"
    | "high_risk"
    | "urgent"
    | "follow_up"
    | "data_insufficient";
  description: string;
  shouldReassureFamily: boolean;
  shouldShowHistoricalRisk: boolean;
};

const hasEvent = (events: CareEvent[], elderId: string, type: CareEvent["eventType"]) =>
  events.some((event) => event.elderId === elderId && event.eventType === type);

export const deriveCareLoopStatus = (
  elderId: string,
  tasks: CareTask[],
  events: CareEvent[],
): CareLoopStatus => {
  const activeTask = getActiveTaskForElder(elderId, tasks);
  const latestTask = getLatestTaskForElder(elderId, tasks);
  const scopedEvents = activeTask
    ? events.filter(
        (event) =>
          event.elderId === elderId &&
          (!event.linkedTaskId || event.linkedTaskId === activeTask.taskId),
      )
    : events.filter((event) => event.elderId === elderId);

  if (activeTask?.status === "pending") return "pending";
  if (activeTask?.status === "in_progress") {
    if (hasEvent(scopedEvents, elderId, "medication_confirmed")) {
      return "medication_confirmed";
    }
    if (hasEvent(scopedEvents, elderId, "caregiver_checked")) return "checked";
    return "in_progress";
  }

  if (hasEvent(scopedEvents, elderId, "caregiver_completed") || latestTask?.status === "completed") {
    return "completed";
  }
  return "none";
};

const status = (
  label: string,
  shortLabel: string,
  tone: DisplayStatus["tone"],
  description: string,
  shouldReassureFamily = false,
  shouldShowHistoricalRisk = false,
): DisplayStatus => ({
  label,
  shortLabel,
  tone,
  description,
  shouldReassureFamily,
  shouldShowHistoricalRisk,
});

export const deriveDisplayStatus = (
  riskResult: RiskResult,
  careLoopStatus: CareLoopStatus,
): DisplayStatus => {
  if (riskResult.riskLevel === "urgent") {
    if (careLoopStatus === "completed" || careLoopStatus === "follow_up") {
      return status(
        "紧急事件已跟进 / 持续观察",
        "已跟进",
        "follow_up",
        "今日曾触发紧急事件，照护人员已完成跟进，系统继续观察。",
        true,
        true,
      );
    }
    if (careLoopStatus !== "none" && careLoopStatus !== "pending") {
      return status(
        "紧急处理中",
        "处理中",
        "urgent",
        "紧急事件已被护工接单，正在按机构流程处理。",
        false,
        true,
      );
    }
    return status(
      "紧急待处理",
      "紧急",
      "urgent",
      "已触发紧急事件，需要立即按机构应急流程处理。",
      false,
      true,
    );
  }

  if (riskResult.riskLevel === "high_risk") {
    if (careLoopStatus === "completed" || careLoopStatus === "follow_up") {
      return status(
        "已跟进 / 持续观察",
        "已跟进",
        "follow_up",
        "今日曾出现高风险事件，护工已跟进，系统将继续观察后续状态。",
        true,
        true,
      );
    }
    if (careLoopStatus === "medication_confirmed") {
      return status(
        "处理中 / 待完成记录",
        "待记录",
        "attention",
        "护工已确认关键事项，等待完成处理记录。",
        true,
        true,
      );
    }
    if (careLoopStatus === "checked") {
      return status(
        "已查看 / 待完成记录",
        "已查看",
        "attention",
        "护工已到场查看，正在完成用药和休息确认。",
        true,
        true,
      );
    }
    if (careLoopStatus === "in_progress") {
      return status(
        "高风险处理中",
        "处理中",
        "high_risk",
        "高风险提醒已被护工接单，正在现场查看。",
        false,
        true,
      );
    }
    return status(
      "高风险待处理",
      "高风险",
      "high_risk",
      "系统已识别今日高风险事件，需要护工优先处理。",
      false,
      true,
    );
  }

  if (riskResult.riskLevel === "attention") {
    if (careLoopStatus === "completed" || careLoopStatus === "follow_up") {
      return status(
        "已跟进 / 持续观察",
        "已跟进",
        "follow_up",
        "护工已完成本次关注事项，系统继续观察后续变化。",
        true,
        true,
      );
    }
    if (careLoopStatus === "medication_confirmed" || careLoopStatus === "checked") {
      return status(
        "需关注处理中",
        "处理中",
        "attention",
        "护工已开始处理关注事项，等待完成记录。",
        true,
        false,
      );
    }
    if (careLoopStatus === "in_progress") {
      return status(
        "需关注处理中",
        "处理中",
        "attention",
        "护工已接单，正在确认今日关注事项。",
        true,
        false,
      );
    }
    if (careLoopStatus === "pending") {
      return status(
        "需关注待处理",
        "需关注",
        "attention",
        "系统已生成关注提醒，等待护工处理。",
        false,
        false,
      );
    }
    return status(
      "需关注",
      "需关注",
      "attention",
      "今日状态较个人基线有偏离，建议照护人员关注。",
      false,
      false,
    );
  }

  if (riskResult.riskLevel === "data_insufficient") {
    return status(
      "数据不足 / 需确认佩戴或同步",
      "数据不足",
      "data_insufficient",
      "今日数据完整度不足，需先确认设备佩戴或数据同步。",
      false,
      false,
    );
  }

  if (riskResult.riskLevel === "observation") {
    return status(
      "观察",
      "观察",
      "observation",
      "今日有轻微偏离，建议在日常巡查中继续观察。",
      true,
      false,
    );
  }

  return status(
    "稳定",
    "稳定",
    "stable",
    "今日状态接近本人近期基线。",
    true,
    false,
  );
};

export const displayToneToPillTone = (tone: DisplayStatus["tone"]) => {
  if (tone === "high_risk") return "high-risk";
  if (tone === "data_insufficient") return "muted";
  if (tone === "follow_up") return "follow-up";
  return tone;
};
