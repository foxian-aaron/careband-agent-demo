import type { WeeklySummary } from "../types";

export const mockWeeklySummaries: Record<string, WeeklySummary> = {
  E001: {
    elderId: "E001",
    generatedAt: "2026-06-10T20:40:00+08:00",
    findings: [
      "活动量连续 3 天下滑",
      "睡眠连续 2 天低于本人基线",
      "本周 2 次晚药延迟确认",
      "本周 1 次头晕反馈",
      "设备佩戴稳定性：82%",
    ],
    summary:
      "近 7 日陈伯活动量呈下降趋势，睡眠连续两天低于个人基线，晚药确认存在延迟。建议护工下周重点关注活动能力、晚药确认和头晕反馈是否重复出现。",
    wearStability: 0.82,
  },
};
