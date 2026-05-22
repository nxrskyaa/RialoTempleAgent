import WorldCharacter from './WorldCharacter'

export default function WorldLoadingState({ label }: { label: string }) {
  return (
    <div className="world-loading-state" aria-live="polite">
      <WorldCharacter name="Busy Rialo Helper" tone="emerald" size="sm" mood="walk" accessory="spark" role="scale" />
      <span>{label}</span>
      <i />
    </div>
  )
}
