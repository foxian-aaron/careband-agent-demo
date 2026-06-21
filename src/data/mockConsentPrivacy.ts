import type { ConsentPrivacyRecord } from "../types";

export const mockConsentPrivacyRecords: ConsentPrivacyRecord[] = [
  {
    elderId: "E001",
    familyCanViewTrend: true,
    caregiverCanViewTasks: true,
    institutionCanViewRiskHeatmap: true,
    doctorCanViewVisitSummary: false,
    rawMedicalRecordRetention: "do_not_save",
    updatedAt: "2026-06-10T09:00:00+08:00",
  },
  {
    elderId: "E002",
    familyCanViewTrend: true,
    caregiverCanViewTasks: true,
    institutionCanViewRiskHeatmap: true,
    doctorCanViewVisitSummary: false,
    rawMedicalRecordRetention: "do_not_save",
    updatedAt: "2026-06-10T09:00:00+08:00",
  },
  {
    elderId: "E003",
    familyCanViewTrend: true,
    caregiverCanViewTasks: true,
    institutionCanViewRiskHeatmap: true,
    doctorCanViewVisitSummary: false,
    rawMedicalRecordRetention: "do_not_save",
    updatedAt: "2026-06-10T09:00:00+08:00",
  },
  {
    elderId: "E004",
    familyCanViewTrend: false,
    caregiverCanViewTasks: true,
    institutionCanViewRiskHeatmap: true,
    doctorCanViewVisitSummary: false,
    rawMedicalRecordRetention: "do_not_save",
    updatedAt: "2026-06-10T09:00:00+08:00",
  },
  {
    elderId: "E005",
    familyCanViewTrend: true,
    caregiverCanViewTasks: true,
    institutionCanViewRiskHeatmap: true,
    doctorCanViewVisitSummary: false,
    rawMedicalRecordRetention: "do_not_save",
    updatedAt: "2026-06-10T09:00:00+08:00",
  },
];
