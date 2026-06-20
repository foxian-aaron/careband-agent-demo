interface EmptyStateProps {
  title: string;
  description?: string;
}

export const EmptyState = ({ title, description }: EmptyStateProps) => (
  <div className="empty-state">
    <strong>{title}</strong>
    {description ? <p>{description}</p> : null}
  </div>
);
