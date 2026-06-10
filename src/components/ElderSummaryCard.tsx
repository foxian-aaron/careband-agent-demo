import type { CareTask, ElderProfile, OperationalState, RiskResult } from "../types";
import type { CareLoopStatus, DisplayStatus } from "../lib/displayStatus";
import { displayToneToPillTone } from "../lib/displayStatus";
import {
  careLoopLabels,
  operationalLabels,
  priorityLabels,
  taskStatusLabels,
} from "../lib/statusLabels";
import { RiskBadge } from "./RiskBadge";
import { StatusPill } from "./StatusPill";

interface ElderSummaryCardProps {
  profile: ElderProfile;
  risk: RiskResult;
  displayStatus: DisplayStatus;
  careLoopStatus: CareLoopStatus;
  operationalState: OperationalState;
  task?: CareTask;
}

export const ElderSummaryCard = ({
  profile,
  risk,
  displayStatus,
  careLoopStatus,
  operationalState,
  task,
}: ElderSummaryCardProps) => (
  <article className="elder-summary-card">
    <div>
      <span className="room-label">房间 {profile.room}</span>
      <h3>{profile.name}</h3>
      <p>
        {profile.age} 岁 · {profile.chronicConditions.join("、") || "无慢病标签"}
      </p>
    </div>
    <div className="card-actions">
      <RiskBadge level={risk.riskLevel} score={risk.riskScore} />
      <StatusPill
        label={displayStatus.shortLabel}
        tone={displayToneToPillTone(displayStatus.tone)}
      />
    </div>
    <p className="muted-copy">
      前台状态：{displayStatus.label} · 闭环：{careLoopLabels[careLoopStatus]} · 运营：
      {operationalLabels[operationalState]}
    </p>
    <ul>
      {risk.keyReasons.slice(0, 3).map((reason) => (
        <li key={reason}>{reason}</li>
      ))}
    </ul>
    {task ? (
      <p className="task-inline">
        {priorityLabels[task.priority]} · {taskStatusLabels[task.status]} · {task.title}
      </p>
    ) : null}
  </article>
);
