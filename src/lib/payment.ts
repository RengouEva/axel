const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY || ""
const FLW_API = "https://api.flutterwave.com/v3"

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ""
const PAYSTACK_API = "https://api.paystack.co"

type PaymentProvider = "demo" | "paystack" | "flutterwave" | "cash_on_delivery"

function getActiveProvider(): PaymentProvider {
  if (FLW_SECRET_KEY && FLW_SECRET_KEY !== "FLWSECK_TEST-xxxxxxxxxxxxxxxxxxxx") return "flutterwave"
  if (PAYSTACK_SECRET_KEY && PAYSTACK_SECRET_KEY !== "sk_test_xxxxxxxxxxxxxxxxxxxx") return "paystack"
  return "demo"
}

export function getPaymentConfig() {
  const provider = getActiveProvider()
  const publicKey = provider === "flutterwave"
    ? (process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY || "")
    : provider === "paystack"
      ? (process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "")
      : ""
  return { provider, publicKey }
}

interface InitParams {
  email: string
  amount: number
  orderId: string
  callbackUrl: string
  customerName?: string
  customerPhone?: string
}

type InitResult =
  | { success: true; authorizationUrl: string; reference: string }
  | { success: false; error: string }

export async function initializePayment(params: InitParams): Promise<InitResult> {
  const provider = getActiveProvider()

  switch (provider) {
    case "flutterwave":
      return initFlutterwave(params)
    case "paystack":
      return initPaystack(params)
    default:
      return initDemo(params)
  }
}

function initDemo({ orderId, amount, callbackUrl }: InitParams): InitResult {
  const reference = `DEMO-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  return {
    success: true,
    authorizationUrl: `${siteUrl}/demo-paiement?reference=${reference}&orderId=${orderId}&amount=${amount}&callbackUrl=${encodeURIComponent(callbackUrl)}`,
    reference,
  }
}

async function initPaystack({ email, amount, orderId, callbackUrl, customerName, customerPhone }: InitParams): Promise<InitResult> {
  const reference = `AXEL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`.toUpperCase()

  try {
    const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100),
        reference,
        callback_url: callbackUrl,
        currency: "XOF",
        channels: ["card", "mobile_money", "bank"],
        metadata: { orderId, customerName, customerPhone },
      }),
    })

    const json = await res.json()
    if (!json.status) return { success: false, error: json.message || "Échec du paiement" }

    return {
      success: true,
      authorizationUrl: json.data.authorization_url,
      reference: json.data.reference,
    }
  } catch (error) {
    console.error("[PAYSTACK_INIT]", error)
    return { success: false, error: "Erreur de communication avec Paystack" }
  }
}

async function initFlutterwave({ email, amount, orderId, callbackUrl, customerName, customerPhone }: InitParams): Promise<InitResult> {
  const txRef = `AXEL-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`.toUpperCase()

  try {
    const res = await fetch(`${FLW_API}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount,
        currency: "XAF",
        redirect_url: callbackUrl,
        customer: {
          email,
          name: customerName || "",
          phonenumber: customerPhone || "",
        },
        meta: { order_id: orderId },
        customizations: {
          title: "AXEL Marketplace",
          description: `Commande ${orderId}`,
        },
        payment_options: "card, mobilemoney, ussd",
      }),
    })

    const json = await res.json()
    if (json.status !== "success") return { success: false, error: json.message || "Échec du paiement" }

    return {
      success: true,
      authorizationUrl: json.data.link,
      reference: txRef,
    }
  } catch (error) {
    console.error("[FLUTTERWAVE_INIT]", error)
    return { success: false, error: "Erreur de communication avec Flutterwave" }
  }
}

type VerifyResult =
  | { success: true; status: string; amount: number; reference: string }
  | { success: false; error: string }

export async function verifyPayment(provider: string, reference: string, transactionId?: string): Promise<VerifyResult> {
  switch (provider) {
    case "flutterwave":
      return verifyFlutterwave(transactionId)
    case "paystack":
      return verifyPaystack(reference)
    default:
      return verifyDemo(reference)
  }
}

function verifyDemo(reference: string): VerifyResult {
  return {
    success: true,
    status: "success",
    amount: 0,
    reference,
  }
}

async function verifyPaystack(reference: string): Promise<VerifyResult> {
  try {
    const res = await fetch(`${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    })
    const json = await res.json()
    if (!json.status) return { success: false, error: json.message || "Échec de vérification" }

    return {
      success: true,
      status: json.data.status,
      amount: json.data.amount / 100,
      reference,
    }
  } catch (error) {
    console.error("[PAYSTACK_VERIFY]", error)
    return { success: false, error: "Erreur de vérification Paystack" }
  }
}

async function verifyFlutterwave(transactionId?: string): Promise<VerifyResult> {
  if (!transactionId) return { success: false, error: "ID de transaction requis" }

  try {
    const res = await fetch(`${FLW_API}/transactions/${encodeURIComponent(transactionId)}/verify`, {
      headers: { Authorization: `Bearer ${FLW_SECRET_KEY}` },
    })
    const json = await res.json()
    if (json.status !== "success") return { success: false, error: json.message || "Échec de vérification" }

    return {
      success: true,
      status: json.data.status,
      amount: json.data.amount,
      reference: json.data.tx_ref,
    }
  } catch (error) {
    console.error("[FLUTTERWAVE_VERIFY]", error)
    return { success: false, error: "Erreur de vérification Flutterwave" }
  }
}
