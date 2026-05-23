import type { CSSProperties } from 'react'
import type { WorldZone } from './worldData'
import WorldCharacter from './WorldCharacter'

type WorldFeatureSceneProps = {
  zone: WorldZone
  compact?: boolean
}

const sourceLabels = ['Weather', 'Price', 'Bank', 'Shipment', 'Ratings']
const portalLabels = ['Payment', 'Database', 'Email', 'Delivery']
const privacyLabels = ['Public note', 'Encrypt', 'Private send']
const passportLabels = ['Email', 'SMS', 'Social', 'Wallet']
const assetLabels = ['House', 'Invoice', 'Bond', 'Gold', 'Ticket', 'Doc']
const agentLabels = ['Request', 'Work', 'Verify', 'Pay']
const scaleLabels = ['Task Terms', 'Deadline', 'Quality Check', 'Payment Release']

export default function WorldFeatureScene({ zone, compact = false }: WorldFeatureSceneProps) {
  return (
    <div className={`world-story-scene zone-${zone.id} tone-${zone.tone} ${compact ? 'is-compact' : ''}`}>
      {renderScene(zone)}
      <div className="world-scene-guide">
        <WorldCharacter
          name={zone.mascot.name}
          tone={zone.tone}
          role={zone.mascot.role}
          accessory={zone.mascot.accessory}
          mood={zone.mascot.mood}
          size={compact ? 'sm' : 'md'}
        />
      </div>
    </div>
  )
}

function renderScene(zone: WorldZone) {
  if (zone.id === 'data-spring') {
    return (
      <>
        <div className="scene-source-row">
          {sourceLabels.map((label, index) => <span key={label} style={{ '--i': index } as CSSProperties}>{label}</span>)}
        </div>
        <div className="scene-filter">Check</div>
        <div className="scene-pool"><strong>Onchain data pool</strong></div>
        <span className="scene-flow-line" />
      </>
    )
  }

  if (zone.id === 'bridge-gate') {
    return (
      <>
        <div className="scene-contract">Smart contract</div>
        <div className="scene-api-portals">
          {portalLabels.map((label, index) => <span key={label} style={{ '--i': index } as CSSProperties}>{label}</span>)}
        </div>
        <div className="scene-response">Response returns</div>
        <span className="scene-scroll-message" />
      </>
    )
  }

  if (zone.id === 'privacy-chamber') {
    return (
      <>
        <div className="scene-privacy-steps">
          {privacyLabels.map((label, index) => <span key={label} style={{ '--i': index } as CSSProperties}>{label}</span>)}
        </div>
        <div className="scene-shield-dome">Private chamber</div>
        <span className="scene-encrypted-scroll" />
      </>
    )
  }

  if (zone.id === 'identity-passport') {
    return (
      <div className="scene-identity-flow">
        <div className="scene-passport-stamps" aria-label="Familiar login options">
          {passportLabels.map((label, index) => <span key={label} style={{ '--i': index } as CSSProperties}>{label}</span>)}
        </div>
        <span className="scene-flow-arrow" />
        <div className="scene-passport-book">
          <strong>Temple Passport</strong>
          <small>stamped identity</small>
        </div>
        <span className="scene-flow-arrow" />
        <div className="scene-entry-door">Enter Web3</div>
      </div>
    )
  }

  if (zone.id === 'speed-engine') {
    return (
      <>
        <div className="scene-event-card">Real-world event</div>
        <div className="scene-engine-core">Trigger engine</div>
        <div className="scene-action-card">Onchain action</div>
        <span className="scene-lightning-path" />
      </>
    )
  }

  if (zone.id === 'rwa-vault') {
    return (
      <div className="scene-rwa-flow">
        <div className="scene-assets-stack" aria-label="Real-world assets">
          {assetLabels.map((label, index) => <span key={label} style={{ '--i': index } as CSSProperties}>{label}</span>)}
        </div>
        <span className="scene-flow-arrow" />
        <div className="scene-vault-core">
          <strong>RWA Vault</strong>
          <small>verify</small>
        </div>
        <span className="scene-flow-arrow" />
        <div className="scene-asset-card">
          <strong>Asset Card</strong>
          <small>onchain record</small>
          <em>Live status update</em>
        </div>
      </div>
    )
  }

  if (zone.id === 'agent-camp') {
    return (
      <>
        <div className="scene-agent-board">Task board</div>
        <div className="scene-agent-steps">
          {agentLabels.map((label, index) => <span key={label} style={{ '--i': index } as CSSProperties}>{label}</span>)}
        </div>
        <span className="scene-task-scroll-moving" />
      </>
    )
  }

  return (
    <>
      <div className="scene-scale-machine">SCALE machine</div>
      <div className="scene-scale-stations">
        {scaleLabels.map((label, index) => <span key={label} style={{ '--i': index } as CSSProperties}>{label}</span>)}
      </div>
      <div className="scene-approved-output">Approved action</div>
      <span className="scene-lab-task" />
    </>
  )
}
