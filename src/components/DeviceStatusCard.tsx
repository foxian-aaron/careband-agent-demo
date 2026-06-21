import type { DeviceRecord } from "../types";
import { formatDateTime } from "../lib/dateUtils";
import { DataQualityBadge } from "./DataQualityBadge";
import { StatusPill } from "./StatusPill";
import { WearableDataSourceBadge } from "./WearableDataSourceBadge";

interface DeviceStatusCardProps {
  device?: DeviceRecord;
  compact?: boolean;
}

export const DeviceStatusCard = ({ device, compact = false }: DeviceStatusCardProps) => {
  if (!device) {
    return (
      <article className="device-card">
        <h3>设备状态</h3>
        <p className="muted-copy">暂无设备记录，当前仅展示 Mock 数据。</p>
      </article>
    );
  }

  return (
    <article className={`device-card${compact ? " device-card--compact" : ""}`}>
      <div className="device-card__head">
        <div>
          <span>设备状态</span>
          <h3>{device.deviceId}</h3>
        </div>
        <StatusPill
          label={device.connectionStatus === "online" ? "设备在线" : "设备离线"}
          tone={device.connectionStatus === "online" ? "stable" : "muted"}
        />
      </div>
      <div className="device-grid">
        <div>
          <span>佩戴状态</span>
          <strong>{device.wearStatus === "worn" ? "已佩戴" : "未佩戴"}</strong>
        </div>
        <div>
          <span>今日佩戴</span>
          <strong>{device.todayWearTimeHours} 小时</strong>
        </div>
        <div>
          <span>电量</span>
          <strong>{device.batteryLevel}%</strong>
        </div>
        <div>
          <span>固件</span>
          <strong>{device.firmwareVersion}</strong>
        </div>
      </div>
      <div className="tag-row">
        <DataQualityBadge quality={device.dataQuality} />
        <WearableDataSourceBadge source={device.dataSource} />
        <StatusPill label={`最近同步 ${formatDateTime(device.lastSyncAt)}`} tone="observation" />
      </div>
      {device.wearStatus === "not_worn" || device.dataQuality < 0.4 ? (
        <p className="trace-disclaimer">设备未佩戴或数据完整度不足时，系统会提示护工先确认佩戴，不做强判断。</p>
      ) : null}
    </article>
  );
};
