import { cn } from "@/lib/utils/cn";

type Status =
  | "draft" | "sent" | "viewed" | "paid" | "partially_paid"
  | "overdue" | "cancelled" | "archived"
  | "active" | "inactive" | "churned"
  | "onboarding" | "design_phase" | "development_phase"
  | "deployment_qa" | "setup_strategy" | "active_execution"
  | "maintenance" | "completed" | "on_hold"
  | "signed" | "terminated" | "generated"
  | "closed";

const statusConfig: Record<Status, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-surface-DEFAULT text-text-muted border-surface-border" },
  sent: { label: "Sent", className: "bg-accent-muted text-accent border-accent-light" },
  viewed: { label: "Viewed", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  paid: { label: "Paid", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  partially_paid: { label: "Partial", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  overdue: { label: "Overdue", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  cancelled: { label: "Cancelled", className: "bg-surface-DEFAULT text-text-muted border-surface-border" },
  archived: { label: "Archived", className: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  active: { label: "Active", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  inactive: { label: "Inactive", className: "bg-surface-DEFAULT text-text-muted border-surface-border" },
  churned: { label: "Churned", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  onboarding: { label: "Onboarding", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  design_phase: { label: "Design", className: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  development_phase: { label: "Dev", className: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  deployment_qa: { label: "QA", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  setup_strategy: { label: "Setup", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  active_execution: { label: "Active", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  maintenance: { label: "Maintenance", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  completed: { label: "Completed", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  on_hold: { label: "On Hold", className: "bg-surface-DEFAULT text-text-muted border-surface-border" },
  signed: { label: "Signed", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  terminated: { label: "Terminated", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  generated: { label: "Generated", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  closed: { label: "Closed", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    className: "bg-surface-DEFAULT text-text-muted border-surface-border",
  };

  return (
    <span
      aria-live="polite"
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
