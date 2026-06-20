export const SAFETY_DISCLAIMER = "本結果僅為照護風險提示，不構成醫療診斷。";

export const STATUS_LEVELS = [
  "stable",
  "observe",
  "attention",
  "high_risk",
  "urgent",
  "insufficient_data",
];

export const RISK_ORDER = {
  insufficient_data: 0,
  stable: 1,
  observe: 2,
  attention: 3,
  high_risk: 4,
  urgent: 5,
};
