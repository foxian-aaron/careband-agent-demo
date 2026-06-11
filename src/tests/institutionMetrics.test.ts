import { describe, expect, it } from "vitest";
import {
  deriveInstitutionMetrics,
  type InstitutionElderRowInput,
} from "../lib/institutionMetrics";
import { deriveCareLoopStatus, deriveDisplayStatus } from "../lib/displayStatus";
import {
  createInitialDemoState,
  demoReducer,
  getActiveTaskForElder,
  getEventsForElder,
  getRiskForElder,
  getTaskForElder,
  type DemoState,
} from "../store/demoStore";

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

const metricsFromDemoState = (state: DemoState) =>
  deriveInstitutionMetrics(
    Object.values(state.profiles).map((profile) => {
      const events = getEventsForElder(state, profile.elderId);
      const risk = getRiskForElder(state, profile.elderId);
      const careLoopStatus = deriveCareLoopStatus(profile.elderId, state.tasks, events);
      const displayStatus = deriveDisplayStatus(risk, careLoopStatus);
      const task =
        getActiveTaskForElder(state, profile.elderId) ??
        getTaskForElder(state, profile.elderId);

      return {
        elderId: profile.elderId,
        riskLevel: risk.riskLevel,
        riskScore: risk.riskScore,
        displayStatusLabel: displayStatus.label,
        displayStatusTone: displayStatus.tone,
        careLoopStatus,
        taskStatus: task?.status,
        dataCompleteness: risk.dataCompleteness,
      };
    }),
  );

describe("institution metrics across Chen demo flow", () => {
  it("matches the expected institution counters through the full care loop", () => {
    let state = createInitialDemoState();
    let metrics = metricsFromDemoState(state);
    expect(metrics.currentOpenHighRiskCount).toBe(0);
    expect(metrics.todayEverHighRiskCount).toBe(0);
    expect(metrics.followedUpHighRiskCount).toBe(0);

    state = demoReducer(state, { type: "TRIGGER_CHEN_DIZZINESS" });
    metrics = metricsFromDemoState(state);
    expect(metrics.currentOpenHighRiskCount).toBe(1);
    expect(metrics.todayEverHighRiskCount).toBe(1);
    expect(metrics.followedUpHighRiskCount).toBe(0);
    expect(metrics.pendingTaskCount).toBe(1);

    state = demoReducer(state, { type: "CAREGIVER_ACCEPT_TASK" });
    metrics = metricsFromDemoState(state);
    expect(metrics.currentOpenHighRiskCount).toBe(1);
    expect(metrics.pendingTaskCount).toBe(0);

    state = demoReducer(state, { type: "CAREGIVER_MARK_VIEWED" });
    metrics = metricsFromDemoState(state);
    expect(metrics.currentOpenHighRiskCount).toBe(1);
    expect(metrics.followedUpHighRiskCount).toBe(0);

    state = demoReducer(state, { type: "CONFIRM_EVENING_MEDICATION" });
    metrics = metricsFromDemoState(state);
    expect(metrics.currentOpenHighRiskCount).toBe(1);
    expect(metrics.followedUpHighRiskCount).toBe(0);

    state = demoReducer(state, { type: "COMPLETE_CARE_TASK" });
    metrics = metricsFromDemoState(state);
    expect(metrics.currentOpenHighRiskCount).toBe(0);
    expect(metrics.todayEverHighRiskCount).toBe(1);
    expect(metrics.followedUpHighRiskCount).toBe(1);
    expect(metrics.pendingTaskCount).toBe(0);
  });
});
