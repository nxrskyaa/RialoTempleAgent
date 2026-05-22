export type WorldCharacterTone = 'gold' | 'emerald' | 'coral' | 'sapphire' | 'violet' | 'cream'
export type WorldCharacterRole = 'gate' | 'vault' | 'agent' | 'scale' | 'quest' | 'portal'
export type WorldCharacterMood = 'wave' | 'think' | 'walk' | 'focus' | 'float'
export type WorldCharacterAccessory = 'scroll' | 'orb' | 'coin' | 'key' | 'spark' | 'map'

type WorldCharacterProps = {
  name: string
  tone?: WorldCharacterTone
  role?: WorldCharacterRole
  size?: 'sm' | 'md' | 'lg'
  mood?: WorldCharacterMood
  accessory?: WorldCharacterAccessory
}

export default function WorldCharacter({
  name,
  tone = 'gold',
  role = 'gate',
  size = 'md',
  mood = 'wave',
  accessory = 'orb',
}: WorldCharacterProps) {
  return (
    <div className={`world-character tone-${tone} role-${role} size-${size} mood-${mood}`} aria-label={name} role="img">
      <span className="world-character-shadow" />
      <span className="world-character-accessory" data-accessory={accessory} />
      <span className="world-character-spark one" />
      <span className="world-character-spark two" />
      <div className="world-character-body">
        <span className="world-character-badge" />
        <div className="world-character-head">
          <span className="world-character-ear left" />
          <span className="world-character-ear right" />
          <div className="world-character-face">
            <span className="world-character-eye left">
              <i />
            </span>
            <span className="world-character-eye right">
              <i />
            </span>
            <span className="world-character-mouth" />
          </div>
        </div>
        <span className="world-character-arm left" />
        <span className="world-character-arm right" />
        <span className="world-character-foot left" />
        <span className="world-character-foot right" />
      </div>
    </div>
  )
}
