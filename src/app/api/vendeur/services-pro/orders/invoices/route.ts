import { NextResponse } from "next/server"
import { requireRole } from "@/lib/require-auth"
import { queryOne } from "@/lib/db"
import { getOrderForInvoice } from "@/data/services-pro/orders"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")
    if (!orderId) return NextResponse.json({ error: "ID de commande requis" }, { status: 400 })

    const order = await getOrderForInvoice(orderId)
    if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const invoice = {
      number: `FACT-${order.id}`,
      date: order.createdAt,
      seller: { name: shop.name, phone: shop.phone, email: shop.email, address: shop.address },
      customer: { name: order.customerName, email: order.customerEmail, address: order.shippingAddress },
      items: order.items,
      subtotal: order.items.reduce((s: number, i: any) => s + Number(i.price) * Number(i.quantity), 0),
      total: order.total,
      status: order.status,
    }

    const deliveryNote = {
      number: `BL-${order.id}`,
      date: order.createdAt,
      seller: { name: shop.name, phone: shop.phone },
      customer: { name: order.customerName, phone: order.shippingPhone, address: order.shippingAddress },
      items: order.items,
    }

    return NextResponse.json({ invoice, deliveryNote })
  } catch (error) {
    console.error("[SERVICES_PRO_INVOICES_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
