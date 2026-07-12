"use client"

import { useState, useMemo, useEffect } from "react"
import { Check, CreditCard, Truck, MapPin, Package, ArrowLeft, Loader, ChevronDown } from "lucide-react"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { useNotifications } from "@/lib/notification-context"
import { AnimatedDiv } from "@/lib/animations"
import { getCountries, getCities, getDistricts, type Country, type City, type District } from "@/data/delivery"
import { getTaxRate } from "@/data/taxes"
import Link from "next/link"

const steps = ["Adresse", "Livraison", "Paiement", "Confirmation"]

function SelectField({ id, label, value, onChange, options, placeholder }: {
  id: string; label: string; value: string; onChange: (v: string) => void; options: { id: string; name: string }[]; placeholder: string
}) {
  return (
    <div className="relative">
      <label htmlFor={id} className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">{label}</label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-4 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-hover)] transition-colors cursor-pointer"
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none" aria-hidden="true" />
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState("")
  const [countries, setCountries] = useState<Country[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [taxRate, setTaxRate] = useState(19.25)
  const { items, subtotal, clearCart } = useCart()
  const { user } = useAuth()
  const { addNotification } = useNotifications()

  const [form, setForm] = useState({
    nom: user?.name || "",
    email: user?.email || "",
    telephone: "",
    adresse: "",
    ville: "DLA",
    quartier: "DLA-CT",
    pays: "CM",
    modeLivraison: "standard",
    carte: "", nomCarte: "", exp: "", cvv: "",
  })

  useEffect(() => {
    Promise.all([getCountries(), getCities(), getDistricts()]).then(([co, ci, di]) => {
      setCountries(co)
      setCities(ci)
      setDistricts(di)
    })
  }, [])

  useEffect(() => {
    getTaxRate(form.pays || "CM").then(setTaxRate)
  }, [form.pays])

  const tva = Math.round(subtotal * taxRate / 100)
  const livraison = subtotal >= 50000 ? 0 : 5000
  const total = subtotal + tva + livraison

  const updateForm = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }))

  const filteredCities = useMemo(() => cities.filter(c => c.countryId === form.pays), [form.pays, cities])
  const filteredDistricts = useMemo(() => districts.filter(d => d.cityId === form.ville), [form.ville, districts])

  const selectedCountry = countries.find(c => c.id === form.pays)
  const selectedCity = cities.find(c => c.id === form.ville)
  const selectedDistrict = districts.find(d => d.id === form.quartier)

  const canProceed = () => {
    if (currentStep === 0) return form.nom && form.email && form.telephone && form.adresse && form.ville && form.quartier
    if (currentStep === 1) return true
    if (currentStep === 2) return form.carte.length >= 16 && form.nomCarte && form.exp.length >= 4 && form.cvv.length >= 3
    return true
  }

  const handlePlaceOrder = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total,
          userId: user?.id || 1,
          items: items.map((i) => ({
            productId: i.product.id,
            name: i.product.name,
            quantity: i.quantity,
            price: i.product.price,
          })),
          shipping: {
            name: form.nom,
            email: form.email,
            telephone: form.telephone,
            address: form.adresse,
            countryId: form.pays,
            cityId: form.ville,
            districtId: form.quartier,
            method: form.modeLivraison,
          },
        }),
      })
      if (!res.ok) throw new Error("Erreur lors de la création de la commande")
      const order = await res.json()

      await fetch("/api/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          countryId: form.pays,
          cityId: form.ville,
          districtId: form.quartier,
          deliveryAddress: `${form.adresse}, ${selectedDistrict?.name}, ${selectedCity?.name}`,
          customerName: form.nom,
          customerPhone: form.telephone,
        }),
      })

      setOrderId(order.id)
      addNotification({ title: "Commande confirmée", message: `Votre commande ${order.id} a été confirmée.`, type: "order" })
      clearCart()
      setCurrentStep(3)
    } catch {
      addNotification({ title: "Erreur", message: "Impossible de passer la commande. Réessayez.", type: "system" })
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0 && currentStep !== 3) {
    return (
      <div className="w-full min-h-screen bg-[var(--bg-primary)]">
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Votre panier est vide</h1>
          <Link href="/produits"><Button>Découvrir les produits</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/panier" aria-label="Retour au panier" className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors"><ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" /></Link>
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)]">Finaliser la commande</h1>
            <p className="text-[var(--text-secondary)] text-sm">Étape {currentStep + 1} sur 4</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-8" role="group" aria-label="Étapes de la commande">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300 ${i <= currentStep ? "gradient-axel text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"}`}
                aria-current={i === currentStep ? "step" : undefined}
              >
                {i < currentStep ? <Check className="w-4 h-4" aria-hidden="true" /> : i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${i <= currentStep ? "text-[var(--text-primary)] font-semibold" : "text-[var(--text-secondary)]"}`}>{label}</span>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i < currentStep ? "bg-[var(--text-link)]" : "bg-[var(--border)]"}`} aria-hidden="true" />}
            </div>
          ))}
        </div>

        {currentStep === 0 && (
          <AnimatedDiv fade slideUp className="space-y-6">
            <div className="rounded-2xl border-2 border-[var(--border)] p-6 space-y-4">
              <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2"><MapPin className="w-5 h-5 text-[var(--text-link)]" aria-hidden="true" /> Adresse de livraison</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="checkout-nom" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Nom complet</label>
                  <Input id="checkout-nom" placeholder="Nom complet" value={form.nom} onChange={e => updateForm("nom", e.target.value)} />
                </div>
                <div>
                  <label htmlFor="checkout-email" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Email</label>
                  <Input id="checkout-email" placeholder="Email" type="email" value={form.email} onChange={e => updateForm("email", e.target.value)} />
                </div>
                <div>
                  <label htmlFor="checkout-tel" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Téléphone</label>
                  <Input id="checkout-tel" placeholder="Téléphone" value={form.telephone} onChange={e => updateForm("telephone", e.target.value)} />
                </div>
                <SelectField id="checkout-pays" label="Pays" value={form.pays} onChange={(v) => updateForm("pays", v)} options={countries} placeholder="Pays" />
                <SelectField id="checkout-ville" label="Ville" value={form.ville} onChange={(v) => updateForm("ville", v)} options={filteredCities} placeholder="Ville" />
                <SelectField id="checkout-quartier" label="Quartier" value={form.quartier} onChange={(v) => updateForm("quartier", v)} options={filteredDistricts} placeholder="Quartier" />
              </div>
              <div>
                <label htmlFor="checkout-adresse" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Adresse complète</label>
                <Input id="checkout-adresse" placeholder="Rue, immeuble, etc." value={form.adresse} onChange={e => updateForm("adresse", e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end"><Button size="lg" onClick={() => setCurrentStep(1)} disabled={!canProceed()}>Continuer</Button></div>
          </AnimatedDiv>
        )}

        {currentStep === 1 && (
          <AnimatedDiv fade slideUp className="space-y-6">
            <div className="rounded-2xl border-2 border-[var(--border)] p-6 space-y-4">
              <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2"><Truck className="w-5 h-5 text-[var(--text-link)]" aria-hidden="true" /> Mode de livraison</h2>
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] text-sm text-[var(--text-secondary)] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--text-link)]" aria-hidden="true" />
                Livraison vers <strong className="text-[var(--text-primary)]">{selectedDistrict?.name}</strong>, <strong className="text-[var(--text-primary)]">{selectedCity?.name}</strong> - {selectedCountry?.flag} {selectedCountry?.name}
              </div>
              <fieldset>
                <legend className="sr-only">Mode de livraison</legend>
                {[
                  { id: "standard", label: "Standard", desc: "Livraison sous 3-5 jours ouvrés", price: 0 },
                  { id: "express", label: "Express", desc: "Livraison sous 24-48h", price: 5000 },
                ].map((m) => (
                  <button key={m.id} onClick={() => updateForm("modeLivraison", m.id)} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${form.modeLivraison === m.id ? "border-[var(--border-hover)] bg-[var(--text-link)]/5" : "border-[var(--border)] hover:border-[var(--border-hover)]/20"}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.modeLivraison === m.id ? "border-[var(--border-hover)]" : "border-[var(--border)]"}`} aria-hidden="true">
                      {form.modeLivraison === m.id && <div className="w-3 h-3 rounded-full bg-[var(--text-link)]" />}
                    </div>
                    <div className="flex-1 text-left"><p className="font-semibold text-[var(--text-primary)]">{m.label}</p><p className="text-sm text-[var(--text-secondary)]">{m.desc}</p></div>
                    <p className="font-semibold text-[var(--text-primary)]">{m.price === 0 ? "Gratuite" : `${m.price.toLocaleString("fr-FR")} F`}</p>
                  </button>
                ))}
              </fieldset>
            </div>
            <div className="flex justify-between"><Button variant="outline" onClick={() => setCurrentStep(0)}>Retour</Button><Button size="lg" onClick={() => setCurrentStep(2)}>Continuer</Button></div>
          </AnimatedDiv>
        )}

        {currentStep === 2 && (
          <AnimatedDiv fade slideUp className="space-y-6">
            <div className="rounded-2xl border-2 border-[var(--border)] p-6 space-y-4">
              <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2"><CreditCard className="w-5 h-5 text-[var(--text-link)]" aria-hidden="true" /> Paiement</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="checkout-nomcarte" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Nom sur la carte</label>
                  <Input id="checkout-nomcarte" placeholder="Nom sur la carte" value={form.nomCarte} onChange={e => updateForm("nomCarte", e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="checkout-carte" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Numéro de carte</label>
                  <Input id="checkout-carte" placeholder="0000 0000 0000 0000" value={form.carte} onChange={e => updateForm("carte", e.target.value.replace(/\D/g, "").slice(0, 16))} />
                </div>
                <div>
                  <label htmlFor="checkout-exp" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Date d'expiration</label>
                  <Input id="checkout-exp" placeholder="MM/AA" value={form.exp} onChange={e => updateForm("exp", e.target.value.replace(/\D/g, "").slice(0, 4))} />
                </div>
                <div>
                  <label htmlFor="checkout-cvv" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">CVV</label>
                  <Input id="checkout-cvv" placeholder="CVV" type="password" value={form.cvv} onChange={e => updateForm("cvv", e.target.value.replace(/\D/g, "").slice(0, 3))} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {["Visa", "Mastercard", "IrisPay", "Orange Money", "MTN Mobile Money", "Wave"].map(p => (
                  <span key={p} className="px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-xs font-medium text-[var(--text-secondary)] border border-[var(--border)]">{p}</span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border-2 border-[var(--border)] p-6 space-y-3">
              <h3 className="font-bold text-[var(--text-primary)]">Récapitulatif</h3>
              <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">Sous-total</span><span>{subtotal.toLocaleString("fr-FR")} F</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">TVA ({taxRate}%)</span><span>{tva.toLocaleString("fr-FR")} F</span></div>
              <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">Livraison</span><span>{livraison === 0 ? "Gratuite" : `${livraison.toLocaleString("fr-FR")} F`}</span></div>
              <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                <span>Adresse</span>
                <span className="text-right max-w-[200px] truncate">{form.adresse}, {selectedDistrict?.name}, {selectedCity?.name}</span>
              </div>
              <hr className="border-[var(--border)]" />
              <div className="flex justify-between"><span className="font-bold text-[var(--text-primary)] text-lg">Total</span><span className="text-2xl font-bold text-[var(--text-link)]">{total.toLocaleString("fr-FR")} F</span></div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>Retour</Button>
              <Button size="lg" onClick={handlePlaceOrder} disabled={!canProceed() || loading}>
                {loading ? <Loader className="w-5 h-5 animate-spin" aria-hidden="true" /> : null}
                {loading ? "Traitement..." : "Confirmer et payer"}
              </Button>
            </div>
          </AnimatedDiv>
        )}

        {currentStep === 3 && (
          <AnimatedDiv fade slideUp className="text-center py-12">
            <div className="w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-500" aria-hidden="true" />
            </div>
            <h2 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Commande confirmée !</h2>
            <p className="text-[var(--text-secondary)] mb-1">Merci {form.nom} ! Votre commande <span className="font-semibold text-[var(--text-link)]">{orderId}</span> a été passée avec succès.</p>
            <p className="text-sm text-[var(--text-secondary)] mb-2">Livraison prévue à <strong>{selectedDistrict?.name}, {selectedCity?.name}</strong> - {selectedCountry?.flag} {selectedCountry?.name}</p>
            <p className="text-sm text-[var(--text-secondary)] mb-8">Un email de confirmation sera envoyé à {form.email}</p>
            <div className="flex gap-4 justify-center">
              <Link href="/compte/commandes"><Button variant="outline">Voir mes commandes</Button></Link>
              <Link href="/livraison"><Button variant="outline">Suivre ma livraison</Button></Link>
              <Link href="/"><Button>Retour à l'accueil</Button></Link>
            </div>
          </AnimatedDiv>
        )}
      </div>
    </div>
  )
}
