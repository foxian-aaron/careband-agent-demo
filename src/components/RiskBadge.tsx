import type { RiskLevel } from "../types";
import { riskCssClass, riskLabels } from "../lib/statusLabels";

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
}

export const RiskBadge = ({ level, score }: RiskBadgeProps) => (
  <span className={`risk-badge ${riskCssClass(level)}`}>
    <span>{riskLabels[level]}</span>
    {typeof score === "number" ? <strong>{score}</strong> : null}
  </span>
);
