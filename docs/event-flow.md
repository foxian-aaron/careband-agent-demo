# 事件流说明

```mermaid
flowchart TD
  A[模拟数据 / 事件输入] --> B[读取老人档案和个人基线]
  A --> A1[用药提醒 / 用药确认事件]
  A1 --> B
  B --> C[读取用药计划和授权状态]
  C --> D[检查硬事件]
  D --> E[检查数据完整度]
  E --> F[计算日常偏离]
  F --> G[风险引擎输出 riskLevel]
  G --> H[deriveDisplayStatus 输出前台展示状态]
  H --> I[Mock Agent 生成三端摘要]
  I --> J[护工任务生成]
  I --> K[MedicationPage / CaregiverPage / FamilyPage / InstitutionPage 同步展示]
  J --> L[护工接单 / 查看 / 确认用药 / 完成处理]
  L --> M[家属端和机构端同步更新]
```

## 陈伯主线

1. 初始数据进入系统：步数 820、睡眠 4.8 小时、晚药未确认。
2. 系统读取陈伯个人基线：7 日平均步数 2150、平均睡眠 6.5 小时。
3. 规则引擎输出“需关注”。
4. 20:15 添加语音事件“我有点头晕”。
5. 规则引擎升级为“高风险”，Mock AI Agent 生成护工、家属、机构摘要。
6. 护工端生成高优先级任务。
7. 护工接单，任务进入处理中。
8. 护工标记已查看，时间线新增 caregiver_checked 事件。
9. 护工确认晚药，DailySnapshot 和 MedicationPlan 同步更新为 confirmed，并新增 medication_confirmed 事件。
10. 护工完成处理，任务状态变为 completed，并保留备注。
11. 家属端和机构端同步显示“已跟进 / 持续观察”，同时保留“今日曾出现高风险事件”的说明。
