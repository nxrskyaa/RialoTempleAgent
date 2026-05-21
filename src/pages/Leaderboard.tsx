import { motion } from 'framer-motion'
import { Crown, Flame, Loader2, Sparkles, Trophy, WalletCards, type LucideIcon } from 'lucide-react'
import { useReadContract } from 'wagmi'
import { RIALO_TEMPLE_ABI, RIALO_TEMPLE_ADDRESS } from '@/config/contracts'
import { fmtAddress, getGrialoRarity, parseGrialoLeaderboard, type GrialoLeaderboardData } from '@/lib/rialo'

const LIMIT = 30n

export default function Leaderboard() {
  const ptsQuery = useReadContract({
    address: RIALO_TEMPLE_ADDRESS,
    abi: RIALO_TEMPLE_ABI,
    functionName: 'getTopPlayersByPts',
    args: [LIMIT],
    query: { refetchInterval: 8000, retry: 1 },
  })
  const streakQuery = useReadContract({
    address: RIALO_TEMPLE_ADDRESS,
    abi: RIALO_TEMPLE_ABI,
    functionName: 'getTopPlayersByStreak',
    args: [LIMIT],
    query: { refetchInterval: 8000, retry: 1 },
  })
  const playerCountQuery = useReadContract({
    address: RIALO_TEMPLE_ADDRESS,
    abi: RIALO_TEMPLE_ABI,
    functionName: 'getPlayerCount',
    query: { refetchInterval: 15000, retry: 1 },
  })

  const byPts = parseGrialoLeaderboard(ptsQuery.data)
  const byStreak = parseGrialoLeaderboard(streakQuery.data)
  const playerCount = typeof playerCountQuery.data === 'bigint' ? Number(playerCountQuery.data) : 0
  const isLoading = ptsQuery.isLoading || streakQuery.isLoading

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="temple-card grialo-leaderboard-hero mb-6 overflow-hidden rounded-lg p-5 sm:flex sm:items-end sm:justify-between sm:p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--temple-gold)]">Grialo Leaderboard</p>
          <h1 className="arcade-title mt-2 text-4xl font-black tracking-normal">Temple Energy Ranks</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-[var(--temple-muted)]">
            Ranked by Grialo PTS and streak discipline through daily mystery box consistency.
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-0 sm:w-72">
          <Stat icon={WalletCards} label="Players" value={playerCount} />
          <Stat icon={Sparkles} label="Board size" value={byPts.length} />
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-sm text-[var(--temple-muted)]">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-[var(--temple-emerald)]" /> Loading Grialo ranks
        </div>
      ) : byPts.length === 0 && byStreak.length === 0 ? (
        <div className="temple-card spark-field rounded-lg py-20 text-center">
          <Trophy className="mx-auto mb-3 h-9 w-9 text-[var(--temple-soft)]" />
          <p className="text-sm text-[var(--temple-muted)]">No Grialo spins yet.</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <RankPanel title="Top by PTS" icon={Crown} entries={byPts} mode="pts" />
          <RankPanel title="Top by streak" icon={Flame} entries={byStreak} mode="streak" />
        </div>
      )}
    </main>
  )
}

function RankPanel({ title, icon: Icon, entries, mode }: { title: string; icon: LucideIcon; entries: GrialoLeaderboardData[]; mode: 'pts' | 'streak' }) {
  return (
    <section className="temple-card rounded-lg p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="signature-section-icon">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-black">{title}</h2>
            <p className="text-xs font-bold text-[var(--temple-soft)]">Grialo PTS / streak / best tier / spins</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {entries.map((entry, index) => {
          const rarity = getGrialoRarity(entry.bestTier)
          return (
            <motion.div
              key={`${mode}-${entry.user}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.025 }}
              className="grialo-rank-row pixel-panel rounded-lg border border-[var(--temple-border)] p-3"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.055] text-sm font-black" style={{ color: index < 3 ? rarity.color : 'var(--temple-soft)' }}>
                  #{index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black">{fmtAddress(entry.user)}</p>
                  <p className="text-xs font-bold" style={{ color: rarity.color }}>{rarity.tier} / {rarity.boxName}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-right">
                <Mini label="PTS" value={entry.totalPts} />
                <Mini label="Best" value={`${entry.bestStreak}d`} />
                <Mini label="Spins" value={entry.totalSpins} />
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-sm font-black text-[var(--temple-text)]">{value}</p>
      <p className="text-[9px] font-black uppercase tracking-wider text-[var(--temple-soft)]">{label}</p>
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="pixel-panel rounded-lg border border-[var(--temple-border)] p-4">
      <Icon className="mb-2 h-4 w-4 text-[var(--temple-gold)]" />
      <p className="text-2xl font-black text-[var(--temple-emerald)]">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--temple-soft)]">{label}</p>
    </div>
  )
}
