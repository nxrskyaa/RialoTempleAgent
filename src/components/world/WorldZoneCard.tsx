import { motion } from 'framer-motion'
import WorldFeatureScene from './WorldFeatureScene'
import type { WorldZone } from './worldData'

type WorldZoneCardProps = {
  zone: WorldZone
  selected: boolean
  visited: boolean
  index: number
  onSelect: (zone: WorldZone) => void
}

export default function WorldZoneCard({ zone, selected, visited, index, onSelect }: WorldZoneCardProps) {
  const Icon = zone.icon

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(zone)}
      className={`world2-zone-card tone-${zone.tone} ${selected ? 'is-selected' : ''} ${visited ? 'is-visited' : ''}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.025 }}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="world2-zone-top">
        <span><Icon className="h-4 w-4" /> {zone.concept}</span>
        <small>{visited ? 'Visited' : 'Explore'}</small>
      </div>
      <WorldFeatureScene zone={zone} compact />
      <h3>{zone.title}</h3>
      <p>{zone.summary}</p>
    </motion.button>
  )
}

export type { WorldZone }
