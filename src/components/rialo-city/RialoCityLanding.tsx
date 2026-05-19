import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Sparkles } from 'lucide-react'
import RialoCityMap from './RialoCityMap'

export default function RialoCityLanding() {
  const scrollToMap = () => {
    document.getElementById('city-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <section className="city-hero temple-card rounded-lg p-6 sm:p-8">
        <div className="city-skyline" aria-hidden="true" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <img src="/logo-mark.svg" alt="" className="h-14 w-14" />
              <div>
                <p className="temple-wordmark text-lg font-black">Rialo City</p>
                <p className="text-xs text-[var(--temple-muted)]">No wallet learning simulator</p>
              </div>
            </div>
            <h1 className="max-w-2xl text-5xl font-black leading-[0.95] tracking-normal sm:text-7xl">Explore Rialo through a visual city simulator.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--temple-muted)]">
              No wallet. No gas. Just interactive learning for real-world data, privacy, automation, Web2 connectivity, Omni Account, and gasless UX before Rialo goes live.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={scrollToMap} className="temple-button inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-black">
                Explore map <ArrowRight className="h-4 w-4" />
              </button>
              <Link to="/rialo-city/passport" className="temple-button-secondary inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-black">
                <BadgeCheck className="h-4 w-4 text-[var(--temple-cyan)]" /> City Passport
              </Link>
            </div>
          </div>
          <div className="city-preview relative min-h-[360px] overflow-hidden rounded-lg">
            <div className="city-preview-grid" />
            <div className="city-preview-building stream">Stream</div>
            <div className="city-preview-building workflow">Workflow</div>
            <div className="city-preview-building privacy">Privacy</div>
            <div className="city-preview-building edge">Edge</div>
            <div className="city-preview-building omni">Omni</div>
            <div className="city-preview-road cruise">Cruise Lane</div>
            <div className="city-preview-orbit" />
            <div className="city-preview-note rounded-lg p-4">
              <Sparkles className="h-5 w-5 text-[var(--temple-gold)]" />
              <p className="mt-3 text-sm font-black">Click buildings, run tiny simulations, unlock local badges.</p>
            </div>
          </div>
        </div>
      </section>
      <div id="city-map" className="mt-5 scroll-mt-24">
        <RialoCityMap />
      </div>
    </div>
  )
}
