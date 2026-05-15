import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Clapperboard, Flame, MessageSquareText, Star, Trophy, Utensils, type LucideIcon } from 'lucide-react'
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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <section className="grid min-h-[calc(100vh-5.5rem)] gap-5 py-5 lg:grid-cols-[0.92fr_1.08fr]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="temple-rune-panel temple-card flex flex-col justify-between rounded-lg p-6 sm:p-8">
          <div className="relative z-10">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src="/logo-mark.svg" alt="" className="h-12 w-12" />
                <div>
                  <p className="temple-wordmark text-xl font-semibold">Rialo Temple</p>
                  <p className="text-xs text-[var(--temple-muted)]">Arc Testnet / native USDC</p>
                </div>
              </div>
              <div className="hidden rounded-lg border border-[var(--temple-border)] bg-black/20 px-3 py-2 text-xs font-semibold text-[var(--temple-gold)] sm:block">1 USDC per ritual</div>
            </div>

            <h1 className="max-w-xl text-5xl font-black leading-[0.92] tracking-normal sm:text-7xl">
              On-chain streaks with a review culture.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[var(--temple-muted)]">
              Grialo check-ins, food notes, film reviews, PTS, and leaderboard identity in one contract-backed temple.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/grialo" className="temple-button inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-bold">
                <Flame className="h-4 w-4" /> Check in <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/review" className="temple-button-secondary inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold">
                <MessageSquareText className="h-4 w-4 text-[var(--temple-gold)]" /> Write review
              </Link>
            </div>
          </div>

          <div className="relative z-10 mt-10 grid grid-cols-3 gap-2">
            {[
              ['Users', totals.totalUsers],
              ['Reviews', totals.totalReviews],
              ['Chain', 'Arc'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[var(--temple-border)] bg-black/20 p-3">
                <p className="text-xl font-black text-[var(--temple-emerald)]">{value}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--temple-soft)]">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, delay: 0.08 }} className="grid gap-5 lg:grid-rows-[1fr_auto]">
          <div className="temple-card relative grid overflow-hidden rounded-lg p-5 sm:p-6 md:grid-cols-[0.92fr_1.08fr]">
            <div className="relative z-10 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--temple-soft)]">Daily ritual console</p>
                <h2 className="mt-2 text-3xl font-black">Keep the flame. Earn the rank.</h2>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <ActionTile icon={Flame} title="Grialo" text="24h streak check-in" to="/grialo" />
                <ActionTile icon={Star} title="PTS" text="Synced leaderboard" to="/leaderboard" />
                <ActionTile icon={Utensils} title="Food" text="Origin, image, rating" to="/review" />
                <ActionTile icon={Clapperboard} title="Film" text="IMDb link, rating" to="/review" />
              </div>
            </div>

            <div className="relative mt-8 flex min-h-[310px] items-center justify-center md:mt-0">
              <div className="temple-orbit absolute h-72 w-72 rounded-full p-[1px]">
                <div className="h-full w-full rounded-full bg-[#090b0a]" />
              </div>
              <div className="absolute h-52 w-52 rounded-full border border-[var(--temple-border)] bg-black/30" />
              <div className="relative z-10 text-center">
                <Flame className="mx-auto h-12 w-12 text-[var(--temple-gold)]" style={{ animation: 'temple-float 3s ease-in-out infinite' }} />
                <p className="mt-5 text-7xl font-black leading-none text-[var(--temple-text)]">24h</p>
                <p className="mt-2 text-sm text-[var(--temple-muted)]">cooldown cycle</p>
              </div>
            </div>
          </div>

          <div className="temple-card rounded-lg p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--temple-soft)]">Tier ladder</p>
              <Link to="/leaderboard" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--temple-gold)]"><Trophy className="h-3.5 w-3.5" /> leaderboard</Link>
            </div>
            <div className="grid gap-2 md:grid-cols-5">
              {TIERS.map((tier) => (
                <div key={tier.name} className="rounded-lg border border-[var(--temple-border)] bg-white/[0.025] p-3">
                  <p className="truncate text-sm font-semibold">{tier.name}</p>
                  <p className="mt-2 text-xs text-[var(--temple-muted)]">{tier.range}</p>
                  <p className="mt-3 text-lg font-black" style={{ color: tier.color }}>+{tier.pts}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}

function ActionTile({ icon: Icon, title, text, to }: { icon: LucideIcon; title: string; text: string; to: string }) {
  return (
    <Link to={to} className="group rounded-lg border border-[var(--temple-border)] bg-white/[0.028] p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.055]">
      <Icon className="h-5 w-5 text-[var(--temple-emerald)] transition group-hover:text-[var(--temple-gold)]" />
      <p className="mt-4 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-[var(--temple-muted)]">{text}</p>
    </Link>
  )
}
