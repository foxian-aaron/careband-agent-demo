import { useDemo } from "../store/demoStore";
import { MockNoticeBanner } from "./MockNoticeBanner";

interface FallRiskSimulatorProps {
  elderId: string;
}

export const FallRiskSimulator = ({ elderId }: FallRiskSimulatorProps) => {
  const { state, dispatch } = useDemo();
  const events = state.events.filter((event) => event.elderId === elderId);
  const hasFall = events.some((event) => event.eventType === "fall_detected");
  const hasNoResponse = events.some((event) => event.eventType === "no_response_after_fall");

  return (
    <section className="panel simulator-panel">
      <div className="section-title">
        <span>跌倒 / 异常静止模拟</span>
        <h2>硬件安全事件升级流程</h2>
      </div>
      <MockNoticeBanner>跌倒检测为照护风险提示，不构成医疗诊断；当前为前端 Mock 事件。</MockNoticeBanner>
      <div className="fall-flow">
        <div className={hasFall ? "active" : ""}>
          <strong>1. 疑似跌倒</strong>
          <span>{hasFall ? "已生成" : "等待模拟"}</span>
        </div>
        <div className={hasNoResponse ? "active" : ""}>
          <strong>2. 30 秒无回应</strong>
          <span>{hasNoResponse ? "已升级" : "等待确认"}</span>
        </div>
        <div className={hasNoResponse ? "active" : ""}>
          <strong>3. 护工置顶任务</strong>
          <span>{hasNoResponse ? "紧急处理" : "未触发"}</span>
        </div>
      </div>
      <div className="button-row">
        <button onClick={() => dispatch({ type: "SIMULATE_FALL_EVENT", elderId, stage: "fall_detected" })}>
          模拟跌倒
        </button>
        <button
          className="primary"
          disabled={!hasFall}
          onClick={() =>
            dispatch({ type: "SIMULATE_FALL_EVENT", elderId, stage: "no_response_after_fall" })
          }
        >
          30 秒无回应
        </button>
      </div>
    </section>
  );
};
