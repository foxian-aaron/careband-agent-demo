import { MockNoticeBanner } from "../components/MockNoticeBanner";
import { StatusPill } from "../components/StatusPill";
import { pilotInterviewQuestions } from "../data/mockPilotPlan";
import { useDemo } from "../store/demoStore";

const progress = [
  { key: "webDemo", label: "Web Demo", done: "已完成" },
  { key: "contactPerson", label: "对接人", done: "已有" },
  { key: "interview", label: "访谈", done: "待约" },
  { key: "prototype", label: "原型机", done: "计划中" },
  { key: "realWearableData", label: "真实穿戴数据", done: "计划中" },
  { key: "elderTrial", label: "老人试戴", done: "未开始" },
];

const levels = [
  ["Level 1", "访谈", "了解机构真实流程和不可收集的数据边界。"],
  ["Level 2", "内部 Demo 展示", "仅用模拟数据展示闭环，不进入真实老人数据。"],
  ["Level 3", "工作人员 / 团队成员试戴", "封闭测试硬件佩戴、按钮、同步和数据完整度。"],
  ["Level 4", "老人试戴，需授权", "获得明确授权后，才进入真实场景小范围验证。"],
];

export const PilotPlanPage = () => {
  const { state } = useDemo();

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span>试点计划 / Pilot Plan</span>
          <h1>菩提禅院 / 老人院场景验证进度</h1>
          <p>项目当前阶段先做访谈和 Demo 展示，不直接进行老人试戴。</p>
        </div>
      </header>
      <MockNoticeBanner>当前为试点路径展示，不代表已经采集真实老人数据或真实穿戴数据。</MockNoticeBanner>
      <section className="stats-grid pilot-progress">
        {progress.map((item) => (
          <article key={item.key}>
            <span>{item.label}</span>
            <strong>{item.done}</strong>
            <p>{JSON.stringify(state.pilotPlanStatus[item.key as keyof typeof state.pilotPlanStatus]).replace(/"/g, "")}</p>
          </article>
        ))}
      </section>
      <section className="panel">
        <div className="section-title">
          <span>四级试点路径</span>
          <h2>从访谈到授权试戴</h2>
        </div>
        <div className="pilot-levels">
          {levels.map(([level, title, description]) => (
            <article key={level}>
              <StatusPill label={level} tone="observation" />
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="two-column">
        <article className="panel">
          <div className="section-title">
            <span>访谈问题列表</span>
            <h2>机构访谈准备</h2>
          </div>
          <ol className="question-list">
            {pilotInterviewQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
        </article>
        <article className="panel">
          <div className="section-title">
            <span>试点边界</span>
            <h2>先封闭测试，再授权试戴</h2>
          </div>
          <ul className="insight-list">
            <li>不做医疗诊断。</li>
            <li>不收集无关隐私。</li>
            <li>不展示精确轨迹。</li>
            <li>数据不足明确标记。</li>
            <li>高风险事件人工确认。</li>
          </ul>
        </article>
      </section>
    </div>
  );
};
