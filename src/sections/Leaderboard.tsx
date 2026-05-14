import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Flame, BadgeCheck, Medal, Loader2 } from 'lucide-react'
import { useAccount, useReadContracts } from 'wagmi'
import { useVibeCheck } from '@/hooks/useVibeCheck'
import { CONTRACT_ADDRESS, VIBECHECK_ABI } from '@/config/contract'

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'Main Character': { label: 'Main', color: '#FFD700', bg: 'rgba(255,215,0,0.1)' },
  'Viral': { label: 'Viral', color: '#A855F7', bg: 'rgba(168,85,247,0.1)' },
  'Hype': { label: 'Hype', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  'Chill': { label: 'Chill', color: '#8A8A9A', bg: 'rgba(138,138,154,0.1)' },
}

function getTier(score: number): string {
  if (score >= 5000) return 'Main Character'
  if (score >= 2000) return 'Viral'
  if (score >= 500) return 'Hype'
  return 'Chill'
}

function calcScore(user: any): number {
  if (!user || user.predictions === 0n) return 0
  const followers = Number(user.followerCount || 0n)
  const verified = user.isVerified ? 500 : 0
  const predictions = Number(user.predictions || 0n)
  const correct = Number(user.correct || 0n)
  const streak = Number(user.streak || 0n)
  const accuracy = predictions > 0 ? (correct * 10000) / predictions : 0
  return Math.floor(followers / 100 + verified + accuracy * 0.03 + streak * 50)
}

function truncateAddr(addr: string): string {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ''
}

export default function Leaderboard() {
  const { isConnected } = useAccount()
  const { dayPredictors } = useVibeCheck()
  const [rankedUsers, setRankedUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Read user data for all predictors
  const contracts = (dayPredictors || []).slice(0, 20).map(addr => ({
    address: CONTRACT_ADDRESS,
    abi: VIBECHECK_ABI,
    functionName: 'getUser' as const,
    args: [addr],
  }))

  const { data: usersData } = useReadContracts({
    contracts,
    query: { enabled: isConnected && (dayPredictors?.length || 0) > 0 },
  })

  useEffect(() => {
    if (!usersData || !dayPredictors) {
      setIsLoading(false)
      return
    }

    const processed = dayPredictors.map((addr, i) => {
      const userData = (usersData as any[])?.[i]?.result
      const score = calcScore(userData)
      return {
        address: addr,
        username: userData?.xUsername || '',
        followers: Number(userData?.followerCount || 0n),
        verified: userData?.isVerified || false,
        predictions: Number(userData?.predictions || 0n),
        correct: Number(userData?.correct || 0n),
        streak: Number(userData?.streak || 0n),
        score,
      }
    })

    processed.sort((a, b) => b.score - a.score)
    setRankedUsers(processed)
    setIsLoading(false)
  }, [usersData, dayPredictors])

  const displayName = (u: any) => {
    if (u.username) return `@${u.username}`
    return truncateAddr(u.address)
  }

  return (
    <section className="mx-auto max-w-[800px] px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Leaderboard</h2>
        <p className="mt-1 text-sm text-[#8A8A9A]">Ranked by social score &middot; Live from ARC</p>
      </motion.div>

      {!isConnected ? (
        <div className="rounded-2xl border border-[#2A2A3A] bg-[#12121A] p-8 text-center text-[#8A8A9A]">
          Connect wallet to see the leaderboard
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#2DD4BF]" />
        </div>
      ) : rankedUsers.length === 0 ? (
        <div className="rounded-2xl border border-[#2A2A3A] bg-[#12121A] p-8 text-center">
          <p className="text-[#8A8A9A]">No predictions yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rankedUsers.map((entry, i) => {
            const tier = getTier(entry.score)
            const tierConfig = TIER_CONFIG[tier]
            const isTop3 = i < 3
            return (
              <motion.div
                key={entry.address}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-colors ${
                  isTop3 ? 'border-[#FFD700]/20 bg-gradient-to-r from-[rgba(255,215,0,0.03)] to-transparent' : 'border-[#2A2A3A] bg-[#12121A] hover:border-[#3A3A50]'
                }`}
              >
                {/* Rank */}
                <div className="flex w-7 shrink-0 justify-center">
                  {isTop3 ? (
                    <Medal className={`h-5 w-5 ${i === 0 ? 'text-[#FFD700]' : i === 1 ? 'text-[#C0C0C0]' : 'text-[#CD7F32]'}`} />
                  ) : (
                    <span className="text-sm text-[#5A5A6A]">#{i + 1}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2A2A3A] text-sm font-bold text-[#8A8A9A]">
                  {entry.username ? entry.username[0].toUpperCase() : entry.address[2]}
                </div>

                {/* Name */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{displayName(entry)}</span>
                    {entry.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-[#2DD4BF]" />}
                  </div>
                  {entry.followers > 0 && (
                    <span className="text-[11px] text-[#5A5A6A]">{(entry.followers / 1000).toFixed(1)}K followers</span>
                  )}
                </div>

                {/* Tier */}
                <span
                  className="hidden shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium sm:inline-block"
                  style={{ color: tierConfig.color, backgroundColor: tierConfig.bg, border: `1px solid ${tierConfig.color}30` }}
                >
                  {tierConfig.label}
                </span>

                {/* Streak */}
                <div className="flex shrink-0 items-center gap-1">
                  <Flame className="h-4 w-4 text-[#F97316]" />
                  <span className="text-sm font-medium text-[#F97316]">{entry.streak}</span>
                </div>

                {/* Score */}
                <span className="w-14 shrink-0 text-right text-sm font-bold text-[#2DD4BF]">{entry.score.toLocaleString()}</span>
              </motion.div>
            )
          })}
        </div>
      )}
    </section>
  )
}
