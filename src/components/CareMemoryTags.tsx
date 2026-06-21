import type { InitialCareMemory } from "../types";
import { StatusPill } from "./StatusPill";

interface CareMemoryTagsProps {
  memory?: InitialCareMemory;
}

export const CareMemoryTags = ({ memory }: CareMemoryTagsProps) => {
  if (!memory) {
    return (
      <div className="tag-row">
        <StatusPill label="初始照护记忆：未建立" tone="muted" />
        <StatusPill label="动态状态基线：建立中" tone="observation" />
      </div>
    );
  }

  return (
    <div className="care-memory-tags">
      <div className="tag-row">
        <StatusPill label="初始照护记忆：已建立" tone="stable" />
        <StatusPill label="动态状态基线：建立中" tone="observation" />
      </div>
      <div className="tag-row">
        {memory.riskTags.map((tag) => (
          <StatusPill label={tag} tone="attention" key={tag} />
        ))}
      </div>
    </div>
  );
};
