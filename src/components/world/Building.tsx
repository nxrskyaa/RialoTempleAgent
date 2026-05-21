import { motion } from 'framer-motion'
import type { CSSProperties } from 'react'
import type { WorldBuilding } from './worldData'

export default function Building({
  building,
  active,
  onSelect,
}: {
  building: WorldBuilding
  active: boolean
  onSelect: (building: WorldBuilding) => void
}) {
  const sizeClass = building.position.size === 'lg' ? 'is-large' : building.position.size === 'sm' ? 'is-small' : ''

  return (
    <motion.button
      type="button"
      className={`world-building ${sizeClass} ${active ? 'is-active' : ''}`}
      style={{
        left: `${building.position.x}%`,
        top: `${building.position.y}%`,
        '--world-accent': building.accent,
        '--world-accent-2': building.accent2,
      } as CSSProperties}
      onClick={() => onSelect(building)}
      whileHover={{ y: -10, scale: 1.04 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
    >
      <span className="world-building-glow" />
      <img src={building.exterior} alt="" draggable={false} />
      <span className="world-building-label">
        <building.icon className="h-4 w-4" />
        <span>{building.name}</span>
        <small>{building.shortName}</small>
      </span>
    </motion.button>
  )
}
