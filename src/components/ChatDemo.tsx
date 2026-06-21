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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const demoSteps = [
    { user: "Je voudrais commander une robe", delay: 1000 },
    { assistant: "Bien sûr ! Quelle taille et couleur souhaitez-vous ? Voici nos modèles disponibles : [photos]", delay: 1500 },
    { user: "Taille M en bleu", delay: 1000 },
    { assistant: "Parfait ! Pour finaliser, pouvez-vous me donner votre nom et numéro de téléphone ?", delay: 1500 },
    { user: "Marie Dupont, 0612345678", delay: 1000 },
    { assistant: "Commande enregistrée ! Vous recevrez un SMS de confirmation sous peu. Merci Marie ! 🎉", delay: 1500 }
  ]

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
      }, demoSteps[step]?.delay || 1000)
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
    <div className="rounded-xl p-4 max-w-md mx-auto w-full" style={{ background: '#120f1e', border: '1px solid rgba(255,107,53,0.1)' }}>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4 pb-3" style={{ borderBottom: '1px solid rgba(255,107,53,0.06)' }}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff6b35] to-[#f72585] flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#fcfcfc]">Yasmine</p>
          <p className="text-xs text-[#6b6b80]">En ligne</p>
        </div>
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto space-y-3 mb-4 pr-2" style={{ scrollbarWidth: 'thin' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] p-3 rounded-lg text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'text-[#07050a]'
                  : 'text-[#a0a0b8] border'
              }`}
              style={msg.role === 'user'
                ? { background: 'linear-gradient(135deg, #ff6b35, #f72585)' }
                : { background: '#0c0a14', borderColor: 'rgba(255,107,53,0.08)' }
              }
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg flex items-center gap-2" style={{ background: '#0c0a14', border: '1px solid rgba(255,107,53,0.08)' }}>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-[#6b6b80] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-1.5 h-1.5 bg-[#6b6b80] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-1.5 h-1.5 bg-[#6b6b80] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick replies */}
      <div className="space-y-2 mb-3">
        <p className="text-xs text-[#6b6b80] flex items-center gap-1.5">
          <MessageSquare className="w-3 h-3" />
          Essayez ces exemples :
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
              className="px-3 py-1 rounded-full text-xs transition-colors"
              style={{
                background: '#0c0a14',
                border: '1px solid rgba(255,107,53,0.1)',
                color: '#a0a0b8',
              }}
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
          className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
          style={{
            background: '#0c0a14',
            border: '1px solid rgba(255,107,53,0.1)',
            color: '#fcfcfc',
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={isTyping}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="p-2 rounded-lg transition-colors"
          style={{
            background: input.trim() ? '#ff6b35' : 'rgba(255,107,53,0.1)',
            opacity: !input.trim() || isTyping ? 0.5 : 1,
          }}
        >
          <Send className={`w-4 h-4 ${input.trim() ? 'text-[#07050a]' : 'text-[#6b6b80]'}`} />
        </button>
      </div>
    </div>
  )
}
