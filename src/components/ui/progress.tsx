/**
 * Composant de barre de progression animée
 */

import { cn } from "@/lib/utils"

export function Progress({ value = 0, max = 100, className }: { value: number; max?: number; className?: string }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn("w-full bg-cyber-bgCard rounded-full h-2.5 overflow-hidden", className)}>
      <div
        className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-blue transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export function ProgressWithLabel({
  value,
  max = 100,
  label,
  className
}: {
  value: number;
  max?: number;
  label: string;
  className?: string
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <span className="text-cyber-textSecondary text-sm font-medium">{label}</span>
        <span className="text-cyber-cyan text-sm font-semibold">{Math.round(percentage)}%</span>
      </div>
      <Progress value={value} max={max} />
    </div>
  )
}

export function StepProgress({
  steps,
  currentStep,
  className
}: {
  steps: string[];
  currentStep: number;
  className?: string
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center mb-2">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                index < currentStep
                  ? 'bg-cyber-cyan text-cyber-bg'
                  : index === currentStep
                    ? 'bg-cyber-blue text-white border-2 border-cyber-cyan/50'
                    : 'bg-cyber-bgCard text-cyber-textSecondary border-2 border-cyber-border'
              }`}
            >
              {index < currentStep ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
            </div>
            <span
              className={`text-xs mt-2 text-center transition-colors duration-300 ${
                index <= currentStep ? 'text-cyber-textPrimary font-medium' : 'text-cyber-textSecondary'
              }`}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
      <div className="flex-1 h-0.5 bg-cyber-border/30 relative">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyber-cyan to-cyber-blue transition-all duration-300"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  )
}

// Import local pour éviter la dépendance circulaire
import { CheckCircle2 } from "lucide-react"