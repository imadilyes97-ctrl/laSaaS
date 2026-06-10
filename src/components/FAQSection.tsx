'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'

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
    <section className="relative w-full py-20 sm:py-28 px-4 sm:px-6 bg-cyber-bg">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-white text-3xl sm:text-4xl md:text-5xl font-semibold mb-4">
            Questions Fréquentes
          </h2>
          <p className="text-cyber-textSecondary text-sm sm:text-base max-w-2xl mx-auto">
            Vous avez des questions ? Nous avons les réponses. Si vous ne trouvez pas ce que vous cherchez, contactez-nous !
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-cyber-bgCard border border-cyber-border/50 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-cyber-bgHover transition-colors"
              >
                <span className="text-white font-medium text-sm sm:text-base">
                  {faq.question}
                </span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-cyber-cyan" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-cyber-textSecondary" />
                )}
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96' : 'max-h-0'}`}
                style={{ transitionProperty: 'max-height' }}
              >
                <div className="p-5 pt-0">
                  <p className="text-cyber-textSecondary text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-cyber-textSecondary mb-4">Vous ne trouvez pas votre réponse ?</p>
          <button
            onClick={() => {
              const section = document.getElementById('comment')
              if (section) section.scrollIntoView({ behavior: 'smooth' })
            }}
            className="bg-cyber-cyan hover:bg-cyber-blue text-cyber-bg px-6 py-3 rounded-full font-medium transition-colors inline-flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Essayez la démo
          </button>
        </div>
      </div>
    </section>
  )
}