import type { RiskDimensions } from "../types";
import { dimensionLabels, dimensionTone } from "../lib/statusLabels";
import { StatusPill } from "./StatusPill";

interface FiveDimensionStatusProps {
  dimensions: RiskDimensions;
}

const items: Array<keyof RiskDimensions> = [
  "vitals",
  "activity",
  "sleep",
  "medication",
  "safety",
];

const names: Record<keyof RiskDimensions, string> = {
  vitals: "生命体征",
  activity: "活动状态",
  sleep: "睡眠状态",
  medication: "用药状态",
  safety: "安全状态",
};

export const FiveDimensionStatus = ({ dimensions }: FiveDimensionStatusProps) => (
  <section className="five-dimensions">
    {items.map((item) => (
      <article className="dimension-card" key={item}>
        <span>{names[item]}</span>
        <StatusPill
          label={dimensionLabels[dimensions[item]]}
          tone={dimensionTone(dimensions[item])}
        />
      </article>
    ))}
  </section>
);
