# 智护环 CareBand Agent Demo v0.1.3

智护环 CareBand Agent 是一个面向长者照护场景的 AI Agent 状态观察系统。v0.1.3 继续保持 Web Demo + 模拟数据 + 规则引擎 + Mock AI Agent，不接真实硬件、医院系统、数据库或真实大模型 API。

长者档案 + 今日状态 + 个人基线 + 照护事件 → 规则引擎判断风险 → Mock AI Agent 生成三端摘要 → 护工处理任务 → 家属端和机构端同步更新。

## Current Public Demo Status

Original demo remains deployed at the GitHub Pages root:

- https://foxian-aaron.github.io/careband-agent-demo/#/institution
- https://foxian-aaron.github.io/careband-agent-demo/#/elder/E001/profile
- https://foxian-aaron.github.io/careband-agent-demo/#/medication/E001

CareBand Agent v0.2 is deployed as a separate static preview under `/v0.2/`:

- https://foxian-aaron.github.io/careband-agent-demo/v0.2/#/institution
- https://foxian-aaron.github.io/careband-agent-demo/v0.2/#/elder/TEST001
- https://foxian-aaron.github.io/careband-agent-demo/v0.2/#/elder/E001/profile
- https://foxian-aaron.github.io/careband-agent-demo/v0.2/#/medication/E001

GitHub Pages is static only. The v0.2 public preview uses mock fallback data; the full Express + SQLite + Agent backend must run locally or on a Node-compatible host.

## 技术栈

- React + TypeScript + Vite
- 普通 CSS
- React `useReducer` + `localStorage`
- Hash Router
- 自定义 SVG / CSS 图表
- Vitest
- 本地 TypeScript mock data

## 如何运行

```bash
npm install
npm run dev
```

打开终端提示的本地地址，默认进入 `#/institution`。

如果这台电脑没有系统 `npm`，可以直接运行项目自带的 PowerShell 启动脚本：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-demo.ps1
```

脚本会优先使用本机 `node`，没有系统 npm 时使用项目内 npm CLI；缺少依赖时会安装依赖，然后启动 Demo。

## 如何测试和构建

```bash
npm test
npm run build
```

## Demo 演示步骤

1. 打开 `#/institution`，展示 5 位老人风险热力图，以及“当前未闭环高风险 / 今日曾高风险 / 已跟进高风险 / 待处理任务 / 平均数据完整度”五个机构指标。
2. 点击陈伯进入 `#/elder/E001`，说明陈伯初始前台展示状态为“需关注”，今日风险等级为 `attention`。
3. 点击“查看老人档案”进入 `#/elder/E001/profile`，说明系统结合基础档案、照护标签、个人基线、照护团队和授权状态。
4. 点击“查看用药计划”进入 `#/medication/E001`，说明陈伯早药已确认、晚药未确认，用药确认是照护闭环的一部分。
5. 回到驾驶舱，在 Decision Trace 中展示输入数据、个人基线比较、触发规则、风险输出和三端摘要。
6. 打开 `#/demo-control`，点击“触发陈伯头晕语音事件”。
7. 陈伯升级为“高风险待处理”，护工端生成高优先级任务“陈伯需要立即查看”。
8. 在 `#/caregiver` 或控制台依次点击“护工接单”、“标记已查看”。
9. 在 `#/medication/E001` 或护工端点击“确认晚药”，晚药状态同步到驾驶舱、护工端、家属端和机构端。
10. 点击“完成护工处理”，写入护工备注。
11. 回到 `#/family/E001`，家属端主标题变为“陈伯今日状态：已跟进 / 持续观察”。
12. 回到 `#/institution`，机构端显示陈伯前台状态已跟进，同时保留“今日曾出现高风险事件”的说明；此时“当前未闭环高风险”为 0，“今日曾高风险”为 1，“已跟进高风险”为 1。

## 页面路径

- `#/institution`：机构端风险热力图
- `#/caregiver`：护工端待办处理
- `#/elder/E001`：陈伯状态驾驶舱
- `#/elder/E001/profile`：老人档案页
- `#/medication/E001`：用药计划 / 用药确认页
- `#/family/E001`：家属端安心卡
- `#/demo-control`：路演控制台
- `#/docs`：项目说明页

## 数据说明

Demo 包含 5 位老人：陈伯、李婆婆、黄叔、梁婆婆、吴伯。每位老人包含档案、档案详情、照护团队、授权状态、个人基线、今日快照、用药计划、照护事件和 7 日趋势。风险结果不写死在页面中，而是由 `src/lib/riskEngine.ts` 动态计算。

## v0.1.3 更新说明

- 新增老人档案页 `#/elder/E001/profile`，展示基础资料、慢病标签、风险标签、个人基线、照护团队、授权状态和今日风险摘要。
- 新增用药计划 / 用药确认页 `#/medication/E001`，展示今日早药和晚药计划、提醒时间线、确认记录和风险关系说明。
- “确认晚药”与现有 Demo 状态联动：更新 `DailySnapshot.medicationEvening`、`MedicationPlan.doses` 和 `CareEvent`，并同步到护工端、家属端、机构端和 Demo 控制台。
- 新增 `MedicationPlan`、`MedicationDose`、`ContactPerson`、`ConsentStatus`、`ElderProfileDetail` 等模拟数据结构。
- 所有数据仍为模拟数据，不接真实后端、真实硬件、真实医疗系统或真实模型 API。

## 风险规则说明

核心规则包括：

- SOS、跌倒未回应、离开安全区域、严重主诉等硬事件优先于数据完整度。
- 没有硬事件且数据完整度低于 40% 时输出“数据不足”。
- 今日步数低于本人 7 日平均 50% 时，活动状态为“明显下降”。
- 睡眠低于本人基线 1.5 小时以上时，标记“低于基线”。
- 晚药未确认会提升风险分。
- 主动反馈“头晕、不舒服、胸闷”等关键词会提升优先级。
- 慢病标签与主诉不适组合时提高关注等级。
- 活动明显下降 + 晚药未确认 + 主诉不适时，至少为“高风险”。
- SOS 直接进入“紧急”。

## riskLevel 与 displayStatus

v0.1.1 新增 `careLoopStatus` 和 `displayStatus`：

- `riskLevel`：规则引擎输出的“今日风险判断”，用于审计和机构管理，例如陈伯触发头晕后仍保留 `high_risk` 作为今日历史风险。
- `careLoopStatus`：护工处理闭环状态，包括无任务、待处理、处理中、已查看、晚药已确认、已完成。
- `displayStatus`：前台展示状态，面向家属、护工和机构。例如高风险任务完成后，前台展示为“已跟进 / 持续观察”，避免家属端继续只显示“高风险”。

这三个状态分层后，Demo 能同时表达“今天曾经出现高风险”和“目前已经有人跟进”。

## 机构端统计指标

机构端顶部统计已拆分为：

- 当前未闭环高风险：仍需机构关注的高风险或紧急个案。
- 今日曾高风险：今日曾触发高风险或紧急状态，用于复盘和审计。
- 已跟进高风险：今日高风险中已完成护工处理并进入持续观察。
- 待处理任务：尚未接单的任务，只统计 `pending`。
- 平均数据完整度：所有长者今日数据完整度的平均百分比。

陈伯完成护工处理后，`riskLevel` 仍保留“高风险”用于今日复盘；但 `displayStatus / careLoopStatus` 表示当前已闭环，所以机构端“当前未闭环高风险”应变为 0，“已跟进高风险”应变为 1。

## Mock QwenPaw Agent IO

陈伯驾驶舱新增 Mock QwenPaw Agent 输入 / 输出面板。它展示结构化 request：老人档案、个人基线、今日快照、事件和 RiskResult；同时展示 Mock response：护工摘要、家属摘要、机构摘要、建议动作和医疗边界声明。

当前版本不发送真实网络请求、不需要 API Key。后续接入 QwenPaw 时，可复用这份结构化 request，让真实 Agent 生成多角色摘要。

## 后续接入 QwenPaw

`src/lib/qwenpawAdapter.ts` 已保留 AgentRequest、AgentResponse 和 Adapter 接口。后续可以把老人档案、今日快照、事件、RiskResult 和 Decision Trace 发送给 QwenPaw，由真实模型生成更自然的护工、家属和机构摘要。

## 后续接入硬件

硬件侧计划通过网上购入可接入 AI / IoT 的原型传感器模块，搭建手环式原型或 IoT 传感器节点。原型传感器可以把心率趋势、步数、睡眠参考、佩戴时间、安全区状态、SOS 按钮和网页 / 手机语音输入映射为 `DailySnapshot` 与 `CareEvent`。第一版风险引擎已经按结构化数据设计，后续只需替换数据入口。

## 医疗边界声明

本系统仅用于照护风险提示，不构成医疗诊断。如出现持续不适或紧急情况，请由照护人员或专业医疗人员判断处理。
