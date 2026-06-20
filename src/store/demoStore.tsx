import {
  createContext,
  type Dispatch,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { mockBaselines } from "../data/mockBaselines";
import { mockContacts } from "../data/mockContacts";
import {
  mockEvents,
  mockOperationalStates,
  mockTasks,
} from "../data/mockEvents";
import { mockMedicationPlans } from "../data/mockMedicationPlans";
import { mockProfileDetails } from "../data/mockProfileDetails";
import { mockProfiles } from "../data/mockProfiles";
import { mockSnapshots } from "../data/mockSnapshots";
import { mockTrends } from "../data/mockTrends";
import { generateAgentSummaries } from "../lib/agentFormatter";
import {
  apiAnalyzeAgent,
  apiGetDashboard,
  apiPatchTask,
  apiPostEvent,
  apiPostSnapshot,
  type BackendAgentOutput,
  type BackendDashboardResponse,
  type BackendEvent,
  type BackendRiskResult,
  type BackendSnapshot,
  type BackendTask,
} from "../lib/apiClient";
import { deriveCareLoopStatus, deriveDisplayStatus } from "../lib/displayStatus";
import { calculateRisk } from "../lib/riskEngine";
import {
  getActiveTaskForElder as selectActiveTaskForElder,
  getLatestTaskForElder,
  getTaskHistoryForElder as selectTaskHistoryForElder,
} from "../lib/taskSelectors";
import type {
  AgentOutput,
  AgentRoleSummaries,
  CareEvent,
  CareTask,
  ContactPerson,
  DailySnapshot,
  ElderProfile,
  ElderProfileDetail,
  ElderTrend,
  MedicationPlan,
  OperationalState,
  PersonalBaseline,
  RiskLevel,
  RiskResult,
} from "../types";

const storageKey = "careband-agent-demo-state-v0.2";
const chenId = "E001";
const testAppleWatchId = "TEST001";
const backendFallbackMessage = "後端未連接，正在使用本地 mock fallback";

type BackendStatus = {
  mode: "local" | "connected" | "unavailable";
  lastSyncedAt?: string;
  error?: string;
};

export interface DemoState {
  profiles: Record<string, ElderProfile>;
  baselines: Record<string, PersonalBaseline>;
  snapshots: Record<string, DailySnapshot>;
  medicationPlans: Record<string, MedicationPlan>;
  contacts: Record<string, ContactPerson>;
  profileDetails: Record<string, ElderProfileDetail>;
  trends: Record<string, ElderTrend>;
  events: CareEvent[];
  tasks: CareTask[];
  operationalStates: Record<string, OperationalState>;
  backendRiskResults: Record<string, RiskResult>;
  agentOutputs: Record<string, AgentOutput>;
  backend: BackendStatus;
}

export type DemoAction =
  | { type: "RESET_DEMO" }
  | { type: "HYDRATE_FROM_BACKEND"; payload: Partial<DemoState>; syncedAt: string }
  | { type: "SET_BACKEND_STATUS"; payload: BackendStatus }
  | { type: "TRIGGER_CHEN_DIZZINESS" }
  | { type: "CAREGIVER_ACCEPT_TASK" }
  | { type: "CAREGIVER_MARK_VIEWED" }
  | { type: "CONFIRM_EVENING_MEDICATION" }
  | { type: "COMPLETE_CARE_TASK" }
  | { type: "TRIGGER_SOS" }
  | { type: "SIMULATE_DATA_GAP" }
  | { type: "IMPORT_APPLE_HEALTH_SAMPLE" };

interface DemoContextValue {
  state: DemoState;
  dispatch: Dispatch<DemoAction>;
}

const DemoContext = createContext<DemoContextValue | null>(null);

const toRecord = <T extends { elderId: string }>(items: T[]) =>
  items.reduce<Record<string, T>>((record, item) => {
    record[item.elderId] = item;
    return record;
  }, {});

const toContactRecord = (items: ContactPerson[]) =>
  items.reduce<Record<string, ContactPerson>>((record, item) => {
    record[item.contactId] = item;
    return record;
  }, {});

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const riskLevelFromBackend = (level: BackendRiskResult["status_level"]): RiskLevel => {
  if (level === "insufficient_data") return "data_insufficient";
  if (level === "observe") return "observation";
  return level;
};

const statusFromRisk = (level: RiskLevel): OperationalState => {
  if (level === "urgent" || level === "high_risk" || level === "attention") {
    return "pending";
  }
  return "normal";
};

const backendEventTypeToLocal = (eventType: string): CareEvent["eventType"] => {
  if (eventType === "sos_long_press") return "sos";
  if (
    [
      "medication_reminder",
      "medication_confirmed",
      "voice_symptom",
      "fall_detected",
      "location_alert",
      "night_wakeup",
      "low_activity",
      "caregiver_accepted",
      "caregiver_checked",
      "caregiver_completed",
      "system_risk_update",
    ].includes(eventType)
  ) {
    return eventType as CareEvent["eventType"];
  }
  return "system_risk_update";
};

const backendSourceToLocal = (source: string): CareEvent["source"] => {
  if (["demo", "mock_wearable", "caregiver", "system"].includes(source)) {
    return source as CareEvent["source"];
  }
  return source.includes("apple") ? "mock_wearable" : "system";
};

const mapBackendPayload = (payload: Record<string, unknown> = {}): CareEvent["payload"] => ({
  symptomKeywords: payload.symptom_keywords as string[] | undefined,
  medicationName: payload.medication_name as string | undefined,
  locationZone: payload.location_zone as string | undefined,
  safeZoneStatus: payload.safe_zone_status as "inside" | "outside" | "unknown" | undefined,
  nightWakeupCount: payload.night_wakeup_count as number | undefined,
  activityDropPercent: payload.activity_drop_percent as number | undefined,
  noResponseSeconds: payload.no_response_seconds as number | undefined,
  note: payload.note as string | undefined,
  previousValue: payload.previous_value as number | string | undefined,
  currentValue: payload.current_value as number | string | undefined,
});

const eventTitle = (event: BackendEvent) => {
  if (event.raw_text) return event.raw_text;
  if (event.event_type === "sos_long_press") return "SOS 长按求助";
  if (event.event_type === "fall_detected") return "跌倒检测事件";
  if (event.event_type === "caregiver_accepted") return "护工已接单";
  if (event.event_type === "caregiver_checked") return "护工已查看";
  if (event.event_type === "caregiver_completed") return "护工已完成处理";
  if (event.event_type === "medication_confirmed") return "用药已确认";
  return "系统照护事件";
};

const mapBackendEvent = (event: BackendEvent): CareEvent => ({
  eventId: event.event_id,
  elderId: event.elder_id,
  eventType: backendEventTypeToLocal(event.event_type),
  timestamp: event.timestamp,
  title: eventTitle(event),
  rawText: event.raw_text ?? undefined,
  source: backendSourceToLocal(event.source),
  payload: mapBackendPayload(event.payload),
  status: event.event_type.includes("caregiver") ? "acknowledged" : "open",
});

const deriveMedicationEvening = (events: CareEvent[]) => {
  if (events.some((event) => event.eventType === "medication_confirmed")) return "confirmed";
  if (
    events.some(
      (event) =>
        event.eventType === "medication_reminder" &&
        (event.rawText?.includes("未确认") || event.payload?.currentValue === "not_confirmed"),
    )
  ) {
    return "not_confirmed";
  }
  return "not_required";
};

const mapBackendSnapshot = (
  snapshot: BackendSnapshot,
  events: CareEvent[],
): DailySnapshot => ({
  elderId: snapshot.elder_id,
  date: snapshot.date,
  snapshotId: snapshot.snapshot_id,
  dataSource: snapshot.data_source,
  dataQuality: snapshot.data_quality,
  heartRate: snapshot.heart_rate_avg,
  restingHeartRate: snapshot.resting_heart_rate,
  stepsToday: snapshot.steps,
  activeMinutes: snapshot.active_minutes,
  sleepDuration: snapshot.sleep_duration,
  medicationMorning: "confirmed",
  medicationEvening: deriveMedicationEvening(events),
  wearTimeHours: snapshot.wear_time_hours ?? 0,
  locationZone: "长者中心二楼",
  safeZoneStatus: "inside",
  fallDetected: events.some((event) => event.eventType === "fall_detected"),
  dataCompleteness: snapshot.data_quality / 100,
  lastSyncedAt: snapshot.created_at,
});

const createMissingSnapshot = (elderId: string): DailySnapshot => ({
  elderId,
  date: new Date().toISOString().slice(0, 10),
  snapshotId: `MISSING-${elderId}`,
  dataSource: "等待 Apple Health 匯入",
  dataQuality: 0,
  heartRate: null,
  restingHeartRate: null,
  stepsToday: null,
  activeMinutes: null,
  sleepDuration: null,
  medicationMorning: "not_required",
  medicationEvening: "not_required",
  wearTimeHours: 0,
  locationZone: "測試資料",
  safeZoneStatus: "unknown",
  fallDetected: false,
  dataCompleteness: 0,
  lastSyncedAt: new Date().toISOString(),
});

const mapBackendTask = (task: BackendTask): CareTask => ({
  taskId: task.task_id,
  elderId: task.elder_id,
  sourceEventId: task.source_event_id ?? undefined,
  priority: task.priority,
  title: task.task_title,
  reason: task.task_reason,
  recommendedAction: task.recommended_action,
  assignedTo: task.handled_by ?? "护工A",
  status: task.status,
  createdAt: task.created_at,
  updatedAt: task.completed_at ?? task.created_at,
  completedAt: task.completed_at ?? undefined,
  note: task.handled_note ?? undefined,
  handledBy: task.handled_by ?? undefined,
  handledNote: task.handled_note ?? undefined,
});

const mapBackendAgentOutput = (output: BackendAgentOutput): AgentOutput => ({
  outputId: output.output_id,
  elderId: output.elder_id,
  sourceEventId: output.source_event_id ?? undefined,
  statusLevel: output.status_level,
  riskScore: output.risk_score,
  caregiverSummary: output.caregiver_summary,
  familySummary: output.family_summary,
  institutionSummary: output.institution_summary,
  recommendedAction: output.recommended_action,
  safetyDisclaimer: output.safety_disclaimer,
  keyReasons: output.key_reasons,
  agentSource: output.agent_source,
  warning: output.warning,
  createdAt: output.created_at,
});

const mapBackendRisk = (
  risk: BackendRiskResult,
  localFallback: RiskResult,
): RiskResult => ({
  ...localFallback,
  riskLevel: riskLevelFromBackend(risk.status_level),
  riskScore: Math.round(risk.risk_score),
  keyReasons: risk.key_reasons,
  triggeredRules: risk.triggered_rules,
  recommendedAction: risk.recommended_action,
  dataCompleteness: risk.data_quality / 100,
  confidence: risk.data_quality / 100,
  medicalDisclaimer: risk.safety_disclaimer,
});

const mapDashboardToDemoState = (
  dashboard: BackendDashboardResponse,
  fallback: DemoState,
): Partial<DemoState> => {
  const profiles: Record<string, ElderProfile> = {};
  const baselines: Record<string, PersonalBaseline> = {};
  const snapshots: Record<string, DailySnapshot> = {};
  const tasks: CareTask[] = [];
  const events: CareEvent[] = [];
  const operationalStates: Record<string, OperationalState> = {};
  const backendRiskResults: Record<string, RiskResult> = {};
  const agentOutputs: Record<string, AgentOutput> = {};
  const trends: Record<string, ElderTrend> = {};

  for (const row of dashboard.elders) {
    const elderId = row.elder.elder_id;
    profiles[elderId] = {
      elderId,
      name: row.elder.name,
      age: row.elder.age,
      room: row.elder.room,
      floor: fallback.profiles[elderId]?.floor ?? "二楼",
      chronicConditions: fallback.profiles[elderId]?.chronicConditions ?? [],
      riskTags: row.elder.risk_tags,
      caregiverId: fallback.profiles[elderId]?.caregiverId ?? "CG-A",
      familyContactId: fallback.profiles[elderId]?.familyContactId ?? `FAM-${elderId}`,
    };
    baselines[elderId] = {
      elderId,
      avgSteps7d: row.baseline.avg_steps_7d,
      avgSleep7d: row.baseline.avg_sleep_7d,
      avgActiveMinutes7d: row.baseline.avg_active_minutes_7d,
      restingHrBaseline: row.baseline.resting_hr_baseline,
      medicationOnTimeRate: fallback.baselines[elderId]?.medicationOnTimeRate ?? 0.9,
      baselineConfidence: row.baseline.baseline_confidence / 100,
      baselineLabel: row.baseline.baseline_label,
      usableDays: row.baseline.usable_days,
    };

    const mappedEvents = row.events.map(mapBackendEvent);
    events.push(...mappedEvents);

    if (row.latest_snapshot) {
      snapshots[elderId] = mapBackendSnapshot(row.latest_snapshot, mappedEvents);
    } else {
      snapshots[elderId] = fallback.snapshots[elderId] ?? createMissingSnapshot(elderId);
    }

    trends[elderId] =
      fallback.trends[elderId] ??
      {
        elderId,
        points: [
          {
            date: snapshots[elderId].date,
            steps: snapshots[elderId].stepsToday ?? 0,
            sleepHours: snapshots[elderId].sleepDuration ?? 0,
            medicationOnTimeRate: baselines[elderId].medicationOnTimeRate,
            riskLevel: row.risk_result
              ? riskLevelFromBackend(row.risk_result.status_level)
              : "data_insufficient",
          },
        ],
      };
    tasks.push(...row.tasks.map(mapBackendTask));

    const activeTask = row.tasks.find((task) => task.status !== "completed");
    operationalStates[elderId] = activeTask
      ? activeTask.status === "completed"
        ? "follow_up"
        : activeTask.status
      : "normal";

    if (row.risk_result && snapshots[elderId]) {
      const fallbackRisk = calculateRisk({
        profile: profiles[elderId],
        baseline: baselines[elderId],
        snapshot: snapshots[elderId],
        events: mappedEvents,
      });
      backendRiskResults[elderId] = mapBackendRisk(row.risk_result, fallbackRisk);
      operationalStates[elderId] =
        activeTask?.status ?? statusFromRisk(backendRiskResults[elderId].riskLevel);
    }

    if (row.latest_agent_output) {
      agentOutputs[elderId] = mapBackendAgentOutput(row.latest_agent_output);
    }
  }

  return {
    profiles,
    baselines,
    snapshots: { ...fallback.snapshots, ...snapshots },
    events,
    tasks,
    trends: { ...fallback.trends, ...trends },
    operationalStates,
    backendRiskResults,
    agentOutputs,
  };
};

export const createInitialDemoState = (): DemoState => ({
  profiles: toRecord(clone(mockProfiles)),
  baselines: toRecord(clone(mockBaselines)),
  snapshots: toRecord(clone(mockSnapshots)),
  medicationPlans: toRecord(clone(mockMedicationPlans)),
  contacts: toContactRecord(clone(mockContacts)),
  profileDetails: toRecord(clone(mockProfileDetails)),
  trends: toRecord(clone(mockTrends)),
  events: clone(mockEvents),
  tasks: clone(mockTasks),
  operationalStates: clone(mockOperationalStates),
  backendRiskResults: {},
  agentOutputs: {},
  backend: {
    mode: "local",
  },
});

const addEventOnce = (events: CareEvent[], event: CareEvent) =>
  events.some((existing) => existing.eventId === event.eventId)
    ? events
    : [...events, event];

const confirmEveningMedicationPlan = (
  plans: Record<string, MedicationPlan>,
  confirmedEventId = "EVT-E001-MED-PM-CONFIRMED",
) => {
  const plan = plans[chenId];
  if (!plan) return plans;

  return {
    ...plans,
    [chenId]: {
      ...plan,
      updatedAt: "2026-06-10T20:22:00+08:00",
      doses: plan.doses.map((dose) =>
        dose.label === "晚药"
          ? {
              ...dose,
              status: "confirmed" as const,
              confirmedAt: "20:22",
              confirmedBy: "护工A",
              confirmSource: "caregiver" as const,
              confirmedEventId,
            }
          : dose,
      ),
    },
  };
};

const nextTaskId = (tasks: CareTask[], baseId: string) => {
  if (!tasks.some((task) => task.taskId === baseId)) return baseId;
  return `${baseId}-${tasks.filter((task) => task.taskId.startsWith(baseId)).length + 1}`;
};

const upsertActiveTask = (tasks: CareTask[], elderId: string, task: CareTask) => {
  const activeTask = selectActiveTaskForElder(elderId, tasks);
  if (!activeTask) return [...tasks, task];
  return tasks.map((existing) =>
    existing.taskId === activeTask.taskId
      ? {
          ...existing,
          priority: task.priority,
          title: task.title,
          reason: task.reason,
          recommendedAction: task.recommendedAction,
          sourceEventId: task.sourceEventId,
          updatedAt: task.updatedAt,
        }
      : existing,
  );
};

const updateActiveTask = (
  tasks: CareTask[],
  elderId: string,
  updater: (task: CareTask) => CareTask,
) => {
  const activeTask = selectActiveTaskForElder(elderId, tasks);
  if (!activeTask) return tasks;
  return tasks.map((task) => (task.taskId === activeTask.taskId ? updater(task) : task));
};

export const demoReducer = (state: DemoState, action: DemoAction): DemoState => {
  switch (action.type) {
    case "HYDRATE_FROM_BACKEND":
      return {
        ...state,
        ...action.payload,
        backend: {
          mode: "connected",
          lastSyncedAt: action.syncedAt,
        },
      };
    case "SET_BACKEND_STATUS":
      return {
        ...state,
        backend: action.payload,
      };
    case "RESET_DEMO":
      return createInitialDemoState();
    case "TRIGGER_CHEN_DIZZINESS": {
      const existingActiveTask = selectActiveTaskForElder(chenId, state.tasks);
      const taskId = existingActiveTask?.taskId ?? nextTaskId(state.tasks, "TASK-E001-DIZZINESS");
      const voiceEvent: CareEvent = {
        eventId: "EVT-E001-DIZZINESS",
        elderId: chenId,
        eventType: "voice_symptom",
        timestamp: "2026-06-10T20:15:00+08:00",
        title: "语音反馈：我有点头晕",
        rawText: "我有点头晕",
        source: "demo",
        severity: "high_risk",
        payload: {
          symptomKeywords: ["头晕"],
        },
        status: "open",
        linkedTaskId: taskId,
        confidence: 0.94,
      };
      const notifyEvent: CareEvent = {
        eventId: "EVT-E001-NOTIFY-CAREGIVER",
        elderId: chenId,
        eventType: "system_risk_update",
        timestamp: "2026-06-10T20:16:00+08:00",
        title: "系统通知护工：陈伯需要立即查看",
        source: "system",
        severity: "high_risk",
        status: "open",
        linkedTaskId: taskId,
      };
      const highTask: CareTask = {
        taskId,
        elderId: chenId,
        sourceEventId: voiceEvent.eventId,
        priority: "high",
        title: "陈伯需要立即查看",
        reason: "头晕反馈 + 晚药未确认 + 活动明显下降",
        recommendedAction:
          "请护工立即查看，确认是否已进食和服药，并观察不适是否持续。",
        assignedTo: "护工A",
        status: "pending",
        createdAt: "2026-06-10T20:16:00+08:00",
        updatedAt: "2026-06-10T20:16:00+08:00",
      };

      return {
        ...state,
        snapshots: {
          ...state.snapshots,
          [chenId]: {
            ...state.snapshots[chenId],
            lastSyncedAt: "2026-06-10T20:16:00+08:00",
          },
        },
        events: addEventOnce(addEventOnce(state.events, voiceEvent), notifyEvent),
        tasks: upsertActiveTask(state.tasks, chenId, highTask),
        operationalStates: {
          ...state.operationalStates,
          [chenId]: "pending",
        },
      };
    }
    case "CAREGIVER_ACCEPT_TASK": {
      const activeTask = selectActiveTaskForElder(chenId, state.tasks);
      if (!activeTask) return state;
      const acceptedEvent: CareEvent = {
        eventId: "EVT-E001-CAREGIVER-ACCEPTED",
        elderId: chenId,
        eventType: "caregiver_accepted",
        timestamp: "2026-06-10T20:20:00+08:00",
        title: "护工A已接单，正在查看陈伯情况",
        source: "caregiver",
        severity: "attention",
        status: "acknowledged",
        linkedTaskId: activeTask.taskId,
        handledBy: "护工A",
        handledAt: "2026-06-10T20:20:00+08:00",
      };

      return {
        ...state,
        events: addEventOnce(state.events, acceptedEvent),
        tasks: updateActiveTask(state.tasks, chenId, (task) => ({
          ...task,
          status: "in_progress",
          updatedAt: "2026-06-10T20:20:00+08:00",
        })),
        operationalStates: {
          ...state.operationalStates,
          [chenId]: "in_progress",
        },
      };
    }
    case "CAREGIVER_MARK_VIEWED": {
      const activeTask = selectActiveTaskForElder(chenId, state.tasks);
      if (!activeTask) return state;
      const checkedEvent: CareEvent = {
        eventId: "EVT-E001-CAREGIVER-CHECKED",
        elderId: chenId,
        eventType: "caregiver_checked",
        timestamp: "2026-06-10T20:21:00+08:00",
        title: "护工A已到场查看陈伯",
        source: "caregiver",
        severity: "attention",
        payload: {
          note: "护工A已到场查看陈伯",
        },
        status: "acknowledged",
        linkedTaskId: activeTask.taskId,
        handledBy: "护工A",
        handledAt: "2026-06-10T20:21:00+08:00",
      };

      return {
        ...state,
        events: addEventOnce(state.events, checkedEvent),
        tasks: updateActiveTask(state.tasks, chenId, (task) => ({
          ...task,
          updatedAt: "2026-06-10T20:21:00+08:00",
        })),
        operationalStates: {
          ...state.operationalStates,
          [chenId]: "in_progress",
        },
      };
    }
    case "CONFIRM_EVENING_MEDICATION": {
      const activeTask = selectActiveTaskForElder(chenId, state.tasks);
      const medicationEvent: CareEvent = {
        eventId: "EVT-E001-MED-PM-CONFIRMED",
        elderId: chenId,
        eventType: "medication_confirmed",
        timestamp: "2026-06-10T20:22:00+08:00",
        title: "晚药已确认",
        source: "caregiver",
        severity: "stable",
        payload: {
          medicationName: "晚药",
        },
        status: "resolved",
        linkedTaskId: activeTask?.taskId,
        handledBy: "护工A",
        handledAt: "2026-06-10T20:22:00+08:00",
      };

      return {
        ...state,
        snapshots: {
          ...state.snapshots,
          [chenId]: {
            ...state.snapshots[chenId],
            medicationEvening: "confirmed",
            lastSyncedAt: "2026-06-10T20:22:00+08:00",
          },
        },
        medicationPlans: confirmEveningMedicationPlan(state.medicationPlans),
        events: addEventOnce(state.events, medicationEvent),
        tasks: updateActiveTask(state.tasks, chenId, (task) => ({
          ...task,
          updatedAt: "2026-06-10T20:22:00+08:00",
        })),
      };
    }
    case "COMPLETE_CARE_TASK": {
      const activeTask = selectActiveTaskForElder(chenId, state.tasks);
      const medicationEvent: CareEvent = {
        eventId: "EVT-E001-MED-PM-CONFIRMED",
        elderId: chenId,
        eventType: "medication_confirmed",
        timestamp: "2026-06-10T20:22:00+08:00",
        title: "晚药已确认",
        source: "caregiver",
        severity: "stable",
        payload: {
          medicationName: "晚药",
        },
        status: "resolved",
        linkedTaskId: activeTask?.taskId,
        handledBy: "护工A",
        handledAt: "2026-06-10T20:22:00+08:00",
      };
      const note =
        "20:25 护工A已查看陈伯，已确认晚药，陈伯目前在房间休息，建议明早继续关注活动和睡眠。";
      const completedEvent: CareEvent = {
        eventId: "EVT-E001-CAREGIVER-COMPLETED",
        elderId: chenId,
        eventType: "caregiver_completed",
        timestamp: "2026-06-10T20:25:00+08:00",
        title: "护工A已查看陈伯，已确认晚药，陈伯目前在房间休息",
        source: "caregiver",
        severity: "observation",
        payload: {
          note,
        },
        status: "resolved",
        linkedTaskId: activeTask?.taskId,
        handledBy: "护工A",
        handledAt: "2026-06-10T20:25:00+08:00",
      };

      return {
        ...state,
        snapshots: {
          ...state.snapshots,
          [chenId]: {
            ...state.snapshots[chenId],
            medicationEvening: "confirmed",
            locationZone: "房间 203",
            lastSyncedAt: "2026-06-10T20:25:00+08:00",
          },
        },
        medicationPlans: confirmEveningMedicationPlan(state.medicationPlans),
        events: addEventOnce(addEventOnce(state.events, medicationEvent), completedEvent),
        tasks: state.tasks.map((task) =>
          activeTask && task.taskId === activeTask.taskId
            ? {
                ...task,
                status: "completed",
                updatedAt: "2026-06-10T20:25:00+08:00",
                completedAt: "2026-06-10T20:25:00+08:00",
                note,
              }
            : task,
        ),
        operationalStates: {
          ...state.operationalStates,
          [chenId]: "follow_up",
        },
      };
    }
    case "TRIGGER_SOS": {
      const existingActiveTask = selectActiveTaskForElder(chenId, state.tasks);
      const taskId = existingActiveTask?.taskId ?? nextTaskId(state.tasks, "TASK-E001-SOS");
      const sosEvent: CareEvent = {
        eventId: "EVT-E001-SOS",
        elderId: chenId,
        eventType: "sos",
        timestamp: "2026-06-10T20:18:00+08:00",
        title: "SOS 测试事件",
        rawText: "SOS 求助",
        source: "demo",
        severity: "urgent",
        status: "open",
        linkedTaskId: taskId,
      };
      const urgentTask: CareTask = {
        taskId,
        elderId: chenId,
        sourceEventId: sosEvent.eventId,
        priority: "urgent",
        title: "陈伯触发 SOS，需要立即响应",
        reason: "SOS 求助事件",
        recommendedAction:
          "立即通知护工和机构负责人，并按机构应急流程处理。",
        assignedTo: "护工A",
        status: "pending",
        createdAt: "2026-06-10T20:18:00+08:00",
        updatedAt: "2026-06-10T20:18:00+08:00",
      };

      return {
        ...state,
        events: addEventOnce(state.events, sosEvent),
        tasks: upsertActiveTask(state.tasks, chenId, urgentTask),
        operationalStates: {
          ...state.operationalStates,
          [chenId]: "pending",
        },
      };
    }
    case "SIMULATE_DATA_GAP": {
      const dataGapEvent: CareEvent = {
        eventId: "EVT-E001-DATA-GAP",
        elderId: chenId,
        eventType: "system_risk_update",
        timestamp: "2026-06-10T20:30:00+08:00",
        title: "模拟数据不足：设备佩戴或同步需确认",
        source: "demo",
        severity: "data_insufficient",
        payload: {
          previousValue: state.snapshots[chenId].dataCompleteness,
          currentValue: 0.32,
        },
      };

      return {
        ...state,
        snapshots: {
          ...state.snapshots,
          [chenId]: {
            ...state.snapshots[chenId],
            dataCompleteness: 0.32,
            wearTimeHours: 4.2,
            lastSyncedAt: "2026-06-10T20:30:00+08:00",
          },
        },
        events: addEventOnce(state.events, dataGapEvent),
        operationalStates: {
          ...state.operationalStates,
          [chenId]: "pending",
        },
      };
    }
    case "IMPORT_APPLE_HEALTH_SAMPLE": {
      const targetId = state.profiles[testAppleWatchId] ? testAppleWatchId : chenId;
      const baseSnapshot = state.snapshots[targetId] ?? createMissingSnapshot(targetId);
      return {
        ...state,
        snapshots: {
          ...state.snapshots,
          [targetId]: {
            ...baseSnapshot,
            snapshotId: "LOCAL-APPLE-HEALTH-SAMPLE",
            dataSource: "Apple Health Export",
            dataQuality: 88,
            heartRate: 84,
            restingHeartRate: 72,
            stepsToday: 980,
            activeMinutes: 24,
            sleepDuration: 5.1,
            wearTimeHours: 18.2,
            dataCompleteness: 0.88,
            lastSyncedAt: new Date().toISOString(),
          },
        },
        events: addEventOnce(state.events, {
          eventId: `EVT-${targetId}-APPLE-HEALTH-IMPORT`,
          elderId: targetId,
          eventType: "system_risk_update",
          timestamp: new Date().toISOString(),
          title: "已导入 Apple Health Export 示例快照",
          source: "system",
          severity: "attention",
          payload: {
            note: "Apple Health Export",
          },
        }),
      };
    }
    default:
      return state;
  }
};

const loadInitialState = () => {
  if (typeof window === "undefined") return createInitialDemoState();
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) return createInitialDemoState();
  try {
    const parsed = JSON.parse(saved) as Partial<DemoState>;
    const initial = createInitialDemoState();
    return {
      ...initial,
      ...parsed,
      profiles: { ...initial.profiles, ...parsed.profiles },
      baselines: { ...initial.baselines, ...parsed.baselines },
      snapshots: { ...initial.snapshots, ...parsed.snapshots },
      medicationPlans: { ...initial.medicationPlans, ...parsed.medicationPlans },
      contacts: { ...initial.contacts, ...parsed.contacts },
      profileDetails: { ...initial.profileDetails, ...parsed.profileDetails },
      trends: { ...initial.trends, ...parsed.trends },
      events: parsed.events ?? initial.events,
      tasks: parsed.tasks ?? initial.tasks,
      operationalStates: { ...initial.operationalStates, ...parsed.operationalStates },
      backendRiskResults: { ...initial.backendRiskResults, ...parsed.backendRiskResults },
      agentOutputs: { ...initial.agentOutputs, ...parsed.agentOutputs },
      backend: parsed.backend ?? initial.backend,
    };
  } catch {
    return createInitialDemoState();
  }
};

const createAgentInput = (
  state: DemoState,
  elderId: string,
  riskResult: BackendRiskResult,
  sourceEventId?: string,
) => ({
  elder_profile: { ...(state.profiles[elderId] ?? { elder_id: elderId }) },
  daily_snapshot: { ...(state.snapshots[elderId] ?? { elder_id: elderId }) },
  baseline: { ...(state.baselines[elderId] ?? {}) },
  events: getEventsForElder(state, elderId).map((event) => ({ ...event })),
  risk_result: { ...riskResult },
  source_event_id: sourceEventId,
});

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [state, rawDispatch] = useReducer(demoReducer, undefined, loadInitialState);

  const refreshDashboard = useCallback(async () => {
    const dashboard = await apiGetDashboard();
    rawDispatch({
      type: "HYDRATE_FROM_BACKEND",
      payload: mapDashboardToDemoState(dashboard, state),
      syncedAt: dashboard.generated_at,
    });
  }, [state]);

  useEffect(() => {
    refreshDashboard().catch((error) => {
      console.warn("CareBand backend dashboard fallback:", error);
      rawDispatch({
        type: "SET_BACKEND_STATUS",
        payload: {
          mode: "unavailable",
          error: backendFallbackMessage,
        },
      });
    });
  }, []);

  const dispatch: Dispatch<DemoAction> = useCallback(
    (action) => {
      const run = async () => {
        if (action.type === "HYDRATE_FROM_BACKEND" || action.type === "SET_BACKEND_STATUS") {
          rawDispatch(action);
          return;
        }

        if (action.type === "RESET_DEMO") {
          rawDispatch(action);
          return;
        }

        try {
          if (action.type === "TRIGGER_CHEN_DIZZINESS") {
            const response = await apiPostEvent({
              elder_id: chenId,
              event_type: "voice_symptom",
              source: "demo",
              raw_text: "我有点头晕，不太舒服",
              payload: { symptom_keywords: ["头晕", "不舒服"] },
            });
            await apiAnalyzeAgent(
              createAgentInput(state, chenId, response.risk_result, response.event.event_id),
            ).catch(() => undefined);
            await refreshDashboard();
            return;
          }

          if (action.type === "TRIGGER_SOS") {
            const response = await apiPostEvent({
              elder_id: chenId,
              event_type: "sos_long_press",
              source: "demo",
              raw_text: "SOS 长按求助",
              payload: { button_press_seconds: 3 },
            });
            await apiAnalyzeAgent(
              createAgentInput(state, chenId, response.risk_result, response.event.event_id),
            ).catch(() => undefined);
            await refreshDashboard();
            return;
          }

          if (action.type === "SIMULATE_DATA_GAP") {
            await apiPostSnapshot({
              elder_id: chenId,
              date: new Date().toISOString().slice(0, 10),
              data_source: "Demo Control",
              heart_rate_avg: null,
              resting_heart_rate: null,
              steps: 220,
              active_minutes: 4,
              sleep_duration: null,
              wear_time_hours: 3.2,
              data_quality: 32,
            });
            await refreshDashboard();
            return;
          }

          if (action.type === "IMPORT_APPLE_HEALTH_SAMPLE") {
            await apiPostSnapshot({
              elder_id: testAppleWatchId,
              date: new Date().toISOString().slice(0, 10),
              data_source: "Apple Health Export",
              heart_rate_avg: 84,
              resting_heart_rate: 72,
              steps: 980,
              active_minutes: 24,
              sleep_duration: 5.1,
              wear_time_hours: 18.2,
              data_quality: 88,
            });
            await refreshDashboard();
            return;
          }

          if (action.type === "CAREGIVER_ACCEPT_TASK") {
            const activeTask = selectActiveTaskForElder(chenId, state.tasks);
            if (!activeTask) throw new Error("No active task to accept.");
            await apiPatchTask(activeTask.taskId, {
              status: "in_progress",
              handled_by: "护工A",
            });
            await apiPostEvent({
              elder_id: chenId,
              event_type: "caregiver_accepted",
              source: "caregiver",
              raw_text: "护工A已接单，正在查看陈伯情况",
              payload: { note: "护工A已接单" },
            });
            await refreshDashboard();
            return;
          }

          if (action.type === "CAREGIVER_MARK_VIEWED") {
            await apiPostEvent({
              elder_id: chenId,
              event_type: "caregiver_checked",
              source: "caregiver",
              raw_text: "护工A已到场查看陈伯",
              payload: { note: "护工A已到场查看" },
            });
            await refreshDashboard();
            return;
          }

          if (action.type === "CONFIRM_EVENING_MEDICATION") {
            await apiPostEvent({
              elder_id: chenId,
              event_type: "medication_confirmed",
              source: "caregiver",
              raw_text: "晚药已确认",
              payload: { medication_name: "晚药" },
            });
            await refreshDashboard();
            return;
          }

          if (action.type === "COMPLETE_CARE_TASK") {
            const activeTask = selectActiveTaskForElder(chenId, state.tasks);
            if (!activeTask) throw new Error("No active task to complete.");
            const handledNote =
              "护工A已查看陈伯，已确认晚药，目前在房间休息，建议明早继续关注活动和睡眠。";
            await apiPatchTask(activeTask.taskId, {
              status: "completed",
              handled_by: "护工A",
              handled_note: handledNote,
            });
            await apiPostEvent({
              elder_id: chenId,
              event_type: "caregiver_completed",
              source: "caregiver",
              raw_text: handledNote,
              payload: { note: handledNote },
            });
            await refreshDashboard();
            return;
          }

          rawDispatch(action);
        } catch (error) {
          console.warn("CareBand backend action fallback:", error);
          rawDispatch({
            type: "SET_BACKEND_STATUS",
            payload: {
              mode: "unavailable",
              error: backendFallbackMessage,
            },
          });
          rawDispatch(action);
        }
      };

      void run();
    },
    [refreshDashboard, state],
  );

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used inside DemoProvider");
  }
  return context;
};

export const getEventsForElder = (state: DemoState, elderId: string) =>
  state.events.filter((event) => event.elderId === elderId);

export const getTaskForElder = (state: DemoState, elderId: string) =>
  selectActiveTaskForElder(elderId, state.tasks) ??
  getLatestTaskForElder(elderId, state.tasks);

export const getActiveTaskForElder = (state: DemoState, elderId: string) =>
  selectActiveTaskForElder(elderId, state.tasks);

export const getTaskHistoryForElder = (state: DemoState, elderId: string) =>
  selectTaskHistoryForElder(elderId, state.tasks);

export const getRiskForElder = (
  state: DemoState,
  elderId: string,
): RiskResult => {
  if (state.backendRiskResults[elderId]) return state.backendRiskResults[elderId];
  return calculateRisk({
    profile: state.profiles[elderId],
    baseline: state.baselines[elderId],
    snapshot: state.snapshots[elderId],
    events: getEventsForElder(state, elderId),
  });
};

export const getAgentSummariesForElder = (
  state: DemoState,
  elderId: string,
): AgentRoleSummaries => {
  const agentOutput = state.agentOutputs[elderId];
  if (agentOutput) {
    return {
      caregiverSummary: agentOutput.caregiverSummary,
      familySummary: agentOutput.familySummary,
      institutionSummary: agentOutput.institutionSummary,
      decisionTrace: [
        `Agent 来源：${agentOutput.agentSource === "openai" ? "OpenAI" : "Mock Agent"}`,
        ...agentOutput.keyReasons,
        `建议动作：${agentOutput.recommendedAction}`,
        agentOutput.safetyDisclaimer,
      ],
      agentSource: agentOutput.agentSource,
      warning: agentOutput.warning,
      generatedAt: agentOutput.createdAt,
    };
  }

  const events = getEventsForElder(state, elderId);
  const risk = getRiskForElder(state, elderId);
  const careLoopStatus = deriveCareLoopStatus(elderId, state.tasks, events);
  const displayStatus = deriveDisplayStatus(risk, careLoopStatus);

  return generateAgentSummaries(
    state.profiles[elderId],
    state.baselines[elderId],
    state.snapshots[elderId],
    events,
    risk,
    careLoopStatus,
    displayStatus,
  );
};
