import { FullPageLoader } from "@/components/ui/loading-spinner"

export default function RootLoading() {
  return <div className="w-full min-h-screen bg-[var(--bg-primary)]"><FullPageLoader /></div>
}
