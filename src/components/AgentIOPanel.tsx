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
        <span>Mock QwenPaw Agent IO</span>
        <h2>结构化输入 / 多角色输出</h2>
      </div>
      <p className="muted-copy">
        当前版本使用 Mock Agent 输出。后续接入 QwenPaw 时，可将下方结构化
        request 发送给 QwenPaw Agent，由真实 Agent 生成多角色摘要和任务建议。
      </p>
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
