import { describe, expect, it } from "vitest";
import { mockBaselines } from "../data/mockBaselines";
import { mockEvents } from "../data/mockEvents";
import { mockProfiles } from "../data/mockProfiles";
import { mockSnapshots } from "../data/mockSnapshots";
import { calculateRisk } from "../lib/riskEngine";
import type { CareEvent } from "../types";

const byId = <T extends { elderId: string }>(items: T[], elderId: string) =>
  items.find((item) => item.elderId === elderId)!;

const inputFor = (elderId: string, extraEvents: CareEvent[] = []) => ({
  profile: byId(mockProfiles, elderId),
  baseline: byId(mockBaselines, elderId),
  snapshot: byId(mockSnapshots, elderId),
  events: [
    ...mockEvents.filter((event) => event.elderId === elderId),
    ...extraEvents,
  ],
});

describe("riskEngine", () => {
  it("calculates Chen initial state as attention or at least not stable", () => {
    const result = calculateRisk(inputFor("E001"));
    const reasons = result.keyReasons.join("；");

    expect(result.riskLevel).toBe("attention");
    expect(result.riskLevel).not.toBe("stable");
    expect(reasons).toContain("步数");
    expect(reasons).toContain("睡眠");
    expect(reasons).toContain("晚药尚未确认");
  });

  it("upgrades Chen to high_risk after dizziness voice symptom", () => {
    const voiceEvent: CareEvent = {
      eventId: "TEST-DIZZINESS",
      elderId: "E001",
      eventType: "voice_symptom",
      timestamp: "2026-06-10T20:15:00+08:00",
      title: "语音反馈：我有点头晕",
      rawText: "我有点头晕",
      source: "demo",
      severity: "high_risk",
    };
    const result = calculateRisk(inputFor("E001", [voiceEvent]));
    const reasons = result.keyReasons.join("；");

    expect(result.riskLevel).toBe("high_risk");
    expect(reasons).toContain("头晕");
    expect(reasons).toContain("晚药尚未确认");
    expect(reasons).toContain("步数");
  });

  it("keeps Liang stable when today is close to baseline", () => {
    const result = calculateRisk(inputFor("E004"));

    expect(result.riskLevel).toBe("stable");
    expect(result.keyReasons.join("；")).toContain("接近本人近期基线");
  });

  it("returns data_insufficient when completeness is below 40 percent", () => {
    const result = calculateRisk(inputFor("E005"));

    expect(result.riskLevel).toBe("data_insufficient");
    expect(result.riskScore).toBeLessThanOrEqual(30);
    expect(result.keyReasons.join("；")).toContain("数据完整度不足");
  });

  it("returns urgent and score >= 90 for SOS events", () => {
    const sosEvent: CareEvent = {
      eventId: "TEST-SOS",
      elderId: "E001",
      eventType: "sos",
      timestamp: "2026-06-10T20:18:00+08:00",
      title: "SOS 测试事件",
      source: "demo",
      severity: "urgent",
    };
    const result = calculateRisk(inputFor("E001", [sosEvent]));

    expect(result.riskLevel).toBe("urgent");
    expect(result.riskScore).toBeGreaterThanOrEqual(90);
  });

  it("keeps medical disclaimer and avoids diagnostic wording", () => {
    const result = calculateRisk(inputFor("E001"));

    expect(result.medicalDisclaimer).toBeTruthy();
    expect(result.recommendedAction).not.toMatch(/患有|确诊|疾病判断/);
  });
});
