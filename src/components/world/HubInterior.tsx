import WorldInterior from './WorldInterior'
import type { WorldBuilding } from './worldData'

export default function HubInterior(props: { building: WorldBuilding; onBack: () => void; onComplete: (id: string) => void }) {
  return <WorldInterior {...props} />
}
