"use client"

import { useState, useEffect } from "react"
import { Trash2, ShoppingBag, ArrowLeft, CreditCard } from "lucide-react"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import { useCart } from "@/lib/cart-context"
import { AnimatedDiv } from "@/lib/animations"

import Link from "next/link"

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCart()
  const [taxRate, setTaxRate] = useState(19.25)

  useEffect(() => {
    fetch("/api/taxes?countryId=CM").then(r => r.json()).then(data => {
      setTaxRate(data.rate ?? 19.25)
    })
  }, [])

  const tva = Math.round(subtotal * taxRate / 100)
  const livraison = subtotal >= 50000 ? 0 : 5000
  const total = subtotal + tva + livraison

  if (items.length === 0) {
    return (
      <div className="w-full min-h-screen bg-[var(--bg-primary)]">
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-[var(--text-secondary)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Votre panier est vide</h1>
          <p className="text-[var(--text-secondary)] mb-6">Découvrez nos produits et ajoutez-les à votre panier</p>
          <Link href="/produits">
            <Button size="lg">Découvrir les produits</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)]">Mon panier</h1>
            <p className="text-[var(--text-secondary)]">{items.reduce((s, i) => s + i.quantity, 0)} article(s)</p>
          </div>
          <Button variant="ghost" onClick={clearCart}>
            <Trash2 className="w-4 h-4" /> Vider
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <AnimatedDiv key={item.product.id} fade slideUp className="flex gap-4 p-4 rounded-2xl border-2 border-[var(--border)]">
                <Link href={`/produit/${item.product.slug}`} className="w-24 h-24 rounded-xl bg-[var(--bg-secondary)] overflow-hidden shrink-0">
                  <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-[var(--text-link)] font-semibold">{item.product.brand}</p>
                      <Link href={`/produit/${item.product.slug}`}><h3 className="font-semibold text-[var(--text-primary)] hover:text-[var(--text-link)] transition-colors">{item.product.name}</h3></Link>
                      <p className="text-lg font-bold text-[var(--text-primary)] mt-1">{item.product.price.toLocaleString("fr-FR")} F</p>
                    </div>
                    <button onClick={() => removeItem(item.product.id)} className="p-2 rounded-xl hover:bg-red-50 text-[var(--text-secondary)] hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center border-2 border-[var(--border)] rounded-xl overflow-hidden">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-9 h-9 flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors font-semibold">-</button>
                      <span className="w-10 text-center font-semibold text-[var(--text-primary)] text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-9 h-9 flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors font-semibold">+</button>
                    </div>
                    <p className="text-sm font-semibold text-[var(--text-primary)] ml-auto">{(item.product.price * item.quantity).toLocaleString("fr-FR")} F</p>
                  </div>
                </div>
              </AnimatedDiv>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border-2 border-[var(--border)] p-6 space-y-4">
              <h3 className="font-bold text-[var(--text-primary)] text-lg">Résumé de la commande</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">Sous-total</span><span className="font-semibold text-[var(--text-primary)]">{subtotal.toLocaleString("fr-FR")} F</span></div>
                <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">TVA ({taxRate}%)</span><span className="font-semibold text-[var(--text-primary)]">{tva.toLocaleString("fr-FR")} F</span></div>
                <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">Livraison</span><span className="font-semibold text-[var(--text-primary)]">{livraison === 0 ? "Gratuite" : `${livraison.toLocaleString("fr-FR")} F`}</span></div>
                <hr className="border-[var(--border)]" />
                <div className="flex justify-between"><span className="font-bold text-[var(--text-primary)]">Total</span><span className="text-2xl font-bold text-[var(--text-link)]">{total.toLocaleString("fr-FR")} F</span></div>
              </div>
              <Link href="/checkout">
                <Button fullWidth size="lg">
                  <CreditCard className="w-5 h-5" />
                  Commander
                </Button>
              </Link>
              <Link href="/produits" className="block text-center text-sm text-[var(--text-secondary)] hover:text-[var(--text-link)] transition-colors">
                Continuer mes achats
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
