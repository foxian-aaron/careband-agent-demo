import type { DemoState } from "../store/demoStore";
import type { MedicationDose, MedicationDoseStatus, MedicationPlan } from "../types";
import { medicationLabels } from "./statusLabels";

export type MedicationTimelineItem = {
  time: string;
  title: string;
  description: string;
  source: string;
  status: "done" | "pending" | "warning";
};

const getDoseByLabel = (doses: MedicationDose[], label: string) =>
  doses.find((dose) => dose.label === label);

const formatSource = (source?: MedicationDose["confirmSource"]) => {
  if (source === "elder_button") return "老人按钮确认";
  if (source === "caregiver") return "护工确认";
  if (source === "demo") return "Demo 控制";
  if (source === "system") return "系统记录";
  return "-";
};

const statusToTimelineStatus = (
  status: MedicationDoseStatus,
): "done" | "pending" | "warning" => {
  if (status === "confirmed" || status === "not_required") return "done";
  if (status === "delayed") return "warning";
  return "pending";
};

export const getMedicationPlanForElder = (
  elderId: string,
  state: DemoState,
): MedicationPlan | undefined => state.medicationPlans[elderId];

export const getMedicationDosesForElder = (
  elderId: string,
  state: DemoState,
): MedicationDose[] => getMedicationPlanForElder(elderId, state)?.doses ?? [];

export const getEveningMedicationDose = (
  elderId: string,
  state: DemoState,
): MedicationDose | undefined => getDoseByLabel(getMedicationDosesForElder(elderId, state), "晚药");

export const isEveningMedicationConfirmed = (elderId: string, state: DemoState) =>
  getEveningMedicationDose(elderId, state)?.status === "confirmed";

export const getTodayMedicationSummary = (
  elderId: string,
  state: DemoState,
): {
  morningStatus: MedicationDoseStatus;
  eveningStatus: MedicationDoseStatus;
  confirmedCount: number;
  pendingCount: number;
  delayedCount: number;
  notRequiredCount: number;
  lastConfirmedAt?: string;
  lastConfirmedBy?: string;
  summaryText: string;
} => {
  const doses = getMedicationDosesForElder(elderId, state);
  const morningStatus = getDoseByLabel(doses, "早药")?.status ?? "not_required";
  const eveningStatus = getDoseByLabel(doses, "晚药")?.status ?? "not_required";
  const confirmedDoses = doses.filter((dose) => dose.status === "confirmed");
  const lastConfirmed = [...confirmedDoses]
    .filter((dose) => dose.confirmedAt)
    .sort((a, b) => (b.confirmedAt ?? "").localeCompare(a.confirmedAt ?? ""))[0];
  const pendingCount = doses.filter((dose) => dose.status === "not_confirmed").length;
  const delayedCount = doses.filter((dose) => dose.status === "delayed").length;
  const notRequiredCount = doses.filter((dose) => dose.status === "not_required").length;

  return {
    morningStatus,
    eveningStatus,
    confirmedCount: confirmedDoses.length,
    pendingCount,
    delayedCount,
    notRequiredCount,
    lastConfirmedAt: lastConfirmed?.confirmedAt,
    lastConfirmedBy: lastConfirmed?.confirmedBy,
    summaryText:
      pendingCount > 0
        ? `今日已确认 ${confirmedDoses.length}/${doses.length} 项，仍有 ${pendingCount} 项待确认。`
        : `今日用药记录已确认 ${confirmedDoses.length}/${doses.length} 项。`,
  };
};

export const getMedicationTimeline = (
  elderId: string,
  state: DemoState,
): MedicationTimelineItem[] => {
  const doses = getMedicationDosesForElder(elderId, state);
  const events = state.events.filter(
    (event) =>
      event.elderId === elderId &&
      ["medication_reminder", "medication_confirmed"].includes(event.eventType),
  );
  const eventTimes = new Map(events.map((event) => [event.eventId, event.timestamp.slice(11, 16)]));
  const timeline = doses.flatMap((dose) => {
    const reminderTime =
      (dose.reminderEventId && eventTimes.get(dose.reminderEventId)) ?? dose.scheduledTime;
    const items: MedicationTimelineItem[] = [
      {
        time: reminderTime,
        title: `${dose.label}提醒`,
        description: `${dose.medicationName}，${dose.instruction}`,
        source: "系统提醒",
        status: dose.status === "not_confirmed" ? "pending" : "done",
      },
    ];

    if (dose.status === "not_confirmed") {
      items.push({
        time: dose.label === "晚药" ? "20:15" : reminderTime,
        title: `${dose.label}尚未确认`,
        description: "系统保留为照护关注记录，等待护工确认。",
        source: "照护记录",
        status: "warning",
      });
    } else if (dose.status === "confirmed") {
      items.push({
        time:
          dose.confirmedAt ??
          (dose.confirmedEventId && eventTimes.get(dose.confirmedEventId)) ??
          dose.scheduledTime,
        title: `${dose.label}已确认`,
        description: `${dose.confirmedBy ?? "照护人员"}通过${formatSource(
          dose.confirmSource,
        )}完成记录。`,
        source: formatSource(dose.confirmSource),
        status: "done",
      });
    } else if (dose.status === "delayed") {
      items.push({
        time: dose.scheduledTime,
        title: `${dose.label}延迟记录`,
        description: "当前为模拟延迟记录，护工巡查时确认即可。",
        source: "照护记录",
        status: "warning",
      });
    } else {
      items.push({
        time: dose.scheduledTime,
        title: `${dose.label}无需确认`,
        description: "今日无固定用药计划。",
        source: "照护记录",
        status: "done",
      });
    }

    return items;
  });

  return timeline.sort((a, b) => a.time.localeCompare(b.time)).map((item) => ({
    ...item,
    description: `${item.description} 当前状态：${
      medicationLabels[doses.find((dose) => item.title.startsWith(dose.label))?.status ?? "not_required"]
    }。`,
    status: item.status ?? statusToTimelineStatus("not_confirmed"),
  }));
};
