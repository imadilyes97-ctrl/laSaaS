'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Package, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import gsap from 'gsap'

type LoadingState = 'loading' | 'loaded' | 'error'

/**
 * Loading, empty and error state components for dashboard pages
 */

export function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-[rgba(255,107,53,0.1)] flex items-center justify-center border border-[rgba(255,107,53,0.12)] animate-glow-pulse">
            <Loader2 className="h-6 w-6 text-[#ff6b35] animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-[#9d9db5]">Chargement...</p>
          <p className="text-xs text-[#64647a] mt-1">Un instant</p>
        </div>
      </div>
    </div>
  )
}

export function EmptyState({
  icon: Icon = Package,
  title = "Aucune donnée",
  description = "Il n'y a rien à afficher pour le moment.",
  action,
}: {
  icon?: React.ElementType
  title?: string
  description?: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="empty-state group cursor-default">
      <div className="empty-state-icon group-hover:scale-110 transition-transform duration-300">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {action && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

export function ErrorState({
  message = "Une erreur est survenue",
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[rgba(239,68,68,0.1)] flex items-center justify-center border border-[rgba(239,68,68,0.15)]">
          <AlertCircle className="h-6 w-6 text-[#ef4444]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-[#9d9db5]">{message}</p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={onRetry}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Réessayer
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Hook to manage loading state with optional min display time
 */
export function usePageState(options?: { minLoadingMs?: number }) {
  const { minLoadingMs = 400 } = options || {}
  const [state, setState] = useState<LoadingState>('loading')
  const startTime = useRef(Date.now())

  useEffect(() => {
    if (state === 'loaded') {
      const elapsed = Date.now() - startTime.current
      if (elapsed < minLoadingMs) {
        const timer = setTimeout(() => {}, minLoadingMs - elapsed)
        return () => clearTimeout(timer)
      }
    }
  }, [state, minLoadingMs])

  return {
    state,
    setLoaded: () => setState('loaded'),
    setError: () => setState('error'),
    isLoading: state === 'loading',
    isError: state === 'error',
  }
}

/**
 * Page entrance animation hook
 */
export function usePageEnter(ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    gsap.fromTo(el,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'cubic-bezier(0.23, 1, 0.32, 1)' }
    )
  }, [ref])
}
