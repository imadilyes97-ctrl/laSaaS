"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, LogIn } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#f72585] flex items-center justify-center shadow-lg shadow-[#ff6b35]/20 mb-4">
          <span className="text-white text-xl font-bold" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>L</span>
        </div>
        <h1 className="text-[#fcfcfc] text-xl font-medium" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>LinkFlow</h1>
      </div>

      <Card className="w-full border-[rgba(255,107,53,0.1)] shadow-xl shadow-black/20">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl text-[#fcfcfc]">Content de te revoir</CardTitle>
          <CardDescription className="text-[#a0a0b8]">Connecte-toi à ton dashboard</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 pt-4">
            {error && (
              <div className="text-sm text-[#ef4444] bg-[rgba(239,68,68,0.1)] p-3 rounded-lg border border-[rgba(239,68,68,0.15)]">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#a0a0b8] text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#0c0a14] border-[rgba(255,107,53,0.12)] text-[#fcfcfc] placeholder:text-[#6b6b80] focus:border-[#ff6b35] focus:ring-[#ff6b35]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#a0a0b8] text-sm font-medium">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#0c0a14] border-[rgba(255,107,53,0.12)] text-[#fcfcfc] placeholder:text-[#6b6b80] focus:border-[#ff6b35] focus:ring-[#ff6b35]"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button
              type="submit"
              className="w-full bg-[#ff6b35] hover:bg-[#e55a2b] text-[#07050a] font-semibold h-11 rounded-lg shadow-lg shadow-[#ff6b35]/20 transition-all duration-200"
              disabled={loading}
              style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#07050a] border-t-transparent rounded-full animate-spin" />
                  Connexion...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Se connecter
                </span>
              )}
            </Button>
            <p className="text-sm text-[#6b6b80]">
              Pas encore de compte ?{" "}
              <Link href="/auth/register" className="text-[#ff6b35] hover:text-[#e55a2b] underline-offset-4 hover:underline transition-colors">
                S&apos;inscrire
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
