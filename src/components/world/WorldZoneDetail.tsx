import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Lightbulb } from 'lucide-react'
import WorldFeatureScene from './WorldFeatureScene'
import WorldCharacter from './WorldCharacter'
import type { WorldZone } from './worldData'

type WorldZoneDetailProps = {
  zone: WorldZone
  onNext: () => void
}

export default function WorldZoneDetail({ zone, onNext }: WorldZoneDetailProps) {
  const Icon = zone.icon

  return (
    <motion.section
      key={zone.id}
      className={`world2-detail tone-${zone.tone}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
    >
      <div className="world2-detail-main">
        <div className="world2-detail-copy">
          <span className="world2-eyebrow"><Icon className="h-4 w-4" /> {zone.concept}</span>
          <h2>{zone.title}</h2>
          <p>{zone.summary}</p>
          <div className="world2-scene-brief">
            <strong>Visual scene</strong>
            <span>{zone.scene}</span>
          </div>
        </div>
        <WorldFeatureScene zone={zone} />
      </div>

      <div className="world2-learning-grid">
        <article className="world2-learning-card is-points">
          <h3>What you should notice</h3>
          {zone.points.map((point) => (
            <span key={point}><CheckCircle2 className="h-4 w-4" /> {point}</span>
          ))}
        </article>

        <article className="world2-learning-card">
          <h3>Example</h3>
          <p>{zone.example}</p>
        </article>

        <article className="world2-learning-card">
          <h3>Why it matters</h3>
          <p>{zone.why}</p>
        </article>

        <article className="world2-learning-card world2-character-note">
          <WorldCharacter
            name={zone.mascot.name}
            tone={zone.tone}
            role={zone.mascot.role}
            accessory={zone.mascot.accessory}
            mood={zone.mascot.mood}
            size="sm"
          />
          <div>
            <h3>{zone.mascot.name}</h3>
            <p>This guide acts out the process so the concept is easier to remember.</p>
          </div>
        </article>
      </div>

      <div className="world2-process-strip">
        {zone.steps.map((step, index) => (
          <div key={step.label} className="world2-process-step">
            <small>{String(index + 1).padStart(2, '0')}</small>
            <strong>{step.label}</strong>
            <span>{step.detail}</span>
          </div>
        ))}
      </div>

      <button type="button" onClick={onNext} className="world2-next-button">
        <Lightbulb className="h-4 w-4" /> Explore next idea <ArrowRight className="h-4 w-4" />
      </button>
    </motion.section>
  )
}
