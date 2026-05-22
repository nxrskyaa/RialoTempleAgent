import type { WorldZone } from './WorldZoneCard'
import WorldCharacter from './WorldCharacter'
import ExplanationPopup from './ExplanationPopup'
import { glossary, type WorldBuilding } from './worldData'

type WorldZoneDetailProps = {
  zone: WorldZone | undefined
  building: WorldBuilding
  advanced: boolean
  onToggleAdvanced: () => void
}

const technicalNotes: Record<string, string> = {
  oracle: 'Agents create work, judges score it, escrow settles it, and proof records the result.',
  treasury: 'RWA maps a verified offchain claim to an onchain record that apps can inspect.',
  hub: 'Governance turns proposals and votes into transparent state changes.',
  bazaar: 'Markets coordinate listings, matching, settlement, and price discovery.',
  spire: 'Transactions wait, batch into blocks, and become verifiable chain history.',
  homes: 'Wallet identity carries permissions, assets, reputation, and history.',
}

export default function WorldZoneDetail({ zone, building, advanced, onToggleAdvanced }: WorldZoneDetailProps) {
  return (
    <aside className={`world-feature-detail tone-${zone?.tone ?? 'gold'}`}>
      <div className="world-detail-hero">
        <WorldCharacter
          name={zone?.mascot.name ?? building.shortName}
          tone={zone?.tone ?? 'gold'}
          size="md"
          mood={zone?.mascot.mood ?? 'wave'}
          accessory={zone?.mascot.accessory ?? 'orb'}
          role={zone?.mascot.role ?? 'gate'}
        />
        <div>
          <span>{zone?.concept ?? building.role}</span>
          <h2>{zone?.label ?? building.shortName}</h2>
        </div>
      </div>

      <p>{zone?.simple ?? building.simple}</p>

      <div className="world-compare-card">
        <strong>Without Rialo</strong>
        <span>{building.without}</span>
      </div>
      <div className="world-compare-card is-bright">
        <strong>With Rialo</strong>
        <span>{building.with}</span>
      </div>

      <button type="button" onClick={onToggleAdvanced} className="world-learn-toggle">
        {advanced ? 'Hide tech note' : 'Learn more'}
      </button>
      {advanced ? <div className="world-tech-bubble">{technicalNotes[building.id]}</div> : null}

      <div className="world-modal-row">
        {glossary.slice(0, 3).map((item) => (
          <ExplanationPopup key={item.term} title={item.term}>{item.simple}</ExplanationPopup>
        ))}
      </div>
    </aside>
  )
}
