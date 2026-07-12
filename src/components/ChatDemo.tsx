'use client'

import { useState, useEffect, useRef } from 'react'
import { Bot, User, Send, MessageSquare } from 'lucide-react'

export default function ChatDemo() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Bonjour ! Je suis Yasmine, votre assistante pour LinkFlow. Comment puis-je vous aider aujourd'hui ?" }
  ])
  const [input, setInput] = useState('')
  const [step, setStep] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [visibleMessages, setVisibleMessages] = useState<Set<number>>(new Set([0]))
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const msgContainerRef = useRef<HTMLDivElement>(null)

  const demoSteps = [
    { user: "Je voudrais commander une robe", delay: 800 },
    { assistant: "Bien sûr ! Quelle taille et couleur souhaitez-vous ? Voici nos modèles disponibles :", delay: 1200 },
    { user: "Taille M en bleu", delay: 800 },
    { assistant: "Parfait ! Pour finaliser, pouvez-vous me donner votre nom et numéro de téléphone ?", delay: 1200 },
    { user: "Marie Dupont, 0612345678", delay: 800 },
    { assistant: "Commande enregistrée ! Vous recevrez un SMS de confirmation sous peu. Merci Marie ! 🎉", delay: 1200 }
  ]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 🎬 Animate new messages appearing
  useEffect(() => {
    if (messages.length > visibleMessages.size) {
      const lastIdx = messages.length - 1
      const timer = setTimeout(() => {
        setVisibleMessages(prev => new Set(prev).add(lastIdx))
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [messages.length, visibleMessages])

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { role: 'user', content: input }])
      setInput('')
      setIsTyping(true)

      setTimeout(() => {
        if (step < demoSteps.length) {
          const next = demoSteps[step]
          const role = next.user ? 'user' : 'assistant'
          const content = next[role] as string
          setMessages(prev => [...prev, { role, content }])
          setStep(step + 1)
          setIsTyping(false)
        }
      }, demoSteps[step]?.delay || 800)
    }
  }

  const handleQuickReply = (text: string) => {
    setInput(text)
    setTimeout(() => {
      const inputElement = document.getElementById('chat-input') as HTMLInputElement
      if (inputElement) inputElement.focus()
    }, 50)
  }

  return (
    <div className="rounded-2xl p-4 max-w-md mx-auto w-full transition-all duration-300 hover:shadow-xl hover:shadow-[#ff6b35]/5" style={{
      background: 'linear-gradient(180deg, rgba(15,10,30,0.9), rgba(15,10,30,0.6))',
      border: '1px solid rgba(255,107,53,0.1)',
      backdropFilter: 'blur(12px)',
    }}>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4 pb-3" style={{ borderBottom: '1px solid rgba(255,107,53,0.06)' }}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f72585] flex items-center justify-center shadow-lg shadow-[#ff6b35]/20 animate-glow-pulse">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#fcfcfc]">Yasmine</p>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]" />
            </span>
            <p className="text-[10px] text-[#22c55e] font-medium">En ligne</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={msgContainerRef} className="h-80 overflow-y-auto space-y-3 mb-4 pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,107,53,0.15) transparent' }}>
        {messages.map((msg, i) => {
          const isVisible = visibleMessages.has(i)
          return (
            <div
              key={i}
              className={`flex transition-all duration-500 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed transition-all duration-200 ${
                  msg.role === 'user'
                    ? 'text-[#06030b] shadow-lg shadow-[#ff6b35]/10'
                    : 'text-[#9d9db5] border'
                } ${isVisible ? 'scale-100' : 'scale-95'}`}
                style={msg.role === 'user'
                  ? { background: 'linear-gradient(135deg, #ff6b35, #f72585)' }
                  : { background: 'rgba(11,7,22,0.8)', borderColor: 'rgba(255,107,53,0.08)' }
                }
              >
                {msg.content}
              </div>
            </div>
          )
        })}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="max-w-[80%] p-3 rounded-2xl flex items-center gap-2" style={{ background: 'rgba(11,7,22,0.8)', border: '1px solid rgba(255,107,53,0.08)' }}>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[#64647a] rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '0.6s' }} />
                <div className="w-2 h-2 bg-[#64647a] rounded-full animate-bounce" style={{ animationDelay: '0.15s', animationDuration: '0.6s' }} />
                <div className="w-2 h-2 bg-[#64647a] rounded-full animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '0.6s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies */}
      <div className="space-y-2 mb-3">
        <p className="text-[10px] text-[#64647a] flex items-center gap-1.5 font-medium uppercase tracking-wider">
          <MessageSquare className="w-3 h-3" />
          Suggestions
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            "Je veux commander une robe",
            "Quels sont vos horaires ?",
            "Combien coûte la livraison ?",
          ].map((text, i) => (
            <button
              key={i}
              onClick={() => handleQuickReply(text)}
              className="px-3 py-1.5 rounded-full text-xs transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'rgba(11,7,22,0.8)',
                border: '1px solid rgba(255,107,53,0.1)',
                color: '#9d9db5',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,107,53,0.3)'; e.currentTarget.style.color = '#fcfcfc' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,107,53,0.1)'; e.currentTarget.style.color = '#9d9db5' }}
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écrivez votre message..."
          className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 focus:ring-1"
          style={{
            background: 'rgba(11,7,22,0.8)',
            border: '1px solid rgba(255,107,53,0.1)',
            color: '#fcfcfc',
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isTyping}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="p-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100"
          style={{
            background: input.trim() ? 'linear-gradient(135deg, #ff6b35, #f72585)' : 'rgba(255,107,53,0.1)',
            opacity: !input.trim() || isTyping ? 0.5 : 1,
          }}
        >
          <Send className={`w-4 h-4 ${input.trim() ? 'text-[#06030b]' : 'text-[#64647a]'}`} />
        </button>
      </div>
    </div>
  )
}
