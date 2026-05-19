export type GradientPreset = {
  name: string
  value: string
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { name: 'Ivory Flame', value: 'linear-gradient(135deg,#f5ead8,#ff7a00)' },
  { name: 'Rialo Glow', value: 'linear-gradient(135deg,#f7f0dc,#8dd9c7)' },
  { name: 'Temple Gold', value: 'linear-gradient(135deg,#fff4c2,#c99b3b)' },
  { name: 'Arc Blue', value: 'linear-gradient(135deg,#d9f4ff,#4f8cff)' },
  { name: 'Emerald Signal', value: 'linear-gradient(135deg,#e7ffe7,#39d98a)' },
]

type GradientPickerProps = {
  value: string
  onChange: (value: string, name: string) => void
  customA: string
  customB: string
  onCustomAChange: (value: string) => void
  onCustomBChange: (value: string) => void
}

export default function GradientPicker({
  value,
  onChange,
  customA,
  customB,
  onCustomAChange,
  onCustomBChange,
}: GradientPickerProps) {
  const customGradient = `linear-gradient(135deg,${customA},${customB})`

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {GRADIENT_PRESETS.map(preset => (
          <button
            key={preset.name}
            type="button"
            onClick={() => onChange(preset.value, preset.name)}
            className={`signature-gradient-option ${value === preset.value ? 'is-active' : ''}`}
          >
            <span className="signature-gradient-swatch" style={{ background: preset.value }} />
            <span>{preset.name}</span>
          </button>
        ))}
      </div>
      <div className="signature-custom-gradient">
        <label>
          <span>Custom A</span>
          <input
            type="color"
            value={customA}
            onChange={event => {
              onCustomAChange(event.target.value)
              onChange(`linear-gradient(135deg,${event.target.value},${customB})`, 'Custom Gradient')
            }}
          />
        </label>
        <label>
          <span>Custom B</span>
          <input
            type="color"
            value={customB}
            onChange={event => {
              onCustomBChange(event.target.value)
              onChange(`linear-gradient(135deg,${customA},${event.target.value})`, 'Custom Gradient')
            }}
          />
        </label>
        <button type="button" className="temple-button-secondary rounded-full px-4 py-2 text-xs font-black" onClick={() => onChange(customGradient, 'Custom Gradient')}>
          Use custom
        </button>
      </div>
    </div>
  )
}
