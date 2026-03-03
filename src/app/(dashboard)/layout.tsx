import { TopNavV2 } from "@/components/dashboard-v2/TopNavV2";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundImage: "url('/white-bg.webp')",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
      }}
    >
      <div style={{ background: "rgba(255,255,255,0.55)", minHeight: "100vh" }}>
        <TopNavV2 />
        <main className="max-w-[1440px] mx-auto px-10 pt-6 pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
