import type {
  AgentRoleSummaries,
  AgentRunStatus,
  AgentTraceBundle,
  CareEvent,
  DailySnapshot,
  DeviceRecord,
  ElderProfile,
  InitialCareMemory,
  PersonalBaseline,
  RiskResult,
} from "../types";

export const buildAgentTrace = ({
  profile,
  baseline,
  snapshot,
  events,
  risk,
  summaries,
  initialCareMemory,
  deviceRecord,
  status = "ready",
}: {
  profile: ElderProfile;
  baseline: PersonalBaseline;
  snapshot: DailySnapshot;
  events: CareEvent[];
  risk: RiskResult;
  summaries: AgentRoleSummaries;
  initialCareMemory?: InitialCareMemory;
  deviceRecord?: DeviceRecord;
  status?: AgentRunStatus;
}): AgentTraceBundle => {
  const deviceNotWorn =
    deviceRecord?.wearStatus === "not_worn" || snapshot.dataCompleteness < 0.4;
  const memoryTags = initialCareMemory?.riskTags ?? [];
  const memoryText =
    memoryTags.length > 0
      ? `${profile.name}有${memoryTags.join("、")}标签。`
      : "尚未建立初始照护记忆。";

  const fallbackPrefix =
    status === "fallback_rule" ? "Agent 暂不可用，已 fallback 到规则摘要。" : "";
  const dataGapText = deviceNotWorn
    ? "当前设备佩戴或数据完整度不足，摘要只提示确认佩戴，不做强判断。"
    : "";
  const medicationAndDizzy = events.some(
    (event) =>
      event.eventType === "voice_symptom" &&
      ["头晕", "不舒服", "胸闷"].some((keyword) =>
        event.rawText?.includes(keyword),
      ),
  );
  const caregiverFocus =
    medicationAndDizzy && snapshot.medicationEvening !== "confirmed"
      ? "请重点确认是否已进食和服药，并观察不适是否重复出现。"
      : risk.recommendedAction;

  return {
    elderId: profile.elderId,
    request: {
      elder_profile: {
        elder_id: profile.elderId,
        name: profile.name,
        age: profile.age,
        room: profile.room,
        chronic_conditions: profile.chronicConditions,
      },
      initial_care_memory: initialCareMemory
        ? {
            summary: initialCareMemory.summary,
            risk_tags: initialCareMemory.riskTags,
            communication_preferences: initialCareMemory.communicationPreferences,
            medication_notes: initialCareMemory.medicationNotes,
            observation_focus: initialCareMemory.observationFocus,
          }
        : { status: "not_created" },
      daily_snapshot: {
        date: snapshot.date,
        steps: snapshot.stepsToday,
        sleep_duration: snapshot.sleepDuration,
        medication_evening: snapshot.medicationEvening,
        wear_time_hours: snapshot.wearTimeHours,
        data_quality: snapshot.dataCompleteness,
        data_source: snapshot.dataSource ?? deviceRecord?.dataSource ?? "Mock Data",
      },
      personal_baseline: {
        avg_steps_7d: baseline.avgSteps7d,
        avg_sleep_7d: baseline.avgSleep7d,
        resting_hr_baseline: baseline.restingHrBaseline,
      },
      events: events.slice(-6).map((event) => ({
        event_type: event.eventType,
        title: event.title,
        raw_text: event.rawText,
        severity: event.severity,
        source: event.source,
      })),
      risk_result: {
        risk_level: risk.riskLevel,
        risk_score: risk.riskScore,
        key_reasons: risk.keyReasons,
        recommended_action: risk.recommendedAction,
        confidence: risk.confidence,
      },
      target_outputs: ["caregiver_summary", "family_summary", "institution_summary"],
    },
    response: {
      caregiver_summary: `${fallbackPrefix}${memoryText}${dataGapText}${caregiverFocus} ${summaries.caregiverSummary}`,
      family_summary: `${fallbackPrefix}${dataGapText}${summaries.familySummary}`,
      institution_summary: `${fallbackPrefix}${memoryText}${summaries.institutionSummary}`,
      recommended_action: caregiverFocus,
      safety_disclaimer: risk.medicalDisclaimer,
    },
    status,
    generatedAt: new Date().toISOString(),
  };
};
