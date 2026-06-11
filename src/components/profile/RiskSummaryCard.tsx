import type { RiskResult } from "../../types";
import type { CareLoopStatus, DisplayStatus } from "../../lib/displayStatus";
import { riskLabels } from "../../lib/statusLabels";
import { RiskBadge } from "../RiskBadge";
import { StatusPill } from "../StatusPill";
import { displayToneToPillTone } from "../../lib/displayStatus";

interface RiskSummaryCardProps {
  risk: RiskResult;
  displayStatus: DisplayStatus;
  careLoopStatus: CareLoopStatus;
}

export const RiskSummaryCard = ({
  risk,
  displayStatus,
  careLoopStatus,
}: RiskSummaryCardProps) => {
  const action =
    careLoopStatus === "completed" || displayStatus.tone === "follow_up"
      ? "护工已完成本次跟进，建议明早继续关注活动、睡眠与用药情况。"
      : risk.recommendedAction;

  return (
    <article className="panel">
      <div className="section-title">
        <span>今日风险摘要</span>
        <h2>当前表达与今日判断分开展示</h2>
      </div>
      <div className="risk-summary-head">
        <StatusPill label={displayStatus.label} tone={displayToneToPillTone(displayStatus.tone)} />
        <RiskBadge level={risk.riskLevel} score={risk.riskScore} />
        <span>今日风险等级：{riskLabels[risk.riskLevel]}</span>
      </div>
      <ul className="insight-list">
        {risk.keyReasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <p className="care-note">{action}</p>
    </article>
  );
};
