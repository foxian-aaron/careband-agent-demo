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
  baselineLabel?: string;
  usableDays?: number;
}

export type MedicationDoseStatus =
  | "confirmed"
  | "not_confirmed"
  | "delayed"
  | "not_required";

export type MedicationStatus = MedicationDoseStatus;

export type MedicationConfirmSource =
  | "elder_button"
  | "caregiver"
  | "demo"
  | "system";

export interface DailySnapshot {
  elderId: string;
  date: string;
  snapshotId?: string;
  dataSource?: string;
  dataQuality?: number;
  heartRate: number | null;
  restingHeartRate?: number | null;
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

export interface MedicationDose {
  doseId: string;
  elderId: string;
  label: string;
  scheduledTime: string;
  medicationName: string;
  dosageText: string;
  instruction: string;
  status: MedicationDoseStatus;
  confirmedAt?: string;
  confirmedBy?: string;
  confirmSource?: MedicationConfirmSource;
  reminderEventId?: string;
  confirmedEventId?: string;
}

export interface MedicationPlan {
  elderId: string;
  planName: string;
  planSource: "mock" | "caregiver_input" | "doctor_note";
  updatedAt: string;
  notes: string;
  doses: MedicationDose[];
  medicalDisclaimer: string;
}

export interface ContactPerson {
  contactId: string;
  name: string;
  role: "caregiver" | "family" | "institution_manager" | "doctor";
  relation?: string;
  phoneMasked: string;
  visibleTo: Array<"caregiver" | "family" | "institution">;
}

export interface ConsentStatus {
  elderId: string;
  familyCanViewDailyStatus: boolean;
  familyCanViewMedicationStatus: boolean;
  familyCanViewLocationZone: boolean;
  familyCanViewVoiceSummary: boolean;
  doctorSummaryRequiresApproval: boolean;
  locationPrecision: "zone_only" | "precise";
  voiceRawTextPolicy: "summary_only" | "caregiver_only" | "visible_to_family";
  updatedAt: string;
}

export interface ElderProfileDetail {
  elderId: string;
  languagePreference: string;
  institutionName: string;
  careGroup: string;
  admissionType: string;
  primaryCaregiverId: string;
  backupCaregiverId?: string;
  primaryFamilyContactId: string;
  emergencyContactId?: string;
  consentStatus: ConsentStatus;
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
  handledBy?: string;
  handledNote?: string;
}

export interface AgentRoleSummaries {
  caregiverSummary: string;
  familySummary: string;
  institutionSummary: string;
  decisionTrace: string[];
  agentSource?: "mock" | "openai";
  warning?: string | null;
  generatedAt?: string;
}

export interface AgentOutput {
  outputId: string;
  elderId: string;
  sourceEventId?: string | null;
  statusLevel: "stable" | "observe" | "attention" | "high_risk" | "urgent" | "insufficient_data";
  riskScore: number;
  caregiverSummary: string;
  familySummary: string;
  institutionSummary: string;
  recommendedAction: string;
  safetyDisclaimer: string;
  keyReasons: string[];
  agentSource: "mock" | "openai";
  warning?: string | null;
  createdAt: string;
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
