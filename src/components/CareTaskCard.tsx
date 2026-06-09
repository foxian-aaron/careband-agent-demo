import type { Dispatch } from "react";
import type { DemoAction } from "../store/demoStore";
import type { CareTask, ElderProfile, RiskResult } from "../types";
import { priorityLabels, taskStatusLabels } from "../lib/statusLabels";
import { RiskBadge } from "./RiskBadge";

interface CareTaskCardProps {
  task: CareTask;
  profile: ElderProfile;
  risk: RiskResult;
  dispatch: Dispatch<DemoAction>;
}

export const CareTaskCard = ({
  task,
  profile,
  risk,
  dispatch,
}: CareTaskCardProps) => {
  const isChen = profile.elderId === "E001";
  const isCompleted = task.status === "completed";

  return (
    <article className={`task-card priority-${task.priority}`}>
      <div className="task-card__head">
        <div>
          <span>{priorityLabels[task.priority]}</span>
          <h3>{task.title}</h3>
          <p>
            {profile.name} · 房间 {profile.room} · {taskStatusLabels[task.status]}
          </p>
        </div>
        <RiskBadge level={risk.riskLevel} score={risk.riskScore} />
      </div>
      <dl className="task-details">
        <div>
          <dt>原因</dt>
          <dd>{task.reason}</dd>
        </div>
        <div>
          <dt>建议动作</dt>
          <dd>{task.recommendedAction}</dd>
        </div>
      </dl>
      {task.note ? <p className="care-note">{task.note}</p> : null}
      <div className="button-row">
        <button
          disabled={!isChen || task.status !== "pending"}
          onClick={() => dispatch({ type: "CAREGIVER_ACCEPT_TASK" })}
        >
          接单
        </button>
        <button
          disabled={!isChen || isCompleted}
          onClick={() => dispatch({ type: "CAREGIVER_ACCEPT_TASK" })}
        >
          标记已查看
        </button>
        <button
          disabled={!isChen || isCompleted}
          onClick={() => dispatch({ type: "CONFIRM_EVENING_MEDICATION" })}
        >
          确认晚药
        </button>
        <button
          className="primary"
          disabled={!isChen || isCompleted}
          onClick={() => dispatch({ type: "COMPLETE_CARE_TASK" })}
        >
          完成并记录
        </button>
      </div>
    </article>
  );
};
