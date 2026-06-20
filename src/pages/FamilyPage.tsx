import { FamilyPeaceCard } from "../components/FamilyPeaceCard";
import { MedicalDisclaimer } from "../components/MedicalDisclaimer";
import { UnknownElderState } from "../components/UnknownElderState";
import { deriveCareLoopStatus, deriveDisplayStatus } from "../lib/displayStatus";
import { getElderViewModel } from "../lib/elderView";
import { buildFamilyStatusMessage } from "../lib/familyCopy";
import {
  getActiveTaskForElder,
  getEventsForElder,
  getRiskForElder,
  useDemo,
} from "../store/demoStore";

interface FamilyPageProps {
  elderId: string;
}

export const FamilyPage = ({ elderId }: FamilyPageProps) => {
  const { state } = useDemo();
  const viewModel = getElderViewModel(state, elderId);
  if (!viewModel.found) return <UnknownElderState elderId={elderId} />;
  const { profile } = viewModel;
  const snapshot = state.snapshots[profile.elderId];
  const risk = getRiskForElder(state, profile.elderId);
  const task = getActiveTaskForElder(state, profile.elderId);
  const events = getEventsForElder(state, profile.elderId);
  const careLoopStatus = deriveCareLoopStatus(profile.elderId, state.tasks, events);
  const displayStatus = deriveDisplayStatus(risk, careLoopStatus);
  const exceptionText = buildFamilyStatusMessage(
    profile,
    risk,
    displayStatus,
    snapshot,
    events,
    task,
    careLoopStatus,
  );

  return (
    <div className="page family-page">
      <header className="page-header">
        <div>
          <span>家属端</span>
          <h1>{profile.name}今日安心卡</h1>
          <p>给家属看得懂、不过度制造焦虑的照护状态摘要。</p>
        </div>
      </header>
      <FamilyPeaceCard
        profile={profile}
        snapshot={snapshot}
        risk={risk}
        displayStatus={displayStatus}
        careLoopStatus={careLoopStatus}
        task={task}
        exceptionText={exceptionText}
      />
      <section className="panel gentle-summary">
        <div className="section-title">
          <span>温和说明</span>
          <h2>家属可见摘要</h2>
        </div>
        <p>
          系统会把复杂的步数、睡眠、用药和事件判断转成照护状态，不展示复杂医学指标。
          如有持续不适或紧急情况，将由照护人员或专业医疗人员判断处理。
        </p>
        <div className="button-row page-link-row">
          <a className="text-button" href={`#/medication/${profile.elderId}`}>
            查看今日用药状态
          </a>
        </div>
      </section>
      <MedicalDisclaimer />
    </div>
  );
};
