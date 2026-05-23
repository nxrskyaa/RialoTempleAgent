import WorldZoneCard from './WorldZoneCard'
import { worldZones, type WorldZone, type WorldZoneId } from './worldData'

type WorldMapProps = {
  selectedId: WorldZoneId
  visited: Set<WorldZoneId>
  onSelect: (zone: WorldZone) => void
}

export default function WorldMap({ selectedId, visited, onSelect }: WorldMapProps) {
  return (
    <section id="world-map" className="world2-map-section">
      <div className="world2-section-heading">
        <span className="world2-eyebrow">Interactive World Map</span>
        <h2>Pick a real-world Rialo system.</h2>
        <p>Each zone uses a small animated process to explain what Rialo makes possible for apps and agents.</p>
      </div>
      <div className="world2-zone-grid">
        {worldZones.map((zone, index) => (
          <WorldZoneCard
            key={zone.id}
            zone={zone}
            index={index}
            selected={zone.id === selectedId}
            visited={visited.has(zone.id)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  )
}

export { worldZones }
