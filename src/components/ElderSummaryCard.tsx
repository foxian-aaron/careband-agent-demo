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

const identityBadges = (elderId: string) => {
  if (elderId === "TEST001") {
    return [
      "團隊 Apple Watch 測試資料",
      "非真實長者",
      "驗證真實穿戴資料導入",
      "不作為真實老人健康結論",
    ];
  }
  if (elderId === "E001") {
    return ["陳伯 Demo 情境", "模擬長者照護流程", "活動下降 + 頭暈 + SOS + 護工跟進"];
  }
  return ["Seeded demo elder"];
};

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
      <div className="identity-badge-row">
        {identityBadges(profile.elderId).map((badge) => (
          <span className="identity-badge" key={badge}>{badge}</span>
        ))}
      </div>
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
      <a className="text-button" href={`#/elder/${profile.elderId}/profile`}>档案</a>
      <a className="text-button" href={`#/medication/${profile.elderId}`}>用药</a>
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
