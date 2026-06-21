'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, MessageSquare, Sparkles } from 'lucide-react'

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: "Combien de temps prend la configuration ?",
      answer: "Moins de 10 minutes ! Il vous suffit de créer votre compte, connecter votre page Facebook Messenger, et ajouter vos produits. Notre assistant vous guide à chaque étape."
    },
    {
      question: "Puis-je personnaliser les réponses du chatbot ?",
      answer: "Absolument ! Depuis le dashboard, vous pouvez personnaliser le message de bienvenue, les réponses aux questions fréquentes, et même créer des flux de conversation spécifiques à vos produits."
    },
    {
      question: "Comment les commandes sont-elles gérées ?",
      answer: "Yasmine prend les commandes automatiquement via Messenger et les enregistre dans votre dashboard. Vous recevez une notification instantanée et pouvez suivre l'état de chaque commande."
    },
    {
      question: "Est-ce compatible avec tous les types de boutiques ?",
      answer: "Oui ! LinkFlow est conçu pour tous les types de boutiques en ligne, que vous vendiez des vêtements, des accessoires, des produits électroniques ou autres."
    },
    {
      question: "Quel est le coût de LinkFlow ?",
      answer: "Nous proposons un essai gratuit pour commencer. Nos tarifs sont basés sur le volume de commandes, avec des forfaits adaptés aux petites et grandes boutiques."
    },
    {
      question: "Puis-je essayer avant de m'engager ?",
      answer: "Bien sûr ! Vous pouvez tester notre démo interactive ci-dessus et créer un compte gratuitement sans engagement. Aucune carte bancaire requise pour commencer."
    }
  ]

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="relative w-full py-24 sm:py-32 px-4 sm:px-6" style={{ background: '#07050a' }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 30% at 50% 100%, rgba(255, 107, 53, 0.03) 0%, transparent 60%)',
      }} />

      <div className="relative max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <div className="tag mb-4">FAQ</div>
          <h2 className="text-[#fcfcfc] text-3xl sm:text-4xl md:text-5xl font-medium mb-4" style={{ fontFamily: "'Instrument Serif', Georgia, serif", letterSpacing: '-0.03em' }}>
            Questions Fréquentes
          </h2>
          <p className="text-[#a0a0b8] text-sm sm:text-base max-w-xl mx-auto">
            Vous avez des questions ? Nous avons les réponses. Si vous ne trouvez pas ce que vous cherchez, contactez-nous !
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl overflow-hidden transition-all duration-300"
              style={{
                background: 'linear-gradient(180deg, rgba(255, 107, 53, 0.03) 0%, transparent 100%)',
                border: '1px solid rgba(255, 107, 53, 0.08)',
                transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-[rgba(255,107,53,0.03)] transition-colors duration-200"
                style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
              >
                <span className="text-[#fcfcfc] font-medium text-sm sm:text-base pr-4">
                  {faq.question}
                </span>
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                  openIndex === index ? 'bg-[rgba(255,107,53,0.15)]' : 'bg-[rgba(255,107,53,0.06)]'
                }`}>
                  {openIndex === index ? (
                    <ChevronUp className="w-4 h-4 text-[#ff6b35]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#a0a0b8]" />
                  )}
                </div>
              </button>

              <div
                className={`overflow-hidden transition-all duration-300`}
                style={{
                  maxHeight: openIndex === index ? '500px' : '0',
                  transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                }}
              >
                <div className="px-5 pb-5 pt-0">
                  <div className="w-full h-px bg-[rgba(255,107,53,0.06)] mb-4" />
                  <p className="text-[#a0a0b8] text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-[#6b6b80] mb-5 text-sm">Vous ne trouvez pas votre réponse ?</p>
          <button
            onClick={() => {
              const section = document.getElementById('comment')
              if (section) section.scrollIntoView({ behavior: 'smooth' })
            }}
            className="inline-flex items-center gap-2 bg-[#ff6b35] hover:bg-[#e55a2b] text-[#07050a] text-sm font-semibold px-6 py-3 rounded-full transition-all duration-200 shadow-lg shadow-[#ff6b35]/20"
          >
            <MessageSquare className="w-4 h-4" />
            Essayez la démo
          </button>
        </div>
      </div>
    </section>
  )
}
