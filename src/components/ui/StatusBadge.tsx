import { cn } from "@/lib/utils";

type Status = "not_started" | "in_progress" | "done" | "locked";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const config: Record<Status, { label: string; className: string; icon: string }> = {
  not_started: { label: "Не начато",  className: "bg-gray-100 text-text-muted", icon: "○" },
  in_progress: { label: "В процессе", className: "bg-primary-light text-primary", icon: "◐" },
  done:        { label: "Готово",      className: "bg-green-100 text-success",    icon: "✓" },
  locked:      { label: "Закрыто",    className: "bg-gray-100 text-locked",      icon: "🔒" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, className: cls, icon } = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
        cls,
        className
      )}
    >
      <span>{icon}</span>
      {label}
    </span>
  );
}
