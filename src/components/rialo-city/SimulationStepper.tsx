import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Play } from 'lucide-react'

type SimulationStepperProps = {
  steps: string[]
  buttonLabel?: string
  onComplete?: () => void
}

export default function SimulationStepper({ steps, buttonLabel = 'Run Simulation', onComplete }: SimulationStepperProps) {
  const [running, setRunning] = useState(false)
  const [activeStep, setActiveStep] = useState(-1)

  useEffect(() => {
    if (!running) return

    if (activeStep >= steps.length - 1) {
      const doneTimer = window.setTimeout(() => {
        setRunning(false)
        onComplete?.()
      }, 650)
      return () => window.clearTimeout(doneTimer)
    }

    const timer = window.setTimeout(() => setActiveStep((current) => current + 1), activeStep < 0 ? 120 : 680)
    return () => window.clearTimeout(timer)
  }, [activeStep, onComplete, running, steps.length])

  const run = () => {
    setActiveStep(-1)
    setRunning(true)
  }

  return (
    <div className="city-sim-panel rounded-lg p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-black">Mini simulation</p>
        <button type="button" onClick={run} disabled={running} className="temple-button inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black disabled:cursor-not-allowed disabled:opacity-60">
          <Play className="h-3.5 w-3.5" /> {running ? 'Running' : buttonLabel}
        </button>
      </div>
      <div className="grid gap-3">
        {steps.map((step, index) => {
          const isActive = index === activeStep
          const isDone = index < activeStep || (!running && activeStep >= steps.length - 1)
          return (
            <motion.div
              key={step}
              animate={{ opacity: isActive || isDone ? 1 : 0.5, x: isActive ? 4 : 0 }}
              className={`city-sim-step flex items-center gap-3 rounded-lg px-3 py-3 ${isActive ? 'is-active' : ''} ${isDone ? 'is-done' : ''}`}
            >
              <span className="city-sim-dot flex h-7 w-7 items-center justify-center rounded-full text-xs font-black">
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </span>
              <span className="text-sm font-semibold">{step}</span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
