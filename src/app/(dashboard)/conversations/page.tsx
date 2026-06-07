"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { User, Search, MessageCircle, Clock } from "lucide-react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import type { Conversation, Message } from "@/lib/types"

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Conversations</h1>
        <p className="text-muted-foreground">
          {conversations.length} conversation(s)
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {filtered.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                      selectedConv?.id === conv.id ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {conv.sender_id || "Anonyme"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.messages?.[conv.messages.length - 1]?.content ||
                            "Aucun message"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {format(parseISO(conv.created_at), "dd/MM/yyyy HH:mm", {
                            locale: fr,
                          })}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    Aucune conversation trouvée
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedConv
                  ? selectedConv.sender_id || "Anonyme"
                  : "Sélectionnez une conversation"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedConv ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {(selectedConv.messages || []).map((msg: Message, i: number) => (
                    <div
                      key={i}
                      className={`flex ${
                        msg.role === "assistant" ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.role === "assistant"
                            ? "bg-muted"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {msg.timestamp
                            ? format(parseISO(msg.timestamp), "HH:mm", {
                                locale: fr,
                              })
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!selectedConv.messages ||
                    selectedConv.messages.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">
                      Aucun message dans cette conversation
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <p>Sélectionnez une conversation pour voir les messages</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
