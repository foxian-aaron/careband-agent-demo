interface DecisionTracePanelProps {
  trace: string[];
}

export const DecisionTracePanel = ({ trace }: DecisionTracePanelProps) => (
  <section className="panel decision-trace">
    <div className="section-title">
      <span>Decision Trace</span>
      <h2>规则与 Agent 输出追踪</h2>
    </div>
    <ol>
      {trace.map((item, index) => (
        <li key={`${item}-${index}`}>
          <span>{index + 1}</span>
          <p>{item}</p>
        </li>
      ))}
    </ol>
  </section>
);
