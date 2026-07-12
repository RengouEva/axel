"use client"

import { ArrowLeft, User, Camera } from "lucide-react"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import { AnimatedDiv } from "@/lib/animations"
import Link from "next/link"

export default function ProfilePage() {
  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/compte" className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors"><ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" /></Link>
          <h1 className="text-4xl font-bold text-[var(--text-primary)]">Mon profil</h1>
        </div>

        <AnimatedDiv fade slideUp className="rounded-2xl border-2 border-[var(--border)] p-8 space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl gradient-axel flex items-center justify-center text-white text-4xl font-bold">K</div>
              <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-[var(--bg-primary)] border-2 border-[var(--border)] flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors"><Camera className="w-4 h-4 text-[var(--text-secondary)]" /></button>
            </div>
            <div><h2 className="text-xl font-bold text-[var(--text-primary)]">Kouamé Jean</h2><p className="text-sm text-[var(--text-secondary)]">Membre depuis Juin 2026</p></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input placeholder="Prénom" defaultValue="Kouamé" />
            <Input placeholder="Nom" defaultValue="Jean" />
            <Input placeholder="Email" type="email" defaultValue="kouame.jean@email.com" />
            <Input placeholder="Téléphone" defaultValue="+225 01 02 03 04 05" />
          </div>
          <div className="flex gap-3">
            <Button>Enregistrer</Button>
            <Button variant="outline">Annuler</Button>
          </div>
        </AnimatedDiv>
      </div>
    </div>
  )
}
