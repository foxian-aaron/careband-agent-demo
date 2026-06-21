interface FutureIntegrationBadgeProps {
  label: string;
}

export const FutureIntegrationBadge = ({ label }: FutureIntegrationBadgeProps) => (
  <span className="future-badge">{label}</span>
);
