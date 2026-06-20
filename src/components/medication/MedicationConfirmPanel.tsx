import type { Dispatch } from "react";
import type { DemoAction } from "../../store/demoStore";
import type { CareLoopStatus } from "../../lib/displayStatus";
import type { MedicationDose } from "../../types";
import { careLoopLabels } from "../../lib/statusLabels";

interface MedicationConfirmPanelProps {
  eveningDose?: MedicationDose;
  careLoopStatus: CareLoopStatus;
  dispatch: Dispatch<DemoAction>;
  canUseDemoAction?: boolean;
}

export const MedicationConfirmPanel = ({
  eveningDose,
  careLoopStatus,
  dispatch,
  canUseDemoAction = true,
}: MedicationConfirmPanelProps) => {
  const confirmed = eveningDose?.status === "confirmed";
  const disabled = confirmed || !canUseDemoAction;

  return (
    <article className="panel medication-confirm-panel">
      <div className="section-title">
        <span>晚药确认操作</span>
        <h2>{confirmed ? "晚药已确认" : "晚药尚未确认"}</h2>
      </div>
      <p className="muted-copy">
        {confirmed
          ? `晚药已确认，确认人为 ${eveningDose?.confirmedBy ?? "护工A"}。`
          : !canUseDemoAction
            ? "当前 Demo 只开放陈伯的用药确认交互，其余长者展示轻量模拟记录。"
          : "晚药尚未确认。请护工确认老人是否已按机构记录完成用药。"}
      </p>
      <p className="muted-copy">当前护工闭环状态：{careLoopLabels[careLoopStatus]}</p>
      <button
        className="primary"
        disabled={disabled}
        title={
          confirmed
            ? "晚药已经确认"
            : canUseDemoAction
              ? "确认后会同步护工端、家属端和机构端"
              : "此 Demo 仅完整实现陈伯交互"
        }
        onClick={() => dispatch({ type: "CONFIRM_EVENING_MEDICATION" })}
      >
        {confirmed ? "晚药已确认" : "确认晚药"}
      </button>
    </article>
  );
};
