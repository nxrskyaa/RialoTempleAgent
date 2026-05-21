import WorldInterior from './WorldInterior'
import type { WorldBuilding } from './worldData'

export default function HomesInterior(props: { building: WorldBuilding; onBack: () => void; onComplete: (id: string) => void }) {
  return <WorldInterior {...props} />
}
