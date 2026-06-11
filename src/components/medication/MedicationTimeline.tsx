import type { MedicationTimelineItem } from "../../lib/medicationSelectors";

interface MedicationTimelineProps {
  items: MedicationTimelineItem[];
}

export const MedicationTimeline = ({ items }: MedicationTimelineProps) => (
  <ol className="timeline medication-timeline">
    {items.map((item) => (
      <li key={`${item.time}-${item.title}`}>
        <time>{item.time}</time>
        <div className={`timeline-status timeline-status--${item.status}`}>
          <strong>{item.title}</strong>
          <p>{item.description}</p>
          <span>{item.source}</span>
        </div>
      </li>
    ))}
  </ol>
);
