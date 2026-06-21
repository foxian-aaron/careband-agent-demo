import type { WearableDataSource } from "../types";
import { StatusPill } from "./StatusPill";

interface WearableDataSourceBadgeProps {
  source?: WearableDataSource;
}

export const WearableDataSourceBadge = ({ source = "Mock Data" }: WearableDataSourceBadgeProps) => {
  const future = ["Apple Health", "Android Health Connect", "Fitbit", "Zepp / Amazfit"].includes(
    source,
  );
  return (
    <StatusPill
      label={`${source}${future ? "（未来接入）" : "（模拟）"}`}
      tone={future ? "observation" : "stable"}
    />
  );
};
