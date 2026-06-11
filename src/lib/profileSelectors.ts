import type { DemoState } from "../store/demoStore";
import type { ConsentStatus, ContactPerson, ElderProfileDetail } from "../types";

export const getProfileDetail = (
  elderId: string,
  state: DemoState,
): ElderProfileDetail | undefined => state.profileDetails[elderId];

export const getCareTeamForElder = (
  elderId: string,
  state: DemoState,
): {
  primaryCaregiver?: ContactPerson;
  backupCaregiver?: ContactPerson;
  familyContact?: ContactPerson;
  emergencyContact?: ContactPerson;
} => {
  const profile = state.profiles[elderId];
  const detail = getProfileDetail(elderId, state);

  return {
    primaryCaregiver:
      state.contacts[detail?.primaryCaregiverId ?? profile?.caregiverId ?? ""],
    backupCaregiver: detail?.backupCaregiverId
      ? state.contacts[detail.backupCaregiverId]
      : undefined,
    familyContact:
      state.contacts[detail?.primaryFamilyContactId ?? profile?.familyContactId ?? ""],
    emergencyContact: detail?.emergencyContactId
      ? state.contacts[detail.emergencyContactId]
      : undefined,
  };
};

export const getConsentStatusForElder = (
  elderId: string,
  state: DemoState,
): ConsentStatus | undefined => getProfileDetail(elderId, state)?.consentStatus;

export const getProfileSummaryForElder = (
  elderId: string,
  state: DemoState,
): {
  name: string;
  age: number;
  room: string;
  chronicConditions: string[];
  riskTags: string[];
  careGroup: string;
  primaryCaregiverName: string;
  familyContactName: string;
  consentSummary: string[];
} => {
  const profile = state.profiles[elderId];
  const detail = getProfileDetail(elderId, state);
  const careTeam = getCareTeamForElder(elderId, state);
  const consent = detail?.consentStatus;

  return {
    name: profile?.name ?? "未知长者",
    age: profile?.age ?? 0,
    room: profile?.room ?? "-",
    chronicConditions: profile?.chronicConditions ?? [],
    riskTags: profile?.riskTags ?? [],
    careGroup: detail?.careGroup ?? "未分组",
    primaryCaregiverName: careTeam.primaryCaregiver?.name ?? "未指定",
    familyContactName: careTeam.familyContact?.name ?? "未指定",
    consentSummary: [
      `家属可查看今日安心卡：${consent?.familyCanViewDailyStatus ? "是" : "否"}`,
      `家属可查看用药状态：${consent?.familyCanViewMedicationStatus ? "是" : "否"}`,
      `家属可查看位置区域：${consent?.familyCanViewLocationZone ? "是" : "否"}`,
      `位置精度：${consent?.locationPrecision === "zone_only" ? "仅显示区域" : "精确位置"}`,
      `语音内容：${
        consent?.voiceRawTextPolicy === "summary_only"
          ? "默认摘要化"
          : consent?.voiceRawTextPolicy === "caregiver_only"
            ? "仅护工可见"
            : "家属可见"
      }`,
      `医生摘要：${consent?.doctorSummaryRequiresApproval ? "需要授权" : "无需额外授权"}`,
    ],
  };
};
