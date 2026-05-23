import { useMemo, useState } from 'react'
import WorldHero from '@/components/world/WorldHero'
import WorldMap from '@/components/world/WorldMap'
import WorldZoneDetail from '@/components/world/WorldZoneDetail'
import { worldZones, type WorldZone, type WorldZoneId } from '@/components/world/worldData'

export default function World() {
  const [selectedId, setSelectedId] = useState<WorldZoneId>('data-spring')
  const [visited, setVisited] = useState<Set<WorldZoneId>>(() => new Set(['data-spring']))

  const selectedZone = useMemo(() => worldZones.find((zone) => zone.id === selectedId) ?? worldZones[0], [selectedId])

  function selectZone(zone: WorldZone) {
    setSelectedId(zone.id)
    setVisited((current) => new Set([...current, zone.id]))
    document.getElementById('world-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function selectNext() {
    const currentIndex = worldZones.findIndex((zone) => zone.id === selectedId)
    const next = worldZones[(currentIndex + 1) % worldZones.length]
    selectZone(next)
  }

  function startExploring() {
    document.getElementById('world-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="world2-page mx-auto max-w-[1540px] px-4 pb-14 pt-6 sm:px-6">
      <WorldHero explored={visited.size} total={worldZones.length} onStart={startExploring} />
      <WorldMap selectedId={selectedId} visited={visited} onSelect={selectZone} />
      <div id="world-detail">
        <WorldZoneDetail zone={selectedZone} onNext={selectNext} />
      </div>
    </main>
  )
}
