import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Crown, Flame, Loader2, Sparkles, Trophy, WalletCards, type LucideIcon } from 'lucide-react'
import { useReadContract, useReadContracts } from 'wagmi'
import { ARC_CHAIN, RIALO_TEMPLE_ABI, RIALO_TEMPLE_ADDRESS } from '@/config/contracts'
import { buildLeaderboardRows, fmtAddress, getGrialoRarity, parseLeaderboardAddresses, type GrialoLeaderboardData } from '@/lib/rialo'

const LIMIT = 30n

const TABS = [
  { id: 'pts', label: 'Top PTS', fn: 'getTopByPts', metric: 'Total PTS' },
  { id: 'streak', label: 'Top Streak', fn: 'getTopByStreak', metric: 'Best Streak' },
  { id: 'grialo', label: 'Top Grialo', fn: 'getTopByGrialoPts', metric: 'Grialo PTS' },
  { id: 'quiz', label: 'Top Quiz', fn: 'getTopByQuizPts', metric: 'Quiz PTS' },
] as const

type TabId = typeof TABS[number]['id']

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<TabId>('pts')
  const active = TABS.find((tab) => tab.id === activeTab) ?? TABS[0]
  const rankQuery = useReadContract({
    address: RIALO_TEMPLE_ADDRESS,
    abi: RIALO_TEMPLE_ABI,
    chainId: ARC_CHAIN.id,
    functionName: active.fn,
    args: [LIMIT],
    query: { refetchInterval: 8000, retry: 1 },
  })
  const playerCountQuery = useReadContract({
    address: RIALO_TEMPLE_ADDRESS,
    abi: RIALO_TEMPLE_ABI,
    chainId: ARC_CHAIN.id,
    functionName: 'getPlayerCount',
    query: { refetchInterval: 15000, retry: 1 },
  })

  const ranking = useMemo(() => parseLeaderboardAddresses(rankQuery.data), [rankQuery.data])
  const userQueries = useReadContracts({
    contracts: ranking.users.map((user) => ({
      address: RIALO_TEMPLE_ADDRESS,
      abi: RIALO_TEMPLE_ABI,
      chainId: ARC_CHAIN.id,
      functionName: 'getUser',
      args: [user],
    })),
    query: {
      enabled: ranking.users.length > 0,
      refetchInterval: 10000,
      retry: 1,
    },
  })
  const rows = useMemo(
    () => buildLeaderboardRows(ranking.users, ranking.values, userQueries.data?.map((item) => item.result) ?? []),
    [ranking.users, ranking.values, userQueries.data],
  )
  const playerCount = typeof playerCountQuery.data === 'bigint' ? Number(playerCountQuery.data) : 0
  const isLoading = rankQuery.isLoading || userQueries.isLoading

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="temple-card grialo-leaderboard-hero mb-6 overflow-hidden rounded-lg p-5 sm:flex sm:items-end sm:justify-between sm:p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--temple-gold)]">Unified Rialo Leaderboard</p>
          <h1 className="arcade-title mt-2 text-4xl font-black tracking-normal">Temple PTS Ranks</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-[var(--temple-muted)]">
            Ranked from the V2Lite contract: Grialo rituals, quiz mastery, wishes, streaks, and total temple activity.
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-0 sm:w-72">
          <Stat icon={WalletCards} label="Players" value={playerCount} />
          <Stat icon={Sparkles} label="Rows" value={rows.length} />
        </div>
      </header>

      <div className="mb-5 flex flex-wrap gap-2 rounded-lg border border-[var(--temple-border)] bg-white/[0.035] p-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wider transition ${activeTab === tab.id ? 'bg-[var(--temple-gold)] text-[#11130f]' : 'text-[var(--temple-muted)] hover:bg-white/[0.06] hover:text-[var(--temple-text)]'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-sm text-[var(--temple-muted)]">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-[var(--temple-emerald)]" /> Loading V2Lite ranks
        </div>
      ) : rows.length === 0 ? (
        <div className="temple-card spark-field rounded-lg py-20 text-center">
          <Trophy className="mx-auto mb-3 h-9 w-9 text-[var(--temple-soft)]" />
          <p className="text-sm text-[var(--temple-muted)]">No ranked temple activity yet.</p>
        </div>
      ) : (
        <RankPanel title={active.label} metric={active.metric} entries={rows} />
      )}
    </main>
  )
}

function RankPanel({ title, metric, entries }: { title: string; metric: string; entries: GrialoLeaderboardData[] }) {
  return (
    <section className="temple-card rounded-lg p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="signature-section-icon">
          {title.includes('Streak') ? <Flame className="h-5 w-5" /> : <Crown className="h-5 w-5" />}
        </div>
        <div>
          <h2 className="text-2xl font-black">{title}</h2>
          <p className="text-xs font-bold text-[var(--temple-soft)]">Username / X / wallet / total PTS / Grialo / Quiz / wishes</p>
        </div>
      </div>

      <div className="space-y-2">
        {entries.map((entry, index) => {
          const rarity = getGrialoRarity(entry.bestTier)
          return (
            <motion.div
              key={`${entry.user}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.025 }}
              className="grialo-rank-row pixel-panel rounded-lg border border-[var(--temple-border)] p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/[0.055] text-sm font-black" style={{ color: index < 3 ? rarity.color : 'var(--temple-soft)' }}>
                  #{index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black">{entry.username || fmtAddress(entry.user)}</p>
                  <p className="truncate text-xs font-bold text-[var(--temple-muted)]">@{entry.xHandle || 'xhandle'} / {fmtAddress(entry.user)}</p>
                  <p className="text-xs font-bold" style={{ color: rarity.color }}>{rarity.tier} / {rarity.boxName}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-right sm:mt-0 sm:grid-cols-6">
                <Mini label={metric} value={entry.rankingValue} />
                <Mini label="Total" value={entry.totalPts} />
                <Mini label="Grialo" value={entry.grialoPts} />
                <Mini label="Quiz" value={entry.quizPts} />
                <Mini label="Spins" value={entry.totalSpins} />
                <Mini label="Wishes" value={entry.totalWishes} />
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
