import CharacterMascot from './CharacterMascot'

export default function WorldEmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="world-empty-state">
      <CharacterMascot name="Lost Temple Scout" tone="cream" size="sm" mood="tilt" accessory="orb" variant="scout" />
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </div>
  )
}
