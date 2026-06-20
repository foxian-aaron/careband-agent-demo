import type {
  AgentRoleSummaries,
  CareEvent,
  DailySnapshot,
  ElderProfile,
  PersonalBaseline,
  RiskResult,
} from "../types";
import type { DisplayStatus } from "../lib/displayStatus";
import { formatClock } from "../lib/dateUtils";
import { medicationLabels, riskLabels } from "../lib/statusLabels";
import { StatusPill } from "./StatusPill";

interface DecisionTracePanelProps {
  profile: ElderProfile;
  baseline: PersonalBaseline;
  snapshot: DailySnapshot;
  events: CareEvent[];
  risk: RiskResult;
  summaries: AgentRoleSummaries;
  displayStatus: DisplayStatus;
  trace: string[];
}

const latestVoiceEvent = (events: CareEvent[]) =>
  events
    .filter((event) => event.eventType === "voice_symptom" && event.rawText)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];

const percentDrop = (today: number | null, baseline: number) => {
  if (today === null || baseline === 0) return "数据缺失";
  return `${Math.round((1 - today / baseline) * 100)}%`;
};

const formatSigned = (value: number, digits = 0) => {
  const rounded = Number(value.toFixed(digits));
  return `${rounded > 0 ? "+" : ""}${rounded}`;
};

export const DecisionTracePanel = ({
  profile,
  baseline,
  snapshot,
  events,
  risk,
  summaries,
  displayStatus,
  trace,
}: DecisionTracePanelProps) => {
  const voiceEvent = latestVoiceEvent(events);
  const sleepDiff =
    snapshot.sleepDuration === null
      ? "数据缺失"
      : `${(baseline.avgSleep7d - snapshot.sleepDuration).toFixed(1)} 小时`;
  const heartRateDiff =
    snapshot.heartRate === null
      ? "数据缺失"
      : `${formatSigned(snapshot.heartRate - baseline.restingHrBaseline, 1)} bpm`;

  return (
    <section className="panel decision-trace">
      <div className="section-title">
        <span>Decision Trace</span>
        <h2>输入、规则、输出全链路</h2>
      </div>
      <div className="decision-grid">
        <article>
          <h3>1. 输入数据</h3>
          <dl>
            <div><dt>长者</dt><dd>{profile.name} · {profile.age} 岁 · 房间 {profile.room}</dd></div>
            <div><dt>今日步数</dt><dd>{snapshot.stepsToday ?? "缺失"} 步</dd></div>
            <div><dt>7 日平均步数</dt><dd>{baseline.avgSteps7d} 步</dd></div>
            <div><dt>睡眠</dt><dd>{snapshot.sleepDuration ?? "缺失"} 小时</dd></div>
            <div><dt>平均睡眠</dt><dd>{baseline.avgSleep7d} 小时</dd></div>
            <div><dt>晚药状态</dt><dd>{medicationLabels[snapshot.medicationEvening]}</dd></div>
            <div><dt>最新语音事件</dt><dd>{voiceEvent ? `${formatClock(voiceEvent.timestamp)} “${voiceEvent.rawText}”` : "暂无"}</dd></div>
            <div><dt>数据完整度</dt><dd>{Math.round(snapshot.dataCompleteness * 100)}%</dd></div>
          </dl>
        </article>
        <article>
          <h3>2. 个人基线比较</h3>
          <dl>
            <div><dt>步数下降</dt><dd>{percentDrop(snapshot.stepsToday, baseline.avgSteps7d)}</dd></div>
            <div><dt>睡眠减少</dt><dd>{sleepDiff}</dd></div>
            <div><dt>心率相对基线</dt><dd>{heartRateDiff}</dd></div>
            <div><dt>基线置信度</dt><dd>{Math.round(baseline.baselineConfidence * 100)}%</dd></div>
          </dl>
        </article>
        <article>
          <h3>3. 触发规则</h3>
          <ul>
            {risk.triggeredRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </article>
        <article>
          <h3>4. 风险输出</h3>
          <dl>
            <div><dt>riskLevel</dt><dd>{risk.riskLevel} · {riskLabels[risk.riskLevel]}</dd></div>
            <div><dt>riskScore</dt><dd>{risk.riskScore}</dd></div>
            <div><dt>confidence</dt><dd>{Math.round(risk.confidence * 100)}%</dd></div>
            <div><dt>recommendedAction</dt><dd>{risk.recommendedAction}</dd></div>
          </dl>
          <ul>
            {risk.keyReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <p className="trace-disclaimer">{risk.medicalDisclaimer}</p>
        </article>
        <article className="decision-wide">
          <h3>5. 三端输出</h3>
          <div className="trace-output-grid">
            <div><strong>护工端摘要</strong><p>{summaries.caregiverSummary}</p></div>
            <div><strong>家属端摘要</strong><p>{summaries.familySummary}</p></div>
            <div><strong>机构端摘要</strong><p>{summaries.institutionSummary}</p></div>
            <div>
              <strong>前台展示状态</strong>
              <p><StatusPill label={displayStatus.label} tone={displayStatus.tone === "follow_up" ? "follow-up" : displayStatus.tone === "high_risk" ? "high-risk" : displayStatus.tone === "data_insufficient" ? "muted" : displayStatus.tone} /></p>
              <p>{displayStatus.description}</p>
            </div>
          </div>
        </article>
      </div>
      <details className="trace-details">
        <summary>查看原始 trace 细节</summary>
        <ol>
          {trace.map((item, index) => (
            <li key={`${item}-${index}`}>
              <span>{index + 1}</span>
              <p>{item}</p>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
};
