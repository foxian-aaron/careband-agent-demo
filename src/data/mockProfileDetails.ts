import { mockConsentStatuses } from "./mockConsent";
import type { ConsentStatus, ElderProfileDetail } from "../types";

const consentById = mockConsentStatuses.reduce<Record<string, ConsentStatus>>(
  (record, consent) => {
    record[consent.elderId] = consent;
    return record;
  },
  {},
);

export const mockProfileDetails: ElderProfileDetail[] = [
  {
    elderId: "TEST001",
    languagePreference: "團隊測試資料",
    institutionName: "CareBand v0.2 Demo",
    careGroup: "Apple Health 資料驗證",
    admissionType: "非真實長者 / 團隊 Apple Watch 測試資料",
    primaryCaregiverId: "CG-A",
    backupCaregiverId: "CG-B",
    primaryFamilyContactId: "FAM-TEST001",
    consentStatus: consentById.TEST001,
  },
  {
    elderId: "E001",
    languagePreference: "粤语 / 普通话",
    institutionName: "澳门长者中心 Demo",
    careGroup: "二楼照护组",
    admissionType: "日间照护 / 住宿照护模拟",
    primaryCaregiverId: "CG-A",
    backupCaregiverId: "CG-B",
    primaryFamilyContactId: "FAM-E001",
    emergencyContactId: "EMG-E001",
    consentStatus: consentById.E001,
  },
  {
    elderId: "E002",
    languagePreference: "粤语",
    institutionName: "澳门长者中心 Demo",
    careGroup: "二楼照护组",
    admissionType: "住宿照护模拟",
    primaryCaregiverId: "CG-A",
    backupCaregiverId: "CG-B",
    primaryFamilyContactId: "FAM-E002",
    consentStatus: consentById.E002,
  },
  {
    elderId: "E003",
    languagePreference: "普通话",
    institutionName: "澳门长者中心 Demo",
    careGroup: "二楼照护组",
    admissionType: "日间照护模拟",
    primaryCaregiverId: "CG-B",
    backupCaregiverId: "CG-A",
    primaryFamilyContactId: "FAM-E003",
    consentStatus: consentById.E003,
  },
  {
    elderId: "E004",
    languagePreference: "粤语 / 普通话",
    institutionName: "澳门长者中心 Demo",
    careGroup: "二楼照护组",
    admissionType: "日间照护模拟",
    primaryCaregiverId: "CG-B",
    backupCaregiverId: "CG-A",
    primaryFamilyContactId: "FAM-E004",
    consentStatus: consentById.E004,
  },
  {
    elderId: "E005",
    languagePreference: "粤语",
    institutionName: "澳门长者中心 Demo",
    careGroup: "二楼照护组",
    admissionType: "住宿照护模拟",
    primaryCaregiverId: "CG-A",
    backupCaregiverId: "CG-B",
    primaryFamilyContactId: "FAM-E005",
    consentStatus: consentById.E005,
  },
];
