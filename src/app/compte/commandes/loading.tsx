export default function Loading() {
  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-b border-[var(--border-hover)]/30 border-t-[#1769F2] rounded-full animate-spin" />
        <p className="text-sm text-[var(--text-secondary)]">Chargement...</p>
      </div>
    </div>
  )
}
