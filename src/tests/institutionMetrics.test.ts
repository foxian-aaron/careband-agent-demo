import { describe, expect, it } from "vitest";
import {
  deriveInstitutionMetrics,
  type InstitutionElderRowInput,
} from "../lib/institutionMetrics";

const row = (
  overrides: Partial<InstitutionElderRowInput>,
): InstitutionElderRowInput => ({
  elderId: "E001",
  riskLevel: "attention",
  riskScore: 55,
  displayStatusLabel: "需关注",
  displayStatusTone: "attention",
  careLoopStatus: "none",
  dataCompleteness: 0.82,
  ...overrides,
});

describe("deriveInstitutionMetrics", () => {
  it("does not count Chen initial attention state as high risk", () => {
    const metrics = deriveInstitutionMetrics([row({})]);

    expect(metrics.currentOpenHighRiskCount).toBe(0);
    expect(metrics.todayEverHighRiskCount).toBe(0);
    expect(metrics.followedUpHighRiskCount).toBe(0);
  });

  it("counts dizziness high risk pending task as open high risk and pending task", () => {
    const metrics = deriveInstitutionMetrics([
      row({
        riskLevel: "high_risk",
        riskScore: 82,
        displayStatusLabel: "高风险待处理",
        displayStatusTone: "high_risk",
        careLoopStatus: "pending",
        taskStatus: "pending",
      }),
    ]);

    expect(metrics.currentOpenHighRiskCount).toBe(1);
    expect(metrics.todayEverHighRiskCount).toBe(1);
    expect(metrics.followedUpHighRiskCount).toBe(0);
    expect(metrics.pendingTaskCount).toBe(1);
  });

  it("keeps accepted high risk open but removes it from pending tasks", () => {
    const metrics = deriveInstitutionMetrics([
      row({
        riskLevel: "high_risk",
        displayStatusLabel: "高风险处理中",
        displayStatusTone: "high_risk",
        careLoopStatus: "in_progress",
        taskStatus: "in_progress",
      }),
    ]);

    expect(metrics.currentOpenHighRiskCount).toBe(1);
    expect(metrics.todayEverHighRiskCount).toBe(1);
    expect(metrics.followedUpHighRiskCount).toBe(0);
    expect(metrics.pendingTaskCount).toBe(0);
  });

  it("moves completed high risk into followed up instead of open high risk", () => {
    const metrics = deriveInstitutionMetrics([
      row({
        riskLevel: "high_risk",
        displayStatusLabel: "已跟进 / 持续观察",
        displayStatusTone: "follow_up",
        careLoopStatus: "completed",
        taskStatus: "completed",
      }),
    ]);

    expect(metrics.currentOpenHighRiskCount).toBe(0);
    expect(metrics.todayEverHighRiskCount).toBe(1);
    expect(metrics.followedUpHighRiskCount).toBe(1);
    expect(metrics.pendingTaskCount).toBe(0);
  });

  it("counts unfinished SOS as open urgent risk", () => {
    const metrics = deriveInstitutionMetrics([
      row({
        riskLevel: "urgent",
        displayStatusLabel: "紧急待处理",
        displayStatusTone: "urgent",
        careLoopStatus: "pending",
        taskStatus: "pending",
      }),
    ]);

    expect(metrics.currentOpenHighRiskCount).toBe(1);
    expect(metrics.todayEverHighRiskCount).toBe(1);
    expect(metrics.followedUpHighRiskCount).toBe(0);
  });

  it("rounds average data completeness as integer percentage", () => {
    const metrics = deriveInstitutionMetrics([
      row({ elderId: "E001", dataCompleteness: 0.82 }),
      row({ elderId: "E002", dataCompleteness: 0.75 }),
      row({ elderId: "E003", dataCompleteness: 0.4 }),
    ]);

    expect(metrics.averageDataCompleteness).toBe(66);
  });
});
