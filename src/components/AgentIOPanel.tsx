import type {
  AgentRoleSummaries,
  CareEvent,
  DailySnapshot,
  ElderProfile,
  PersonalBaseline,
  RiskResult,
} from "../types";
import { buildMockQwenPawIO } from "../lib/qwenpawAdapter";

interface AgentIOPanelProps {
  profile: ElderProfile;
  baseline: PersonalBaseline;
  snapshot: DailySnapshot;
  events: CareEvent[];
  risk: RiskResult;
  summaries: AgentRoleSummaries;
}

export const AgentIOPanel = ({
  profile,
  baseline,
  snapshot,
  events,
  risk,
  summaries,
}: AgentIOPanelProps) => {
  const io = buildMockQwenPawIO(profile, baseline, snapshot, events, risk, summaries);

  return (
    <section className="panel agent-io-panel">
      <div className="section-title">
        <span>{summaries.agentSource === "openai" ? "OpenAI Agent IO" : "Mock Agent IO"}</span>
        <h2>结构化输入 / 多角色输出</h2>
      </div>
      <p className="muted-copy">
        当前 Agent 来源：{summaries.agentSource === "openai" ? "OpenAI" : "Mock fallback"}。
        Agent provider: mock fallback / OpenAI / future QwenPaw-compatible endpoint。
        API key 只在后端读取，前端不会暴露密钥。
      </p>
      {summaries.warning ? <p className="muted-copy">Agent 警告：{summaries.warning}</p> : null}
      <div className="agent-io-grid">
        <div>
          <h3>Mock QwenPaw Request</h3>
          <pre>{JSON.stringify(io.request, null, 2)}</pre>
        </div>
        <div>
          <h3>Mock QwenPaw Response</h3>
          <pre>{JSON.stringify(io.response, null, 2)}</pre>
        </div>
      </div>
    </section>
  );
};
