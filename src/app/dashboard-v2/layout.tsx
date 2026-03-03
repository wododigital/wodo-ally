import { TopNavV2 } from "@/components/dashboard-v2/TopNavV2";

export const dynamic = "force-dynamic";

export default function DashboardV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: "url('/white-bg.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* White overlay to soften the gradient */}
      <div
        className="min-h-screen"
        style={{ background: "rgba(255, 255, 255, 0.55)" }}
      >
        <TopNavV2 />
        <main className="max-w-[1440px] mx-auto px-10 pt-6 pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
