"use client"

import { useState } from "react"
import { Mail, ArrowLeft, CheckCircle } from "lucide-react"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) setSent(true)
  }

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)] flex items-center justify-center py-20">
      <div className="w-full max-w-md mx-auto px-4">
        <Link href="/connexion" className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-link)] transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Retour à la connexion
        </Link>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Email envoyé</h1>
            <p className="text-[var(--text-secondary)] mb-6">
              Un email de réinitialisation a été envoyé à <strong>{email}</strong>. Vérifiez votre boîte de réception.
            </p>
            <Link href="/connexion">
              <Button>Retour à la connexion</Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Mot de passe oublié</h1>
            <p className="text-[var(--text-secondary)] mb-8">
              Saisissez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                icon={<Mail className="w-4 h-4" />}
                type="email"
                placeholder="Votre adresse email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={!email}>
                Envoyer le lien
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}