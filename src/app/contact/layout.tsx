import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez l'équipe AXEL Marketplace. Service client disponible pour répondre à toutes vos questions.",
  openGraph: {
    title: "Contact | AXEL Marketplace",
    description: "Nous sommes là pour vous aider.",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
