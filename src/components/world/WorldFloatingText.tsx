import { motion } from 'framer-motion'

export default function WorldFloatingText({ label, text }: { label: string; text: string }) {
  return (
    <motion.div
      className="world-floating-copy"
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
    >
      <strong>{label}</strong>
      <span>{text}</span>
    </motion.div>
  )
}
