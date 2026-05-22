import { motion } from 'framer-motion'
import WorldCharacter from './WorldCharacter'
import type { WorldBuilding } from './worldData'
import type { WorldCharacterAccessory, WorldCharacterMood, WorldCharacterRole, WorldCharacterTone } from './WorldCharacter'

export type WorldZone = {
  id: string
  label: string
  concept: string
  simple: string
  why: string
  action: string
  building: WorldBuilding
  tone: WorldCharacterTone
  mascot: {
    name: string
    mood: WorldCharacterMood
    accessory: WorldCharacterAccessory
    role: WorldCharacterRole
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
      className={`world-feature-card tone-${zone.tone} ${visited ? 'is-visited' : ''}`}
      onClick={() => onSelect(zone.building)}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: 0.08 + index * 0.045, ease: 'easeOut' }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.985 }}
    >
      <span className="world-feature-status">{visited ? 'Awake' : 'Explore'}</span>
      <div className="world-feature-visual">
        <WorldCharacter
          name={zone.mascot.name}
          tone={zone.tone}
          size="sm"
          mood={zone.mascot.mood}
          accessory={zone.mascot.accessory}
          role={zone.mascot.role}
        />
        <span className="world-feature-portal" aria-hidden="true" />
      </div>
      <div className="world-feature-copy">
        <span>{zone.concept}</span>
        <h3>{zone.label}</h3>
        <p>{zone.simple}</p>
      </div>
      <div className="world-feature-note">
        <strong>Why it matters</strong>
        <p>{zone.why}</p>
      </div>
      <span className="world-feature-action">{zone.action}</span>
    </motion.button>
  )
}
