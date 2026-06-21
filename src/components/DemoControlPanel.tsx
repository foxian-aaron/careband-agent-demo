import type { Dispatch } from "react";
import type { DemoAction, DemoState } from "../store/demoStore";
import {
  getActiveTaskForElder,
  getAgentTraceForElder,
  getEventsForElder,
  getRiskForElder,
} from "../store/demoStore";
import { formatClock } from "../lib/dateUtils";
import { deriveCareLoopStatus, deriveDisplayStatus } from "../lib/displayStatus";
import {
  careLoopLabels,
  operationalLabels,
  riskLabels,
  taskStatusLabels,
} from "../lib/statusLabels";

interface DemoControlPanelProps {
  state: DemoState;
  dispatch: Dispatch<DemoAction>;
}

const chenId = "E001";

const getStage = (state: DemoState) => {
  const events = getEventsForElder(state, chenId);
  const task = getActiveTaskForElder(state, chenId);
  const risk = getRiskForElder(state, chenId);
  const careLoopStatus = deriveCareLoopStatus(chenId, state.tasks, events);
  if (risk.riskLevel === "data_insufficient") return "模拟数据不足";
  if (risk.riskLevel === "urgent") return "SOS 紧急测试";
  if (careLoopStatus === "completed") return "处理完成";
  if (careLoopStatus === "medication_confirmed") return "晚药已确认";
  if (careLoopStatus === "checked") return "护工已查看";
  if (task?.status === "in_progress") return "护工已接单";
  if (events.some((event) => event.eventType === "voice_symptom")) return "头晕事件已触发";
  return "初始需关注";
};

const getScript = (stage: string) => {
  if (stage === "初始需关注") {
    return "先展示陈伯虽然没有跌倒，但活动、睡眠和晚药确认都偏离了个人基线，因此系统给出“需关注”。";
  }
  if (stage === "头晕事件已触发") {
    return "现在说明语音反馈进入事件流，规则引擎把陈伯升级为高风险，并为护工生成高优先级任务。";
  }
  if (stage === "护工处理中") {
    return "切到家属端，展示家属看到的是温和的“护工正在查看”，不是复杂医学指标。";
  }
  if (stage === "护工已接单") {
    return "继续点击“标记已查看”，说明接单只是响应，已查看才代表护工到场确认。";
  }
  if (stage === "护工已查看") {
    return "现在点击“确认晚药”，展示用药确认会同步到家属端和长者驾驶舱。";
  }
  if (stage === "晚药已确认") {
    return "最后点击“完成护工处理”，写入备注并同步为已跟进 / 持续观察。";
  }
  if (stage === "处理完成") {
    return "最后回到机构端，展示任务完成后三端同步更新，形成照护闭环。";
  }
  if (stage === "SOS 紧急测试") {
    return "这是备用分支，用于说明 SOS 会绕过普通评分直接进入紧急流程。";
  }
  return "这是备用分支，用于说明数据不足时系统不会做过度判断，而是要求先确认佩戴和同步。";
};

export const DemoControlPanel = ({ state, dispatch }: DemoControlPanelProps) => {
  const risk = getRiskForElder(state, chenId);
  const task = getActiveTaskForElder(state, chenId);
  const events = getEventsForElder(state, chenId);
  const careLoopStatus = deriveCareLoopStatus(chenId, state.tasks, events);
  const displayStatus = deriveDisplayStatus(risk, careLoopStatus);
  const stage = getStage(state);
  const hasVoice = events.some((event) => event.eventType === "voice_symptom");
  const canTriggerDizziness = !hasVoice;
  const canAccept = Boolean(task && task.status === "pending");
  const canMarkViewed = Boolean(task && task.status === "in_progress" && careLoopStatus === "in_progress");
  const canConfirmMedication = Boolean(
    task && task.status === "in_progress" && careLoopStatus === "checked",
  );
  const canComplete = Boolean(
    task &&
      task.status === "in_progress" &&
      state.snapshots[chenId].medicationEvening === "confirmed" &&
      ["checked", "medication_confirmed"].includes(careLoopStatus),
  );

  return (
    <section className="demo-control">
      <div className="target-note">
        <strong>目前照護流程操作對象：陳伯 E001</strong>
        <span>Apple Health 示例快照會寫入 TEST001 團隊測試資料，不會改動陳伯照護故事。</span>
      </div>
      <div className="control-status">
        <div>
          <span>当前 Demo 阶段</span>
          <strong>{stage}</strong>
        </div>
        <div>
          <span>陈伯前台展示状态</span>
          <strong>{displayStatus.label}</strong>
        </div>
        <div>
          <span>陈伯风险等级</span>
          <strong>{riskLabels[risk.riskLevel]}</strong>
        </div>
        <div>
          <span>当前任务状态</span>
          <strong>{task ? taskStatusLabels[task.status] : "暂无任务"}</strong>
        </div>
        <div>
          <span>闭环状态</span>
          <strong>{careLoopLabels[careLoopStatus]}</strong>
          <small>{operationalLabels[state.operationalStates[chenId]]}</small>
        </div>
      </div>
      <div className="control-buttons">
        <button onClick={() => dispatch({ type: "RESET_DEMO" })}>重置本地 Demo</button>
        <button
          className="primary"
          disabled={!canTriggerDizziness}
          title={canTriggerDizziness ? "触发语音主诉并创建高优先级任务" : "本轮头晕事件已触发"}
          onClick={() => dispatch({ type: "TRIGGER_CHEN_DIZZINESS" })}
        >
          触发陈伯 E001 头晕语音事件
        </button>
        <button
          disabled={!canAccept}
          title={canAccept ? "接单后任务进入处理中" : "需要先触发任务，或当前任务已接单"}
          onClick={() => dispatch({ type: "CAREGIVER_ACCEPT_TASK" })}
        >
          陳伯 E001 護工接單
        </button>
        <button
          disabled={!canMarkViewed}
          title={canMarkViewed ? "记录护工到场查看" : "护工接单后才能标记已查看"}
          onClick={() => dispatch({ type: "CAREGIVER_MARK_VIEWED" })}
        >
          陳伯 E001 標記已查看
        </button>
        <button
          disabled={!canConfirmMedication}
          title={canConfirmMedication ? "确认晚药状态" : "标记已查看后才能确认晚药"}
          onClick={() => dispatch({ type: "CONFIRM_EVENING_MEDICATION" })}
        >
          確認陳伯 E001 晚藥
        </button>
        <button
          disabled={!canComplete}
          title={canComplete ? "完成并写入护工备注" : "确认晚药后才能完成处理"}
          onClick={() => dispatch({ type: "COMPLETE_CARE_TASK" })}
        >
          完成陳伯 E001 護工任務
        </button>
        <button onClick={() => dispatch({ type: "TRIGGER_SOS" })}>
          触发陈伯 E001 SOS 测试
        </button>
        <button onClick={() => dispatch({ type: "SIMULATE_DATA_GAP" })}>
          模拟陈伯 E001 数据不足
        </button>
        <button onClick={() => dispatch({ type: "IMPORT_APPLE_HEALTH_SAMPLE" })}>
          导入 TEST001 Apple Health 示例快照
        </button>
        <a className="text-button" href={`#/elder/${chenId}/memory-intake`}>
          导入历史资料
        </a>
        <a className="text-button" href={`#/elder/${chenId}/wearable-import`}>
          导入穿戴数据
        </a>
        <button
          onClick={() =>
            dispatch({ type: "TRIGGER_HARDWARE_EVENT", elderId: chenId, eventType: "sos_long_press" })
          }
        >
          长按 SOS
        </button>
        <button
          onClick={() =>
            dispatch({ type: "TRIGGER_HARDWARE_EVENT", elderId: chenId, eventType: "fall_detected" })
          }
        >
          模拟跌倒
        </button>
        <button
          onClick={() =>
            dispatch({ type: "TRIGGER_HARDWARE_EVENT", elderId: chenId, eventType: "no_response_after_fall" })
          }
        >
          模拟无回应
        </button>
        <button
          onClick={() =>
            dispatch({ type: "TRIGGER_HARDWARE_EVENT", elderId: chenId, eventType: "device_not_worn" })
          }
        >
          模拟设备未佩戴
        </button>
        <button onClick={() => dispatch({ type: "SIMULATE_GEOFENCE_EXIT", elderId: chenId })}>
          模拟离开安全区
        </button>
        <button onClick={() => dispatch({ type: "SIMULATE_AGENT_FAILURE", elderId: chenId })}>
          模拟 Agent 失败
        </button>
        <button
          onClick={() =>
            dispatch({
              type: "FALLBACK_TO_RULE_SUMMARY",
              trace: { ...getAgentTraceForElder(state, chenId), status: "fallback_rule" },
            })
          }
        >
          模拟 Agent fallback
        </button>
        <button
          onClick={() =>
            dispatch({
              type: "GENERATE_WEEKLY_SUMMARY",
              summary: {
                elderId: chenId,
                generatedAt: new Date().toISOString(),
                findings: [
                  "活动量连续 3 天下滑",
                  "睡眠连续 2 天低于本人基线",
                  "本周 2 次晚药延迟确认",
                  "本周 1 次头晕反馈",
                  "设备佩戴稳定性：82%",
                ],
                summary:
                  "近 7 日陈伯活动量呈下降趋势，睡眠连续两天低于个人基线，晚药确认存在延迟。建议护工下周重点关注活动能力、晚药确认和头晕反馈是否重复出现。",
                wearStability: 0.82,
              },
            })
          }
        >
          生成周报
        </button>
      </div>
      <div className="panel">
        <div className="section-title">
          <span>v0.2 数据接入</span>
          <h2>后端与 Apple Health</h2>
        </div>
        <p className="muted-copy">
          当前后端状态：{state.backend.mode === "connected" ? "已连接" : "未连接，使用本地 Mock fallback"}。
          陈伯 E001 用于完整照护闭环；TEST001 用于团队 Apple Watch 测试资料导入。示例导入会写入 TEST001 的 data_source = Apple Health Export。
        </p>
        {state.backend.error ? <p className="muted-copy">最近后端错误：{state.backend.error}</p> : null}
      </div>
      <div className="panel">
        <div className="section-title">
          <span>当前事件列表</span>
          <h2>陈伯 24 小时事件</h2>
        </div>
        <ul className="event-list">
          {events.map((event) => (
            <li key={event.eventId}>
              <time>{formatClock(event.timestamp)}</time>
              <span>{event.title}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="script-card">
        <span>下一步建议演示话术</span>
        <p>{getScript(stage)}</p>
      </div>
    </section>
  );
};
