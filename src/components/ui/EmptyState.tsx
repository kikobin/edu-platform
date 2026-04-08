interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = "📭", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-text mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-text-muted leading-relaxed max-w-xs mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}
