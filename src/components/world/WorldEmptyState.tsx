import WorldCharacter from './WorldCharacter'

export default function WorldEmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="world-empty-state">
      <WorldCharacter name="Lost Temple Scout" tone="cream" size="sm" mood="think" accessory="orb" role="portal" />
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </div>
  )
}
