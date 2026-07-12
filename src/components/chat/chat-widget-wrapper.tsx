"use client"

import dynamic from "next/dynamic"

const ChatWidget = dynamic(() => import("@/components/chat/chat-widget"), {
  ssr: false,
  loading: () => null,
})

export default function ChatWidgetWrapper() {
  return <ChatWidget />
}
