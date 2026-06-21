import type { PilotPlanStatus } from "../types";

export const mockPilotPlanStatus: PilotPlanStatus = {
  webDemo: "completed",
  contactPerson: "available",
  interview: "to_schedule",
  prototype: "planned",
  realWearableData: "planned",
  elderTrial: "not_started",
};

export const pilotInterviewQuestions = [
  "现在怎么知道老人状态不好？",
  "用药未确认怎么处理？",
  "护工最容易漏掉什么？",
  "家属需要每天通知还是异常通知？",
  "老人佩戴手环最大的阻力是什么？",
  "哪些数据不能收？",
  "什么情况下愿意让老人试戴？",
  "长者记忆初始化是否有价值？",
  "状态驾驶舱哪些信息最有用？",
  "机构是否接受先由工作人员试戴？",
];
