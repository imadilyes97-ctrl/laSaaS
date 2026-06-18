/**
 * Composant de chargement animé avec effet cyber
 */

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function Loading({ className, text = "Chargement..." }: { className?: string; text?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-8", className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-cyber-cyan/10 rounded-full blur-xl animate-pulse"></div>
        <Loader2 className="h-8 w-8 text-cyber-cyan animate-spin relative" />
      </div>
      <p className="text-cyber-textSecondary text-sm font-medium animate-pulse-slow">
        {text}
      </p>
    </div>
  )
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2 className="h-5 w-5 text-cyber-cyan animate-spin" />
    </div>
  )
}

export function LoadingOverlay({ visible = true }: { visible?: boolean }) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cyber-bg/80 backdrop-blur-sm">
      <div className="bg-cyber-bgCard rounded-2xl p-8 shadow-2xl border border-cyber-border/20">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyber-cyan/20 to-cyber-blue/20 rounded-full blur-xl animate-spin-slow"></div>
            <Loader2 className="h-10 w-10 text-cyber-cyan animate-spin relative" />
          </div>
          <p className="text-cyber-textPrimary font-semibold animate-pulse-slow">
            Traitement en cours...
          </p>
          <p className="text-cyber-textSecondary text-sm text-center max-w-xs">
            Cela peut prendre quelques secondes
          </p>
        </div>
      </div>
    </div>
  )
}