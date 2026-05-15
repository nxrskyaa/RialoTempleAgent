import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Clapperboard, Flame, Sparkles, Star, Utensils } from 'lucide-react'
import { useReadContract } from 'wagmi'
import { RIALO_TEMPLE_ABI, RIALO_TEMPLE_ADDRESS } from '@/config/contracts'
import { parseTotals, TIERS } from '@/lib/rialo'

export default function Landing() {
  const { data } = useReadContract({
    address: RIALO_TEMPLE_ADDRESS,
    abi: RIALO_TEMPLE_ABI,
    functionName: 'getTotals',
    query: { refetchInterval: 8000 },
  })
  const totals = parseTotals(data)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <section className="grid min-h-[calc(100vh-6rem)] items-center gap-6 py-8 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-[var(--temple-border)] bg-white/[0.035] px-3 py-2 text-xs font-semibold text-[var(--temple-gold)]">
            <Sparkles className="h-3.5 w-3.5" /> Arc Testnet / native USDC
          </div>
          <h1 className="text-5xl font-black leading-[0.98] tracking-normal sm:text-7xl">Rialo Temple</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[var(--temple-muted)]">
            Build a Grialo streak, pay 1 native USDC for each on-chain ritual, publish food and film reviews, then climb the temple leaderboard by PTS.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/grialo" className="temple-button inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-bold">
              <Flame className="h-4 w-4" /> Start Grialo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/review" className="temple-button-secondary inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold">
              <Star className="h-4 w-4 text-[var(--temple-gold)]" /> Write Review
            </Link>
          </div>

          <div className="mt-8 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ['Users', totals.totalUsers],
              ['Reviews', totals.totalReviews],
              ['Fee', '1 USDC'],
            ].map(([label, value]) => (
              <div key={label} className="temple-card rounded-lg p-4">
                <p className="text-2xl font-bold text-[var(--temple-emerald)]">{value}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--temple-soft)]">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, delay: 0.08 }} className="temple-card relative overflow-hidden rounded-lg p-4 sm:p-5">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[var(--temple-gold)]/10 blur-3xl" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--temple-soft)]">Today in the temple</p>
              <h2 className="mt-1 text-2xl font-semibold">Daily ritual board</h2>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--temple-border)] bg-black/20" style={{ animation: 'temple-float 3s ease-in-out infinite' }}>
              <Flame className="h-6 w-6 text-[var(--temple-gold)]" />
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-[var(--temple-border)] bg-black/20 p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold">Grialo Check-in</span>
                <span className="rounded-md bg-[var(--temple-emerald)]/10 px-2 py-1 text-xs font-semibold text-[var(--temple-emerald)]">+PTS</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-6xl font-black leading-none">24</span>
                <span className="pb-2 text-sm text-[var(--temple-muted)]">hour cooldown</span>
              </div>
              <Link to="/grialo" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--temple-gold)]">Check in on-chain <ArrowRight className="h-4 w-4" /></Link>
            </div>

            <div className="space-y-3">
              {[
                { icon: Utensils, title: 'Food review', text: 'Name, origin, image URL, stars.' },
                { icon: Clapperboard, title: 'Film review', text: 'Title, IMDb link, stars.' },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border border-[var(--temple-border)] bg-white/[0.035] p-4">
                  <div className="flex items-start gap-3">
                    <item.icon className="h-5 w-5 text-[var(--temple-emerald)]" />
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-xs text-[var(--temple-muted)]">{item.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-[var(--temple-border)] bg-black/20 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--temple-soft)]">Tier ladder</p>
            <div className="space-y-2">
              {TIERS.map((tier) => (
                <div key={tier.name} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-xs">
                  <span className="truncate font-semibold">{tier.name}</span>
                  <span className="text-[var(--temple-muted)]">{tier.range}</span>
                  <span className="font-bold" style={{ color: tier.color }}>+{tier.pts}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
