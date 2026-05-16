import { motion } from 'framer-motion'
import { CalendarCheck, Flame, Loader2, Star, Trophy } from 'lucide-react'
import { useReadContract } from 'wagmi'
import { RIALO_TEMPLE_ABI, RIALO_TEMPLE_ADDRESS } from '@/config/contracts'
import { fmtAddress, getTier, parseLeaderboard, parseTotals } from '@/lib/rialo'

export default function Leaderboard() {
  const { data, isLoading } = useReadContract({
    address: RIALO_TEMPLE_ADDRESS,
    abi: RIALO_TEMPLE_ABI,
    functionName: 'getLeaderboard',
    args: [30n],
    query: { refetchInterval: 6000 },
  })
  const { data: totalsData } = useReadContract({
    address: RIALO_TEMPLE_ADDRESS,
    abi: RIALO_TEMPLE_ABI,
    functionName: 'getTotals',
    query: { refetchInterval: 10000 },
  })
  const entries = parseLeaderboard(data)
  const totals = parseTotals(totalsData)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="temple-card spark-field mb-6 overflow-hidden rounded-lg p-5 sm:flex sm:items-end sm:justify-between sm:p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-[var(--temple-cyan)]">Leaderboard</p>
          <h1 className="arcade-title mt-2 text-4xl font-black tracking-normal">Rialo Streaks</h1>
          <p className="mt-2 text-sm text-[var(--temple-muted)]">PTS first, streaks second, pure consistency energy after that.</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-0 sm:w-72">
          <Stat label="Users" value={totals.totalUsers} />
          <Stat label="Reviews" value={totals.totalReviews} />
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-sm text-[var(--temple-muted)]"><Loader2 className="mr-2 h-4 w-4 animate-spin text-[var(--temple-emerald)]" /> Loading ranks</div>
      ) : entries.length === 0 ? (
        <div className="temple-card spark-field rounded-lg py-20 text-center">
          <Trophy className="mx-auto mb-3 h-9 w-9 text-[var(--temple-soft)]" />
          <p className="text-sm text-[var(--temple-muted)]">No Grialo check-ins yet.</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="temple-card rounded-lg p-5">
            <p className="mb-5 text-xs font-black uppercase tracking-wider text-[var(--temple-soft)]">Podium</p>
            <div className="grid grid-cols-3 items-end gap-3">
              {[entries[1], entries[0], entries[2]].filter(Boolean).map((entry, index) => {
                const rank = entry === entries[0] ? 1 : entry === entries[1] ? 2 : 3
                const tier = getTier(entry.currentStreak)
                return (
                  <div key={entry.user} className={`pixel-panel rounded-lg border border-[var(--temple-border)] p-3 text-center transition hover:-translate-y-0.5 ${rank === 1 ? 'pb-8 pt-7' : index === 0 ? 'pb-5 pt-5' : 'pb-4 pt-4'}`}>
                    <div className="machine-screen mx-auto mb-3 flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-[var(--temple-border)]">
                      {entry.avatarUrl ? <img src={entry.avatarUrl} alt="" className="h-full w-full object-cover" /> : <Trophy className="h-5 w-5" style={{ color: tier.color }} />}
                    </div>
                    <p className="text-lg font-black" style={{ color: tier.color }}>#{rank}</p>
                    <p className="mt-1 truncate text-sm font-black">{entry.name || fmtAddress(entry.user)}</p>
                    <p className="text-xs text-[var(--temple-muted)]">{entry.totalPts} PTS</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="temple-card rounded-lg p-5">
            <p className="mb-4 text-xs font-black uppercase tracking-wider text-[var(--temple-soft)]">All players</p>
            <div className="space-y-2">
              {entries.map((entry, index) => {
                const tier = getTier(entry.currentStreak)
                return (
                  <motion.div key={entry.user} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.025 }} className="pixel-panel grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-[var(--temple-border)] p-3 transition hover:-translate-y-0.5 hover:border-[rgba(161,255,211,0.3)]">
                    <span className="w-8 text-center text-sm font-black" style={{ color: index < 3 ? tier.color : 'var(--temple-soft)' }}>#{index + 1}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="machine-screen h-8 w-8 overflow-hidden rounded-lg border border-[var(--temple-border)]">
                          {entry.avatarUrl && <img src={entry.avatarUrl} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">{entry.name || fmtAddress(entry.user)}</p>
                          <p className="truncate text-xs text-[var(--temple-muted)]">@{entry.xHandle || fmtAddress(entry.user)}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[var(--temple-muted)]">
                        <span className="inline-flex items-center gap-1"><Flame className="h-3 w-3" style={{ color: tier.color }} />{entry.currentStreak}d</span>
                        <span className="inline-flex items-center gap-1"><CalendarCheck className="h-3 w-3" />{entry.totalCheckIns} checks</span>
                        <span className="inline-flex items-center gap-1"><Star className="h-3 w-3" />{entry.reviewCount} reviews</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-[var(--temple-emerald)]">{entry.totalPts}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--temple-soft)]">PTS</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="pixel-panel rounded-lg border border-[var(--temple-border)] p-4">
      <p className="text-2xl font-black text-[var(--temple-emerald)]">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--temple-soft)]">{label}</p>
    </div>
  )
}
