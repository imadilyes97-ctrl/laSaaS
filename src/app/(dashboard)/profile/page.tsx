"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, Lock, CheckCircle2, AlertCircle, Loader2, Check, Sparkles, Shield, KeyRound, Eye, EyeOff } from "lucide-react"
import { LoadingSkeleton } from "@/components/PageStates"

export default function ProfilePage() {
  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setEmail(user.email || "")
      setPageLoading(false)
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

  if (pageLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-8 pb-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="stat-icon w-12 h-12 rounded-2xl">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1>Profil</h1>
            <p>Gérez votre compte et vos informations personnelles</p>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="card-premium p-0">
        <div className="p-6 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="stat-icon w-10 h-10 rounded-xl">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold" style={{ color: "#fcfcfc" }}>Informations du compte</h3>
              <p className="text-xs" style={{ color: "#64647a" }}>Votre profil LinkFlow</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <Avatar className="h-20 w-20 rounded-2xl ring-2 ring-[rgba(255,107,53,0.25)] transition-all duration-300 group-hover:ring-4 group-hover:ring-[rgba(255,107,53,0.4)]">
                <AvatarFallback className="text-2xl font-bold rounded-2xl" style={{ background: "var(--gradientPrimary)", color: "#fff" }}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2" style={{ background: "#06030b", borderColor: "rgba(255, 107, 53, 0.3)" }}>
                <Check className="h-3 w-3" style={{ color: "#22c55e" }} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold" style={{ color: "#fcfcfc", fontFamily: "'Instrument Serif', Georgia, serif" }}>{email}</p>
              <div className="flex items-center gap-2">
                <span className="tag text-[10px]" style={{ background: "var(--primaryDim)", color: "#ff6b35" }}>
                  <Shield className="h-3 w-3" />
                  Compte actif
                </span>
                <span className="tag-accent text-[10px]">
                  <Sparkles className="h-3 w-3" />
                  LinkFlow
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change */}
      <div className="card-premium p-0">
        <div className="p-6 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="stat-icon w-10 h-10 rounded-xl">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold" style={{ color: "#fcfcfc" }}>Changer le mot de passe</h3>
              <p className="text-xs" style={{ color: "#64647a" }}>Mettez à jour votre mot de passe de connexion</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <form onSubmit={handleChangePassword} className="space-y-5">
            {message && (
              <div className="flex items-start gap-3 text-sm p-4 rounded-xl animate-in fade-in duration-300" style={{ background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.2)" }}>
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
                <span style={{ color: "#86efac" }}>{message}</span>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-3 text-sm p-4 rounded-xl animate-in fade-in duration-300" style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
                <span style={{ color: "#fca5a5" }}>{error}</span>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#9d9db5" }}>
                  <KeyRound className="h-3.5 w-3.5" /> Nouveau mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="rounded-lg pr-10 placeholder-[#6b6b80]"
                    style={{ background: "#0b0716", borderColor: "var(--border)", color: "#fcfcfc" }}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full w-9 rounded-lg"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-3.5 w-3.5" style={{ color: "#64647a" }} /> : <Eye className="h-3.5 w-3.5" style={{ color: "#64647a" }} />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "#9d9db5" }}>
                  <KeyRound className="h-3.5 w-3.5" /> Confirmer le mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="rounded-lg pr-10 placeholder-[#6b6b80]"
                    style={{ background: "#0b0716", borderColor: "var(--border)", color: "#fcfcfc" }}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full w-9 rounded-lg"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" style={{ color: "#64647a" }} /> : <Eye className="h-3.5 w-3.5" style={{ color: "#64647a" }} />}
                  </Button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="btn-gradient btn-glow gap-2 rounded-xl"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
