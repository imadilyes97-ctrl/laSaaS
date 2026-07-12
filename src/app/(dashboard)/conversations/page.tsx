"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { User, Search, MessageCircle, Clock, ChevronRight, Bot, Sparkles, Inbox, ArrowLeft } from "lucide-react"
import { format, parseISO, formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import type { Conversation, Message } from "@/lib/types"
import { LoadingSkeleton, EmptyState } from "@/components/PageStates"

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [mobilePanel, setMobilePanel] = useState<"list" | "chat">("list")

  const fetchConversations = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (data) setConversations(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchConversations()

    const supabase = createClient()
    const channel = supabase
      .channel("conversations-realtime-page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          fetchConversations()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const filtered = conversations.filter(
    (c) =>
      c.sender_id?.toLowerCase().includes(search.toLowerCase()) ||
      c.messages?.some((m) =>
        m.content?.toLowerCase().includes(search.toLowerCase())
      )
  )

  const handleSelectConv = (conv: Conversation) => {
    setSelectedConv(conv)
    setMobilePanel("chat")
  }

  const handleBackToList = () => {
    setMobilePanel("list")
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* ═══ Header ═══ */}
      <div className="page-header">
        <div className="flex items-center gap-2 mb-1">
          <h1>Conversations</h1>
          <Sparkles className="h-4 w-4 text-[#ff6b35] animate-pulse-soft" />
        </div>
        <p>
          {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
          {filtered.length < conversations.length && search && (
            <span className="text-[#64647a]"> · {filtered.length} trouvée{filtered.length !== 1 ? "s" : ""}</span>
          )}
        </p>
      </div>

      {/* ═══ Grid Layout ═══ */}
      <div className="relative grid gap-5 lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr] min-h-[65vh]">
        {/* ─── Mobile: hide sidebar when chat is open ─── */}
        <div className={`${mobilePanel === "chat" ? "hidden lg:block" : "block"} relative`}>
          <div className="glass rounded-2xl overflow-hidden h-full flex flex-col" style={{ maxHeight: "calc(100vh - 220px)" }}>
            {/* Search */}
            <div className="relative p-3 border-b border-[rgba(255,107,53,0.06)]">
              <div className="relative group">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[rgba(255,107,53,0.04)] to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64647a] group-focus-within:text-[#ff6b35] transition-colors duration-200" />
                <Input
                  placeholder="Rechercher dans les conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 text-sm bg-[#0f0a1e] border-[rgba(255,107,53,0.08)] rounded-xl placeholder:text-[#64647a]/60 focus:border-[rgba(255,107,53,0.25)] focus:ring-[rgba(255,107,53,0.08)] transition-all duration-200"
                />
              </div>
            </div>

            {/* Conversation count */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[rgba(255,107,53,0.04)]">
              <span className="text-xs font-medium text-[#64647a] uppercase tracking-wider">
                {search ? "RÉSULTATS" : "TOUTES LES CONVERSATIONS"}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(255,107,53,0.08)] text-[#ff6b35]">
                {filtered.length}
              </span>
            </div>

            {/* Conversation list */}
            <div
              className="flex-1 overflow-y-auto"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(255,107,53,0.15) transparent",
              }}
            >
              {filtered.length === 0 ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-center px-6">
                    <Inbox className="h-8 w-8 text-[#64647a] mx-auto mb-3 opacity-40" />
                    <p className="text-sm text-[#64647a]">
                      {search ? "Aucune conversation trouvée" : "Aucune conversation"}
                    </p>
                    {search && (
                      <p className="text-xs text-[#64647a]/60 mt-1">
                        Essayez de modifier votre recherche
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-1.5">
                  {filtered.map((conv, index) => {
                    const lastMsg = conv.messages?.[conv.messages.length - 1]
                    const isSelected = selectedConv?.id === conv.id
                    const msgCount = conv.messages?.length || 0
                    const unread = false // could be extended with an `unread` field

                    return (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConv(conv)}
                        className="group relative w-full text-left px-3 py-3 transition-all duration-200"
                        style={{
                          background: isSelected
                            ? "linear-gradient(135deg, rgba(255,107,53,0.08), rgba(255,107,53,0.02))"
                            : "transparent",
                        }}
                      >
                        {/* Hover background */}
                        <div
                          className={`absolute inset-0 transition-opacity duration-200 rounded-xl ${
                            isSelected ? "opacity-0" : "opacity-0 group-hover:opacity-100"
                          }`}
                          style={{
                            background: "linear-gradient(135deg, rgba(255,107,53,0.04), transparent)",
                          }}
                        />

                        {/* Selected indicator bar */}
                        <div
                          className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-full transition-all duration-300 ${
                            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                          }`}
                          style={{
                            background: isSelected
                              ? "linear-gradient(180deg, #ff6b35, #7c3aed)"
                              : "#ff6b35",
                            boxShadow: isSelected ? "0 0 8px rgba(255,107,53,0.4)" : "none",
                          }}
                        />

                        <div className="relative flex items-start gap-3">
                          {/* Avatar */}
                          <div
                            className={`relative shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                              isSelected
                                ? "bg-gradient-to-br from-[#ff6b35] to-[#7c3aed] shadow-lg shadow-[rgba(255,107,53,0.2)]"
                                : "bg-[rgba(255,107,53,0.08)] group-hover:bg-[rgba(255,107,53,0.12)]"
                            }`}
                          >
                            <User
                              className={`h-5 w-5 transition-colors duration-200 ${
                                isSelected ? "text-[#06030b]" : "text-[#ff6b35]"
                              }`}
                            />
                            {/* Online indicator */}
                            <span
                              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0f0a1e]"
                              style={{
                                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                boxShadow: "0 0 6px rgba(34,197,94,0.4)",
                              }}
                            />
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1 pt-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <p
                                className={`text-sm font-semibold truncate transition-colors duration-200 ${
                                  isSelected ? "text-[#fcfcfc]" : "text-[#fcfcfc]/90 group-hover:text-[#fcfcfc]"
                                }`}
                              >
                                {conv.sender_id || "Anonyme"}
                              </p>
                              <span className="text-[10px] text-[#64647a] whitespace-nowrap font-medium">
                                {formatDistanceToNow(parseISO(conv.created_at), { addSuffix: true, locale: fr })}
                              </span>
                            </div>

                            <p className="text-xs text-[#64647a] truncate mt-0.5 leading-relaxed">
                              {lastMsg?.content || (
                                <span className="italic opacity-60">Aucun message</span>
                              )}
                            </p>

                            <div className="flex items-center gap-2.5 mt-1.5">
                              <span className="flex items-center gap-1 text-[10px] text-[#64647a]/70">
                                <Clock className="h-2.5 w-2.5" />
                                {format(parseISO(conv.created_at), "dd MMM HH:mm", { locale: fr })}
                              </span>
                              {msgCount > 0 && (
                                <span className="flex items-center gap-1 text-[10px] text-[#64647a]/70">
                                  <MessageCircle className="h-2.5 w-2.5" />
                                  {msgCount}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Chevron */}
                          <ChevronRight
                            className={`h-4 w-4 mt-1.5 shrink-0 transition-all duration-200 ${
                              isSelected
                                ? "text-[#ff6b35] translate-x-0.5"
                                : "text-[#64647a]/40 group-hover:text-[#64647a] group-hover:translate-x-0.5"
                            }`}
                          />
                        </div>

                        {/* Bottom divider */}
                        <div
                          className="absolute bottom-0 left-12 right-3 h-px"
                          style={{
                            background: isSelected
                              ? "linear-gradient(90deg, rgba(255,107,53,0.08), transparent)"
                              : "rgba(255,107,53,0.04)",
                          }}
                        />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Chat Panel ─── */}
        <div className={`${mobilePanel === "list" ? "hidden lg:block" : "block"}`}>
          {selectedConv ? (
            <div
              className="glass rounded-2xl overflow-hidden h-full flex flex-col"
              style={{ maxHeight: "calc(100vh - 220px)" }}
            >
              {/* Chat header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,107,53,0.06)] shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile back button */}
                  <button
                    onClick={handleBackToList}
                    className="lg:hidden w-8 h-8 rounded-xl bg-[rgba(255,107,53,0.08)] flex items-center justify-center hover:bg-[rgba(255,107,53,0.14)] transition-colors shrink-0"
                  >
                    <ArrowLeft className="h-4 w-4 text-[#9d9db5]" />
                  </button>

                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#7c3aed] flex items-center justify-center shrink-0 shadow-lg shadow-[rgba(255,107,53,0.15)]">
                    <Bot className="h-5 w-5 text-[#06030b]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-[#fcfcfc] truncate">
                      {selectedConv.sender_id || "Anonyme"}
                    </h3>
                    <p className="text-[10px] text-[#64647a] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" style={{ boxShadow: "0 0 4px rgba(34,197,94,0.5)" }} />
                      En ligne
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#64647a]">
                  <Clock className="h-3 w-3" />
                  {format(parseISO(selectedConv.created_at), "dd MMM yyyy", { locale: fr })}
                </div>
              </div>

              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(255,107,53,0.12) transparent",
                }}
              >
                {(selectedConv.messages || []).length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="h-10 w-10 text-[#64647a] mx-auto mb-3 opacity-30" />
                      <p className="text-sm text-[#64647a]">Aucun message</p>
                      <p className="text-xs text-[#64647a]/60 mt-1">Cette conversation est vide</p>
                    </div>
                  </div>
                ) : (
                  (selectedConv.messages || []).map((msg: Message, i: number) => {
                    const isAssistant = msg.role === "assistant"
                    const showTimestamp = i === 0 ||
                      (selectedConv.messages?.[i - 1]?.role !== msg.role)

                    return (
                      <div key={i} className="space-y-1">
                        {showTimestamp && (
                          <div className="flex justify-center">
                            <span className="text-[10px] text-[#64647a]/50 px-2 py-1 rounded-full bg-[rgba(255,107,53,0.03)]">
                              {msg.timestamp
                                ? format(parseISO(msg.timestamp), "dd MMM HH:mm", { locale: fr })
                                : ""}
                            </span>
                          </div>
                        )}

                        <div
                          className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`relative max-w-[80%] md:max-w-[70%] px-4 py-2.5 ${
                              isAssistant
                                ? "rounded-2xl rounded-tl-sm"
                                : "rounded-2xl rounded-br-sm"
                            }`}
                            style={
                              isAssistant
                                ? {
                                    background: "linear-gradient(135deg, rgba(255,107,53,0.12), rgba(255,107,53,0.05))",
                                    border: "1px solid rgba(255,107,53,0.1)",
                                    boxShadow: "0 2px 8px rgba(255,107,53,0.06)",
                                  }
                                : {
                                    background: "linear-gradient(135deg, #ff6b35, #e85d2a)",
                                    border: "1px solid rgba(255,107,53,0.2)",
                                    boxShadow: "0 4px 12px rgba(255,107,53,0.2)",
                                  }
                            }
                          >
                            {/* Accent glow on assistant messages */}
                            {isAssistant && (
                              <div
                                className="absolute -top-px -left-px right-1/2 h-px rounded-full pointer-events-none"
                                style={{
                                  background: "linear-gradient(90deg, rgba(255,107,53,0.3), transparent)",
                                }}
                              />
                            )}

                            <p
                              className={`text-sm leading-relaxed ${
                                isAssistant ? "text-[#e8e8f0]" : "text-[#06030b] font-medium"
                              }`}
                            >
                              {msg.content}
                            </p>
                            <p
                              className={`text-[10px] mt-1.5 ${
                                isAssistant ? "text-[#64647a]/70" : "text-[#06030b]/60"
                              }`}
                            >
                              {msg.timestamp
                                ? format(parseISO(msg.timestamp), "HH:mm", { locale: fr })
                                : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Footer area */}
              <div className="shrink-0 px-5 py-3 border-t border-[rgba(255,107,53,0.06)]">
                <div className="flex items-center gap-2 text-[10px] text-[#64647a]/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-[rgba(255,107,53,0.2)]" />
                  {selectedConv.messages?.length || 0} message{(selectedConv.messages?.length || 0) !== 1 ? "s" : ""}
                  <span className="mx-1 opacity-30">·</span>
                  Créée le {format(parseISO(selectedConv.created_at), "dd/MM/yyyy", { locale: fr })}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl overflow-hidden h-full flex items-center justify-center" style={{ minHeight: "calc(100vh - 220px)" }}>
              <div className="text-center px-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[rgba(255,107,53,0.1)] to-[rgba(124,58,237,0.1)] flex items-center justify-center mx-auto mb-5 border border-[rgba(255,107,53,0.06)]">
                  <MessageCircle className="h-7 w-7 text-[#ff6b35]/60" />
                </div>
                <h3 className="text-base font-semibold text-[#9d9db5] mb-1.5">Sélectionnez une conversation</h3>
                <p className="text-sm text-[#64647a] max-w-[260px] mx-auto leading-relaxed">
                  Choisissez une conversation dans la liste pour consulter les messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
