import { motion } from 'framer-motion'
import type { CSSProperties } from 'react'
import { effectAssets } from './worldData'

export function RuneBurst({ color = '#57e39f', dramatic = false }: { color?: string; dramatic?: boolean }) {
  return (
    <motion.div
      className={`world-rune-burst ${dramatic ? 'is-dramatic' : ''}`}
      style={{ '--world-accent': color } as CSSProperties}
      initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
      animate={{ opacity: [0, 1, 0.7], scale: [0.5, 1.12, 1], rotate: 120 }}
      transition={{ duration: dramatic ? 3.8 : 2.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <img src={effectAssets.rune} alt="" />
    </motion.div>
  )
}

export function LightBeam({ color = '#f2c866' }: { color?: string }) {
  return <span className="world-light-beam" style={{ '--world-accent': color } as CSSProperties} />
}
