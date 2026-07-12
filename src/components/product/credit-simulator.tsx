"use client"

import { useState, type FormEvent, useRef } from "react"
import { CreditCard, Calculator, CheckCircle, Info, X, Loader2, Upload, User, Phone, Wallet, MapPin, ChevronLeft, ChevronRight, FileText } from "lucide-react"
import Button from "@/components/ui/button"

const durations = [3, 6, 12, 18, 24, 36]

const defaultRates: Record<string, number> = { "3": 0, "6": 0, "12": 3, "18": 5, "24": 5, "36": 8 }

interface CreditSimulatorProps {
  price: number
  productName?: string
  creditRates?: string
}

interface CreditResult {
  eligible: boolean
  rate: number
  monthlyPayment: number
  totalRepayment: number
  duration: number
  status: string
  message: string
  nextSteps: string[]
  monthlyIncome?: number | null
  incomeThreshold?: number | null
}

interface GuarantorData {
  fullName: string
  phone: string
  email: string
  address: string
  idType: string
  idDocument: string
  relationship: string
}

const emptyGuarantor = (): GuarantorData => ({
  fullName: "",
  phone: "",
  email: "",
  address: "",
  idType: "",
  idDocument: "",
  relationship: "",
})

function parseRates(raw?: string): Record<string, number> {
  try {
    return raw ? { ...defaultRates, ...JSON.parse(raw) } : defaultRates
  } catch {
    return defaultRates
  }
}

export default function CreditSimulator({ price, productName = "ce produit", creditRates }: CreditSimulatorProps) {
  const rates = parseRates(creditRates)
  const [selectedDuration, setSelectedDuration] = useState(12)
  const [showDetails, setShowDetails] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [result, setResult] = useState<CreditResult | null>(null)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    monthlyIncome: "",
  })
  const [guarantor1, setGuarantor1] = useState<GuarantorData>(emptyGuarantor())
  const [guarantor2, setGuarantor2] = useState<GuarantorData>(emptyGuarantor())
  const [uploadingG1, setUploadingG1] = useState(false)
  const [uploadingG2, setUploadingG2] = useState(false)
  const fileInputG1 = useRef<HTMLInputElement>(null)
  const fileInputG2 = useRef<HTMLInputElement>(null)

  const rate = rates[String(selectedDuration)] ?? 0
  const monthlyWithInterest = Math.round((price + (price * rate) / 100) / selectedDuration)

  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Upload échoué")
    return data.url
  }

  async function handleFileSelect(num: 1 | 2, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (num === 1) setUploadingG1(true)
    else setUploadingG2(true)
    try {
      const url = await uploadFile(file)
      if (num === 1) setGuarantor1((p) => ({ ...p, idDocument: url }))
      else setGuarantor2((p) => ({ ...p, idDocument: url }))
    } catch {
      alert("Erreur lors du téléchargement de la pièce d'identité")
    } finally {
      if (num === 1) setUploadingG1(false)
      else setUploadingG2(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price,
          duration: selectedDuration,
          monthlyIncome: Number(formData.monthlyIncome) || 0,
          applicant: {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
          },
          guarantors: [guarantor1, guarantor2],
        }),
      })
      const data = await res.json()
      setResult(data)
      if (data.eligible) {
        const applications = JSON.parse(localStorage.getItem("creditApplications") || "[]")
        applications.unshift({
          id: Date.now().toString(),
          date: new Date().toISOString(),
          productName,
          price,
          duration: selectedDuration,
          rate: data.rate,
          monthlyPayment: data.monthlyPayment,
          totalRepayment: data.totalRepayment,
          status: "pending",
          applicant: formData,
          guarantors: [guarantor1, guarantor2],
        })
        localStorage.setItem("creditApplications", JSON.stringify(applications))
      }
    } catch {
      setResult({
        eligible: false,
        rate: 0,
        monthlyPayment: 0,
        totalRepayment: 0,
        duration: selectedDuration,
        status: "error",
        message: "Une erreur est survenue. Veuillez réessayer.",
        nextSteps: ["Réessayez plus tard"],
      })
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setShowModal(false)
    setResult(null)
    setStep(1)
    setFormData({ fullName: "", email: "", phone: "", monthlyIncome: "" })
    setGuarantor1(emptyGuarantor())
    setGuarantor2(emptyGuarantor())
  }

  function nextStep() {
    if (step === 1 && !formData.fullName.trim()) return
    if (step === 1 && !formData.email.trim()) return
    if (step === 1 && !formData.phone.trim()) return
    if (step === 1 && !formData.monthlyIncome.trim()) return
    if (step === 2) {
      if (!guarantor1.fullName.trim()) return
      if (!guarantor1.phone.trim()) return
      if (!guarantor1.address.trim()) return
      if (!guarantor1.idType) return
      if (!guarantor1.idDocument) return
      if (!guarantor1.relationship) return
    }
    if (step === 3) {
      if (!guarantor2.fullName.trim()) return
      if (!guarantor2.phone.trim()) return
      if (!guarantor2.address.trim()) return
      if (!guarantor2.idType) return
      if (!guarantor2.idDocument) return
      if (!guarantor2.relationship) return
    }
    setStep((s) => Math.min(s + 1, 4))
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 1))
  }

  const stepLabels = ["Vos informations", "Garant 1", "Garant 2", "Récapitulatif"]

  function renderStepIndicator() {
    return (
      <div className="flex items-center gap-2 mb-6">
        {stepLabels.map((label, i) => {
          const idx = i + 1
          const isActive = idx === step
          const isDone = idx < step
          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                isActive ? "gradient-axel text-white" : isDone ? "bg-green-500 text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
              }`}>
                {isDone ? <CheckCircle className="w-4 h-4" /> : idx}
              </div>
              <span className={`text-xs hidden sm:block ${isActive ? "text-[var(--text-primary)] font-semibold" : "text-[var(--text-secondary)]"}`}>
                {label}
              </span>
              {i < stepLabels.length - 1 && <div className={`flex-1 h-0.5 ${idx <= step ? "bg-[var(--text-link)]" : "bg-[var(--border)]"}`} />}
            </div>
          )
        })}
      </div>
    )
  }

  function renderGuarantorForm(num: 1 | 2, data: GuarantorData, setter: (d: GuarantorData) => void) {
    const uploading = num === 1 ? uploadingG1 : uploadingG2
    const fileRef = num === 1 ? fileInputG1 : fileInputG2
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-600 mt-0.5" />
          <p className="text-xs text-amber-800">Les informations du garant doivent être exactes et vérifiables. Une pièce d'identité valide est obligatoire.</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Nom complet du garant</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input type="text" required value={data.fullName} onChange={(e) => setter({ ...data, fullName: e.target.value })}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[var(--border)] text-sm outline-none focus:border-[var(--border-hover)] transition-colors"
              placeholder="Nom et prénoms" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <input type="tel" required value={data.phone} onChange={(e) => setter({ ...data, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[var(--border)] text-sm outline-none focus:border-[var(--border-hover)] transition-colors"
                placeholder="+225 01 02 03 04" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Email</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <input type="email" value={data.email} onChange={(e) => setter({ ...data, email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[var(--border)] text-sm outline-none focus:border-[var(--border-hover)] transition-colors"
                placeholder="jean@email.com" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Adresse</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input type="text" required value={data.address} onChange={(e) => setter({ ...data, address: e.target.value })}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[var(--border)] text-sm outline-none focus:border-[var(--border-hover)] transition-colors"
              placeholder="Ville, quartier, rue, numéro" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Type de pièce</label>
            <select required value={data.idType} onChange={(e) => setter({ ...data, idType: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border)] text-sm outline-none focus:border-[var(--border-hover)] transition-colors bg-[var(--bg-primary)]">
              <option value="">Sélectionnez</option>
              <option value="CNI">CNI</option>
              <option value="Passeport">Passeport</option>
              <option value="Permis">Permis de conduire</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Lien avec vous</label>
            <select required value={data.relationship} onChange={(e) => setter({ ...data, relationship: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border)] text-sm outline-none focus:border-[var(--border-hover)] transition-colors bg-[var(--bg-primary)]">
              <option value="">Sélectionnez</option>
              <option value="Parent">Parent</option>
              <option value="Conjoint(e)">Conjoint(e)</option>
              <option value="Ami(e)">Ami(e)</option>
              <option value="Collègue">Collègue</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Pièce d'identité (recto/verso)</label>
          <div className="relative">
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
              onChange={(e) => handleFileSelect(num, e)} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading || !!data.idDocument}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-[var(--border)] text-sm hover:border-[var(--text-link)] transition-colors disabled:opacity-50">
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-[var(--text-link)]" />
              ) : data.idDocument ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Upload className="w-5 h-5 text-[var(--text-secondary)]" />
              )}
              <span className="text-[var(--text-secondary)]">
                {uploading ? "Téléchargement..." : data.idDocument ? "Pièce téléchargée" : "Cliquez pour télécharger la pièce d'identité"}
              </span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-2xl border-2 border-[var(--border)] p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--text-link)]/10 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-[var(--text-link)]" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--text-primary)]">Simulateur de crédit</h3>
            <p className="text-xs text-[var(--text-secondary)]">Sans engagement</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-[var(--text-secondary)] mb-3">Choisissez votre durée :</p>
          <div className="flex flex-wrap gap-2">
            {durations.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDuration(d)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  selectedDuration === d
                    ? "gradient-axel text-white shadow-lg"
                    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--text-link)]/10 hover:text-[var(--text-link)]"
                }`}
              >
                {d} mois
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--text-secondary)]">Mensualité estimée</span>
            <span className="text-2xl font-bold text-[var(--text-link)]">
              {monthlyWithInterest.toLocaleString("fr-FR")} F
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--text-secondary)]">Total à rembourser</span>
            <span className="font-semibold text-[var(--text-primary)]">
              {(monthlyWithInterest * selectedDuration).toLocaleString("fr-FR")} F
            </span>
          </div>
          {rate > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--text-secondary)]">Taux d'intérÃªt</span>
              <span className="font-semibold text-[var(--text-primary)]">{rate}%</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-link)] transition-colors"
          >
            <Info className="w-4 h-4" />
            Voir les détails
          </button>

          {showDetails && (
            <div className="text-xs text-[var(--text-secondary)] space-y-1 p-3 bg-[var(--bg-secondary)] rounded-xl">
              <p>• Acompte : 0 F</p>
              <p>• Durée : {selectedDuration} mois</p>
              <p>• Taux : {rate}%</p>
              <p>• Frais de dossier : inclus</p>
              <p>• Assurance : facultative</p>
              <p>• 2 garants obligatoires (pièce d'identité valide)</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button fullWidth size="lg" onClick={() => setShowModal(true)}>
            <CreditCard className="w-5 h-5" />
            Demander un crédit
          </Button>
          <Button fullWidth variant="outline" size="lg">
            <CheckCircle className="w-5 h-5" />
            Acheter comptant ({price.toLocaleString("fr-FR")} F)
          </Button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={resetForm}>
          <div className="bg-[var(--bg-primary)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {result ? "Résultat de votre demande" : "Demande de crédit"}
              </h3>
              <button onClick={resetForm} className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors">
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>

            {result ? (
              <div className="p-6 space-y-5">
                <div className={`rounded-xl p-4 ${result.eligible ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${result.eligible ? "bg-green-100" : "bg-red-100"}`}>
                      {result.eligible ? <CheckCircle className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-600" />}
                    </div>
                    <div>
                      <p className={`font-bold ${result.eligible ? "text-green-800" : "text-red-800"}`}>
                        {result.eligible ? "Demande soumise" : "Non éligible"}
                      </p>
                      <p className={`text-xs ${result.eligible ? "text-green-600" : "text-red-600"}`}>{result.message}</p>
                    </div>
                  </div>
                </div>

                {result.eligible && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                        <p className="text-xs text-[var(--text-secondary)]">Mensualité</p>
                        <p className="font-bold text-[var(--text-primary)]">{result.monthlyPayment.toLocaleString("fr-FR")} F</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                        <p className="text-xs text-[var(--text-secondary)]">Total</p>
                        <p className="font-bold text-[var(--text-primary)]">{result.totalRepayment.toLocaleString("fr-FR")} F</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                        <p className="text-xs text-[var(--text-secondary)]">Durée</p>
                        <p className="font-bold text-[var(--text-primary)]">{result.duration} mois</p>
                      </div>
                      <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                        <p className="text-xs text-[var(--text-secondary)]">Taux</p>
                        <p className="font-bold text-[var(--text-primary)]">{result.rate}%</p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-[var(--bg-secondary)] p-4 space-y-3">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Garants fournis</p>
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>{guarantor1.fullName} — {guarantor1.relationship}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>{guarantor2.fullName} — {guarantor2.relationship}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">Prochaines étapes :</p>
                      <ol className="space-y-2">
                        {result.nextSteps.map((step, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <div className="w-6 h-6 rounded-full gradient-axel flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {i + 1}
                            </div>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button fullWidth variant="outline" onClick={resetForm}>Fermer</Button>
                      <Button fullWidth onClick={() => window.location.href = "/compte/credit"}>
                        Voir mon crédit
                      </Button>
                    </div>
                  </>
                )}

                {!result.eligible && (
                  <>
                    {result.incomeThreshold != null ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 rounded-xl bg-[var(--bg-secondary)]">
                          <span className="text-sm text-[var(--text-secondary)]">Mensualité</span>
                          <span className="text-sm font-bold text-red-600">{result.monthlyPayment.toLocaleString("fr-FR")} F</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-[var(--bg-secondary)]">
                          <span className="text-sm text-[var(--text-secondary)]">Vos revenus déclarés</span>
                          <span className="text-sm font-bold text-[var(--text-primary)]">{Number(formData.monthlyIncome).toLocaleString("fr-FR")} F</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-[var(--bg-secondary)]">
                          <span className="text-sm text-[var(--text-secondary)]">Plafond autorisé (40% des revenus)</span>
                          <span className="text-sm font-bold text-red-600">{result.incomeThreshold.toLocaleString("fr-FR")} F</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-red-50 border border-red-200">
                          <span className="text-sm text-red-700 font-semibold">Dépassement</span>
                          <span className="text-sm font-bold text-red-700">+{(result.monthlyPayment - result.incomeThreshold).toLocaleString("fr-FR")} F/mois</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--text-secondary)]">{result.message}</p>
                    )}
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-3">
                      <Info className="w-4 h-4 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-800">Comment être éligible ?</p>
                        <ul className="text-xs text-amber-700 mt-1 space-y-0.5 list-disc list-inside">
                          <li>Augmentez la durée pour réduire la mensualité</li>
                          <li>Choisissez un produit moins cher</li>
                          <li>Ou déclarez des revenus plus élevés</li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button fullWidth variant="outline" onClick={resetForm}>Fermer</Button>
                      <Button fullWidth onClick={() => { setResult(null); setFormData({ ...formData, monthlyIncome: "" }) }}>
                        Réessayer
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {renderStepIndicator()}

                {step === 1 && (
                  <div className="space-y-4">
                    <p className="text-sm text-[var(--text-secondary)]">
                      Complétez vos informations pour {productName} à {(monthlyWithInterest * selectedDuration).toLocaleString("fr-FR")} F sur {selectedDuration} mois.
                    </p>

                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Nom complet</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                        <input type="text" required value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[var(--border)] text-sm outline-none focus:border-[var(--border-hover)] transition-colors"
                          placeholder="Jean Kouamé" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Email</label>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[var(--border)] text-sm outline-none focus:border-[var(--border-hover)] transition-colors"
                          placeholder="jean@email.com" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Téléphone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                        <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[var(--border)] text-sm outline-none focus:border-[var(--border-hover)] transition-colors"
                          placeholder="+225 01 02 03 04 05" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">Revenus mensuels (F CFA)</label>
                      <div className="relative">
                        <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                        <input type="number" required min="0" value={formData.monthlyIncome} onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-[var(--border)] text-sm outline-none focus:border-[var(--border-hover)] transition-colors"
                          placeholder="300000" />
                      </div>
                    </div>

                    <div className="rounded-xl bg-[var(--bg-secondary)] p-3 flex items-start gap-3">
                      <Upload className="w-4 h-4 text-[var(--text-secondary)] mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-primary)]">Documents requis</p>
                        <p className="text-xs text-[var(--text-secondary)]">Pièce d'identité, justificatif de domicile, justificatif de revenus et 2 garants avec pièces d'identité</p>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">Premier garant</h4>
                    {renderGuarantorForm(1, guarantor1, setGuarantor1)}
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">Second garant</h4>
                    {renderGuarantorForm(2, guarantor2, setGuarantor2)}
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Vérifiez vos informations avant de soumettre</p>

                    <div className="rounded-xl bg-[var(--bg-secondary)] p-4 space-y-2">
                      <p className="text-xs font-bold text-[var(--text-primary)]">Vos informations</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <span className="text-[var(--text-secondary)]">Nom :</span>
                        <span className="text-[var(--text-primary)] font-medium">{formData.fullName}</span>
                        <span className="text-[var(--text-secondary)]">Email :</span>
                        <span className="text-[var(--text-primary)] font-medium">{formData.email}</span>
                        <span className="text-[var(--text-secondary)]">Téléphone :</span>
                        <span className="text-[var(--text-primary)] font-medium">{formData.phone}</span>
                        <span className="text-[var(--text-secondary)]">Revenus :</span>
                        <span className="text-[var(--text-primary)] font-medium">{Number(formData.monthlyIncome).toLocaleString("fr-FR")} F/mois</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-[var(--bg-secondary)] p-4 space-y-2">
                      <p className="text-xs font-bold text-[var(--text-primary)]">Garant 1 — {guarantor1.relationship}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <span className="text-[var(--text-secondary)]">Nom :</span>
                        <span className="text-[var(--text-primary)] font-medium">{guarantor1.fullName}</span>
                        <span className="text-[var(--text-secondary)]">Téléphone :</span>
                        <span className="text-[var(--text-primary)] font-medium">{guarantor1.phone}</span>
                        <span className="text-[var(--text-secondary)]">Pièce :</span>
                        <span className="text-[var(--text-primary)] font-medium">{guarantor1.idType}</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-[var(--bg-secondary)] p-4 space-y-2">
                      <p className="text-xs font-bold text-[var(--text-primary)]">Garant 2 — {guarantor2.relationship}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <span className="text-[var(--text-secondary)]">Nom :</span>
                        <span className="text-[var(--text-primary)] font-medium">{guarantor2.fullName}</span>
                        <span className="text-[var(--text-secondary)]">Téléphone :</span>
                        <span className="text-[var(--text-primary)] font-medium">{guarantor2.phone}</span>
                        <span className="text-[var(--text-secondary)]">Pièce :</span>
                        <span className="text-[var(--text-primary)] font-medium">{guarantor2.idType}</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-3">
                      <Info className="w-4 h-4 text-amber-600 mt-0.5" />
                      <p className="text-xs text-amber-800">En soumettant, vous certifiez que les informations fournies sont exactes et que vos garants ont consenti à se porter garants pour ce crédit.</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  {step > 1 && (
                    <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                      <ChevronLeft className="w-4 h-4" />
                      Précédent
                    </Button>
                  )}
                  {step < 4 ? (
                    <Button type="button" onClick={nextStep} className="flex-1">
                      Suivant
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                      {loading ? "Traitement en cours..." : "Soumettre ma demande"}
                    </Button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
