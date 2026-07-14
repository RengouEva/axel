"use client"

import { useState, useEffect } from "react"
import { MessageSquare, Send, Plus, Trash2 } from "lucide-react"
import Button from "@/components/ui/button"
import toast from "react-hot-toast"
import { useAuth } from "@/lib/auth-context"

export default function CommunicationPage() {
  const { getAuthHeaders } = useAuth()
  const [tab, setTab] = useState("messages")
  const [messages, setMessages] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [templates, setTemplates] = useState<any[]>([])
  const [autoReplies, setAutoReplies] = useState<any[]>([])
  const [replyText, setReplyText] = useState("")
  const [selectedMsg, setSelectedMsg] = useState<string | null>(null)

  const loadData = async () => {
    const [msgData, tmplData, autoData] = await Promise.all([
      fetch("/api/vendeur/services-pro/messaging", { headers: getAuthHeaders() }).then(r => r.json()),
      fetch("/api/vendeur/services-pro/messaging/templates", { headers: getAuthHeaders() }).then(r => r.json()),
      fetch("/api/vendeur/services-pro/messaging/auto-replies", { headers: getAuthHeaders() }).then(r => r.json()),
    ])
    setMessages(msgData.messages || [])
    setUnreadCount(msgData.unreadCount || 0)
    setTemplates(tmplData.templates || [])
    setAutoReplies(autoData.autoReplies || [])
  }

  useEffect(() => { loadData() }, [])

  const handleReply = async () => {
    if (!selectedMsg || !replyText) return
    const res = await fetch("/api/vendeur/services-pro/messaging", {
      method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ action: "reply", messageId: selectedMsg, message: replyText }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error || "Erreur lors de l'envoi"); return }
    toast.success("Réponse envoyée"); setReplyText(""); loadData()
  }

  const tabs = [
    { id: "messages", label: `Messages (${unreadCount})` },
    { id: "templates", label: "Modèles" },
    { id: "auto", label: "Réponses auto" },
  ]

  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)] p-6">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-8 h-8 text-[var(--text-link)]" />
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Communication client</h1>
          <p className="text-sm text-[var(--text-secondary)]">Messagerie, modèles et réponses automatiques</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === t.id ? "bg-[var(--text-link)] text-white" : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border)]"}`}>{t.label}</button>
        ))}
      </div>

      <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-6">
        {tab === "messages" && (
          <div className="space-y-3">
            {messages.map((msg: any) => (
              <div key={msg.id} className={`p-4 rounded-xl bg-[var(--bg-secondary)] ${msg.isRead ? "" : "border-l-4 border-[var(--text-link)]"}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm text-[var(--text-primary)]">{msg.subject}</p>
                  <span className="text-xs text-[var(--text-secondary)]">{new Date(msg.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-2">{msg.userName} - {msg.message.substring(0, 100)}...</p>
                {msg.replies?.map((r: any) => (
                  <p key={r.id} className="text-xs text-[var(--text-muted)] ml-4">→ {r.message.substring(0, 80)}...</p>
                ))}
                <div className="flex gap-2 mt-2">
                  <input value={selectedMsg === msg.id ? replyText : ""}
                    onChange={e => { setSelectedMsg(msg.id); setReplyText(e.target.value) }}
                    placeholder="Votre réponse..." className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-1.5 text-sm text-[var(--text-primary)]" />
                  <button onClick={() => { setSelectedMsg(msg.id); handleReply() }} className="p-2 rounded-lg bg-[var(--text-link)]/10 text-[var(--text-link)]">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {messages.length === 0 && <p className="text-sm text-[var(--text-secondary)] text-center py-4">Aucun message</p>}
          </div>
        )}

        {tab === "templates" && <TemplatesSection templates={templates} onUpdate={loadData} />}
        {tab === "auto" && <AutoRepliesSection autoReplies={autoReplies} onUpdate={loadData} />}
      </div>
    </div>
  )
}

function TemplatesSection({ templates, onUpdate }: { templates: any[]; onUpdate: () => void }) {
  const { getAuthHeaders } = useAuth()
  const [form, setForm] = useState({ name: "", subject: "", body: "", category: "general" })
  const create = async () => {
    const res = await fetch("/api/vendeur/services-pro/messaging/templates", {
      method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() }, body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error || "Erreur"); return }
    toast.success("Modèle créé"); setForm({ name: "", subject: "", body: "", category: "general" }); onUpdate()
  }
  return (
    <div className="space-y-4">
      {templates.map((t: any) => (
        <div key={t.id} className="p-3 rounded-xl bg-[var(--bg-secondary)] text-sm">
          <p className="font-semibold text-[var(--text-primary)]">{t.name}</p>
          <p className="text-xs text-[var(--text-secondary)]">{t.subject}</p>
        </div>
      ))}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[var(--border)]">
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom du modèle" className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-primary)]" />
        <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Objet" className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-primary)]" />
        <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Contenu du message" className="col-span-2 rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-primary)]" rows={3} />
        <Button onClick={create}><Plus className="w-4 h-4" /> Ajouter</Button>
      </div>
    </div>
  )
}

function AutoRepliesSection({ autoReplies, onUpdate }: { autoReplies: any[]; onUpdate: () => void }) {
  const { getAuthHeaders } = useAuth()
  const [form, setForm] = useState({ keyword: "", replyMessage: "", matchType: "contains" })
  const create = async () => {
    const res = await fetch("/api/vendeur/services-pro/messaging/auto-replies", {
      method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() }, body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error || "Erreur"); return }
    toast.success("Réponse auto créée"); setForm({ keyword: "", replyMessage: "", matchType: "contains" }); onUpdate()
  }
  return (
    <div className="space-y-4">
      {autoReplies.map((a: any) => (
        <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] text-sm">
          <span className="text-[var(--text-primary)] font-semibold">{a.keyword}</span>
          <span className="text-[var(--text-secondary)] text-xs">{a.replyMessage.substring(0, 60)}...</span>
        </div>
      ))}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[var(--border)]">
        <input value={form.keyword} onChange={e => setForm(f => ({ ...f, keyword: e.target.value }))} placeholder="Mot-clé" className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-primary)]" />
        <select value={form.matchType} onChange={e => setForm(f => ({ ...f, matchType: e.target.value }))} className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-primary)]">
          <option value="contains">Contient</option>
          <option value="exact">Exact</option>
        </select>
        <textarea value={form.replyMessage} onChange={e => setForm(f => ({ ...f, replyMessage: e.target.value }))} placeholder="Message de réponse" className="col-span-2 rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-primary)]" rows={2} />
        <Button onClick={create}><Plus className="w-4 h-4" /> Ajouter</Button>
      </div>
    </div>
  )
}
