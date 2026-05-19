import { motion } from 'framer-motion'
import { Award, X } from 'lucide-react'

type BadgeUnlockModalProps = {
  badge: string
  open: boolean
  onClose: () => void
}

export default function BadgeUnlockModal({ badge, open, onClose }: BadgeUnlockModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="city-badge-modal temple-card max-w-sm rounded-lg p-6 text-center">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-[var(--temple-muted)] transition hover:bg-white/10 hover:text-white" aria-label="Close badge modal">
          <X className="h-4 w-4" />
        </button>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--temple-mint-soft)] text-[var(--temple-gold)]">
          <Award className="h-8 w-8" />
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-wider text-[var(--temple-cyan)]">Badge unlocked</p>
        <h2 className="mt-2 text-3xl font-black">{badge}</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--temple-muted)]">This is a local learning badge for Rialo City. It is not an onchain credential or token reward.</p>
        <button type="button" onClick={onClose} className="temple-button mt-6 rounded-lg px-5 py-3 text-sm font-black">
          Keep exploring
        </button>
      </motion.div>
    </div>
  )
}
