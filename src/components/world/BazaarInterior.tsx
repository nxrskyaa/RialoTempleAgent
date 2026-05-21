import WorldInterior from './WorldInterior'
import type { WorldBuilding } from './worldData'

export default function BazaarInterior(props: { building: WorldBuilding; onBack: () => void; onComplete: (id: string) => void }) {
  return <WorldInterior {...props} />
}
