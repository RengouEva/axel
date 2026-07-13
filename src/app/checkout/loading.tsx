import { FullPageLoader } from "@/components/ui/loading-spinner"

export default function CheckoutLoading() {
  return <div className="w-full min-h-screen bg-[var(--bg-primary)]"><FullPageLoader text="Préparation du checkout..." /></div>
}
