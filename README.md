# 智护环 CareBand Agent Demo v0.1

智护环 CareBand Agent 是一个面向长者照护场景的 AI Agent 状态观察系统。第一版 Demo 不接真实硬件、医院系统、数据库或大模型 API，而是用本地模拟数据跑通核心闭环：

长者档案 + 今日状态 + 个人基线 + 照护事件 → 规则引擎判断风险 → Mock AI Agent 生成三端摘要 → 护工处理任务 → 家属端和机构端同步更新。

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

1. 打开 `#/institution`，展示 5 位老人风险热力图。
2. 点击陈伯进入 `#/elder/E001`，说明陈伯初始为“需关注”。
3. 打开 `#/demo-control`，点击“触发陈伯头晕语音事件”。
4. 进入 `#/caregiver`，展示高优先级任务“陈伯需要立即查看”。
5. 进入 `#/family/E001`，展示家属端温和安心卡。
6. 回到 Demo 控制台或护工端，依次点击“护工接单”、“确认晚药”、“完成护工处理”。
7. 回到机构端和家属端，展示“已跟进 / 持续观察”的同步更新。

## 页面路径

- `#/institution`：机构端风险热力图
- `#/caregiver`：护工端待办处理
- `#/elder/E001`：陈伯状态驾驶舱
- `#/family/E001`：家属端安心卡
- `#/demo-control`：路演控制台
- `#/docs`：项目说明页

## 数据说明

Demo 包含 5 位老人：陈伯、李婆婆、黄叔、梁婆婆、吴伯。每位老人包含档案、个人基线、今日快照、用药计划、照护事件和 7 日趋势。风险结果不写死在页面中，而是由 `src/lib/riskEngine.ts` 动态计算。

## 风险规则说明

核心规则包括：

- 数据完整度低于 40% 时输出“数据不足”。
- 今日步数低于本人 7 日平均 50% 时，活动状态为“明显下降”。
- 睡眠低于本人基线 1.5 小时以上时，标记“低于基线”。
- 晚药未确认会提升风险分。
- 主动反馈“头晕、不舒服、胸闷”等关键词会提升优先级。
- 慢病标签与主诉不适组合时提高关注等级。
- 活动明显下降 + 晚药未确认 + 主诉不适时，至少为“高风险”。
- SOS 直接进入“紧急”。

## 后续接入 QwenPaw

`src/lib/qwenpawAdapter.ts` 已保留 AgentRequest、AgentResponse 和 Adapter 接口。后续可以把老人档案、今日快照、事件、RiskResult 和 Decision Trace 发送给 QwenPaw，由真实模型生成更自然的护工、家属和机构摘要。

## 后续接入硬件

硬件侧可将手环或智能眼镜采集到的心率、步数、睡眠、佩戴时间、位置、安全区状态、SOS 和语音事件映射为 `DailySnapshot` 与 `CareEvent`。第一版风险引擎已经按结构化数据设计，后续只需替换数据入口。

## 医疗边界声明

本系统仅用于照护风险提示，不构成医疗诊断。如出现持续不适或紧急情况，请由照护人员或专业医疗人员判断处理。
