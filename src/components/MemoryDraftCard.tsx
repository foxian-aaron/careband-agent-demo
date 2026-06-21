import type { InitialCareMemory } from "../types";
import { StatusPill } from "./StatusPill";

interface MemoryDraftCardProps {
  draft: InitialCareMemory;
}

export const MemoryDraftCard = ({ draft }: MemoryDraftCardProps) => (
  <article className="panel memory-draft-card">
    <div className="section-title">
      <span>AI 提取结果区</span>
      <h2>初始照护记忆草稿</h2>
    </div>
    <p className="muted-copy">{draft.summary}</p>
    <div className="memory-section-grid">
      <div>
        <h3>基础资料</h3>
        <p>{draft.items.find((item) => item.category === "basic_profile")?.content ?? "待补充"}</p>
      </div>
      <div>
        <h3>已知健康背景</h3>
        <p>{draft.items.find((item) => item.category === "health_background")?.content ?? "待补充"}</p>
      </div>
      <div>
        <h3>用药与提醒信息</h3>
        <p>{draft.medicationNotes.join("；") || "待补充"}</p>
      </div>
      <div>
        <h3>行动与安全风险</h3>
        <p>{draft.items.find((item) => item.category === "safety_risk")?.content ?? "待补充"}</p>
      </div>
      <div>
        <h3>沟通偏好</h3>
        <p>{draft.communicationPreferences.join("；") || "待补充"}</p>
      </div>
      <div>
        <h3>家属通知偏好</h3>
        <p>{draft.familyNotificationPreferences.join("；") || "待补充"}</p>
      </div>
      <div>
        <h3>初始观察重点</h3>
        <p>{draft.observationFocus.join("；") || "待补充"}</p>
      </div>
      <div>
        <h3>待补充问题</h3>
        <p>{draft.missingQuestions.join("；")}</p>
      </div>
    </div>
    <div className="tag-row">
      {draft.riskTags.map((tag) => (
        <StatusPill label={tag} tone="attention" key={tag} />
      ))}
    </div>
  </article>
);
