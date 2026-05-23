import { motion } from 'framer-motion'
import AnimatedText from './AnimatedText'
import WorldCharacter from './WorldCharacter'

type WorldHeroProps = {
  explored: number
  total: number
  nextHint: string
}

export default function WorldHero({ explored, total, nextHint }: WorldHeroProps) {
  const progress = total > 0 ? (explored / total) * 100 : 0
  const scrollToMap = () => {
    document.getElementById('world-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="world-landing">
      <div className="world-landing-copy">
        <AnimatedText eyebrow="Interactive Rialo guide" title="Rialo Temple World">
          Meet tiny temple guides, explore Rialo zones, and learn RWA, agents, SCALE, identity, and onchain movement through playful stories.
        </AnimatedText>
        <div className="world-landing-actions">
          <button type="button" onClick={scrollToMap} className="world-primary-cta">Explore zones</button>
          <span className="world-next-hint">{nextHint}</span>
        </div>
      </div>

      <motion.div
        className="world-landing-stage"
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.14, ease: 'easeOut' }}
      >
        <div className="world-rialo-orbit">
          <img src="/rialo_logo.png" alt="Rialo" />
          <span />
          <span />
          <span />
        </div>
        <WorldCharacter name="Temple Gate Guardian" tone="emerald" size="lg" mood="wave" accessory="scroll" role="gate" />
        <div className="world-progress-card">
          <div>
            <span>World progress</span>
            <strong>{explored}/{total} zones awake</strong>
          </div>
          <div className="world-progress-track"><span style={{ width: `${progress}%` }} /></div>
        </div>
      </motion.div>
    </section>
  )
}
