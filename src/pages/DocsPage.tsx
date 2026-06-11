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
        <li>打开老人档案页，说明系统结合长期档案、照护团队和授权状态。</li>
        <li>打开用药计划页，说明早药已确认、晚药未确认如何进入风险判断。</li>
        <li>在 Demo 控制台触发“我有点头晕”语音事件。</li>
        <li>切回护工端，查看高优先级任务“陈伯需要立即查看”。</li>
        <li>切到家属端，展示温和安心卡和“护工已收到提醒”。</li>
        <li>护工接单、标记已查看、确认晚药、完成处理。</li>
        <li>回到机构端和家属端，展示“已跟进 / 持续观察”，同时保留今日曾出现高风险事件的说明。</li>
      </ol>
    </section>

    <section className="panel docs-section">
      <h2>数据结构说明</h2>
      <p>
        Demo 使用 ElderProfile、ElderProfileDetail、ConsentStatus、ContactPerson、
        PersonalBaseline、DailySnapshot、MedicationPlan、MedicationDose、CareEvent、
        RiskResult、CareTask 和 AgentRoleSummaries 组织数据。v0.1.3 新增老人档案页和
        用药计划页，并保持 careLoopStatus / displayStatus 与 riskLevel 分层。
      </p>
    </section>

    <section className="panel docs-section">
      <h2>风险规则说明</h2>
      <p>
        规则引擎先检查 SOS、跌倒、离开安全区和严重主诉等硬事件；没有硬事件时再判断
        数据完整度；之后按个人步数基线、睡眠基线、晚药确认、主动症状反馈和慢病标签
        计算日常偏离，并输出可解释原因和建议动作。
      </p>
    </section>

    <section className="panel docs-section">
      <h2>事件流说明</h2>
      <pre>{`模拟数据 / 事件输入
  ↓
读取老人档案、用药计划和个人基线
  ↓
用药提醒 / 用药确认事件写入 CareEvent
  ↓
检查硬事件
  ↓
检查数据完整度
  ↓
计算日常偏离
  ↓
风险引擎输出 riskLevel
  ↓
deriveDisplayStatus 输出前台展示状态
  ↓
Mock AI Agent 生成三端摘要
  ↓
护工端生成任务
  ↓
家属端显示安心卡
  ↓
机构端更新热力图
  ↓
护工接单 / 查看 / 确认用药 / 完成处理
  ↓
三端同步更新`}</pre>
    </section>

    <section className="panel docs-section">
      <h2>页面说明</h2>
      <p>
        机构端负责群体风险排序，护工端负责待办处理，长者驾驶舱负责解释状态变化，
        老人档案页展示长期档案和授权状态，用药计划页展示提醒与确认记录，
        家属端负责温和同步，Demo 控制台负责路演推进。
      </p>
    </section>

    <section className="panel docs-section">
      <h2>后续接入 QwenPaw / 硬件</h2>
      <p>
        陈伯驾驶舱已加入 Mock QwenPaw Agent IO 面板。后续可将 riskEngine 输出、事件摘要和老人基线发送给 QwenPaw 生成真实多角色摘要；
        硬件侧计划通过原型传感器模块或手环式原型，将心率趋势、步数、睡眠参考、
        佩戴时间、安全区状态和 SOS 事件映射为 DailySnapshot 与 CareEvent。
      </p>
    </section>

    <MedicalDisclaimer />
  </div>
);
