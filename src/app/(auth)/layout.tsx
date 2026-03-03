export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: "url('/white-bg.webp')",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
      }}
    >
      <div
        className="absolute inset-0 z-0"
        style={{ background: "rgba(255,255,255,0.55)" }}
      />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
