import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import WorldHero from '@/components/world/WorldHero'
import WorldMap, { worldZones } from '@/components/world/WorldMap'
import OracleInterior from '@/components/world/OracleInterior'
import TreasuryInterior from '@/components/world/TreasuryInterior'
import HubInterior from '@/components/world/HubInterior'
import BazaarInterior from '@/components/world/BazaarInterior'
import SpireInterior from '@/components/world/SpireInterior'
import HomesInterior from '@/components/world/HomesInterior'
import { type WorldBuilding, type WorldBuildingId } from '@/components/world/worldData'

const interiors = {
  oracle: OracleInterior,
  treasury: TreasuryInterior,
  hub: HubInterior,
  bazaar: BazaarInterior,
  spire: SpireInterior,
  homes: HomesInterior,
}

export default function World() {
  const [selected, setSelected] = useState<WorldBuilding | null>(null)
  const [visited, setVisited] = useState<Set<string>>(() => new Set())
  const Interior = selected ? interiors[selected.id as WorldBuildingId] : null
  const explored = worldZones.filter((zone) => visited.has(zone.building.id)).length

  const nextHint = useMemo(() => {
    const next = worldZones.find((zone) => !visited.has(zone.building.id))
    return next ? `Next: ${next.label}` : 'World explored: every temple is awake'
  }, [visited])

  function complete(id: string) {
    setVisited((current) => new Set([...current, id]))
  }

  return (
    <main className="world-page mx-auto max-w-[1500px] px-4 pb-14 pt-6 sm:px-6">
      <AnimatePresence mode="wait">
        {selected && Interior ? (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <Interior building={selected} onBack={() => setSelected(null)} onComplete={complete} />
          </motion.div>
        ) : (
          <motion.div
            key="world"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <WorldHero explored={explored} total={worldZones.length} nextHint={nextHint} />
            <WorldMap visited={visited} onSelect={setSelected} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
