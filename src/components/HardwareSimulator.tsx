import { useDemo } from "../store/demoStore";
import type { CareEvent } from "../types";
import { DeviceStatusCard } from "./DeviceStatusCard";
import { MockNoticeBanner } from "./MockNoticeBanner";
import { VirtualCareBand } from "./VirtualCareBand";

interface HardwareSimulatorProps {
  elderId: string;
}

const hardwareButtons: Array<{
  label: string;
  eventType: CareEvent["eventType"];
}> = [
  { label: "短按确认", eventType: "button_confirm" },
  { label: "长按求助", eventType: "sos_long_press" },
  { label: "连按 SOS", eventType: "sos_triple_press" },
  { label: "模拟跌倒", eventType: "fall_detected" },
  { label: "模拟长时间静止", eventType: "inactivity_after_fall" },
  { label: "模拟设备未佩戴", eventType: "device_not_worn" },
  { label: "模拟设备重新佩戴", eventType: "device_reconnected" },
  { label: "模拟低电量", eventType: "device_low_battery" },
];

export const HardwareSimulator = ({ elderId }: HardwareSimulatorProps) => {
  const { state, dispatch } = useDemo();
  const device = state.deviceRecords[elderId];
  const latestLog = state.mockBackendLogs[0];

  return (
    <section className="panel hardware-simulator">
      <div className="section-title">
        <span>硬件原型模拟</span>
        <h2>虚拟手环事件如何触发照护闭环</h2>
      </div>
      <MockNoticeBanner>当前不接真实硬件；所有事件均由前端生成 CareEvent，后续可替换为 ESP32 / nRF 原型机上报。</MockNoticeBanner>
      <div className="hardware-grid">
        <VirtualCareBand device={device} />
        <DeviceStatusCard device={device} compact />
      </div>
      <div className="control-buttons">
        {hardwareButtons.map((button) => (
          <button
            key={button.eventType}
            className={button.eventType.includes("sos") ? "primary" : ""}
            onClick={() =>
              dispatch({
                type: "TRIGGER_HARDWARE_EVENT",
                elderId,
                eventType: button.eventType,
              })
            }
          >
            {button.label}
          </button>
        ))}
      </div>
      <div className="mock-flow-note">
        <strong>事件触发后展示</strong>
        <p>事件已生成；未来 API：POST /api/events；当前处理方式：前端 Mock；影响页面：机构端、护工端、家属端、老人驾驶舱。</p>
        {latestLog ? <small>最近 Mock 调用：{latestLog.method} {latestLog.endpoint}</small> : null}
      </div>
    </section>
  );
};
