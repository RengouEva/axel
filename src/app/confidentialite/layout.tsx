import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
