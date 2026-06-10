'use client'

import { useState, useEffect, useRef } from 'react'
import { Bot, User, Send, CheckCircle2, ShoppingCart, MessageSquare } from 'lucide-react'

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { role: 'user', content: input }])
      setInput('')
      setIsTyping(true)

      setTimeout(() => {
        if (step < demoSteps.length) {
          const next = demoSteps[step]
          setMessages(prev => [...prev, { role: next.user ? 'user' : 'assistant', content: next[next.user ? 'user' : 'assistant'] }])
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
      if (inputElement) {
        inputElement.focus()
      }
    }, 50)
  }

  return (
    <div className="bg-cyber-bgCard border border-cyber-border/50 rounded-xl p-4 max-w-md mx-auto w-full">
      <div className="h-80 overflow-y-auto space-y-3 mb-4 pr-2" style={{ scrollbarWidth: 'thin' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-cyber-cyan text-cyber-bg' : 'bg-cyber-bgSecond border border-cyber-border'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg bg-cyber-bgSecond border border-cyber-border flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-cyber-textSecondary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-1.5 h-1.5 bg-cyber-textSecondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-cyber-textSecondary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="space-y-2 mb-3">
        <div className="text-xs text-cyber-textSecondary flex items-center gap-2 mb-2">
          <MessageSquare className="w-3 h-3" />
          Essayez ces exemples :
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            "Je veux commander une robe",
            "Quels sont vos horaires ?",
            "Combien coûte la livraison ?",
            "Avez-vous des robes en taille L ?"
          ].map((text, i) => (
            <button
              key={i}
              onClick={() => handleQuickReply(text)}
              className="px-3 py-1 bg-cyber-bgSecond border border-cyber-border rounded-full text-xs hover:bg-cyber-bgHover transition-colors"
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <input
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écrivez votre message..."
          className="flex-1 px-3 py-2 bg-cyber-bgSecond border border-cyber-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-cyber-cyan"
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          disabled={isTyping}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className={`p-2 rounded-lg disabled:opacity-50 transition-colors ${input.trim() ? 'bg-cyber-cyan hover:bg-cyber-blue' : 'bg-cyber-border'}`}
        >
          <Send className={`w-4 h-4 ${input.trim() ? 'text-cyber-bg' : 'text-cyber-textSecondary'}`} />
        </button>
      </div>
    </div>
  )
}