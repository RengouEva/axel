"use client"

import { useState } from "react"
import toast from "react-hot-toast"
import { LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import { AnimatedDiv } from "@/lib/animations"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setPending(true)
    const err = await login(email, password)
    setPending(false)
    if (err) {
      setError(err)
    } else {
      toast.success("Connexion réussie")
      const savedUser = JSON.parse(localStorage.getItem("axel-user") || "null")
      const role = savedUser?.role
      if (role === "admin") router.push("/admin")
      else if (role === "seller") router.push("/vendeur")
      else router.push("/compte")
    }
  }

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="w-full max-w-md mx-auto px-4 py-12">
        <AnimatedDiv fade slideUp className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-axel flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)]">Connexion</h1>
          <p className="text-[var(--text-secondary)] mt-1">Connectez-vous à votre compte AXEL</p>
        </AnimatedDiv>

        <AnimatedDiv fade slideUp delay={0.05}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium">{error}</div>
            )}

            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Email</label>
              <Input
                id="login-email"
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
              <label htmlFor="login-password" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Mot de passe</label>
              <div className="relative">
                <Input
                  id="login-password"
                  icon={<Lock className="w-4 h-4" />}
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-[var(--bg-secondary)] pr-10"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/mot-de-passe-oublie" className="text-sm text-[var(--text-link)] hover:underline">Mot de passe oublié ?</Link>
            </div>

            <Button type="submit" fullWidth size="lg" disabled={pending}>
              {pending ? "Connexion..." : "Se connecter"}
            </Button>

            <p className="text-center text-sm text-[var(--text-secondary)]">
              Pas encore de compte ?{" "}
              <Link href="/inscription" className="text-[var(--text-link)] font-semibold hover:underline">
                Créer un compte
              </Link>
            </p>
          </form>
        </AnimatedDiv>

        <AnimatedDiv fade slideUp delay={0.1} className="mt-6 p-4 rounded-xl bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)]">
          <p className="font-semibold text-[var(--text-primary)] mb-1">Comptes de démonstration :</p>
          <p>Client : client@axel.marketplace / Password123</p>
          <p>Vendeur : seller@axel.marketplace / Password123</p>
          <p>Admin : admin@axel.marketplace / Password123</p>
        </AnimatedDiv>
      </div>
    </div>
  )
}
