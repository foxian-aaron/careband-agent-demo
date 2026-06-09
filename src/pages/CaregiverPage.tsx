import { CareTaskCard } from "../components/CareTaskCard";
import { ElderSummaryCard } from "../components/ElderSummaryCard";
import { EmptyState } from "../components/EmptyState";
import { MedicalDisclaimer } from "../components/MedicalDisclaimer";
import { Timeline } from "../components/Timeline";
import {
  getEventsForElder,
  getRiskForElder,
  getTaskForElder,
  useDemo,
} from "../store/demoStore";

const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };

export const CaregiverPage = () => {
  const { state, dispatch } = useDemo();
  const tasks = [...state.tasks].sort(
    (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority],
  );
  const profiles = Object.values(state.profiles);
  const highRiskProfiles = profiles.filter((profile) =>
    ["urgent", "high_risk"].includes(getRiskForElder(state, profile.elderId).riskLevel),
  );
  const attentionProfiles = profiles.filter(
    (profile) => getRiskForElder(state, profile.elderId).riskLevel === "attention",
  );
  const operationEvents = state.events.filter((event) =>
    ["caregiver_accepted", "caregiver_completed", "medication_confirmed", "system_risk_update", "voice_symptom"].includes(
      event.eventType,
    ),
  );

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span>护工端</span>
          <h1>今日待办与优先处理</h1>
          <p>打开页面后先看高优先级任务，再看需关注长者。</p>
        </div>
      </header>

      <section className="panel">
        <div className="section-title">
          <span>今日待办列表</span>
          <h2>按优先级排序</h2>
        </div>
        <div className="task-list">
          {tasks.length ? (
            tasks.map((task) => (
              <CareTaskCard
                dispatch={dispatch}
                key={task.taskId}
                profile={state.profiles[task.elderId]}
                risk={getRiskForElder(state, task.elderId)}
                task={task}
              />
            ))
          ) : (
            <EmptyState title="暂无待办" description="当前没有需要护工处理的任务。" />
          )}
        </div>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="section-title">
            <span>高风险老人卡片</span>
            <h2>优先查看</h2>
          </div>
          <div className="card-stack">
            {highRiskProfiles.length ? (
              highRiskProfiles.map((profile) => (
                <ElderSummaryCard
                  key={profile.elderId}
                  profile={profile}
                  risk={getRiskForElder(state, profile.elderId)}
                  operationalState={state.operationalStates[profile.elderId] ?? "normal"}
                  task={getTaskForElder(state, profile.elderId)}
                />
              ))
            ) : (
              <EmptyState title="暂无高风险" description="当前没有高风险待处理长者。" />
            )}
          </div>
        </article>
        <article className="panel">
          <div className="section-title">
            <span>需关注老人卡片</span>
            <h2>巡查关注</h2>
          </div>
          <div className="card-stack">
            {attentionProfiles.map((profile) => (
              <ElderSummaryCard
                key={profile.elderId}
                profile={profile}
                risk={getRiskForElder(state, profile.elderId)}
                operationalState={state.operationalStates[profile.elderId] ?? "normal"}
                task={getTaskForElder(state, profile.elderId)}
              />
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="section-title">
          <span>操作记录时间线</span>
          <h2>护工与系统记录</h2>
        </div>
        <Timeline events={operationEvents} compact />
      </section>
      <MedicalDisclaimer />
    </div>
  );
};
