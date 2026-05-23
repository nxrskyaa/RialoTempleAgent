import { motion } from 'framer-motion'
import WorldCharacter from './WorldCharacter'

type WorldHeroProps = {
  explored: number
  total: number
  onStart: () => void
}

export default function WorldHero({ explored, total, onStart }: WorldHeroProps) {
  return (
    <section className="world2-hero">
      <div className="world2-hero-copy">
        <span className="world2-eyebrow">Rialo visual simulator</span>
        <h1>Explore the Rialo Temple World</h1>
        <p>
          A playful visual guide to Rialo's real-world blockchain features: live data, API connectivity, privacy, identity, speed, RWA, agents, and SCALE.
        </p>
        <div className="world2-hero-actions">
          <button type="button" onClick={onStart} className="world2-primary">Start Exploring</button>
          <span>{explored}/{total} zones visited</span>
        </div>
      </div>

      <motion.div
        className="world2-hero-stage"
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <div className="world2-logo-pool">
          <img src="/rialo_logo.png" alt="Rialo" />
          <span>Real-world blockchain</span>
        </div>
        <WorldCharacter name="Temple Guide" tone="gold" role="guide" accessory="scroll" mood="wave" size="lg" />
        <div className="world2-hero-sign">
          <strong>Learn by watching</strong>
          <span>Every zone shows a real process, not just a glowing card.</span>
        </div>
      </motion.div>
    </section>
  )
}
