"use client"

import { useState } from "react"
import { UserPlus, Mail, Lock, User, Eye, EyeOff, ShoppingBag, Store } from "lucide-react"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import { AnimatedDiv } from "@/lib/animations"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [role, setRole] = useState<"client" | "seller">("client")
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const { register } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.")
      return
    }
    setPending(true)
    const err = await register(name, email, password, role)
    setPending(false)
    if (err) {
      setError(err)
    } else {
      router.push("/compte")
    }
  }

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="w-full max-w-md mx-auto px-4 py-12">
        <AnimatedDiv fade slideUp className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-axel flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)]">Inscription</h1>
          <p className="text-[var(--text-secondary)] mt-1">Créez votre compte AXEL</p>
        </AnimatedDiv>

        <AnimatedDiv fade slideUp delay={0.05}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Je suis</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("client")}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    role === "client"
                      ? "border-[var(--border-hover)] bg-[var(--text-link)]/5"
                      : "border-[var(--border)] hover:border-[var(--border-hover)]/30"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    role === "client" ? "bg-[var(--text-link)]/10 text-[var(--text-link)]" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                  }`}>
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm text-[var(--text-primary)]">Client</p>
                    <p className="text-xs text-[var(--text-secondary)]">Acheter</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("seller")}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    role === "seller"
                      ? "border-[var(--border-hover)] bg-[var(--text-link)]/5"
                      : "border-[var(--border)] hover:border-[var(--border-hover)]/30"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    role === "seller" ? "bg-[var(--text-link)]/10 text-[var(--text-link)]" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                  }`}>
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm text-[var(--text-primary)]">Vendeur</p>
                    <p className="text-xs text-[var(--text-secondary)]">Vendre</p>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="register-name" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Nom complet</label>
              <Input
                id="register-name"
                icon={<User className="w-4 h-4" />}
                placeholder="Kouamé Jean"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-[var(--bg-secondary)]"
              />
            </div>

            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Email</label>
              <Input
                id="register-email"
                icon={<Mail className="w-4 h-4" />}
                type="email"
                placeholder="vous@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[var(--bg-secondary)]"
              />
            </div>

            <div>
              <label htmlFor="register-password" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Mot de passe</label>
              <div className="relative">
                <Input
                  id="register-password"
                  icon={<Lock className="w-4 h-4" />}
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-[var(--bg-secondary)] pr-10"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="register-confirm" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Confirmer le mot de passe</label>
              <Input
                id="register-confirm"
                icon={<Lock className="w-4 h-4" />}
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="bg-[var(--bg-secondary)]"
              />
            </div>

            <Button type="submit" fullWidth size="lg" disabled={pending}>
              {pending ? "Inscription..." : "Créer mon compte"}
            </Button>

            <p className="text-center text-sm text-[var(--text-secondary)]">
              Déjà un compte ?{" "}
              <Link href="/connexion" className="text-[var(--text-link)] font-semibold hover:underline">
                Se connecter
              </Link>
            </p>
          </form>
        </AnimatedDiv>
      </div>
    </div>
  )
}
