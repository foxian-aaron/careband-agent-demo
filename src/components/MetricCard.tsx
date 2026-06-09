interface MetricCardProps {
  title: string;
  todayValue: string;
  baselineValue: string;
  deviation: string;
  explanation: string;
  tone?: "stable" | "observation" | "attention" | "high-risk" | "muted";
}

export const MetricCard = ({
  title,
  todayValue,
  baselineValue,
  deviation,
  explanation,
  tone = "stable",
}: MetricCardProps) => (
  <article className={`metric-card tone-border-${tone}`}>
    <div className="metric-card__head">
      <span>{title}</span>
      <strong>{todayValue}</strong>
    </div>
    <dl>
      <div>
        <dt>个人基线</dt>
        <dd>{baselineValue}</dd>
      </div>
      <div>
        <dt>偏离幅度</dt>
        <dd>{deviation}</dd>
      </div>
    </dl>
    <p>{explanation}</p>
  </article>
);
