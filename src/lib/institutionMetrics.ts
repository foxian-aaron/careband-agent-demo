import type { RiskLevel } from "../types";
import type { CareLoopStatus, DisplayStatus } from "./displayStatus";

export interface InstitutionElderRowInput {
  elderId: string;
  riskLevel: RiskLevel;
  riskScore: number;
  displayStatusLabel: string;
  displayStatusTone: DisplayStatus["tone"] | string;
  careLoopStatus: CareLoopStatus;
  taskStatus?: "pending" | "in_progress" | "completed";
  dataCompleteness: number;
}

export interface InstitutionMetrics {
  currentOpenHighRiskCount: number;
  todayEverHighRiskCount: number;
  followedUpHighRiskCount: number;
  pendingTaskCount: number;
  averageDataCompleteness: number;
}

const isHighRiskOrUrgent = (riskLevel: RiskLevel) =>
  riskLevel === "high_risk" || riskLevel === "urgent";

const isClosedCareLoop = (careLoopStatus: CareLoopStatus) =>
  careLoopStatus === "completed" || careLoopStatus === "follow_up";

export const deriveInstitutionMetrics = (
  rows: InstitutionElderRowInput[],
): InstitutionMetrics => {
  const todayHighRiskRows = rows.filter((row) => isHighRiskOrUrgent(row.riskLevel));
  const currentOpenHighRiskRows = todayHighRiskRows.filter(
    (row) => !isClosedCareLoop(row.careLoopStatus),
  );
  const followedUpHighRiskRows = todayHighRiskRows.filter(
    (row) =>
      isClosedCareLoop(row.careLoopStatus) ||
      row.displayStatusTone === "follow_up" ||
      row.taskStatus === "completed",
  );
  const averageDataCompleteness =
    rows.length === 0
      ? 0
      : Math.round(
          (rows.reduce((sum, row) => sum + row.dataCompleteness, 0) /
            rows.length) *
            100,
        );

  return {
    currentOpenHighRiskCount: currentOpenHighRiskRows.length,
    todayEverHighRiskCount: todayHighRiskRows.length,
    followedUpHighRiskCount: followedUpHighRiskRows.length,
    pendingTaskCount: rows.filter((row) => row.taskStatus === "pending").length,
    averageDataCompleteness,
  };
};
