import type {
  CareMemoryItem,
  InitialCareMemory,
  MemorySourceType,
} from "../types";

const now = "2026-06-10T20:35:00+08:00";

const sourceLabels: Record<MemorySourceType, string> = {
  family_oral: "家属口述",
  caregiver_input: "护工录入",
  medical_record_text: "病历单文字",
  medication_list_text: "用药单文字",
  institution_record: "机构记录",
  other: "其他",
};

const createItem = (
  elderId: string,
  index: number,
  category: CareMemoryItem["category"],
  content: string,
  sourceType: MemorySourceType,
  confidence: number,
): CareMemoryItem => ({
  id: `MEM-${elderId}-${index.toString().padStart(2, "0")}`,
  elderId,
  category,
  content,
  sourceType,
  sourceDetail: sourceLabels[sourceType],
  sourceDate: "2026-06-10",
  confidence,
  confirmationStatus: "pending",
  visibilityScope: ["caregiver", "institution"],
  updatedAt: now,
});

export const chenMemorySample =
  "陈伯 78 岁，有高血压，去年夜间起床时跌倒过一次。平时听力稍弱，喜欢用粤语沟通。每天早晚饭后服药，晚药经常需要提醒。女儿是主要联系人，希望高风险事件时收到通知。";

export const createMockInitialCareMemoryDraft = (
  elderId: string,
  input: string,
  sourceType: MemorySourceType,
): InitialCareMemory => {
  const text = input.trim();
  const items: CareMemoryItem[] = [];
  let index = 1;
  const riskTags: string[] = [];
  const communicationPreferences: string[] = [];
  const medicationNotes: string[] = [];
  const familyNotificationPreferences: string[] = [];
  const observationFocus: string[] = [];
  const missingQuestions: string[] = [];

  items.push(
    createItem(
      elderId,
      index++,
      "basic_profile",
      text.includes("78") ? "陈伯，78 岁，长者中心住户。" : "待确认基础资料。",
      sourceType,
      text.includes("78") ? 0.86 : 0.52,
    ),
  );

  if (text.includes("高血压")) {
    riskTags.push("高血压关注");
    observationFocus.push("关注头晕、胸闷等主诉是否与既往高血压背景同时出现。");
    items.push(
      createItem(
        elderId,
        index++,
        "health_background",
        "资料提到有高血压史，后续风险摘要需结合个人基线和人工确认。",
        sourceType,
        0.9,
      ),
    );
  }

  if (text.includes("跌倒")) {
    riskTags.push("跌倒风险关注");
    riskTags.push("夜间离床关注");
    observationFocus.push("夜间离床和疑似跌倒事件需优先提示护工确认。");
    items.push(
      createItem(
        elderId,
        index++,
        "safety_risk",
        "既往夜间起床时跌倒过一次，建议将夜间离床纳入初始观察重点。",
        sourceType,
        0.88,
      ),
    );
  }

  if (text.includes("晚药经常需要提醒") || text.includes("晚药")) {
    riskTags.push("晚药易漏");
    medicationNotes.push("早晚饭后服药；晚药经常需要提醒，建议纳入任务闭环。");
    observationFocus.push("每日晚药确认是否延迟或遗漏。");
    items.push(
      createItem(
        elderId,
        index++,
        "medication_notes",
        "晚药经常需要提醒，未确认时应触发护工复核。",
        sourceType,
        0.91,
      ),
    );
  }

  if (text.includes("粤语")) {
    riskTags.push("粤语优先");
    communicationPreferences.push("粤语优先；听力稍弱时应放慢语速并确认老人理解。");
    items.push(
      createItem(
        elderId,
        index++,
        "communication_preference",
        "老人喜欢用粤语沟通，且听力稍弱。",
        sourceType,
        0.89,
      ),
    );
  }

  if (text.includes("女儿") || text.includes("家属")) {
    familyNotificationPreferences.push("女儿为主要联系人；高风险事件时希望收到通知。");
    items.push(
      createItem(
        elderId,
        index++,
        "family_notification",
        "女儿是主要联系人，高风险事件需同步安心摘要。",
        sourceType,
        0.87,
      ),
    );
  }

  if (text.includes("高风险事件时收到通知")) {
    familyNotificationPreferences.push("家属偏好异常通知优先，不需要展示过多专业数据。");
  }

  missingQuestions.push("是否有明确的常用药名称、剂量和禁忌？");
  missingQuestions.push("夜间离床通常发生在什么时间段？");
  missingQuestions.push("家属希望收到每日摘要，还是仅高风险事件通知？");

  items.push(
    createItem(
      elderId,
      index++,
      "missing_question",
      missingQuestions[0],
      sourceType,
      0.76,
    ),
  );

  const uniqueRiskTags = Array.from(new Set(riskTags));

  return {
    elderId,
    summary:
      uniqueRiskTags.length > 0
        ? `已从资料中提取 ${uniqueRiskTags.length} 个初始照护关注点，需人工确认后进入长期记忆。`
        : "资料较少，已生成待补充的初始照护记忆草稿。",
    riskTags: uniqueRiskTags,
    communicationPreferences,
    medicationNotes,
    familyNotificationPreferences,
    observationFocus,
    missingQuestions,
    items,
    createdAt: now,
    updatedAt: now,
  };
};
