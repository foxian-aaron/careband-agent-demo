import type {
  AgentRoleSummaries,
  CareEvent,
  DailySnapshot,
  ElderProfile,
  PersonalBaseline,
  RiskResult,
} from "../types";

export interface AgentRequest {
  elderId: string;
  scenario: "caregiver" | "family" | "institution";
  riskResult: RiskResult;
  context: Record<string, unknown>;
}

export interface AgentResponse {
  summary: string;
  decisionTrace: string[];
  modelName: string;
  generatedAt: string;
}

export interface QwenPawAgentAdapter {
  generateSummary(request: AgentRequest): Promise<AgentResponse>;
}

export const buildQwenPawRequest = (
  elderId: string,
  scenario: AgentRequest["scenario"],
  riskResult: RiskResult,
  context: Record<string, unknown>,
): AgentRequest => ({
  elderId,
  scenario,
  riskResult,
  context,
});

export const mapMockSummariesToAgentResponse = (
  summary: keyof AgentRoleSummaries,
  summaries: AgentRoleSummaries,
): AgentResponse => ({
  summary: String(summaries[summary]),
  decisionTrace: summaries.decisionTrace,
  modelName: "mock-agent-v0.1.1",
  generatedAt: new Date().toISOString(),
});

export interface MockQwenPawIO {
  request: Record<string, unknown>;
  response: Record<string, unknown>;
}

export const buildMockQwenPawIO = (
  profile: ElderProfile,
  baseline: PersonalBaseline,
  snapshot: DailySnapshot,
  events: CareEvent[],
  riskResult: RiskResult,
  summaries: AgentRoleSummaries,
): MockQwenPawIO => ({
  request: {
    elder: `${profile.name}，${profile.age}岁，${
      profile.chronicConditions.join("、") || "无慢病标签"
    }`,
    baseline: {
      avgSteps7d: baseline.avgSteps7d,
      avgSleep7d: baseline.avgSleep7d,
      restingHrBaseline: baseline.restingHrBaseline,
    },
    snapshot: {
      stepsToday: snapshot.stepsToday,
      sleepDuration: snapshot.sleepDuration,
      medicationEvening: snapshot.medicationEvening,
      dataCompleteness: snapshot.dataCompleteness,
    },
    events: events
      .filter((event) =>
        ["voice_symptom", "sos", "fall_detected", "location_alert"].includes(
          event.eventType,
        ),
      )
      .map((event) => ({
        eventType: event.eventType,
        rawText: event.rawText,
        payload: event.payload,
      })),
    riskResult: {
      riskLevel: riskResult.riskLevel,
      riskScore: riskResult.riskScore,
    },
  },
  response: {
    caregiverSummary: summaries.caregiverSummary,
    familySummary: summaries.familySummary,
    institutionSummary: summaries.institutionSummary,
    recommendedAction: riskResult.recommendedAction,
    medicalDisclaimer: riskResult.medicalDisclaimer,
  },
});

/*
  后续接入 QwenPaw 时，可实现 QwenPawAgentAdapter：
  1. 将老人档案、今日快照、RiskResult 和事件摘要序列化为 AgentRequest。
  2. 调用真实 QwenPaw / 大模型服务生成不同角色文案。
  3. 保留 riskEngine 的结构化结果作为可审计输入，避免摘要成为黑盒判断。
*/
