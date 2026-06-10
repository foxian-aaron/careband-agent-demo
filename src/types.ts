export type RiskLevel =
  | "data_insufficient"
  | "stable"
  | "observation"
  | "attention"
  | "high_risk"
  | "urgent";

export type OperationalState =
  | "normal"
  | "pending"
  | "in_progress"
  | "follow_up"
  | "completed";

export type DimensionStatus =
  | "normal"
  | "slightly_high"
  | "slightly_low"
  | "below_baseline"
  | "significantly_low"
  | "not_confirmed"
  | "confirmed"
  | "needs_attention"
  | "high_risk"
  | "data_insufficient";

export interface ElderProfile {
  elderId: string;
  name: string;
  age: number;
  gender?: string;
  room: string;
  floor: string;
  chronicConditions: string[];
  riskTags: string[];
  caregiverId: string;
  familyContactId: string;
}

export interface PersonalBaseline {
  elderId: string;
  avgSteps7d: number;
  avgSleep7d: number;
  avgActiveMinutes7d: number;
  restingHrBaseline: number;
  medicationOnTimeRate: number;
  baselineConfidence: number;
}

export type MedicationStatus =
  | "confirmed"
  | "not_confirmed"
  | "delayed"
  | "not_required";

export interface DailySnapshot {
  elderId: string;
  date: string;
  heartRate: number | null;
  stepsToday: number | null;
  activeMinutes: number | null;
  sleepDuration: number | null;
  medicationMorning: MedicationStatus;
  medicationEvening: MedicationStatus;
  wearTimeHours: number;
  locationZone: string;
  safeZoneStatus: "inside" | "outside" | "unknown";
  fallDetected: boolean;
  dataCompleteness: number;
  lastSyncedAt: string;
}

export interface MedicationPlan {
  elderId: string;
  morningRequired: boolean;
  eveningRequired: boolean;
  morningTime: string;
  eveningTime: string;
  reminderNote: string;
}

export interface CareEvent {
  eventId: string;
  elderId: string;
  eventType:
    | "medication_reminder"
    | "medication_confirmed"
    | "voice_symptom"
    | "sos"
    | "fall_detected"
    | "location_alert"
    | "night_wakeup"
    | "low_activity"
    | "caregiver_accepted"
    | "caregiver_checked"
    | "caregiver_completed"
    | "system_risk_update";
  timestamp: string;
  title: string;
  rawText?: string;
  source: "demo" | "mock_wearable" | "caregiver" | "system";
  severity?: RiskLevel;
  payload?: {
    symptomKeywords?: string[];
    medicationName?: string;
    locationZone?: string;
    safeZoneStatus?: "inside" | "outside" | "unknown";
    nightWakeupCount?: number;
    activityDropPercent?: number;
    noResponseSeconds?: number;
    note?: string;
    previousValue?: number | string;
    currentValue?: number | string;
  };
  status?: "open" | "acknowledged" | "resolved";
  linkedTaskId?: string;
  handledBy?: string;
  handledAt?: string;
  confidence?: number;
}

export interface RiskDimensions {
  vitals: DimensionStatus;
  activity: DimensionStatus;
  sleep: DimensionStatus;
  medication: DimensionStatus;
  safety: DimensionStatus;
}

export interface RiskResult {
  elderId: string;
  riskLevel: RiskLevel;
  riskScore: number;
  dimensions: RiskDimensions;
  keyReasons: string[];
  triggeredRules: string[];
  recommendedAction: string;
  dataCompleteness: number;
  confidence: number;
  medicalDisclaimer: string;
}

export interface CareTask {
  taskId: string;
  elderId: string;
  sourceEventId?: string;
  priority: "low" | "medium" | "high" | "urgent";
  title: string;
  reason: string;
  recommendedAction: string;
  assignedTo: string;
  status: "pending" | "in_progress" | "completed";
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  note?: string;
}

export interface AgentRoleSummaries {
  caregiverSummary: string;
  familySummary: string;
  institutionSummary: string;
  decisionTrace: string[];
}

export interface TrendPoint {
  date: string;
  steps: number;
  sleepHours: number;
  medicationOnTimeRate: number;
  riskLevel: RiskLevel;
}

export interface ElderTrend {
  elderId: string;
  points: TrendPoint[];
}
