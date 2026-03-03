import { AnalyticsSubNav } from "@/components/analytics/analytics-sub-nav";

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <AnalyticsSubNav />
      {children}
    </div>
  );
}
