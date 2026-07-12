import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import MouseGlow from "@/components/MouseGlow"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "LinkFlow — Automatise ta boutique avec un chatbot intelligent",
  description:
    "Yasmine répond à tes clients 24h/24, prend les commandes automatiquement et gère ton stock depuis un seul dashboard. Le chatbot IA qui booste tes ventes.",
  keywords: ["chatbot", "e-commerce", "algérie", "automatisation", "boutique en ligne", "messenger"],
  openGraph: {
    title: "LinkFlow — Chatbot IA pour ta boutique",
    description: "Automatise tes ventes avec Yasmine, ton assistante IA 24h/24",
    type: "website",
    locale: "fr_FR",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>" />
      </head>
      <body className="min-h-full bg-[#06030b] text-[#fcfcfc]">
        <MouseGlow />
        <div className="top-bar" />
        {children}
      </body>
    </html>
  )
}
