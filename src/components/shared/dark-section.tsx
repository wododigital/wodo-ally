import { cn } from "@/lib/utils/cn";

interface DarkSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function DarkSection({ children, className }: DarkSectionProps) {
  return (
    <div
      className={cn("rounded-[24px] p-8 lg:p-10", className)}
      style={{ background: "#1d1f2e" }}
    >
      {children}
    </div>
  );
}

export function DarkLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-widest font-bold mb-4"
      style={{ color: "rgba(255,255,255,0.3)" }}>
      {children}
    </p>
  );
}

export function DarkCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn("rounded-2xl", className)}
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {children}
    </div>
  );
}

export function DarkDivider() {
  return <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} className="my-6" />;
}
