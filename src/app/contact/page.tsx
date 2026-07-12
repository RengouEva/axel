"use client"

import { useState } from "react"
import { Mail, Phone, MapPin, MessageSquare, Send, CheckCircle } from "lucide-react"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import { AnimatedDiv } from "@/lib/animations"

export default function ContactPage() {
  const [sent, setSent] = useState(false)

  const contacts = [
    { icon: Mail, label: "Email", value: "contact@axel.marketplace", color: "#1769F2" },
    { icon: Phone, label: "Téléphone", value: "+225 01 02 03 04 05", color: "#0B4FC8" },
    { icon: MapPin, label: "Adresse", value: "Abidjan, Côte d'Ivoire", color: "#061A4A" },
    { icon: MessageSquare, label: "Chat", value: "Disponible 24h/24", color: "#1769F2" },
  ]

  if (sent) {
    return (
      <div className="w-full min-h-screen bg-[var(--bg-primary)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-10 h-10 text-green-500" /></div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Message envoyé !</h1>
          <p className="text-[var(--text-secondary)]">Nous vous répondrons dans les plus brefs délais.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatedDiv fade slideUp className="text-center mb-12">
          <h1 className="text-4xl sm:text-4xl font-bold text-[var(--text-primary)] mb-2">Contactez-nous</h1>
          <p className="text-[var(--text-secondary)]">Notre équipe est là pour vous aider</p>
        </AnimatedDiv>

        <div className="grid lg:grid-cols-2 gap-8">
          <AnimatedDiv fade slideUp className="space-y-6">
            <div className="rounded-2xl border-2 border-[var(--border)] p-6 space-y-4">
              <h2 className="font-bold text-[var(--text-primary)]">Envoyez-nous un message</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Nom</label>
                  <Input id="contact-name" placeholder="Votre nom" />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Email</label>
                  <Input id="contact-email" placeholder="Votre email" type="email" />
                </div>
              </div>
              <div>
                <label htmlFor="contact-subject" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Sujet</label>
                <Input id="contact-subject" placeholder="Sujet" />
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Message</label>
                <textarea id="contact-message" placeholder="Votre message..." rows={5} className="w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] transition-all duration-300 focus:border-[var(--border-hover)] focus:outline-none focus:ring-4 focus:ring-[#1769F2]/10 hover:border-[var(--border-hover)]/30 resize-none" />
              </div>
              <Button fullWidth onClick={() => setSent(true)}><Send className="w-4 h-4" /> Envoyer</Button>
            </div>
          </AnimatedDiv>

          <AnimatedDiv fade slideUp delay={0.1} className="space-y-4">
            {contacts.map((c) => {
              const Icon = c.icon
              return (
                <div key={c.label} className="flex items-center gap-4 p-5 rounded-2xl border-2 border-[var(--border)] hover:border-[var(--border-hover)]/20 transition-all">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${c.color}15` }}>
                    <Icon className="w-5 h-5" style={{ color: c.color }} />
                  </div>
                  <div><p className="font-semibold text-[var(--text-primary)] text-sm">{c.label}</p><p className="text-sm text-[var(--text-secondary)]">{c.value}</p></div>
                </div>
              )
            })}
          </AnimatedDiv>
        </div>
      </div>
    </div>
  )
}
