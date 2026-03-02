import { cn } from "@/lib/utils/cn";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "accent" | "stat";
  padding?: "none" | "sm" | "md" | "lg";
  onClick?: () => void;
}

export function GlassCard({
  children,
  className,
  variant = "default",
  padding = "md",
  onClick,
}: GlassCardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <div
      className={cn(
        variant === "accent" ? "glass-card-accent" : "glass-card",
        paddingClasses[padding],
        onClick && "cursor-pointer transition-transform duration-200 hover:scale-[1.01]",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
