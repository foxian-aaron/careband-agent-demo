import type {
  CareTask,
  DimensionStatus,
  ElderProfile,
  OperationalState,
  RiskResult,
} from "../types";
import {
  dimensionLabels,
  dimensionTone,
  operationalLabels,
  taskStatusLabels,
} from "../lib/statusLabels";
import { RiskBadge } from "./RiskBadge";
import { StatusPill } from "./StatusPill";

export interface HeatmapRow {
  profile: ElderProfile;
  risk: RiskResult;
  task?: CareTask;
  operationalState: OperationalState;
}

interface InstitutionHeatmapProps {
  rows: HeatmapRow[];
}

const DimensionCell = ({
  label,
  status,
}: {
  label: string;
  status: DimensionStatus;
}) => (
  <td>
    <StatusPill label={label} tone={dimensionTone(status)} />
  </td>
);

export const InstitutionHeatmap = ({ rows }: InstitutionHeatmapProps) => (
  <div className="table-wrap">
    <table className="heatmap-table">
      <thead>
        <tr>
          <th>老人</th>
          <th>房间</th>
          <th>总状态</th>
          <th>生命体征</th>
          <th>活动</th>
          <th>睡眠</th>
          <th>用药</th>
          <th>安全</th>
          <th>任务状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ profile, risk, task, operationalState }) => (
          <tr key={profile.elderId}>
            <td>
              <strong>{profile.name}</strong>
              <span>{profile.age} 岁</span>
            </td>
            <td>{profile.room}</td>
            <td>
              <RiskBadge level={risk.riskLevel} score={risk.riskScore} />
            </td>
            <DimensionCell
              label={dimensionLabels[risk.dimensions.vitals]}
              status={risk.dimensions.vitals}
            />
            <DimensionCell
              label={dimensionLabels[risk.dimensions.activity]}
              status={risk.dimensions.activity}
            />
            <DimensionCell
              label={dimensionLabels[risk.dimensions.sleep]}
              status={risk.dimensions.sleep}
            />
            <DimensionCell
              label={dimensionLabels[risk.dimensions.medication]}
              status={risk.dimensions.medication}
            />
            <DimensionCell
              label={dimensionLabels[risk.dimensions.safety]}
              status={risk.dimensions.safety}
            />
            <td>
              <strong>{operationalLabels[operationalState]}</strong>
              {task ? <span>{taskStatusLabels[task.status]}</span> : null}
            </td>
            <td>
              <a className="text-button" href={`#/elder/${profile.elderId}`}>
                查看详情
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
