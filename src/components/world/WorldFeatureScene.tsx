import type { WorldZone } from './WorldZoneCard'
import type { CSSProperties } from 'react'
import WorldCharacter from './WorldCharacter'

type WorldFeatureSceneProps = {
  zone: WorldZone | undefined
  stepKey?: string
  running?: boolean
  compact?: boolean
}

const assetLabels = ['House', 'Invoice', 'Gold', 'Bond']
const agentLabels = ['Read task', 'Check rules', 'Send action']
const gateLabels = ['Explore', 'Learn', 'Quest']
const scaleLabels = ['Policy', 'Permission', 'Limit', 'Verify']
const questLabels = ['RWA Vault', 'Agent Camp', 'SCALE Lab']

export default function WorldFeatureScene({ zone, stepKey, running = false, compact = false }: WorldFeatureSceneProps) {
  const id = zone?.id ?? 'temple-gate'
  const character = (
    <WorldCharacter
      name={zone?.mascot.name ?? 'Temple Guide'}
      tone={zone?.tone ?? 'gold'}
      size={compact ? 'sm' : 'md'}
      mood={running ? 'walk' : zone?.mascot.mood ?? 'wave'}
      accessory={zone?.mascot.accessory ?? 'scroll'}
      role={zone?.mascot.role ?? 'gate'}
    />
  )

  if (id === 'rwa-vault') {
    return (
      <div className={`world-feature-scene scene-vault ${compact ? 'is-compact' : ''}`} data-step={stepKey}>
        <div className="scene-assets">
          {assetLabels.map((label, index) => <span key={label} style={{ '--i': index } as CSSProperties}>{label}</span>)}
        </div>
        <div className="scene-vault-house">
          <span className="scene-vault-door" />
          <strong>Onchain Vault</strong>
          <i>Verified</i>
        </div>
        <div className="scene-onchain-card">
          <span />
          <strong>Asset Card</strong>
          <small>usable by apps</small>
        </div>
        <div className="scene-character">{character}</div>
      </div>
    )
  }

  if (id === 'agent-camp') {
    return (
      <div className={`world-feature-scene scene-agent ${compact ? 'is-compact' : ''}`} data-step={stepKey}>
        <div className="scene-task-scroll">Task scroll</div>
        <div className="scene-agent-row">
          {agentLabels.map((label, index) => (
            <div className="scene-agent-node" key={label} style={{ '--i': index } as CSSProperties}>
              <WorldCharacter name={label} tone={zone?.tone ?? 'coral'} size="sm" mood={index === 1 ? 'think' : 'focus'} accessory="orb" role="agent" />
              <span>{label}</span>
            </div>
          ))}
        </div>
        <span className="scene-message one" />
        <span className="scene-message two" />
        <div className="scene-result-card">Result confirmed</div>
      </div>
    )
  }

  if (id === 'scale-lab') {
    return (
      <div className={`world-feature-scene scene-scale ${compact ? 'is-compact' : ''}`} data-step={stepKey}>
        <div className="scene-action-orb">Agent action</div>
        <div className="scene-scale-gates">
          {scaleLabels.map((label, index) => <span key={label} style={{ '--i': index } as CSSProperties}>{label}</span>)}
        </div>
        <div className="scene-scan-beam" />
        <div className="scene-approved-action">Verified action</div>
        <div className="scene-character">{character}</div>
      </div>
    )
  }

  if (id === 'quest-board') {
    return (
      <div className={`world-feature-scene scene-quest ${compact ? 'is-compact' : ''}`} data-step={stepKey}>
        <div className="scene-quest-board">
          {questLabels.map((label, index) => <span key={label} style={{ '--i': index } as CSSProperties}>{label}</span>)}
        </div>
        <div className="scene-reward">Reward sparkle</div>
        <div className="scene-character">{character}</div>
      </div>
    )
  }

  if (id === 'identity-homes') {
    return (
      <div className={`world-feature-scene scene-identity ${compact ? 'is-compact' : ''}`} data-step={stepKey}>
        <div className="scene-wallet-home">Wallet home</div>
        <span className="scene-thread one" />
        <span className="scene-thread two" />
        <span className="scene-thread three" />
        <div className="scene-memory-orbs">
          <span>Assets</span>
          <span>History</span>
          <span>Reputation</span>
        </div>
        <div className="scene-character">{character}</div>
      </div>
    )
  }

  return (
    <div className={`world-feature-scene scene-gate ${compact ? 'is-compact' : ''}`} data-step={stepKey}>
      <div className="scene-temple-gate">
        <span className="scene-gate-left" />
        <span className="scene-gate-right" />
        <strong>Temple Gate</strong>
      </div>
      <div className="scene-guide-signs">
        {gateLabels.map((label, index) => <span key={label} style={{ '--i': index } as CSSProperties}>{label}</span>)}
      </div>
      <div className="scene-walk-path" />
      <div className="scene-character">{character}</div>
    </div>
  )
}
