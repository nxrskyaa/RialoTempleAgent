import { motion } from 'framer-motion'
import { characterAssets } from './worldData'

type CharacterRole = keyof typeof characterAssets

export default function Character({
  role,
  className = '',
  delay = 0,
}: {
  role: CharacterRole
  className?: string
  delay?: number
}) {
  return (
    <motion.img
      src={characterAssets[role]}
      alt=""
      className={`world-character ${className}`}
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: [0, -5, 0], scale: 1 }}
      transition={{ opacity: { duration: 0.3, delay }, y: { duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay } }}
      draggable={false}
    />
  )
}
