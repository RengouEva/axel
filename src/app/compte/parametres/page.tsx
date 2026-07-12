"use client"

import { ArrowLeft, Bell, Shield, Globe, Lock, Moon } from "lucide-react"
import Button from "@/components/ui/button"
import { AnimatedDiv } from "@/lib/animations"
import Link from "next/link"
import { useState } from "react"

const settings = [
  { icon: Bell, label: "Notifications", desc: "Gérez vos préférences de notifications" },
  { icon: Shield, label: "Sécurité", desc: "Mot de passe et authentification" },
  { icon: Globe, label: "Langue", desc: "Français (par défaut)" },
  { icon: Lock, label: "Confidentialité", desc: "Gérez vos données personnelles" },
]

export default function SettingsPage() {
  const [notifEnabled, setNotifEnabled] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/compte" className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors"><ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" /></Link>
          <h1 className="text-4xl font-bold text-[var(--text-primary)]">Paramètres</h1>
        </div>

        <div className="space-y-4">
          {settings.map((s) => {
            const Icon = s.icon
            return (
              <AnimatedDiv key={s.label} fade slideUp className="flex items-center gap-4 p-4 rounded-2xl border-2 border-[var(--border)] hover:border-[var(--border-hover)]/20 transition-all cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center"><Icon className="w-5 h-5 text-[var(--text-link)]" /></div>
                <div className="flex-1"><p className="font-semibold text-[var(--text-primary)]">{s.label}</p><p className="text-xs text-[var(--text-secondary)]">{s.desc}</p></div>
              </AnimatedDiv>
            )
          })}

          <AnimatedDiv fade slideUp className="flex items-center justify-between p-4 rounded-2xl border-2 border-[var(--border)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center"><Bell className="w-5 h-5 text-[var(--text-link)]" /></div>
              <div><p className="font-semibold text-[var(--text-primary)]">Notifications push</p><p className="text-xs text-[var(--text-secondary)]">Recevoir des alertes</p></div>
            </div>
            <button onClick={() => setNotifEnabled(!notifEnabled)} className={`w-12 h-6 rounded-full transition-colors ${notifEnabled ? "bg-[var(--text-link)]" : "bg-[var(--border)]"}`}>
              <div className={`w-5 h-5 rounded-full bg-[var(--bg-primary)] shadow-md transition-transform ${notifEnabled ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </AnimatedDiv>

          <AnimatedDiv fade slideUp className="flex items-center justify-between p-4 rounded-2xl border-2 border-[var(--border)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center"><Moon className="w-5 h-5 text-[var(--text-link)]" /></div>
              <div><p className="font-semibold text-[var(--text-primary)]">Mode sombre</p><p className="text-xs text-[var(--text-secondary)]">Activer le thème sombre</p></div>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className={`w-12 h-6 rounded-full transition-colors ${darkMode ? "bg-[var(--text-link)]" : "bg-[var(--border)]"}`}>
              <div className={`w-5 h-5 rounded-full bg-[var(--bg-primary)] shadow-md transition-transform ${darkMode ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </AnimatedDiv>
        </div>
      </div>
    </div>
  )
}
