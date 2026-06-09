import { MedicalDisclaimer } from "../components/MedicalDisclaimer";

export const DocsPage = () => (
  <div className="page docs-page">
    <header className="page-header">
      <div>
        <span>文档页</span>
        <h1>智护环 CareBand Agent Demo 说明</h1>
        <p>评委和团队成员可在这里快速理解 Demo 剧本、数据、规则和后续扩展。</p>
      </div>
    </header>

    <section className="panel docs-section">
      <h2>Demo 剧本</h2>
      <ol>
        <li>从机构端查看 5 位长者风险热力图，说明陈伯初始为“需关注”。</li>
        <li>进入陈伯驾驶舱，展示个人基线、今日偏离和 Decision Trace。</li>
        <li>在 Demo 控制台触发“我有点头晕”语音事件。</li>
        <li>切回护工端，查看高优先级任务“陈伯需要立即查看”。</li>
        <li>切到家属端，展示温和安心卡和“护工已收到提醒”。</li>
        <li>护工接单、确认晚药、完成处理。</li>
        <li>回到机构端和家属端，展示“已跟进 / 持续观察”。</li>
      </ol>
    </section>

    <section className="panel docs-section">
      <h2>数据结构说明</h2>
      <p>
        Demo 使用 ElderProfile、PersonalBaseline、DailySnapshot、MedicationPlan、
        CareEvent、RiskResult、CareTask 和 AgentRoleSummaries 组织数据。风险结果由
        riskEngine 动态计算，不在页面中写死。
      </p>
    </section>

    <section className="panel docs-section">
      <h2>风险规则说明</h2>
      <p>
        规则引擎按数据完整度、个人步数基线、睡眠基线、晚药确认、主动症状反馈、
        慢病标签、SOS 和跌倒事件计算风险分，并输出可解释原因和建议动作。
      </p>
    </section>

    <section className="panel docs-section">
      <h2>事件流说明</h2>
      <pre>{`模拟健康数据进入系统
  ↓
读取老人档案与个人基线
  ↓
规则引擎计算偏离程度
  ↓
生成风险等级
  ↓
Mock AI Agent 生成三端摘要
  ↓
护工端生成任务
  ↓
家属端显示安心卡
  ↓
机构端更新热力图
  ↓
护工处理
  ↓
三端同步更新`}</pre>
    </section>

    <section className="panel docs-section">
      <h2>页面说明</h2>
      <p>
        机构端负责群体风险排序，护工端负责待办处理，长者驾驶舱负责解释状态变化，
        家属端负责温和同步，Demo 控制台负责路演推进。
      </p>
    </section>

    <section className="panel docs-section">
      <h2>后续接入 QwenPaw / 硬件</h2>
      <p>
        后续可将 riskEngine 输出、事件摘要和老人基线发送给 QwenPaw 生成真实多角色摘要；
        硬件侧可将手环心率、步数、睡眠、佩戴时间、位置和 SOS 事件映射为 DailySnapshot
        与 CareEvent。
      </p>
    </section>

    <MedicalDisclaimer />
  </div>
);
