import type { CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Play, RotateCcw } from 'lucide-react'
import WorldCharacter from './WorldCharacter'
import WorldFloatingText from './WorldFloatingText'
import WorldLoadingState from './WorldLoadingState'
import type { WorldZone } from './WorldZoneCard'
import type { WorkflowStep } from './worldData'

type WorldExplorePanelProps = {
  zone: WorldZone | undefined
  steps: WorkflowStep[]
  stepIndex: number
  running: boolean
  progress: number
  caption: string
  onStep: (index: number) => void
  onBegin: () => void
  onReset: () => void
}

export default function WorldExplorePanel({
  zone,
  steps,
  stepIndex,
  running,
  progress,
  caption,
  onStep,
  onBegin,
  onReset,
}: WorldExplorePanelProps) {
  const step = steps[stepIndex]
  const tone = zone?.tone ?? 'gold'

  return (
    <section className={`world-feature-playground tone-${tone}`}>
      <div className="world-playground-sky">
        <span />
        <span />
        <span />
      </div>

      <div className="world-playground-stage">
        <div className="world-story-portal" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step.key}
            className="world-step-scene"
            initial={{ opacity: 0, y: 20, rotate: -1.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: -14, rotate: 1.5 }}
            transition={{ type: 'spring', stiffness: 190, damping: 18 }}
          >
            <div className="world-relic-token">
              <img src={step.item} alt="" />
              <CheckCircle2 className={stepIndex === steps.length - 1 ? 'is-visible' : ''} />
            </div>
            <WorldCharacter
              name={zone?.mascot.name ?? 'Rialo Helper'}
              tone={tone}
              size="md"
              mood={running ? 'walk' : zone?.mascot.mood ?? 'wave'}
              accessory={zone?.mascot.accessory ?? 'orb'}
              role={zone?.mascot.role ?? 'gate'}
            />
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <WorldFloatingText key={`${step.key}-copy`} label={step.title} text={caption} />
        </AnimatePresence>

        {running ? <WorldLoadingState label="Tiny helpers are moving the ritual forward" /> : null}
      </div>

      <div className="world-step-menu">
        {steps.map((station, index) => (
          <button
            type="button"
            key={station.key}
            onClick={() => !running && onStep(index)}
            className={`world-step-card ${index === stepIndex ? 'is-active' : ''} ${index < stepIndex ? 'is-done' : ''}`}
            disabled={running}
            style={{ '--step-index': index } as CSSProperties}
          >
            <img src={station.item} alt="" />
            <span>{station.title}</span>
          </button>
        ))}
      </div>

      <div className="world-playground-controls">
        <div className="world-flow-meter">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="world-control-buttons">
          <button type="button" onClick={onBegin} disabled={running} className="world-primary-cta">
            <Play className="h-4 w-4" /> {running ? 'Exploring' : 'Start Explore'}
          </button>
          <button type="button" onClick={onReset} disabled={running} className="world-soft-button">
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        </div>
      </div>
    </section>
  )
}
