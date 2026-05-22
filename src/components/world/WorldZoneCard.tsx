import { motion } from 'framer-motion'
import CharacterMascot from './CharacterMascot'
import type { WorldBuilding } from './worldData'

export type WorldZone = {
  id: string
  label: string
  concept: string
  simple: string
  why: string
  action: string
  building: WorldBuilding
  tone: 'gold' | 'emerald' | 'coral' | 'sapphire' | 'violet' | 'cream'
  mascot: {
    name: string
    mood: 'wave' | 'tilt' | 'walk' | 'focus' | 'float'
    accessory: 'scroll' | 'orb' | 'coin' | 'key' | 'spark'
  }
}

type WorldZoneCardProps = {
  zone: WorldZone
  index: number
  visited: boolean
  onSelect: (building: WorldBuilding) => void
}

export default function WorldZoneCard({ zone, index, visited, onSelect }: WorldZoneCardProps) {
  return (
    <motion.button
      type="button"
      className={`world-zone-card tone-${zone.tone} ${visited ? 'is-visited' : ''}`}
      onClick={() => onSelect(zone.building)}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: 0.08 + index * 0.045, ease: 'easeOut' }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.985 }}
    >
      <span className="world-zone-status">{visited ? 'Awake' : 'Explore'}</span>
      <div className="world-zone-visual">
        <CharacterMascot
          name={zone.mascot.name}
          tone={zone.tone}
          size="sm"
          mood={zone.mascot.mood}
          accessory={zone.mascot.accessory}
        />
        <span className="world-zone-glyph" aria-hidden="true" />
      </div>
      <div className="world-zone-copy">
        <span>{zone.concept}</span>
        <h3>{zone.label}</h3>
        <p>{zone.simple}</p>
      </div>
      <div className="world-zone-note">
        <strong>Why it matters</strong>
        <p>{zone.why}</p>
      </div>
      <span className="world-zone-action">{zone.action}</span>
    </motion.button>
  )
}
