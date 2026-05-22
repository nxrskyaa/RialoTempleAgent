type MascotTone = 'gold' | 'emerald' | 'coral' | 'sapphire' | 'violet' | 'cream'

type CharacterMascotProps = {
  name: string
  tone?: MascotTone
  size?: 'sm' | 'md' | 'lg'
  mood?: 'wave' | 'tilt' | 'walk' | 'focus' | 'float'
  accessory?: 'scroll' | 'orb' | 'coin' | 'key' | 'spark'
}

const toneClass: Record<MascotTone, string> = {
  gold: 'is-gold',
  emerald: 'is-emerald',
  coral: 'is-coral',
  sapphire: 'is-sapphire',
  violet: 'is-violet',
  cream: 'is-cream',
}

export default function CharacterMascot({
  name,
  tone = 'gold',
  size = 'md',
  mood = 'wave',
  accessory = 'orb',
}: CharacterMascotProps) {
  return (
    <div className={`world-mascot ${toneClass[tone]} is-${size} mood-${mood}`} aria-label={name} role="img">
      <div className="world-mascot-shadow" />
      <div className="world-mascot-accessory" data-accessory={accessory} />
      <div className="world-mascot-body">
        <div className="world-mascot-hood">
          <span className="world-mascot-rune" />
        </div>
        <div className="world-mascot-face">
          <span className="world-mascot-eye left" />
          <span className="world-mascot-eye right" />
          <span className="world-mascot-smile" />
        </div>
        <span className="world-mascot-arm left" />
        <span className="world-mascot-arm right" />
        <span className="world-mascot-foot left" />
        <span className="world-mascot-foot right" />
      </div>
    </div>
  )
}
