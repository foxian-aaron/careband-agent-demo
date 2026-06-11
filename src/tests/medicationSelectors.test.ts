import { describe, expect, it } from "vitest";
import {
  getMedicationPlanForElder,
  getMedicationTimeline,
  getTodayMedicationSummary,
  isEveningMedicationConfirmed,
} from "../lib/medicationSelectors";
import { createInitialDemoState } from "../store/demoStore";

describe("medicationSelectors", () => {
  it("returns Chen medication plan", () => {
    const state = createInitialDemoState();
    const plan = getMedicationPlanForElder("E001", state);

    expect(plan?.planName).toContain("陈伯今日用药计划");
    expect(plan?.doses).toHaveLength(2);
  });

  it("summarizes Chen initial medication state", () => {
    const state = createInitialDemoState();
    const summary = getTodayMedicationSummary("E001", state);

    expect(summary.morningStatus).toBe("confirmed");
    expect(summary.eveningStatus).toBe("not_confirmed");
    expect(summary.confirmedCount).toBe(1);
    expect(summary.pendingCount).toBe(1);
    expect(isEveningMedicationConfirmed("E001", state)).toBe(false);
  });

  it("builds medication timeline with reminders and pending evening dose", () => {
    const state = createInitialDemoState();
    const timeline = getMedicationTimeline("E001", state);
    const titles = timeline.map((item) => item.title).join("；");

    expect(titles).toContain("早药提醒");
    expect(titles).toContain("早药已确认");
    expect(titles).toContain("晚药提醒");
    expect(titles).toContain("晚药尚未确认");
  });
});
