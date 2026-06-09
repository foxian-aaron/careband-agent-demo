import type {
  DimensionStatus,
  MedicationStatus,
  OperationalState,
  RiskLevel,
} from "../types";

export const medicalDisclaimer =
  "本系统仅用于照护风险提示，不构成医疗诊断。如出现持续不适或紧急情况，请由照护人员或专业医疗人员判断处理。";

export const riskLabels: Record<RiskLevel, string> = {
  data_insufficient: "数据不足",
  stable: "稳定",
  observation: "观察",
  attention: "需关注",
  high_risk: "高风险",
  urgent: "紧急",
};

export const riskOrder: Record<RiskLevel, number> = {
  urgent: 6,
  high_risk: 5,
  attention: 4,
  observation: 3,
  stable: 2,
  data_insufficient: 1,
};

export const operationalLabels: Record<OperationalState, string> = {
  normal: "正常",
  pending: "待处理",
  in_progress: "处理中",
  follow_up: "已跟进 / 持续观察",
  completed: "已完成",
};

export const dimensionLabels: Record<DimensionStatus, string> = {
  normal: "正常",
  slightly_high: "偏高",
  slightly_low: "偏低",
  below_baseline: "低于基线",
  significantly_low: "明显下降",
  not_confirmed: "未确认",
  confirmed: "已确认",
  needs_attention: "需确认",
  high_risk: "高风险",
  data_insufficient: "数据不足",
};

export const medicationLabels: Record<MedicationStatus, string> = {
  confirmed: "已确认",
  not_confirmed: "未确认",
  delayed: "已延迟",
  not_required: "无需服药",
};

export const priorityLabels: Record<string, string> = {
  urgent: "紧急",
  high: "高优先级",
  medium: "中优先级",
  low: "低优先级",
};

export const taskStatusLabels: Record<string, string> = {
  pending: "待处理",
  in_progress: "处理中",
  completed: "已完成",
};

export const riskCssClass = (riskLevel: RiskLevel) =>
  `risk-${riskLevel.replace("_", "-")}`;

export const dimensionTone = (status: DimensionStatus) => {
  if (status === "high_risk") return "high-risk";
  if (status === "significantly_low" || status === "not_confirmed")
    return "attention";
  if (status === "below_baseline" || status === "needs_attention")
    return "observation";
  if (status === "data_insufficient") return "muted";
  return "stable";
};
