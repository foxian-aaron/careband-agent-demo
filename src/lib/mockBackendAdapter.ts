import type {
  AgentTraceBundle,
  CareEvent,
  CareMemoryItem,
  CareTask,
  InitialCareMemory,
  MockBackendLog,
  WearableDailySnapshot,
} from "../types";

export interface MockBackendResponse<T> {
  ok: boolean;
  endpoint: string;
  method: MockBackendLog["method"];
  message: string;
  data: T;
  log: MockBackendLog;
}

const mockDelay = () => 300 + Math.round(Math.random() * 500);

const createLog = (
  endpoint: string,
  method: MockBackendLog["method"],
  message: string,
  payloadPreview?: Record<string, unknown>,
): MockBackendLog => ({
  id: `LOG-${Date.now()}-${Math.round(Math.random() * 1000)}`,
  endpoint,
  method,
  status: "success",
  message,
  createdAt: new Date().toISOString(),
  payloadPreview,
});

const resolveMock = <T,>(
  endpoint: string,
  method: MockBackendLog["method"],
  message: string,
  data: T,
  payloadPreview?: Record<string, unknown>,
): Promise<MockBackendResponse<T>> =>
  new Promise((resolve) => {
    window.setTimeout(() => {
      const log = createLog(endpoint, method, message, payloadPreview);
      resolve({
        ok: true,
        endpoint,
        method,
        message,
        data,
        log,
      });
    }, mockDelay());
  });

/*
  当前为前端 Mock，后续可替换为真实 API：POST /api/events。
*/
export const submitCareEvent = (event: CareEvent) =>
  resolveMock("/api/events", "POST", "照护事件已写入前端 Mock 队列", event, {
    elder_id: event.elderId,
    event_type: event.eventType,
    title: event.title,
  });

/*
  当前为前端 Mock，后续可替换为真实 API：POST /api/snapshots。
*/
export const submitDailySnapshot = (snapshot: WearableDailySnapshot) =>
  resolveMock("/api/snapshots", "POST", "每日状态快照已写入前端 Mock 队列", snapshot, {
    elder_id: snapshot.elderId,
    date: snapshot.date,
    data_source: snapshot.dataSource,
  });

/*
  当前为前端 Mock，后续可替换为真实 API：POST /api/agent/analyze。
*/
export const analyzeWithAgent = (trace: AgentTraceBundle) =>
  resolveMock("/api/agent/analyze", "POST", "Mock Agent 摘要已生成", trace, {
    elder_id: trace.elderId,
    status: trace.status,
  });

/*
  当前为前端 Mock，后续可替换为真实 API：POST /api/wearable/import。
*/
export const importWearableData = (snapshots: WearableDailySnapshot[]) =>
  resolveMock("/api/wearable/import", "POST", "穿戴数据已完成前端模拟导入", snapshots, {
    row_count: snapshots.length,
    data_source: snapshots[0]?.dataSource ?? "CSV",
  });

/*
  当前为前端 Mock，后续可替换为真实 API：POST /api/memory/intake。
*/
export const createMemoryDraft = (memory: InitialCareMemory) =>
  resolveMock("/api/memory/intake", "POST", "初始照护记忆草稿已生成", memory, {
    elder_id: memory.elderId,
    item_count: memory.items.length,
  });

/*
  当前为前端 Mock，后续可替换为真实 API：PATCH /api/memory/:id/confirm。
*/
export const confirmMemoryItem = (item: CareMemoryItem) =>
  resolveMock(
    `/api/memory/${item.id}/confirm`,
    "PATCH",
    "记忆条目确认状态已写入前端 Mock",
    item,
    {
      memory_id: item.id,
      confirmation_status: item.confirmationStatus,
    },
  );

/*
  当前为前端 Mock，后续可替换为真实 API：PATCH /api/tasks/:id。
*/
export const updateTaskStatus = (task: CareTask) =>
  resolveMock(`/api/tasks/${task.taskId}`, "PATCH", "任务状态已写入前端 Mock", task, {
    task_id: task.taskId,
    status: task.status,
  });

export const backendContractEndpoints = [
  { method: "GET", path: "/api/elders", description: "获取机构内老人列表" },
  { method: "POST", path: "/api/snapshots", description: "写入每日状态快照" },
  { method: "POST", path: "/api/events", description: "写入硬件、语音或系统事件" },
  { method: "POST", path: "/api/agent/analyze", description: "提交 Agent 分析请求" },
  { method: "PATCH", path: "/api/tasks/:id", description: "更新护工任务状态" },
  { method: "POST", path: "/api/memory/intake", description: "创建初始照护记忆草稿" },
  { method: "PATCH", path: "/api/memory/:id/confirm", description: "确认或修改记忆条目" },
  { method: "POST", path: "/api/wearable/import", description: "导入穿戴设备数据" },
  { method: "GET", path: "/api/elders/:id/dashboard", description: "获取老人驾驶舱数据" },
  { method: "GET", path: "/api/institution/overview", description: "获取机构端总览" },
];
