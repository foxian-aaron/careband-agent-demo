import type { PersonalBaseline } from "../../types";

interface BaselineSummaryCardProps {
  baseline: PersonalBaseline;
}

export const BaselineSummaryCard = ({ baseline }: BaselineSummaryCardProps) => (
  <article className="panel">
    <div className="section-title">
      <span>个人基线</span>
      <h2>与本人近期状态比较</h2>
    </div>
    <div className="info-grid compact">
      <div><span>7 日平均步数</span><strong>{baseline.avgSteps7d} 步</strong></div>
      <div><span>7 日平均睡眠</span><strong>{baseline.avgSleep7d} 小时</strong></div>
      <div><span>平均活跃时长</span><strong>{baseline.avgActiveMinutes7d} 分钟</strong></div>
      <div><span>静息心率基线</span><strong>{baseline.restingHrBaseline} bpm</strong></div>
      <div><span>用药准时率</span><strong>{Math.round(baseline.medicationOnTimeRate * 100)}%</strong></div>
      <div><span>基线置信度</span><strong>{Math.round(baseline.baselineConfidence * 100)}%</strong></div>
    </div>
    <p className="muted-copy">
      系统优先与老人自己的近期基线比较，而不是使用统一标准判断所有老人。
    </p>
  </article>
);
