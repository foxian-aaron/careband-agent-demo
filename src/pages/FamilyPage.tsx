import { FamilyPeaceCard } from "../components/FamilyPeaceCard";
import { MedicalDisclaimer } from "../components/MedicalDisclaimer";
import { getEventsForElder, getRiskForElder, getTaskForElder, useDemo } from "../store/demoStore";

interface FamilyPageProps {
  elderId: string;
}

const buildExceptionText = (
  hasSymptom: boolean,
  taskStatus: string | undefined,
  operationalState: string,
) => {
  if (operationalState === "follow_up" || taskStatus === "completed") {
    return "护工已查看陈伯，晚药已确认，目前陈伯在房间休息，系统将继续观察明早活动与睡眠情况。";
  }
  if (taskStatus === "in_progress") {
    return "护工已接单，正在查看陈伯情况。";
  }
  if (hasSymptom) {
    return "今晚 20:15，陈伯反馈有点头晕。系统发现他今天活动量较平时偏低，晚药尚未确认。护工已收到提醒。";
  }
  return "陈伯今日活动量较平时偏低，晚药尚未确认，护工端已收到关注提醒。";
};

export const FamilyPage = ({ elderId }: FamilyPageProps) => {
  const { state } = useDemo();
  const profile = state.profiles[elderId] ?? state.profiles.E001;
  const snapshot = state.snapshots[profile.elderId];
  const risk = getRiskForElder(state, profile.elderId);
  const task = getTaskForElder(state, profile.elderId);
  const events = getEventsForElder(state, profile.elderId);
  const operationalState = state.operationalStates[profile.elderId] ?? "normal";
  const hasSymptom = events.some((event) => event.eventType === "voice_symptom");

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
        task={task}
        operationalState={operationalState}
        exceptionText={buildExceptionText(hasSymptom, task?.status, operationalState)}
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
      </section>
      <MedicalDisclaimer />
    </div>
  );
};
