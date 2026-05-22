import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import WorldEmptyState from './WorldEmptyState'
import WorldExplorePanel from './WorldExplorePanel'
import WorldZoneDetail from './WorldZoneDetail'
import { worldZones } from './WorldMap'
import type { WorldBuilding } from './worldData'
import { workflows } from './worldData'

export default function WorldInterior({
  building,
  onBack,
  onComplete,
}: {
  building: WorldBuilding
  onBack: () => void
  onComplete: (id: string) => void
}) {
  const [stepIndex, setStepIndex] = useState(0)
  const [running, setRunning] = useState(false)
  const [advanced, setAdvanced] = useState(false)
  const steps = workflows[building.id] ?? []
  const step = steps[stepIndex]
  const zone = worldZones.find((item) => item.building.id === building.id)
  const progress = steps.length ? ((stepIndex + 1) / steps.length) * 100 : 0

  const caption = useMemo(() => {
    if (!step) return 'Pick a zone and start exploring.'
    if (building.id === 'oracle') {
      if (step.key === 'settle') return 'Rewards settle, proof appears, and the helper celebrates.'
      if (step.key === 'judge') return 'A friendly judge checks the result before payment moves.'
      return 'A tiny agent reads, works, submits, and waits for proof.'
    }
    return step.why
  }, [building.id, step])

  function begin() {
    if (!steps.length) return
    setRunning(true)
    setStepIndex(0)

    const run = (index: number) => {
      window.setTimeout(() => {
        setStepIndex(index)
        if (index < steps.length - 1) {
          run(index + 1)
          return
        }
        window.setTimeout(() => {
          setRunning(false)
          onComplete(building.id)
        }, 900)
      }, index === 0 ? 240 : 1120)
    }

    run(0)
  }

  function reset() {
    setRunning(false)
    setStepIndex(0)
  }

  return (
    <section className="world-explore-shell" style={{ '--world-accent': building.accent, '--world-accent-2': building.accent2 } as CSSProperties}>
      <div className="world-explore-header">
        <button type="button" onClick={onBack} className="world-soft-button">
          <ArrowLeft className="h-4 w-4" /> Back to World
        </button>
        <div>
          <span>{zone?.concept ?? building.role}</span>
          <h1>{zone?.label ?? building.shortName}</h1>
        </div>
        <strong>{running ? 'Exploring...' : 'Ready'}</strong>
      </div>

      <motion.div
        className="world-explore-layout"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: 'easeOut' }}
      >
        <WorldZoneDetail zone={zone} building={building} advanced={advanced} onToggleAdvanced={() => setAdvanced((value) => !value)} />
        {step ? (
          <WorldExplorePanel
            zone={zone}
            steps={steps}
            stepIndex={stepIndex}
            running={running}
            progress={progress}
            caption={caption}
            onStep={setStepIndex}
            onBegin={begin}
            onReset={reset}
          />
        ) : (
          <WorldEmptyState title="No ritual steps yet" text="This zone is waiting for a tiny helper to prepare the next adventure." />
        )}
      </motion.div>
    </section>
  )
}
