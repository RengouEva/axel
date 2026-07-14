"use client"

import { useState, useMemo, useEffect } from "react"
import { Check, CreditCard, Smartphone, Banknote, Truck, MapPin, Package, ArrowLeft, Loader, ChevronDown, ExternalLink } from "lucide-react"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import { useCart } from "@/lib/cart-context"
import { useAuth } from "@/lib/auth-context"
import { useNotifications } from "@/lib/notification-context"
import { AnimatedDiv } from "@/lib/animations"
import type { Country, City, District } from "@/data/delivery"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

const steps = ["Adresse", "Livraison", "Paiement", "Confirmation"]

const CREDIT_METHODS = [
  {
    id: "visa",
    label: "Visa",
    desc: "Paiement par carte Visa",
    icon: CreditCard,
  },
  {
    id: "mastercard",
    label: "Mastercard",
    desc: "Paiement par carte Mastercard",
    icon: CreditCard,
  },
  {
    id: "orange_money",
    label: "Orange Money",
    desc: "Paiement via Orange Money Cameroun",
    icon: Smartphone,
  },
  {
    id: "mtn_mobile",
    label: "MTN Mobile Money",
    desc: "Paiement via MTN Mobile Money",
    icon: Smartphone,
  },
  {
    id: "wave",
    label: "Wave",
    desc: "Paiement via Wave Cameroun",
    icon: Banknote,
  },
]

const CASH_METHODS = [
  {
    id: "cash_on_delivery",
    label: "Paiement à la livraison",
    desc: "Payez en espèces à la réception de votre commande",
    icon: Banknote,
  },
]

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
  const searchParams = useSearchParams()
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
    modePaiement: "",
  })

  useEffect(() => {
    const payment = searchParams.get("payment")
    const oid = searchParams.get("orderId")
    if (payment === "success" && oid) {
      setOrderId(oid)
      clearCart()
      setCurrentStep(3)
      addNotification({ title: "Paiement confirmé", message: `Votre commande ${oid} a été payée avec succès.`, type: "order" })
    } else if (payment === "failed" && oid) {
      addNotification({ title: "Paiement échoué", message: "Le paiement n'a pas abouti. Vous pouvez réessayer.", type: "system" })
    }
  }, [searchParams, clearCart, addNotification])

  useEffect(() => {
    fetch("/api/locations").then(r => r.json()).then(data => {
      setCountries(data.countries || [])
      setCities(data.cities || [])
      setDistricts(data.districts || [])
    })
  }, [])

  useEffect(() => {
    const code = form.pays || "CM"
    fetch(`/api/taxes?countryId=${code}`).then(r => r.json()).then(data => {
      setTaxRate(data.rate ?? 19.25)
    })
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
    if (currentStep === 0) return form.nom && form.email && form.telephone && form.adresse
    if (currentStep === 1) return true
    if (currentStep === 2) return !!form.modePaiement
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
          deliveryAddress: [form.adresse, selectedDistrict?.name || form.quartier, selectedCity?.name || form.ville].filter(Boolean).join(", "),
          customerName: form.nom,
          customerPhone: form.telephone,
        }),
      })

      if (form.modePaiement === "cash_on_delivery") {
        await fetch("/api/orders/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id, paymentMethod: "cash_on_delivery" }),
        })
        setOrderId(order.id)
        addNotification({ title: "Commande confirmée", message: `Votre commande ${order.id} sera payée à la livraison.`, type: "order" })
        clearCart()
        setCurrentStep(3)
        return
      }

      const paymentRes = await fetch("/api/payment/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          amount: total,
          orderId: order.id,
          customerName: form.nom,
          customerPhone: form.telephone,
        }),
      })

      if (!paymentRes.ok) {
        setOrderId(order.id)
        setCurrentStep(3)
        addNotification({ title: "Commande créée", message: `Votre commande ${order.id} a été créée. Contactez-nous pour finaliser le paiement.`, type: "order" })
        clearCart()
        return
      }

      const paymentData = await paymentRes.json()
      window.location.href = paymentData.authorizationUrl
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
                {form.pays && filteredCities.length > 0 ? (
                  <SelectField id="checkout-ville" label="Ville" value={form.ville} onChange={(v) => updateForm("ville", v)} options={filteredCities} placeholder="Ville" />
                ) : (
                  <div>
                    <label htmlFor="checkout-ville" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Ville</label>
                    <input id="checkout-ville" type="text" placeholder="Saisir la ville" value={form.ville} onChange={e => updateForm("ville", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-hover)] transition-colors"
                    />
                  </div>
                )}
                {form.ville && filteredDistricts.length > 0 ? (
                  <SelectField id="checkout-quartier" label="Quartier" value={form.quartier} onChange={(v) => updateForm("quartier", v)} options={filteredDistricts} placeholder="Quartier" />
                ) : (
                  <div>
                    <label htmlFor="checkout-quartier" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Quartier</label>
                    <input id="checkout-quartier" type="text" placeholder="Saisir le quartier" value={form.quartier} onChange={e => updateForm("quartier", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-hover)] transition-colors"
                    />
                  </div>
                )}
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
                Livraison vers {selectedDistrict?.name || form.quartier || form.ville}{selectedDistrict?.name || form.quartier ? "" : " - "}{selectedCity?.name || ""} {selectedCountry?.flag} {selectedCountry?.name}
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
              <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2"><CreditCard className="w-5 h-5 text-[var(--text-link)]" aria-hidden="true" /> Mode de paiement</h2>

              <div>
                <p className="text-sm font-medium text-[var(--text-primary)] mb-3">Paiement en ligne</p>
                <fieldset>
                  <legend className="sr-only">Paiement en ligne</legend>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {CREDIT_METHODS.map((method) => {
                      const Icon = method.icon
                      return (
                        <button
                          key={method.id}
                          onClick={() => updateForm("modePaiement", method.id)}
                          className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                            form.modePaiement === method.id
                              ? "border-[var(--border-hover)] bg-[var(--text-link)]/5"
                              : "border-[var(--border)] hover:border-[var(--border-hover)]/20"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            form.modePaiement === method.id
                              ? "bg-[var(--text-link)] text-white"
                              : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                          }`}>
                            <Icon className="w-5 h-5" aria-hidden="true" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[var(--text-primary)]">{method.label}</p>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{method.desc}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                            form.modePaiement === method.id ? "border-[var(--border-hover)]" : "border-[var(--border)]"
                          }`} aria-hidden="true">
                            {form.modePaiement === method.id && <div className="w-3 h-3 rounded-full bg-[var(--text-link)]" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              </div>

              <div className="pt-2 border-t border-[var(--border)]">
                <p className="text-sm font-medium text-[var(--text-primary)] mb-3">Paiement à la livraison</p>
                <fieldset>
                  <legend className="sr-only">Paiement à la livraison</legend>
                  <div className="grid sm:grid-cols-1 gap-3">
                    {CASH_METHODS.map((method) => {
                      const Icon = method.icon
                      return (
                        <button
                          key={method.id}
                          onClick={() => updateForm("modePaiement", method.id)}
                          className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                            form.modePaiement === method.id
                              ? "border-[var(--border-hover)] bg-[var(--text-link)]/5"
                              : "border-[var(--border)] hover:border-[var(--border-hover)]/20"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            form.modePaiement === method.id
                              ? "bg-[var(--text-link)] text-white"
                              : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                          }`}>
                            <Icon className="w-5 h-5" aria-hidden="true" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[var(--text-primary)]">{method.label}</p>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{method.desc}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                            form.modePaiement === method.id ? "border-[var(--border-hover)]" : "border-[var(--border)]"
                          }`} aria-hidden="true">
                            {form.modePaiement === method.id && <div className="w-3 h-3 rounded-full bg-[var(--text-link)]" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
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

            {form.modePaiement === "cash_on_delivery" ? (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                <p className="font-medium">Paiement à la livraison</p>
                <p className="mt-1">Vous payez en espèces au livreur lors de la réception de votre commande. Aucun paiement en ligne requis.</p>
              </div>
            ) : form.modePaiement ? (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                <p className="font-medium flex items-center gap-2"><ExternalLink className="w-4 h-4" aria-hidden="true" /> Paiement sécurisé</p>
                <p className="mt-1">Vous serez redirigé vers une page sécurisée pour effectuer le paiement. Aucune donnée bancaire n&apos;est stockée sur nos serveurs.</p>
              </div>
            ) : null}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>Retour</Button>
              <Button size="lg" onClick={handlePlaceOrder} disabled={!canProceed() || loading}>
                {loading ? <Loader className="w-5 h-5 animate-spin" aria-hidden="true" /> : null}
                {loading
                  ? form.modePaiement === "cash_on_delivery" ? "Traitement..." : "Redirection vers le paiement..."
                  : form.modePaiement === "cash_on_delivery" ? "Confirmer la commande" : `Payer ${total.toLocaleString("fr-FR")} F`
                }
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
