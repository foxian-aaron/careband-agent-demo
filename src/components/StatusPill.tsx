interface StatusPillProps {
  label: string;
  tone?: "stable" | "observation" | "attention" | "high-risk" | "urgent" | "muted";
}

export const StatusPill = ({ label, tone = "muted" }: StatusPillProps) => (
  <span className={`status-pill tone-${tone}`}>{label}</span>
);
