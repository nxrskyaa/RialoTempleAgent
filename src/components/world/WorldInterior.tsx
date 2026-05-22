import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, BookOpen, CheckCircle2, HelpCircle, Play, RotateCcw } from 'lucide-react'
import Character from './Character'
import ExplanationPopup from './ExplanationPopup'
import { LightBeam, RuneBurst } from './LottieAnimations'
import ParticleSystem from './ParticleSystem'
import { characterAssets, effectAssets, glossary, workflows, type WorldBuilding, type WorkflowStep } from './worldData'

const technicalNotes: Record<string, string> = {
  oracle: 'SCALE abstracts task creation, escrow, agent execution, judge scoring, settlement, and proof into a simple workflow.',
  treasury: 'RWA tokenization maps a verified offchain claim to an onchain record that can be referenced by markets and apps.',
  hub: 'Governance turns proposals and votes into auditable state transitions with transparent outcomes.',
  bazaar: 'A marketplace coordinates listings, matching, settlement, and price discovery for tokenized assets.',
  spire: 'Transactions enter a pending area, then validators include them in blocks that become part of chain history.',
  homes: 'Wallet identity lets one address carry permissions, assets, reputation, and activity across the ecosystem.',
}

const roles: Record<string, keyof typeof characterAssets> = {
  oracle: 'agent',
  treasury: 'guardian',
  hub: 'citizen',
  bazaar: 'merchant',
  spire: 'scribe',
  homes: 'citizen',
}

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
  const steps = workflows[building.id]
  const step = steps[stepIndex]
  const progress = ((stepIndex + 1) / steps.length) * 100
  const role = roles[building.id]

  const caption = useMemo(() => {
    if (building.id === 'oracle') {
      if (step.key === 'settle') return 'Approved: coins release, proof forms, and the agent celebrates.'
      if (step.key === 'judge') return 'The judge mask checks quality before anyone gets paid.'
      return 'The ritual shows task, escrow, work, output, judging, and settlement.'
    }
    return step.why
  }, [building.id, step])

  function begin() {
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
        }, 1400)
      }, index === 0 ? 250 : building.id === 'oracle' ? 1650 : 1350)
    }
    run(0)
  }

  function reset() {
    setRunning(false)
    setStepIndex(0)
  }

  return (
    <section
      className="world-interior-shell temple-card"
      style={{ '--world-accent': building.accent, '--world-accent-2': building.accent2 } as CSSProperties}
    >
      <img src={building.interior} alt="" className="world-interior-bg" />
      <ParticleSystem active intensity={building.id === 'oracle' ? 1.6 : 1.05} />
      <div className="world-interior-overlay" />

      <div className="world-interior-topbar">
        <button type="button" onClick={onBack} className="temple-button-secondary inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black">
          <ArrowLeft className="h-4 w-4" /> Back to City
        </button>
        <div className="world-interior-title">
          <building.icon className="h-5 w-5" />
          <span>{building.name}</span>
          <small>{building.shortName}</small>
        </div>
        <button type="button" onClick={() => setAdvanced((value) => !value)} className="temple-button-secondary inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-black">
          <BookOpen className="h-4 w-4" /> {advanced ? 'Simple' : 'Learn More'}
        </button>
      </div>

      <div className="world-interior-grid">
        <div className="world-lesson-panel">
          <p className="world-kicker">{building.role}</p>
          <h2>{building.shortName}</h2>
          <p>{building.simple}</p>
          <div className="world-rialo-context">
            <img src="/rialo_logo.png" alt="" />
            <span>Rialo turns this feature into a visible ritual: input goes in, rules execute, proof comes out, and users can understand the result without reading code.</span>
          </div>
          <div className="world-analogy-row">
            <HelpCircle className="h-4 w-4" />
            <span>{building.analogy}</span>
          </div>
          {advanced && <div className="world-tech-note">{technicalNotes[building.id]}</div>}

          <div className="world-before-after">
            <div>
              <strong>Without Rialo</strong>
              <span>{building.without}</span>
            </div>
            <div>
              <strong>With Rialo</strong>
              <span>{building.with}</span>
            </div>
          </div>

          <div className="world-info-list">
            {glossary.slice(0, 3).map((item) => (
              <ExplanationPopup key={item.term} title={item.term}>{item.simple}</ExplanationPopup>
            ))}
          </div>
        </div>

        <div className={`world-workflow-stage ${running ? 'is-running' : ''}`}>
          <RuneBurst color={building.accent} dramatic={building.id === 'oracle'} />
          <LightBeam color={building.accent2} />
          <div className="world-scene-logo">
            <img src="/rialo_logo.png" alt="" />
          </div>
          <div className="world-stage-floor" />
          <div className="world-station-path">
            {steps.map((station, index) => (
              <button
                type="button"
                key={station.key}
                onClick={() => !running && setStepIndex(index)}
                className={`world-station ${index === stepIndex ? 'is-active' : ''} ${index < stepIndex ? 'is-done' : ''}`}
                style={{ '--station-index': index } as CSSProperties}
              >
                <img src={station.item} alt="" />
                <span>{station.title}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step.key}
              className="world-main-action"
              initial={{ opacity: 0, y: 24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 180, damping: 18 }}
            >
              <img src={step.item} alt="" className="world-action-item" />
              <Character role={role} className="world-action-character" />
              {step.key === 'settle' || step.key === 'record' || step.key === 'proof' ? (
                <CheckCircle2 className="world-success-mark" />
              ) : null}
              <div className="world-floating-label">
                <strong>{step.title}</strong>
                <span>{caption}</span>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="world-proof-wall">
            <span>Proof Wall</span>
            {steps.slice(0, stepIndex + 1).map((station) => (
              <img key={station.key} src={effectAssets.rune} alt="" />
            ))}
          </div>

          <div className="world-stage-controls">
            <button type="button" onClick={begin} disabled={running} className="temple-button inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-black disabled:opacity-55">
              <Play className="h-4 w-4" /> {running ? 'Ritual running' : building.id === 'oracle' ? 'Begin Ritual' : 'Run Flow'}
            </button>
            <button type="button" onClick={reset} disabled={running} className="temple-button-secondary inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-black disabled:opacity-55">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>
        </div>
      </div>

      <WorkflowReadout step={step} progress={progress} />
    </section>
  )
}

function WorkflowReadout({ step, progress }: { step: WorkflowStep; progress: number }) {
  return (
    <div className="world-readout">
      <div className="world-progress-track"><span style={{ width: `${progress}%` }} /></div>
      <div>
        <strong>{step.title}</strong>
        <span>{step.what}</span>
      </div>
      <div>
        <strong>Why it matters</strong>
        <span>{step.why}</span>
      </div>
    </div>
  )
}
