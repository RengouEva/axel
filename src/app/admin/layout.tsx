import type { Metadata } from "next"
import AdminShell from "./admin-shell"

export const metadata: Metadata = {
  title: { default: "Administration AXEL", template: "%s | AXEL Admin" },
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
