import { cn } from "@/lib/utils"
import { CheckCircle2 } from "lucide-react"

export function Progress({ value = 0, max = 100, className }: { value: number; max?: number; className?: string }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn("w-full rounded-full h-2.5 overflow-hidden", className)} style={{ background: '#120f1e' }}>
      <div
        className="h-full transition-all duration-300"
        style={{ width: `${percentage}%`, background: 'linear-gradient(135deg, #ff6b35, #f72585)' }}
      />
    </div>
  )
}

export function ProgressWithLabel({
  value, max = 100, label, className
}: { value: number; max?: number; label: string; className?: string }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium" style={{ color: '#a0a0b8' }}>{label}</span>
        <span className="text-sm font-semibold" style={{ color: '#ff6b35' }}>{Math.round(percentage)}%</span>
      </div>
      <Progress value={value} max={max} />
    </div>
  )
}

export function StepProgress({
  steps, currentStep, className
}: { steps: string[]; currentStep: number; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center mb-2">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
              style={{
                background: index < currentStep ? '#ff6b35' : index === currentStep ? 'rgba(255,107,53,0.15)' : '#120f1e',
                color: index < currentStep ? '#07050a' : index === currentStep ? '#ff6b35' : '#6b6b80',
                border: index === currentStep ? '2px solid rgba(255,107,53,0.5)' : '2px solid rgba(255,107,53,0.08)',
              }}
            >
              {index < currentStep ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
            </div>
            <span
              className="text-xs mt-2 text-center transition-colors duration-300"
              style={{ color: index <= currentStep ? '#fcfcfc' : '#6b6b80', fontWeight: index <= currentStep ? 500 : 400 }}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
      <div className="flex-1 h-0.5 relative" style={{ background: 'rgba(255,107,53,0.06)' }}>
        <div
          className="absolute top-0 left-0 h-full transition-all duration-300"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%`, background: 'linear-gradient(135deg, #ff6b35, #f72585)' }}
        />
      </div>
    </div>
  )
}
