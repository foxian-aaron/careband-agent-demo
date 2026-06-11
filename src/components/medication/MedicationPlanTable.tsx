import type { MedicationDose } from "../../types";
import { medicationLabels } from "../../lib/statusLabels";
import { StatusPill } from "../StatusPill";

const sourceLabels: Record<string, string> = {
  elder_button: "老人按钮确认",
  caregiver: "护工确认",
  demo: "Demo 控制",
  system: "系统记录",
};

interface MedicationPlanTableProps {
  doses: MedicationDose[];
}

export const MedicationPlanTable = ({ doses }: MedicationPlanTableProps) => (
  <div className="table-wrap">
    <table className="heatmap-table medication-table">
      <thead>
        <tr>
          <th>用药时段</th>
          <th>计划时间</th>
          <th>用药名称</th>
          <th>说明</th>
          <th>状态</th>
          <th>确认时间</th>
          <th>确认人</th>
          <th>确认来源</th>
        </tr>
      </thead>
      <tbody>
        {doses.map((dose) => (
          <tr key={dose.doseId}>
            <td><strong>{dose.label}</strong></td>
            <td>{dose.scheduledTime}</td>
            <td>{dose.medicationName}</td>
            <td>
              <span>{dose.dosageText}</span>
              <small>{dose.instruction}</small>
            </td>
            <td>
              <StatusPill
                label={medicationLabels[dose.status]}
                tone={
                  dose.status === "confirmed" || dose.status === "not_required"
                    ? "stable"
                    : dose.status === "delayed"
                      ? "observation"
                      : "attention"
                }
              />
            </td>
            <td>{dose.confirmedAt ?? "-"}</td>
            <td>{dose.confirmedBy ?? "-"}</td>
            <td>{dose.confirmSource ? sourceLabels[dose.confirmSource] : "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
