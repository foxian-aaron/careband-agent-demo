import { MedicalDisclaimer } from "../components/MedicalDisclaimer";
import { MedicationConfirmPanel } from "../components/medication/MedicationConfirmPanel";
import { MedicationPlanTable } from "../components/medication/MedicationPlanTable";
import { MedicationSummaryCard } from "../components/medication/MedicationSummaryCard";
import { MedicationTimeline } from "../components/medication/MedicationTimeline";
import { TrendMiniChart } from "../components/TrendMiniChart";
import { deriveCareLoopStatus, deriveDisplayStatus } from "../lib/displayStatus";
import {
  getEveningMedicationDose,
  getMedicationDosesForElder,
  getMedicationPlanForElder,
  getMedicationTimeline,
  getTodayMedicationSummary,
} from "../lib/medicationSelectors";
import {
  getEventsForElder,
  getRiskForElder,
  useDemo,
} from "../store/demoStore";

interface MedicationPageProps {
  elderId: string;
}

export const MedicationPage = ({ elderId }: MedicationPageProps) => {
  const { state, dispatch } = useDemo();
  const profile = state.profiles[elderId] ?? state.profiles.E001;
  const plan = getMedicationPlanForElder(profile.elderId, state);
  const doses = getMedicationDosesForElder(profile.elderId, state);
  const summary = getTodayMedicationSummary(profile.elderId, state);
  const eveningDose = getEveningMedicationDose(profile.elderId, state);
  const timeline = getMedicationTimeline(profile.elderId, state);
  const events = getEventsForElder(state, profile.elderId);
  const risk = getRiskForElder(state, profile.elderId);
  const careLoopStatus = deriveCareLoopStatus(profile.elderId, state.tasks, events);
  const displayStatus = deriveDisplayStatus(risk, careLoopStatus);
  const baseline = state.baselines[profile.elderId];

  return (
    <div className="page">
      <MedicationSummaryCard
        elderName={profile.name}
        summary={summary}
        displayStatus={displayStatus}
        risk={risk}
      />

      <section className="panel">
        <div className="section-title with-actions">
          <div>
            <span>今日用药计划</span>
            <h2>{plan?.planName ?? `${profile.name}今日用药计划（模拟）`}</h2>
          </div>
          <a className="text-button" href={`#/elder/${profile.elderId}/profile`}>查看老人档案</a>
        </div>
        <MedicationPlanTable doses={doses} />
        <p className="muted-copy">{plan?.notes ?? "当前为模拟数据，用于展示照护记录逻辑。"}</p>
      </section>

      <section className="two-column">
        <MedicationConfirmPanel
          eveningDose={eveningDose}
          careLoopStatus={careLoopStatus}
          dispatch={dispatch}
          canUseDemoAction={profile.elderId === "E001"}
        />
        <article className="panel">
          <div className="section-title">
            <span>用药完成率 / 7 日趋势</span>
            <h2>照护记录参考</h2>
          </div>
          <div className="summary-grid">
            <div><span>今日已确认</span><strong>{summary.confirmedCount}/{doses.length}</strong></div>
            <div><span>本周准时率</span><strong>{Math.round(baseline.medicationOnTimeRate * 100)}%</strong></div>
            <div><span>延迟次数</span><strong>{summary.delayedCount}</strong></div>
            <div><span>待确认次数</span><strong>{summary.pendingCount}</strong></div>
          </div>
          <TrendMiniChart
            title="近 7 日用药准时率"
            points={state.trends[profile.elderId].points.map((point) => ({
              label: point.date,
              value: Math.round(point.medicationOnTimeRate * 100),
            }))}
            unit="%"
            variant="bar"
          />
          <p className="muted-copy">当前为模拟数据，用于展示照护记录逻辑。</p>
        </article>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="section-title">
            <span>用药提醒时间线</span>
            <h2>提醒与确认记录</h2>
          </div>
          <MedicationTimeline items={timeline} />
        </article>
        <article className="panel">
          <div className="section-title">
            <span>风险关系说明</span>
            <h2>为什么用药会影响优先级</h2>
          </div>
          <p className="muted-copy">
            用药确认是照护流程的重要记录。当晚药未确认并叠加活动下降、主诉不适等信息时，
            系统会提升护工关注优先级。系统不判断疾病，也不替代专业人员。
          </p>
          <p className="muted-copy">
            当前为 Demo 模式，实际产品会按角色控制可见信息。家属端只展示温和摘要，
            护工端和机构端保留必要的处理记录。
          </p>
        </article>
      </section>

      <section className="panel">
        <div className="section-title">
          <span>页面操作</span>
          <h2>继续查看</h2>
        </div>
        <div className="button-row">
          <a className="primary-link" href={`#/elder/${profile.elderId}`}>返回状态驾驶舱</a>
          <a className="text-button" href={`#/elder/${profile.elderId}/profile`}>查看老人档案</a>
          <a className="text-button" href="#/caregiver">查看护工端</a>
          <a className="text-button" href={`#/family/${profile.elderId}`}>查看家属端</a>
        </div>
      </section>

      <MedicalDisclaimer />
      <section className="medical-disclaimer">
        {plan?.medicalDisclaimer ??
          "本系统仅用于照护风险提示，不构成医疗诊断。用药信息以机构记录和专业人员确认结果为准。"}
      </section>
    </div>
  );
};
