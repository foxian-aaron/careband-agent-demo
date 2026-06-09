import type { CareEvent } from "../types";
import { byTimestampAsc, formatClock } from "../lib/dateUtils";
import { riskLabels } from "../lib/statusLabels";
import { EmptyState } from "./EmptyState";

interface TimelineProps {
  events: CareEvent[];
  compact?: boolean;
}

export const Timeline = ({ events, compact = false }: TimelineProps) => {
  const sorted = [...events].sort(byTimestampAsc);
  if (sorted.length === 0) {
    return <EmptyState title="暂无事件记录" description="当前筛选范围内没有照护事件。" />;
  }

  return (
    <ol className={`timeline ${compact ? "timeline--compact" : ""}`}>
      {sorted.map((event) => (
        <li key={event.eventId}>
          <time>{formatClock(event.timestamp)}</time>
          <div>
            <strong>{event.title}</strong>
            {event.rawText ? <p>原始反馈：{event.rawText}</p> : null}
            {event.severity ? <span>{riskLabels[event.severity]}</span> : null}
          </div>
        </li>
      ))}
    </ol>
  );
};
