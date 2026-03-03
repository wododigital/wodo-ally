export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#fd7e14", borderTopColor: "transparent" }}
        />
        <p className="text-xs text-text-muted">Loading...</p>
      </div>
    </div>
  );
}
