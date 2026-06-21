import { useDemo } from "../store/demoStore";
import { MockNoticeBanner } from "./MockNoticeBanner";
import { StatusPill } from "./StatusPill";

interface LocationRiskSimulatorProps {
  elderId: string;
}

export const LocationRiskSimulator = ({ elderId }: LocationRiskSimulatorProps) => {
  const { state, dispatch } = useDemo();
  const snapshot = state.snapshots[elderId];

  return (
    <section className="panel simulator-panel">
      <div className="section-title">
        <span>位置 / 地理围栏 / 走失模拟</span>
        <h2>只展示区域，不展示精确轨迹</h2>
      </div>
      <MockNoticeBanner>当前位置为区域级 Mock 数据，后续接入硬件时仍可限制为安全区状态，不展示精确轨迹。</MockNoticeBanner>
      <div className="info-grid compact">
        <div>
          <span>当前区域</span>
          <strong>{snapshot.locationZone}</strong>
          <p>示例区域：长者中心二楼 / 房间 203 / 安全区内</p>
        </div>
        <div>
          <span>安全区状态</span>
          <StatusPill
            label={snapshot.safeZoneStatus === "inside" ? "安全区内" : "需确认位置"}
            tone={snapshot.safeZoneStatus === "inside" ? "stable" : "attention"}
          />
        </div>
      </div>
      <div className="button-row">
        <button onClick={() => dispatch({ type: "SIMULATE_GEOFENCE_EXIT", elderId })}>
          模拟离开安全区
        </button>
        <button
          onClick={() =>
            dispatch({ type: "SIMULATE_VOICE_INPUT", elderId, text: "我不知道在哪里" })
          }
        >
          模拟老人说“我不知道在哪里”
        </button>
      </div>
    </section>
  );
};
