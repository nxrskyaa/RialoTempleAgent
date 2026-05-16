import { Link } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { type RialoCityModule } from '@/data/rialoCityModules'
import { CityIcon } from './CityIcons'

type CityBuildingCardProps = {
  module: RialoCityModule
  completed: boolean
}

export default function CityBuildingCard({ module, completed }: CityBuildingCardProps) {
  return (
    <Link to={`/rialo-city/module/${module.slug}`} className="city-building group rounded-lg p-4" style={{ '--building-accent': module.accent } as CSSProperties & Record<'--building-accent', string>}>
      <div className="flex items-start justify-between gap-3">
        <div className="city-building-icon flex h-12 w-12 items-center justify-center rounded-lg">
          <CityIcon name={module.icon} className="h-6 w-6" />
        </div>
        <span className={`city-status rounded-full px-3 py-1 text-[10px] font-black ${completed ? 'is-complete' : ''}`}>
          {completed ? (
            <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Completed</span>
          ) : 'Explore'}
        </span>
      </div>
      <div className="mt-8">
        <p className="text-xl font-black">{module.buildingName}</p>
        <p className="mt-1 text-sm font-semibold" style={{ color: module.accent }}>{module.tagline}</p>
        <p className="mt-3 text-xs leading-5 text-[var(--temple-muted)]">{module.badge} badge</p>
      </div>
      <div className="mt-5 inline-flex items-center gap-2 text-xs font-black text-[var(--temple-text)]">
        Open module <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
      </div>
    </Link>
  )
}
