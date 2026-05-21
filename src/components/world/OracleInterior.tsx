import WorldInterior from './WorldInterior'
import type { WorldBuilding } from './worldData'

export default function OracleInterior(props: { building: WorldBuilding; onBack: () => void; onComplete: (id: string) => void }) {
  return <WorldInterior {...props} />
}
