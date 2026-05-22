import { buildings, type WorldBuilding } from './worldData'
import WorldZoneCard, { type WorldZone } from './WorldZoneCard'
import WorldCharacter from './WorldCharacter'

const buildingById = Object.fromEntries(buildings.map((building) => [building.id, building])) as Record<string, WorldBuilding>

export const worldZones: WorldZone[] = [
  {
    id: 'temple-gate',
    label: 'Temple Gate',
    concept: 'Governance',
    simple: 'A town hall where the community decides which ritual should happen next.',
    why: 'Rialo choices become transparent, recorded, and easier for everyone to follow.',
    action: 'Visit town hall',
    building: buildingById.hub,
    tone: 'gold',
    mascot: { name: 'Temple Gate Guardian', mood: 'wave', accessory: 'scroll', role: 'gate' },
  },
  {
    id: 'rwa-vault',
    label: 'RWA Vault',
    concept: 'Real-world assets',
    simple: 'Physical value turns into a clean digital token that people can verify.',
    why: 'Assets can move faster without losing the proof of what they represent.',
    action: 'Open vault',
    building: buildingById.treasury,
    tone: 'emerald',
    mascot: { name: 'RWA Vault Keeper', mood: 'focus', accessory: 'key', role: 'vault' },
  },
  {
    id: 'agent-camp',
    label: 'Agent Camp',
    concept: 'AI agents',
    simple: 'Tiny agent helpers read tasks, do work, and wait for a judge to check them.',
    why: 'Work becomes easier to request, measure, and settle fairly.',
    action: 'Meet agents',
    building: buildingById.oracle,
    tone: 'coral',
    mascot: { name: 'Agent Camp Scout', mood: 'walk', accessory: 'orb', role: 'agent' },
  },
  {
    id: 'scale-lab',
    label: 'SCALE Lab',
    concept: 'Task settlement',
    simple: 'Tasks, escrow, judge checks, rewards, and proofs are shown like a simple ritual.',
    why: 'Hard contract flows become understandable without reading code first.',
    action: 'Run ritual',
    building: buildingById.spire,
    tone: 'sapphire',
    mascot: { name: 'SCALE Lab Helper', mood: 'think', accessory: 'spark', role: 'scale' },
  },
  {
    id: 'quest-board',
    label: 'Quest Board',
    concept: 'Marketplace',
    simple: 'People post offers, compare value, and trade digital items in a friendly market.',
    why: 'Market activity feels visible instead of hidden behind confusing tables.',
    action: 'Browse quests',
    building: buildingById.bazaar,
    tone: 'violet',
    mascot: { name: 'Quest Board Runner', mood: 'float', accessory: 'coin', role: 'quest' },
  },
  {
    id: 'identity-homes',
    label: 'Identity Homes',
    concept: 'Wallet identity',
    simple: 'Your wallet is your home base: assets, history, reputation, and profile.',
    why: 'Every action has a place to live, so your onchain story feels connected.',
    action: 'Enter homes',
    building: buildingById.homes,
    tone: 'cream',
    mascot: { name: 'Portal Explorer', mood: 'wave', accessory: 'map', role: 'portal' },
  },
]

type WorldMapProps = {
  visited: Set<string>
  onSelect: (building: WorldBuilding) => void
}

export default function WorldMap({ visited, onSelect }: WorldMapProps) {
  return (
    <section id="world-map" className="world-explore">
      <div className="world-section-heading">
        <div>
          <span className="world-eyebrow">Choose a zone</span>
          <h2>Pick a Rialo path.</h2>
        </div>
        <p>Every card opens a small animated lesson with a guide, short story, and simple Rialo workflow.</p>
      </div>

      <div className="world-map">
        <div className="world-map-core">
          <div className="world-core-card">
            <img src="/rialo_logo.png" alt="Rialo logo" />
            <WorldCharacter name="Rialo Guide" tone="gold" size="sm" mood="float" accessory="spark" role="gate" />
            <div>
              <span>Rialo Core</span>
              <strong>Explore the world paths</strong>
            </div>
          </div>
        </div>
        <div className="world-map-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="world-feature-grid">
          {worldZones.map((zone, index) => (
            <WorldZoneCard
              key={zone.id}
              zone={zone}
              index={index}
              visited={visited.has(zone.building.id)}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
