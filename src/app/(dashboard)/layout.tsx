import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 md:ml-[260px] min-h-screen flex flex-col">
        {/* Background wave image */}
        <div
          className="fixed top-0 right-0 bottom-0 pointer-events-none z-0"
          style={{
            left: "260px",
            backgroundImage: "url('/bg-wave.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.06,
          }}
        />

        {/* Header */}
        <Header className="relative z-20" />

        {/* Page content */}
        <main className="flex-1 relative z-10 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
