import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function Loading({ className, text = "Chargement..." }: { className?: string; text?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-8", className)}>
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur-xl animate-pulse" style={{ background: 'rgba(255,107,53,0.1)' }} />
        <Loader2 className="h-8 w-8 animate-spin relative" style={{ color: '#ff6b35' }} />
      </div>
      <p className="text-sm font-medium" style={{ color: '#a0a0b8' }}>
        {text}
      </p>
    </div>
  )
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#ff6b35' }} />
    </div>
  )
}

export function LoadingOverlay({ visible = true }: { visible?: boolean }) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ background: 'rgba(7,5,10,0.8)' }}>
      <div className="rounded-2xl p-8 shadow-2xl" style={{ background: '#120f1e', border: '1px solid rgba(255,107,53,0.1)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-xl animate-spin" style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.2), rgba(247,37,133,0.2))' }} />
            <Loader2 className="h-10 w-10 animate-spin relative" style={{ color: '#ff6b35' }} />
          </div>
          <p className="font-semibold" style={{ color: '#fcfcfc' }}>
            Traitement en cours...
          </p>
          <p className="text-sm text-center max-w-xs" style={{ color: '#6b6b80' }}>
            Cela peut prendre quelques secondes
          </p>
        </div>
      </div>
    </div>
  )
}
