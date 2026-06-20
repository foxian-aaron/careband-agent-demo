import type { RiskResult } from "../../types";
import type { DisplayStatus } from "../../lib/displayStatus";
import { displayToneToPillTone } from "../../lib/displayStatus";
import { medicationLabels, riskLabels } from "../../lib/statusLabels";
import type { getTodayMedicationSummary } from "../../lib/medicationSelectors";
import { RiskBadge } from "../RiskBadge";
import { StatusPill } from "../StatusPill";

type MedicationSummary = ReturnType<typeof getTodayMedicationSummary>;

interface MedicationSummaryCardProps {
  elderName: string;
  summary: MedicationSummary;
  displayStatus: DisplayStatus;
  risk: RiskResult;
}

export const MedicationSummaryCard = ({
  elderName,
  summary,
  displayStatus,
  risk,
}: MedicationSummaryCardProps) => (
  <section className="panel medication-hero">
    <div>
      <span>用药计划 / 确认</span>
      <h1>{elderName}今日用药状态</h1>
      <p>{summary.summaryText}</p>
      <div className="tag-row">
        <StatusPill label={`早药：${medicationLabels[summary.morningStatus]}`} tone="stable" />
        <StatusPill
          label={`晚药：${medicationLabels[summary.eveningStatus]}`}
          tone={summary.eveningStatus === "confirmed" ? "stable" : "attention"}
        />
        <StatusPill label={displayStatus.label} tone={displayToneToPillTone(displayStatus.tone)} />
      </div>
    </div>
    <div className="hero-status-stack">
      <RiskBadge level={risk.riskLevel} score={risk.riskScore} />
      <span>今日风险等级：{riskLabels[risk.riskLevel]}</span>
      <small>
        最近确认：
        {summary.lastConfirmedAt
          ? `${summary.lastConfirmedAt} · ${summary.lastConfirmedBy ?? "照护人员"}`
          : "暂无"}
      </small>
    </div>
  </section>
);
