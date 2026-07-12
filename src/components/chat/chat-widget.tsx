"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Bot, User } from "lucide-react"

const initialMessages = [
  { id: 1, role: "bot", text: "Bonjour ! Je suis l'assistant AXEL. Comment puis-je vous aider ?" },
]

const autoReplies: Record<string, string> = {
  "bonjour": "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
  "credit": "Notre crédit vous permet de payer en 3 à 36 mois. La simulation est gratuite et sans engagement. Voulez-vous simuler un crédit ?",
  "livraison": "Nous livrons sous 24 à 72h partout. La livraison est gratuite dès 50 000 F d'achat.",
  "retour": "Vous disposez de 30 jours pour retourner un produit. Les retours sont gratuits.",
  "paiement": "Nous acceptons Visa, Mastercard, Orange Money, MTN Mobile Money, Wave et PayPal.",
  "commande": "Vous pouvez suivre votre commande depuis votre espace client dans 'Mes commandes'.",
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      inputRef.current?.focus()
    }
  }, [messages, isOpen])

  const handleSend = () => {
    if (!input.trim()) return
    const userMsg = { id: Date.now(), role: "user" as const, text: input }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsTyping(true)

    setTimeout(() => {
      const lower = input.toLowerCase()
      let reply = "Je n'ai pas compris votre demande. Pouvez-vous reformuler ?"
      for (const [key, value] of Object.entries(autoReplies)) {
        if (lower.includes(key)) { reply = value; break }
      }
      setMessages((prev) => [...prev, { id: Date.now() + 1, role: "bot", text: reply }])
      setIsTyping(false)
    }, 1000)
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Ouvrir le chat d'assistance"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl gradient-axel text-white shadow-axel-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center z-50"
        >
          <MessageCircle className="w-6 h-6" aria-hidden="true" />
        </button>
      )}

      {isOpen && (
        <div
          role="dialog"
          aria-label="Chat d'assistance AXEL"
          aria-modal="true"
          className="fixed bottom-6 right-6 w-80 sm:w-96 rounded-2xl bg-[var(--bg-primary)] shadow-axel-xl border-2 border-[var(--border)] overflow-hidden z-50 animate-fadeIn"
        >
          <div className="gradient-axel p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center" aria-hidden="true">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Assistant AXEL</p>
                <p className="text-[10px] text-white/60">En ligne</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Fermer le chat"
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white" aria-hidden="true" />
            </button>
          </div>

          <div className="h-80 overflow-y-auto p-4 space-y-3 bg-[var(--bg-secondary)]" role="log" aria-live="polite">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex items-start gap-2 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${msg.role === "bot" ? "gradient-axel" : "bg-[var(--bg-inverse)]"}`} aria-hidden="true">
                    {msg.role === "bot" ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm ${msg.role === "user" ? "gradient-axel text-white" : "bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)]"}`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-2" aria-label="L'assistant est en train d'écrire">
                <div className="w-8 h-8 rounded-xl gradient-axel flex items-center justify-center" aria-hidden="true"><Bot className="w-4 h-4 text-white" /></div>
                <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl p-3">
                  <div className="flex gap-1"><span className="w-2 h-2 rounded-full bg-[#64748B] animate-bounce" style={{ animationDelay: "0ms" }} /><span className="w-2 h-2 rounded-full bg-[#64748B] animate-bounce" style={{ animationDelay: "150ms" }} /><span className="w-2 h-2 rounded-full bg-[#64748B] animate-bounce" style={{ animationDelay: "300ms" }} /></div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-[var(--border)] flex gap-2">
            <label htmlFor="chat-input" className="sr-only">Votre message</label>
            <input
              ref={inputRef}
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Écrivez votre message..."
              className="flex-1 px-4 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--border-hover)] focus:outline-none transition-all"
            />
            <button
              onClick={handleSend}
              aria-label="Envoyer le message"
              className="w-10 h-10 rounded-xl gradient-axel flex items-center justify-center hover:scale-105 transition-transform"
            >
              <Send className="w-4 h-4 text-white" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
