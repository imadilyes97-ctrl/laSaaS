"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function ProfilePage() {
  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setEmail(user.email || "")
    }
    loadProfile()
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }

    setMessage("Mot de passe mis à jour avec succès")
    setNewPassword("")
    setConfirmPassword("")
  }

  const initials = email ? email.charAt(0).toUpperCase() : "?"

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-[#fcfcfc]" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>Profil</h1>
        <p className="text-[#a0a0b8] text-sm">Gérez votre compte</p>
      </div>

      <Card className="border-[rgba(255,107,53,0.1)]">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-[rgba(255,107,53,0.15)]">
              <AvatarFallback className="text-lg bg-[#120f1e] text-[#ff6b35]">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-[#fcfcfc]">{email}</CardTitle>
              <CardDescription className="text-[#a0a0b8]">Votre compte LinkFlow</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-[rgba(255,107,53,0.1)]">
        <CardHeader>
          <CardTitle className="text-[#fcfcfc]">Changer le mot de passe</CardTitle>
          <CardDescription className="text-[#a0a0b8]">Mettez à jour votre mot de passe</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {message && (
              <div className="text-sm text-[#22c55e] bg-[rgba(34,197,94,0.1)] p-3 rounded-lg border border-[rgba(34,197,94,0.15)]">
                {message}
              </div>
            )}
            {error && (
              <div className="text-sm text-[#ef4444] bg-[rgba(239,68,68,0.1)] p-3 rounded-lg border border-[rgba(239,68,68,0.15)]">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-[#a0a0b8] text-sm font-medium">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-[#0c0a14] border-[rgba(255,107,53,0.12)] text-[#fcfcfc] placeholder:text-[#6b6b80] focus:border-[#ff6b35] focus:ring-[#ff6b35]"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[#a0a0b8] text-sm font-medium">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-[#0c0a14] border-[rgba(255,107,53,0.12)] text-[#fcfcfc] placeholder:text-[#6b6b80] focus:border-[#ff6b35] focus:ring-[#ff6b35]"
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#ff6b35] hover:bg-[#e55a2b] text-[#07050a] font-semibold shadow-lg shadow-[#ff6b35]/20 transition-all duration-200"
              style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
            >
              {loading ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
