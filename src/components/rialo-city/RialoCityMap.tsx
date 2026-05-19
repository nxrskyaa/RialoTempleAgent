import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Map, RotateCcw } from 'lucide-react'
import { RIALO_CITY_MODULES } from '@/data/rialoCityModules'
import { useRialoCityProgress } from '@/hooks/useRialoCityProgress'
import CityBuildingCard from './CityBuildingCard'

export default function RialoCityMap() {
  const { progress, rank, completedCount, progressPercentage, totalModules, allCompleted } = useRialoCityProgress()

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <div className="city-map temple-card rounded-lg p-4 sm:p-6">
        <div className="city-map-lines" aria-hidden="true" />
        <div className="relative z-10 mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-black text-[var(--temple-cyan)]">Visual city map</p>
            <h2 className="mt-2 text-3xl font-black">Six buildings. Six Rialo ideas.</h2>
          </div>
          <Link to="/rialo-city/passport" className="temple-button-secondary inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-black">
            <BadgeCheck className="h-4 w-4 text-[var(--temple-gold)]" /> View Passport
          </Link>
        </div>
        <div className="relative z-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {RIALO_CITY_MODULES.map((module) => (
            <CityBuildingCard key={module.id} module={module} completed={progress.completedModules.includes(module.id)} />
          ))}
        </div>
      </div>

      <aside className="city-passport-mini temple-card rounded-lg p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--temple-mint-soft)] text-[var(--temple-emerald)]">
            <Map className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-[var(--temple-soft)]">City progress</p>
            <p className="text-2xl font-black">{rank}</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs font-black text-[var(--temple-muted)]">
            <span>{completedCount}/{totalModules} modules</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-[var(--temple-emerald)] via-[var(--temple-gold)] to-[var(--temple-pink)] transition-all" style={{ width: `${progressPercentage}%` }} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="city-mini-stat rounded-lg p-3">
            <p className="text-2xl font-black text-[var(--temple-gold)]">{progress.xp}</p>
            <p className="text-xs text-[var(--temple-muted)]">Local XP</p>
          </div>
          <div className="city-mini-stat rounded-lg p-3">
            <p className="text-2xl font-black text-[var(--temple-cyan)]">{progress.badges.length}</p>
            <p className="text-xs text-[var(--temple-muted)]">Badges</p>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-[var(--temple-border)] bg-black/20 p-4">
          <p className="text-sm font-black">{allCompleted ? 'Rialo City Pioneer' : 'Next step'}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--temple-muted)]">
            {allCompleted ? 'You completed every local simulator module. This is a learning status, not an onchain credential.' : 'Open any building, run its mini simulation, and collect a local learning badge.'}
          </p>
        </div>

        <Link to="/rialo-city/module/stream" className="temple-button mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-black">
          Start with Stream <ArrowRight className="h-4 w-4" />
        </Link>
        <div className="mt-4 flex items-center gap-2 text-xs text-[var(--temple-soft)]">
          <RotateCcw className="h-3.5 w-3.5" /> Progress is saved locally in this browser.
        </div>
      </aside>
    </section>
  )
}
