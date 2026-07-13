import { FullPageLoader } from "@/components/ui/loading-spinner"

export default function Loading() {
  return <div className="w-full min-h-screen bg-[var(--bg-secondary)]"><FullPageLoader /></div>
}
