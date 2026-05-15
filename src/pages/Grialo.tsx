import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Clock, Flame, Loader2, Sparkles, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import ProfileGate from '@/components/ProfileGate'
import { RIALO_TEMPLE_ABI, RIALO_TEMPLE_ADDRESS } from '@/config/contracts'
import { ACTION_FEE, fmtTime, getTier, ptsForStreak, TIERS } from '@/lib/rialo'

export default function Grialo() {
  return (
    <ProfileGate>
      {(profile, stats, refetchProfile) => <GrialoInner profileName={profile.name} stats={stats} refetchProfile={refetchProfile} />}
    </ProfileGate>
  )
}

function GrialoInner({ profileName, stats, refetchProfile }: { profileName: string; stats: { currentStreak: number; bestStreak: number; totalCheckIns: number; totalPts: number }; refetchProfile: () => void }) {
  const { address } = useAccount()
  const [cooldown, setCooldown] = useState(0)
  const [success, setSuccess] = useState(false)
  const tier = getTier(stats.currentStreak)
  const nextPts = ptsForStreak(stats.currentStreak + 1)

  const { data: canData, refetch: refetchCan } = useReadContract({
    address: RIALO_TEMPLE_ADDRESS,
    abi: RIALO_TEMPLE_ABI,
    functionName: 'canCheckIn',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), refetchInterval: 5000 },
  })

  const { data: timeData, refetch: refetchTime } = useReadContract({
    address: RIALO_TEMPLE_ADDRESS,
    abi: RIALO_TEMPLE_ABI,
    functionName: 'timeUntilNextCheckIn',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), refetchInterval: 5000 },
  })

  useEffect(() => {
    const seconds = typeof timeData === 'bigint' ? Number(timeData) : 0
    const sync = window.setTimeout(() => setCooldown(seconds), 0)
    if (seconds <= 0) return
    const timer = window.setInterval(() => setCooldown((value) => (value <= 1 ? 0 : value - 1)), 1000)
    return () => {
      window.clearTimeout(sync)
      window.clearInterval(timer)
    }
  }, [timeData])

  const { writeContract, isPending } = useWriteContract({
    mutation: {
      onSuccess: () => {
        setSuccess(true)
        setTimeout(() => {
          refetchProfile()
          refetchCan()
          refetchTime()
          setSuccess(false)
        }, 1800)
      },
    },
  })

  const canCheckIn = Boolean(canData) && cooldown === 0

  function checkIn() {
    if (!canCheckIn || isPending) return
    writeContract({
      address: RIALO_TEMPLE_ADDRESS,
      abi: RIALO_TEMPLE_ABI,
      functionName: 'checkIn',
      value: ACTION_FEE,
    })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_0.72fr]">
        <section className="temple-rune-panel temple-card overflow-hidden rounded-lg p-5 sm:p-7">
          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--temple-gold)]">Grialo daily ritual</p>
              <h1 className="mt-2 text-4xl font-black tracking-normal sm:text-5xl">Keep the flame alive</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--temple-muted)]">Welcome, {profileName}. Sign one on-chain transaction every 24 hours and pay 1 native USDC to build your streak.</p>
            </div>
            <div className="flex shrink-0 items-center gap-3 rounded-lg border border-[var(--temple-border)] bg-black/20 px-4 py-3">
              <Flame className="h-5 w-5" style={{ color: tier.color }} />
              <div>
                <p className="text-sm font-semibold">{tier.name}</p>
                <p className="text-xs text-[var(--temple-muted)]">+{nextPts} next</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-8 grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
            <div className="relative flex min-h-[340px] items-center justify-center rounded-lg border border-[var(--temple-border)] bg-black/20 p-5 text-center">
              <div className="temple-orbit absolute h-64 w-64 rounded-full p-[1px]">
                <div className="h-full w-full rounded-full bg-[#090b0a]" />
              </div>
              <div className="absolute h-44 w-44 rounded-full border border-[var(--temple-border)] bg-black/35" />
              <div className="relative z-10">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--temple-soft)]">Current streak</p>
                <div className="mt-4 text-8xl font-black leading-none" style={{ color: tier.color }}>{stats.currentStreak}</div>
                <p className="mt-2 text-sm font-semibold">{tier.name}</p>
                <p className="text-xs text-[var(--temple-muted)]">{tier.range}</p>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-lg border border-[var(--temple-border)] bg-white/[0.035] p-5">
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div key="success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-1 flex-col items-center justify-center text-center">
                    <Check className="mb-3 h-10 w-10 text-[var(--temple-emerald)]" />
                    <h2 className="text-2xl font-semibold">Ritual confirmed</h2>
                    <p className="mt-2 text-sm text-[var(--temple-muted)]">Your PTS and leaderboard stats are syncing on-chain.</p>
                  </motion.div>
                ) : (
                  <motion.div key="ready" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--temple-soft)]">Transaction</p>
                    <h2 className="mt-2 text-2xl font-semibold">1 native USDC</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--temple-muted)]">Arc uses USDC as the native gas token. This action sends exactly 1 USDC with the check-in transaction.</p>
                    <button onClick={checkIn} disabled={!canCheckIn || isPending} className="temple-button mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-45">
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : canCheckIn ? <Sparkles className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      {isPending ? 'Signing ritual' : canCheckIn ? `Check in (+${nextPts} PTS)` : cooldown > 0 ? fmtTime(cooldown) : 'Come back tomorrow'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="temple-card rounded-lg p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--temple-soft)]">Your stats</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Best', stats.bestStreak],
                ['PTS', stats.totalPts],
                ['Checks', stats.totalCheckIns],
                ['Fee', '1 USDC'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-white/[0.035] p-4">
                  <p className="text-2xl font-bold text-[var(--temple-emerald)]">{value}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--temple-soft)]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="temple-card rounded-lg p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--temple-soft)]">Tier ladder</p>
              <Link to="/leaderboard" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--temple-gold)]"><Trophy className="h-3.5 w-3.5" /> Rank</Link>
            </div>
            <div className="space-y-2">
              {TIERS.map((item) => {
                const active = stats.currentStreak >= item.min
                return (
                  <div key={item.name} className="rounded-lg border p-3" style={{ borderColor: active ? `${item.color}55` : 'var(--temple-border)', backgroundColor: active ? `${item.color}12` : 'rgba(255,255,255,0.025)' }}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <p className="text-xs font-bold" style={{ color: item.color }}>+{item.pts}</p>
                    </div>
                    <p className="mt-1 text-xs text-[var(--temple-muted)]">{item.range}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
