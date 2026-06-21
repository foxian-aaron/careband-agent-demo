import { StatusPill } from "./StatusPill";

interface DataQualityBadgeProps {
  quality: number;
}

export const DataQualityBadge = ({ quality }: DataQualityBadgeProps) => {
  const percent = Math.round(quality * 100);
  const tone = quality < 0.4 ? "muted" : quality < 0.7 ? "attention" : "stable";
  const label = quality < 0.4 ? `数据不足 ${percent}%` : `数据完整度 ${percent}%`;
  return <StatusPill label={label} tone={tone} />;
};
