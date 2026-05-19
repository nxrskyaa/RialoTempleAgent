import { BadgeCheck, Cable, Factory, IdCard, RadioTower, Route, ShieldCheck } from 'lucide-react'

export function CityIcon({ name, className }: { name: string; className?: string }) {
  if (name === 'Cable') return <Cable className={className} />
  if (name === 'Factory') return <Factory className={className} />
  if (name === 'IdCard') return <IdCard className={className} />
  if (name === 'RadioTower') return <RadioTower className={className} />
  if (name === 'Route') return <Route className={className} />
  if (name === 'ShieldCheck') return <ShieldCheck className={className} />
  return <BadgeCheck className={className} />
}
