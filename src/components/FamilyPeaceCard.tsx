import type {
  CareTask,
  DailySnapshot,
  ElderProfile,
  OperationalState,
  RiskResult,
} from "../types";
import {
  medicationLabels,
  operationalLabels,
  riskLabels,
  taskStatusLabels,
} from "../lib/statusLabels";
import { formatDateTime } from "../lib/dateUtils";
import { RiskBadge } from "./RiskBadge";

interface FamilyPeaceCardProps {
  profile: ElderProfile;
  snapshot: DailySnapshot;
  risk: RiskResult;
  task?: CareTask;
  operationalState: OperationalState;
  exceptionText: string;
}

export const FamilyPeaceCard = ({
  profile,
  snapshot,
  risk,
  task,
  operationalState,
  exceptionText,
}: FamilyPeaceCardProps) => (
  <article className="family-peace-card">
    <div className="family-peace-card__head">
      <div>
        <span>今日安心卡</span>
        <h2>{profile.name}今日状态：{riskLabels[risk.riskLevel]}</h2>
      </div>
      <RiskBadge level={risk.riskLevel} />
    </div>
    <div className="peace-grid">
      <div>
        <span>当前位置</span>
        <strong>{snapshot.locationZone}</strong>
        <p>{snapshot.safeZoneStatus === "inside" ? "在长者中心内" : "位置需确认"}</p>
      </div>
      <div>
        <span>跌倒检测</span>
        <strong>{snapshot.fallDetected ? "需确认" : "未检测到跌倒"}</strong>
        <p>持续观察安全事件</p>
      </div>
      <div>
        <span>早药状态</span>
        <strong>{medicationLabels[snapshot.medicationMorning]}</strong>
        <p>系统记录已同步</p>
      </div>
      <div>
        <span>晚药状态</span>
        <strong>{medicationLabels[snapshot.medicationEvening]}</strong>
        <p>{snapshot.medicationEvening === "confirmed" ? "护工已确认" : "等待护工确认"}</p>
      </div>
      <div>
        <span>护工跟进</span>
        <strong>{operationalLabels[operationalState]}</strong>
        <p>{task ? taskStatusLabels[task.status] : "暂无任务"}</p>
      </div>
      <div>
        <span>最近更新</span>
        <strong>{formatDateTime(snapshot.lastSyncedAt)}</strong>
        <p>来自模拟照护数据</p>
      </div>
    </div>
    <section className="family-exception">
      <h3>异常说明</h3>
      <p>{exceptionText}</p>
    </section>
  </article>
);
