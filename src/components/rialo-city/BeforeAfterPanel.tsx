import { ArrowRight } from 'lucide-react'

type BeforeAfterPanelProps = {
  beforeTitle: string
  beforeSteps: string[]
  withRialoTitle: string
  withRialoSteps: string[]
}

export default function BeforeAfterPanel({ beforeTitle, beforeSteps, withRialoTitle, withRialoSteps }: BeforeAfterPanelProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <StepRail title={beforeTitle} steps={beforeSteps} muted />
      <StepRail title={withRialoTitle} steps={withRialoSteps} />
    </div>
  )
}

function StepRail({ title, steps, muted = false }: { title: string; steps: string[]; muted?: boolean }) {
  return (
    <div className={`city-before-after rounded-lg p-4 ${muted ? 'is-muted' : ''}`}>
      <p className="text-sm font-black">{title}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {steps.map((step, index) => (
          <div key={`${step}-${index}`} className="flex items-center gap-2">
            <span className="city-step-chip rounded-full px-3 py-2 text-xs font-black">{step}</span>
            {index < steps.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-[var(--temple-soft)]" />}
          </div>
        ))}
      </div>
    </div>
  )
}
