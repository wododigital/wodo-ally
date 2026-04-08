export default function TdsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-36 bg-black/[0.06] rounded" />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-card p-4 space-y-2">
            <div className="h-3 w-12 bg-black/[0.06] rounded" />
            <div className="h-6 w-24 bg-black/[0.06] rounded" />
          </div>
        ))}
      </div>

      <div className="glass-card p-4">
        <div className="flex gap-3">
          <div className="h-9 w-32 bg-black/[0.04] rounded-button" />
          <div className="h-9 w-36 bg-black/[0.04] rounded-button" />
          <div className="h-9 flex-1 bg-black/[0.04] rounded-button" />
        </div>
      </div>

      <div className="glass-card p-0">
        <div className="h-10 bg-black/[0.04] border-b border-black/[0.04]" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 border-b border-black/[0.03]" />
        ))}
      </div>
    </div>
  );
}
