import {
  createContext,
  type Dispatch,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { mockBaselines } from "../data/mockBaselines";
import {
  mockEvents,
  mockOperationalStates,
  mockTasks,
} from "../data/mockEvents";
import { mockMedicationPlans, mockProfiles } from "../data/mockProfiles";
import { mockSnapshots } from "../data/mockSnapshots";
import { mockTrends } from "../data/mockTrends";
import { generateAgentSummaries } from "../lib/agentFormatter";
import { calculateRisk } from "../lib/riskEngine";
import type {
  AgentRoleSummaries,
  CareEvent,
  CareTask,
  DailySnapshot,
  ElderProfile,
  ElderTrend,
  MedicationPlan,
  OperationalState,
  PersonalBaseline,
  RiskResult,
} from "../types";

const storageKey = "careband-agent-demo-state-v0.1";
const chenId = "E001";

export interface DemoState {
  profiles: Record<string, ElderProfile>;
  baselines: Record<string, PersonalBaseline>;
  snapshots: Record<string, DailySnapshot>;
  medicationPlans: Record<string, MedicationPlan>;
  trends: Record<string, ElderTrend>;
  events: CareEvent[];
  tasks: CareTask[];
  operationalStates: Record<string, OperationalState>;
}

export type DemoAction =
  | { type: "RESET_DEMO" }
  | { type: "TRIGGER_CHEN_DIZZINESS" }
  | { type: "CAREGIVER_ACCEPT_TASK" }
  | { type: "CONFIRM_EVENING_MEDICATION" }
  | { type: "COMPLETE_CARE_TASK" }
  | { type: "TRIGGER_SOS" }
  | { type: "SIMULATE_DATA_GAP" };

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

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const createInitialDemoState = (): DemoState => ({
  profiles: toRecord(clone(mockProfiles)),
  baselines: toRecord(clone(mockBaselines)),
  snapshots: toRecord(clone(mockSnapshots)),
  medicationPlans: toRecord(clone(mockMedicationPlans)),
  trends: toRecord(clone(mockTrends)),
  events: clone(mockEvents),
  tasks: clone(mockTasks),
  operationalStates: clone(mockOperationalStates),
});

const addEventOnce = (events: CareEvent[], event: CareEvent) =>
  events.some((existing) => existing.eventId === event.eventId)
    ? events
    : [...events, event];

const replaceChenTask = (tasks: CareTask[], task: CareTask) => [
  ...tasks.filter((existing) => existing.elderId !== chenId),
  task,
];

const updateChenTask = (
  tasks: CareTask[],
  updater: (task: CareTask) => CareTask,
) =>
  tasks.map((task) =>
    task.elderId === chenId && task.status !== "completed" ? updater(task) : task,
  );

const reducer = (state: DemoState, action: DemoAction): DemoState => {
  switch (action.type) {
    case "RESET_DEMO":
      return createInitialDemoState();
    case "TRIGGER_CHEN_DIZZINESS": {
      const voiceEvent: CareEvent = {
        eventId: "EVT-E001-DIZZINESS",
        elderId: chenId,
        eventType: "voice_symptom",
        timestamp: "2026-06-10T20:15:00+08:00",
        title: "语音反馈：我有点头晕",
        rawText: "我有点头晕",
        source: "demo",
        severity: "high_risk",
      };
      const notifyEvent: CareEvent = {
        eventId: "EVT-E001-NOTIFY-CAREGIVER",
        elderId: chenId,
        eventType: "system_risk_update",
        timestamp: "2026-06-10T20:16:00+08:00",
        title: "系统通知护工：陈伯需要立即查看",
        source: "system",
        severity: "high_risk",
      };
      const highTask: CareTask = {
        taskId: "TASK-E001-DIZZINESS",
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
        tasks: replaceChenTask(state.tasks, highTask),
        operationalStates: {
          ...state.operationalStates,
          [chenId]: "pending",
        },
      };
    }
    case "CAREGIVER_ACCEPT_TASK": {
      const acceptedEvent: CareEvent = {
        eventId: "EVT-E001-CAREGIVER-ACCEPTED",
        elderId: chenId,
        eventType: "caregiver_accepted",
        timestamp: "2026-06-10T20:20:00+08:00",
        title: "护工A已接单，正在查看陈伯情况",
        source: "caregiver",
        severity: "attention",
      };

      return {
        ...state,
        events: addEventOnce(state.events, acceptedEvent),
        tasks: updateChenTask(state.tasks, (task) => ({
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
    case "CONFIRM_EVENING_MEDICATION": {
      const medicationEvent: CareEvent = {
        eventId: "EVT-E001-MED-PM-CONFIRMED",
        elderId: chenId,
        eventType: "medication_confirmed",
        timestamp: "2026-06-10T20:22:00+08:00",
        title: "晚药已确认",
        source: "caregiver",
        severity: "stable",
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
        events: addEventOnce(state.events, medicationEvent),
        tasks: updateChenTask(state.tasks, (task) => ({
          ...task,
          updatedAt: "2026-06-10T20:22:00+08:00",
        })),
      };
    }
    case "COMPLETE_CARE_TASK": {
      const medicationEvent: CareEvent = {
        eventId: "EVT-E001-MED-PM-CONFIRMED",
        elderId: chenId,
        eventType: "medication_confirmed",
        timestamp: "2026-06-10T20:22:00+08:00",
        title: "晚药已确认",
        source: "caregiver",
        severity: "stable",
      };
      const completedEvent: CareEvent = {
        eventId: "EVT-E001-CAREGIVER-COMPLETED",
        elderId: chenId,
        eventType: "caregiver_completed",
        timestamp: "2026-06-10T20:25:00+08:00",
        title: "护工A已查看陈伯，已确认晚药，陈伯目前在房间休息",
        source: "caregiver",
        severity: "observation",
      };
      const note =
        "20:25 护工A已查看陈伯，已确认晚药，陈伯目前在房间休息，建议明早继续关注活动和睡眠。";

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
        events: addEventOnce(addEventOnce(state.events, medicationEvent), completedEvent),
        tasks: state.tasks.map((task) =>
          task.elderId === chenId
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
      const sosEvent: CareEvent = {
        eventId: "EVT-E001-SOS",
        elderId: chenId,
        eventType: "sos",
        timestamp: "2026-06-10T20:18:00+08:00",
        title: "SOS 测试事件",
        rawText: "SOS 求助",
        source: "demo",
        severity: "urgent",
      };
      const urgentTask: CareTask = {
        taskId: "TASK-E001-SOS",
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
        tasks: replaceChenTask(state.tasks, urgentTask),
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
    default:
      return state;
  }
};

const loadInitialState = () => {
  if (typeof window === "undefined") return createInitialDemoState();
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) return createInitialDemoState();
  try {
    return JSON.parse(saved) as DemoState;
  } catch {
    return createInitialDemoState();
  }
};

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

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
  state.tasks.find((task) => task.elderId === elderId);

export const getRiskForElder = (
  state: DemoState,
  elderId: string,
): RiskResult =>
  calculateRisk({
    profile: state.profiles[elderId],
    baseline: state.baselines[elderId],
    snapshot: state.snapshots[elderId],
    events: getEventsForElder(state, elderId),
  });

export const getAgentSummariesForElder = (
  state: DemoState,
  elderId: string,
): AgentRoleSummaries => {
  const task = getTaskForElder(state, elderId);
  const operationalState = state.operationalStates[elderId] ?? "normal";

  return generateAgentSummaries(
    state.profiles[elderId],
    state.baselines[elderId],
    state.snapshots[elderId],
    getEventsForElder(state, elderId),
    getRiskForElder(state, elderId),
    task?.status ?? operationalState,
  );
};
