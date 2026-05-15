import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Sparkles, UserRound } from 'lucide-react'
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { RIALO_TEMPLE_ABI, RIALO_TEMPLE_ADDRESS } from '@/config/contracts'
import { EMPTY_PROFILE, EMPTY_STATS, normalizeXHandle, parseProfileResult, toXAvatarUrl, toXUrl, type ProfileData, type UserStatsData } from '@/lib/rialo'

type Props = {
  children: (profile: ProfileData, stats: UserStatsData, refetch: () => void) => ReactNode
  compact?: boolean
}

export default function ProfileGate({ children, compact = false }: Props) {
  const { isConnected } = useAccount()
  const [name, setName] = useState('')
  const [xInput, setXInput] = useState('')
  const [message, setMessage] = useState('')

  const { data, isLoading, refetch } = useReadContract({
    address: RIALO_TEMPLE_ADDRESS,
    abi: RIALO_TEMPLE_ABI,
    functionName: 'getMyProfile',
    query: { enabled: isConnected, refetchInterval: 6000 },
  })

  const { profile, stats } = useMemo(() => parseProfileResult(data), [data])

  const { writeContract, isPending } = useWriteContract({
    mutation: {
      onSuccess: () => {
        setMessage('Profile sealed on-chain.')
        setTimeout(() => refetch(), 1200)
      },
      onError: (error) => setMessage(error.message.split('\n')[0] || 'Profile transaction failed.'),
    },
  })

  function submitProfile() {
    const handle = normalizeXHandle(xInput)
    if (!name.trim() || !handle) {
      setMessage('Name and X link are required.')
      return
    }

    writeContract({
      address: RIALO_TEMPLE_ADDRESS,
      abi: RIALO_TEMPLE_ABI,
      functionName: 'setupProfile',
      args: [
        name.trim(),
        toXUrl(xInput || handle),
        handle,
        toXAvatarUrl(handle),
        0n,
        0n,
      ],
    })
  }

  const previewHandle = normalizeXHandle(xInput)
  const previewAvatar = toXAvatarUrl(previewHandle)

  if (!isConnected) {
    return (
      <div className="temple-card mx-auto flex max-w-xl flex-col items-center rounded-lg px-6 py-12 text-center">
        <Sparkles className="mb-3 h-8 w-8 text-[var(--temple-gold)]" />
        <h2 className="text-xl font-semibold">Connect wallet to enter the temple</h2>
        <p className="mt-2 max-w-sm text-sm text-[var(--temple-muted)]">Your profile, check-ins, reviews, and PTS all live behind your Arc Testnet wallet.</p>
      </div>
    )
  }

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-[var(--temple-muted)]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-[var(--temple-emerald)]" /> Reading profile
      </div>
    )
  }

  if (profile.exists) return <>{children(profile, stats, () => void refetch())}</>

  return (
    <div className={`mx-auto grid max-w-5xl gap-5 px-4 py-8 ${compact ? '' : 'lg:grid-cols-[1fr_0.8fr]'}`}>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="temple-card rounded-lg p-5 sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--temple-border)] bg-white/5">
            <UserRound className="h-5 w-5 text-[var(--temple-emerald)]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Set up your Rialo profile</h1>
            <p className="text-sm text-[var(--temple-muted)]">One quick on-chain profile before check-ins and reviews.</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--temple-soft)]">Display name</label>
          <input className="temple-input w-full rounded-lg px-3 py-3 text-sm" value={name} onChange={(event) => setName(event.target.value)} placeholder="Rialo Builder" />

          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--temple-soft)]">X link or handle</label>
          <input className="temple-input w-full rounded-lg px-3 py-3 text-sm" value={xInput} onChange={(event) => setXInput(event.target.value)} placeholder="https://x.com/rialo" />

          {previewHandle && (
            <div className="flex items-center gap-3 rounded-lg border border-[var(--temple-border)] bg-white/[0.03] p-3">
              {previewAvatar ? <img src={previewAvatar} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg bg-[var(--temple-emerald)]/15" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">@{previewHandle}</p>
                <p className="text-xs text-[var(--temple-muted)]">Linked to this wallet on-chain. No X API required.</p>
              </div>
            </div>
          )}

          {message && <p className="text-sm text-[var(--temple-gold)]">{message}</p>}

          <button type="button" onClick={submitProfile} disabled={isPending} className="temple-button inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold disabled:opacity-60">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Seal profile on-chain
          </button>
        </div>
      </motion.div>

      {!compact && (
        <div className="temple-card rounded-lg p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--temple-gold)]">Profile preview</p>
          <div className="mt-6 rounded-lg border border-[var(--temple-border)] bg-black/20 p-4">
            <div className="flex items-center gap-3">
              {previewAvatar ? <img src={previewAvatar} alt="" className="h-14 w-14 rounded-lg object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--temple-emerald)]/15 text-xl">R</div>}
              <div>
                <h3 className="font-semibold">{name || 'Your Rialo name'}</h3>
                <p className="text-sm text-[var(--temple-muted)]">@{previewHandle || 'xhandle'}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[['PTS', EMPTY_STATS.totalPts], ['Checks', EMPTY_STATS.totalCheckIns], ['Reviews', EMPTY_STATS.reviewCount]].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-white/[0.035] p-3">
                  <p className="text-lg font-semibold text-[var(--temple-emerald)]">{value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--temple-soft)]">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs leading-relaxed text-[var(--temple-muted)]">This profile unlocks Grialo daily streaks, food reviews, film reviews, and leaderboard identity.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function useEmptyProfile() {
  return { profile: EMPTY_PROFILE, stats: EMPTY_STATS }
}
