"use client"

import { FileText, Globe, Plus, Edit3, Eye } from "lucide-react"

interface CMSPage {
  id: number
  title: string
  slug: string
  status: "published" | "draft"
  updatedAt: string
}

const mockPages: CMSPage[] = [
  { id: 1, title: "Accueil", slug: "/", status: "published", updatedAt: "2025-06-15" },
  { id: 2, title: "À propos", slug: "/a-propos", status: "published", updatedAt: "2025-05-20" },
  { id: 3, title: "CGV", slug: "/cgv", status: "published", updatedAt: "2025-04-10" },
  { id: 4, title: "Politique de confidentialité", slug: "/confidentialite", status: "published", updatedAt: "2025-04-10" },
  { id: 5, title: "Contact", slug: "/contact", status: "published", updatedAt: "2025-06-01" },
  { id: 6, title: "FAQ", slug: "/faq", status: "draft", updatedAt: "2025-03-22" },
]

export default function AdminCMSPage() {
  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">CMS</h1>
          <p className="text-[var(--text-secondary)] text-sm">Gestion des pages du site</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--text-link)] text-white text-sm font-semibold hover:bg-[#0B4FC8] transition-colors">
          <Plus className="w-4 h-4" /> Nouvelle page
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockPages.map((page) => (
          <div key={page.id} className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)]/30 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--text-link)]/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[var(--text-link)]" />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"><Edit3 className="w-3.5 h-3.5" /></button>
                <button className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"><Eye className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <p className="text-sm font-semibold text-white mb-1">{page.title}</p>
            <div className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] mb-3">
              <Globe className="w-3 h-3" /> {page.slug}
            </div>
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                page.status === "published"
                  ? "text-green-500 bg-green-500/10"
                  : "text-amber-500 bg-amber-500/10"
              }`}>
                {page.status === "published" ? "Publié" : "Brouillon"}
              </span>
              <span className="text-[10px] text-[var(--text-secondary)]">{new Date(page.updatedAt).toLocaleDateString("fr-FR")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
