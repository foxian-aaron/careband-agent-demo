import { useDemo } from "../store/demoStore";
import type { WeeklySummary } from "../types";
import { FutureIntegrationBadge } from "./FutureIntegrationBadge";

interface WeeklyTrendSummaryProps {
  elderId: string;
}

const createWeeklySummary = (elderId: string): WeeklySummary => ({
  elderId,
  generatedAt: new Date().toISOString(),
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
});

export const WeeklyTrendSummary = ({ elderId }: WeeklyTrendSummaryProps) => {
  const { state, dispatch } = useDemo();
  const summary = state.weeklySummaries[elderId] ?? createWeeklySummary(elderId);

  return (
    <section className="panel weekly-summary">
      <div className="section-title with-actions">
        <div>
          <span>AI 周报 / 长期趋势观察</span>
          <h2>7 日 Mock 趋势摘要</h2>
        </div>
        <button
          onClick={() =>
            dispatch({ type: "GENERATE_WEEKLY_SUMMARY", summary: createWeeklySummary(elderId) })
          }
        >
          生成 7 日 AI 趋势摘要（Mock）
        </button>
      </div>
      <div className="tag-row">
        <FutureIntegrationBadge label="Mock Weekly Agent" />
        <FutureIntegrationBadge label="Future QwenPaw Trend Analysis" />
      </div>
      <ul className="insight-list">
        {summary.findings.map((finding) => (
          <li key={finding}>{finding}</li>
        ))}
      </ul>
      <p className="weekly-summary__text">{summary.summary}</p>
    </section>
  );
};
