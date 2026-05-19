import { Link } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, CheckCircle2, IdCard, Sparkles } from 'lucide-react'
import { RIALO_CITY_MODULES } from '@/data/rialoCityModules'
import { useRialoCityProgress } from '@/hooks/useRialoCityProgress'
import ShareCard from './ShareCard'

export default function RialoPassport() {
  const { passport, progress, rank, completedCount, totalModules, progressPercentage, allCompleted } = useRialoCityProgress()

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-5">
        <Link to="/rialo-city" className="temple-button-secondary inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-black">
          <ArrowLeft className="h-4 w-4" /> Back to city
        </Link>
      </div>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.75fr]">
        <div className="city-passport-card temple-card rounded-lg p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[var(--temple-mint-soft)] text-[var(--temple-emerald)]">
                <IdCard className="h-8 w-8" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[var(--temple-cyan)]">Rialo City Passport</p>
                <h1 className="mt-2 text-4xl font-black">{passport?.name || 'Rialo Visitor'}</h1>
                <p className="mt-1 text-sm text-[var(--temple-muted)]">{passport?.role || 'Create a passport in Omni Passport Office'}</p>
              </div>
            </div>
            {allCompleted && <span className="inline-flex items-center gap-2 rounded-full bg-[var(--temple-mint-soft)] px-4 py-2 text-xs font-black text-[var(--temple-emerald)]"><Sparkles className="h-4 w-4" /> Rialo City Pioneer</span>}
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <PassportMetric label="Rank" value={rank} />
            <PassportMetric label="XP" value={`${progress.xp}`} />
            <PassportMetric label="Modules" value={`${completedCount}/${totalModules}`} />
            <PassportMetric label="Badges" value={`${progress.badges.length}`} />
          </div>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-xs font-black text-[var(--temple-muted)]">
              <span>City completion</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-[var(--temple-emerald)] via-[var(--temple-gold)] to-[var(--temple-pink)]" style={{ width: `${progressPercentage}%` }} />
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-sm font-black">Completed modules</p>
              <div className="mt-3 grid gap-2">
                {RIALO_CITY_MODULES.map((module) => {
                  const done = progress.completedModules.includes(module.id)
                  return (
                    <Link key={module.id} to={`/rialo-city/module/${module.slug}`} className={`city-passport-row rounded-lg px-4 py-3 text-sm font-black ${done ? 'is-done' : ''}`}>
                      <span>{module.buildingName}</span>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs text-[var(--temple-soft)]">Open</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div>
              <p className="text-sm font-black">Badges</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {progress.badges.length > 0 ? progress.badges.map((badge) => (
                  <span key={badge} className="inline-flex items-center gap-2 rounded-full border border-[var(--temple-border)] bg-white/[0.045] px-3 py-2 text-xs font-black">
                    <BadgeCheck className="h-3.5 w-3.5 text-[var(--temple-gold)]" /> {badge}
                  </span>
                )) : <p className="text-sm leading-6 text-[var(--temple-muted)]">No badges yet. Open a city building and run a simulator.</p>}
              </div>
              <div className="mt-5 rounded-lg border border-[var(--temple-border)] bg-black/20 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-[var(--temple-soft)]">Favorite use case</p>
                <p className="mt-2 text-sm font-semibold">{passport?.favoriteUseCase || 'Not set yet'}</p>
              </div>
            </div>
          </div>
        </div>

        <ShareCard passport={passport} progress={progress} rank={rank} completedCount={completedCount} totalModules={totalModules} progressPercentage={progressPercentage} />
      </section>
    </div>
  )
}

function PassportMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="city-mini-stat rounded-lg p-4">
      <p className="text-xs font-black uppercase tracking-wider text-[var(--temple-soft)]">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  )
}
