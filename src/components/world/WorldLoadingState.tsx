import CharacterMascot from './CharacterMascot'

export default function WorldLoadingState({ label }: { label: string }) {
  return (
    <div className="world-loading-state" aria-live="polite">
      <CharacterMascot name="Busy Rialo Helper" tone="emerald" size="sm" mood="walk" accessory="spark" variant="lab" />
      <span>{label}</span>
      <i />
    </div>
  )
}
