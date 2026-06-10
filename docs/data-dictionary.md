# 数据字典

## ElderProfile

老人档案。包含 `elderId`、姓名、年龄、房间、楼层、慢病标签、风险标签、护工 ID 和家属联系人 ID。

## PersonalBaseline

个人基线。包含 7 日平均步数、平均睡眠、平均活跃时长、静息心率基线、用药准时率和基线置信度。风险引擎用它和今日数据比较。

## DailySnapshot

今日状态快照。包含心率、今日步数、活跃时长、睡眠时长、早晚药状态、佩戴时间、位置、安全区状态、跌倒检测、数据完整度和最后同步时间。

## MedicationPlan

用药计划。包含早药和晚药是否需要、提醒时间和备注。第一版用于页面解释，后续可扩展为更完整的药品计划。

## CareEvent

照护事件。包含事件 ID、老人 ID、事件类型、时间、标题、原始文本、来源和严重程度。v0.1.1 扩展了结构化字段，业务逻辑不再依赖 `title.includes(...)`：

- `eventType`：包括 `medication_reminder`、`medication_confirmed`、`voice_symptom`、`sos`、`fall_detected`、`location_alert`、`night_wakeup`、`low_activity`、`caregiver_accepted`、`caregiver_checked`、`caregiver_completed`、`system_risk_update`。
- `payload.symptomKeywords`：语音主诉识别出的关键词，如“头晕”。
- `payload.medicationName`：确认的用药项，如“晚药”。
- `payload.safeZoneStatus`：位置事件中的安全区状态。
- `payload.nightWakeupCount`：夜间离床次数。
- `payload.activityDropPercent`：活动下降比例。
- `payload.noResponseSeconds`：跌倒事件后未回应秒数。
- `payload.note`：护工处理备注。
- `payload.previousValue/currentValue`：状态变更前后的值。
- `status`：事件处理状态，`open`、`acknowledged` 或 `resolved`。
- `linkedTaskId`：事件关联的护工任务。
- `handledBy/handledAt`：处理人和处理时间。
- `confidence`：模拟识别置信度。

## RiskResult

风险引擎输出。包含风险等级、风险分、五维状态、关键原因、触发规则、建议动作、数据完整度、置信度和非医疗诊断声明。

## CareTask

护工任务。包含任务 ID、老人 ID、来源事件、优先级、标题、原因、建议动作、负责人、任务状态、创建更新时间、完成时间和护工备注。

## AgentRoleSummaries

Mock AI Agent 输出。包含护工摘要、家属摘要、机构摘要和 Decision Trace。三端文案由同一份风险结果生成，但面向不同角色。

## careLoopStatus / displayStatus

`careLoopStatus` 是护工闭环状态：无任务、待处理、处理中、已查看、晚药已确认、已完成。

`displayStatus` 是前台展示状态：例如“高风险待处理”“高风险处理中”“已查看 / 待完成记录”“已跟进 / 持续观察”。它与 `riskLevel` 分离，避免家属端在护工完成后仍只看到“高风险”。
