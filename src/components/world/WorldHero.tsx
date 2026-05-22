import { motion } from 'framer-motion'
import AnimatedText from './AnimatedText'
import CharacterMascot from './CharacterMascot'

type WorldHeroProps = {
  explored: number
  total: number
  nextHint: string
}

export default function WorldHero({ explored, total, nextHint }: WorldHeroProps) {
  const progress = total > 0 ? (explored / total) * 100 : 0

  return (
    <section className="world-hero-redesign">
      <div className="world-hero-copy">
        <AnimatedText eyebrow="Interactive Rialo guide" title="Rialo Temple World">
          A playful world simulator where every cute temple zone explains Rialo, RWA, agents, SCALE, identity, and onchain movement.
        </AnimatedText>
        <div className="world-hero-actions">
          <a href="#world-map" className="world-primary-cta">Explore zones</a>
          <span className="world-hero-hint">{nextHint}</span>
        </div>
      </div>

      <motion.div
        className="world-hero-stage"
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.14, ease: 'easeOut' }}
      >
        <div className="world-logo-orbit">
          <img src="/rialo_logo.png" alt="Rialo" />
          <span />
          <span />
          <span />
        </div>
        <CharacterMascot name="Rialo Temple Scout" tone="emerald" size="lg" mood="wave" accessory="scroll" variant="scout" />
        <div className="world-hero-progress">
          <div>
            <span>World progress</span>
            <strong>{explored}/{total} zones awake</strong>
          </div>
          <div className="world-mini-progress"><span style={{ width: `${progress}%` }} /></div>
        </div>
      </motion.div>
    </section>
  )
}
