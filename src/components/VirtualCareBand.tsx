import type { DeviceRecord } from "../types";
import { StatusPill } from "./StatusPill";

interface VirtualCareBandProps {
  device?: DeviceRecord;
}

export const VirtualCareBand = ({ device }: VirtualCareBandProps) => (
  <article className="virtual-band">
    <div className="band-face">
      <span className={device?.connectionStatus === "online" ? "led led--online" : "led"} />
      <strong>CareBand</strong>
      <small>{device?.batteryLevel ?? 0}%</small>
      <button className="band-button" title="虚拟大按钮" aria-label="虚拟大按钮" />
    </div>
    <div className="band-status-grid">
      <StatusPill label="大按钮" tone="observation" />
      <StatusPill label={device?.connectionStatus === "online" ? "LED 在线" : "LED 离线"} tone={device?.connectionStatus === "online" ? "stable" : "muted"} />
      <StatusPill label="震动反馈 Mock" tone="observation" />
      <StatusPill label="IMU Mock" tone="observation" />
      <StatusPill label="SOS Ready" tone="attention" />
    </div>
  </article>
);
