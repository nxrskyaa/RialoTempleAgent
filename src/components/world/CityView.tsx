import { motion } from 'framer-motion'
import Building from './Building'
import Character from './Character'
import ParticleSystem from './ParticleSystem'
import { buildings, glossary, type WorldBuilding } from './worldData'

export default function CityView({
  selected,
  visited,
  onSelect,
}: {
  selected: WorldBuilding | null
  visited: Set<string>
  onSelect: (building: WorldBuilding) => void
}) {
  return (
    <section className="world-city-shell temple-card">
      <ParticleSystem intensity={1.15} />
      <div className="world-city-aurora" />
      <div className="world-city-grid" />
      <motion.div
        className="world-city-map"
        animate={{
          scale: selected ? 1.08 : 1,
          x: selected ? `${50 - selected.position.x}%` : '0%',
          y: selected ? `${34 - selected.position.y}%` : '0%',
        }}
        transition={{ type: 'spring', stiffness: 80, damping: 18 }}
      >
        <div className="world-path path-hub-spire" />
        <div className="world-path path-bazaar-treasury" />
        <div className="world-path path-oracle-homes" />
        <div className="world-path path-hub-oracle" />

        {buildings.map((building) => (
          <Building
            key={building.id}
            building={building}
            active={visited.has(building.id)}
            onSelect={onSelect}
          />
        ))}

        <Character role="citizen" className="walker walker-one" delay={0.1} />
        <Character role="scribe" className="walker walker-two" delay={0.6} />
        <Character role="merchant" className="walker walker-three" delay={1.1} />
      </motion.div>

      <div className="world-city-copy">
        <div className="world-logo-relic" aria-hidden="true">
          <img src="/rialo_logo.png" alt="" />
          <span />
        </div>
        <p className="world-kicker">Rialo World</p>
        <h1>One living temple city for the whole Rialo ecosystem.</h1>
        <p>
          Click a temple district. Watch value move, proof form, agents work, and identity connect the whole city.
        </p>
      </div>

      <div className="world-glossary-strip">
        {glossary.map(({ term, simple, icon: Icon }) => (
          <div key={term} className="world-glossary-item">
            <Icon className="h-4 w-4" />
            <strong>{term}</strong>
            <span>{simple}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
