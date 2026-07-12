import { NextResponse } from "next/server"
import { validateInput, creditSimulateSchema, creditApplicationSchema } from "@/lib/validations"
import { checkApiRateLimit, getRateLimitHeaders } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = checkApiRateLimit(`credit:${ip}`)
    const headers = getRateLimitHeaders(rateLimit)

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429, headers })
    }

    const body = await request.json()
    const isFullApplication = body.guarantors !== undefined

    if (isFullApplication) {
      const validation = validateInput(creditApplicationSchema, body)
      if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }

      const { price, duration, monthlyIncome, applicant, guarantors } = validation.data

      const rate = duration <= 12 ? 0 : duration <= 24 ? 5 : 8
      const monthlyWithInterest = Math.round((price + (price * rate) / 100) / duration)
      const totalRepayment = monthlyWithInterest * duration

      const eligible = monthlyIncome ? monthlyWithInterest <= monthlyIncome * 0.4 : true

      return NextResponse.json({
        eligible,
        rate,
        monthlyPayment: monthlyWithInterest,
        totalRepayment,
        duration,
        status: eligible ? "pending" : "rejected",
        monthlyIncome: monthlyIncome || null,
        incomeThreshold: monthlyIncome ? Math.round(monthlyIncome * 0.4) : null,
        message: eligible
          ? "Votre demande a été soumise avec succès. Nos équipes vont vérifier vos informations et celles de vos garants."
        : "Votre mensualité (" + (monthlyWithInterest ?? 0).toLocaleString("fr-FR") + " F) dépasse 40% de vos revenus (" + Math.round((monthlyIncome ?? 0) * 0.4).toLocaleString("fr-FR") + " F). Allongez la durée ou choisissez un produit moins cher.",
        nextSteps: eligible
          ? [
              "Vérification de vos informations par nos équipes",
              "Vérification des pièces d'identité de vos garants",
              "Validation finale sous 24 à 48h",
              "Livraison de votre produit après approbation",
            ]
          : ["Allongez la durée de remboursement pour réduire la mensualité", "Ou choisissez un produit moins cher"],
      }, { headers })
    }

    const validation = validateInput(creditSimulateSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { price, duration, monthlyIncome } = validation.data

    const rate = duration <= 12 ? 0 : duration <= 24 ? 5 : 8
    const monthlyWithInterest = Math.round((price + (price * rate) / 100) / duration)
    const totalRepayment = monthlyWithInterest * duration

    const eligible = monthlyIncome ? monthlyWithInterest <= monthlyIncome * 0.4 : true

    return NextResponse.json({
      eligible,
      rate,
      monthlyPayment: monthlyWithInterest,
      totalRepayment,
      duration,
      status: eligible ? "pre-approved" : "rejected",
      monthlyIncome: monthlyIncome || null,
      incomeThreshold: monthlyIncome ? Math.round(monthlyIncome * 0.4) : null,
      message: eligible
        ? "Votre dossier est pré-approuvé. Vous aurez besoin de 2 garants avec pièces d'identité valides."
        : "Votre mensualité (" + (monthlyWithInterest ?? 0).toLocaleString("fr-FR") + " F) dépasse 40% de vos revenus (" + Math.round((monthlyIncome ?? 0) * 0.4).toLocaleString("fr-FR") + " F). Allongez la durée ou choisissez un produit moins cher.",
      nextSteps: eligible
        ? [
            "Fournissez les informations de vos 2 garants",
            "Téléchargez votre pièce d'identité",
            "Téléchargez votre justificatif de domicile et de revenus",
            "Signez électroniquement le contrat",
          ]
        : ["Allongez la durée de remboursement pour réduire la mensualité", "Ou choisissez un produit moins cher"],
    }, { headers })
  } catch (error) {
    console.error("[CREDIT_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "AXEL Credit API",
    description: "Simulation et demande de crédit",
    example: {
      price: 1599000,
      duration: 12,
      monthlyIncome: 500000,
    },
  })
}
