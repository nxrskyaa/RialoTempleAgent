import { useState } from 'react'
import { CalendarCheck, Copy, ExternalLink, Flame, Star, Trophy, UserRound, Wallet, type LucideIcon } from 'lucide-react'
import { useAccount, useBalance } from 'wagmi'
import ProfileGate from '@/components/ProfileGate'
import { ARC_CHAIN } from '@/config/contracts'
import { fmtAddress, getTier, type ProfileData, type UserStatsData } from '@/lib/rialo'

export default function Profile() {
  return (
    <ProfileGate>
      {(profile, stats) => <ProfileInner profile={profile} stats={stats} />}
    </ProfileGate>
  )
}

function ProfileInner({ profile, stats }: { profile: ProfileData; stats: UserStatsData }) {
  const { address } = useAccount()
  const [copied, setCopied] = useState(false)
  const { data: balance } = useBalance({ address, query: { enabled: Boolean(address), refetchInterval: 10000 } })
  const tier = getTier(stats.currentStreak)

  function copyAddress() {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="temple-card spark-field rounded-lg p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="machine-screen h-20 w-20 overflow-hidden rounded-lg border border-[var(--temple-border)]">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" /> : <UserRound className="m-5 h-10 w-10 text-[var(--temple-soft)]" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-wider text-[var(--temple-cyan)]">Rialo profile</p>
              <h1 className="arcade-title mt-1 truncate text-3xl font-black tracking-normal">{profile.name}</h1>
              <a href={profile.xUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-[var(--temple-muted)]">@{profile.xHandle}<ExternalLink className="h-3 w-3" /></a>
            </div>
          </div>

          <div className="pixel-panel mt-5 rounded-lg border border-[var(--temple-border)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-[var(--temple-emerald)]" />
                <p className="text-sm font-black">{fmtAddress(address)}</p>
              </div>
              <button onClick={copyAddress} className="rounded-md bg-white/[0.06] p-2 text-[var(--temple-muted)] transition hover:text-[var(--temple-gold)]">
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-[var(--temple-muted)]">{copied ? 'Copied wallet address.' : `${ARC_CHAIN.name} / native ${ARC_CHAIN.nativeCurrency.symbol}`}</p>
            <p className="mt-3 text-2xl font-black text-[var(--temple-emerald)]">{balance?.formatted ? Number(balance.formatted).toFixed(4) : '0.0000'} USDC</p>
          </div>
        </section>

        <section className="space-y-5">
          <div className="temple-card rounded-lg p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[var(--temple-soft)]">Current tier</p>
                <h2 className="arcade-title mt-1 text-3xl font-black" style={{ color: tier.color }}>{tier.name}</h2>
                <p className="text-sm text-[var(--temple-muted)]">{tier.range} / +{tier.pts} PTS tier</p>
              </div>
              <div className="machine-screen flex h-20 w-20 items-center justify-center rounded-lg border border-[var(--temple-border)]" style={{ animation: 'temple-pulse 2.8s ease-in-out infinite' }}>
                <div className="flame-buddy h-12 w-10" />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric icon={Flame} label="Streak" value={`${stats.currentStreak}d`} color={tier.color} />
            <Metric icon={Trophy} label="Best" value={`${stats.bestStreak}d`} color="#f4c95d" />
            <Metric icon={CalendarCheck} label="Check-ins" value={stats.totalCheckIns} color="#32d583" />
            <Metric icon={Star} label="Reviews" value={stats.reviewCount} color="#a78bfa" />
          </div>

          <div className="machine-frame rounded-lg p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-wider text-[var(--temple-soft)]">Total PTS</p>
            <div className="mt-4 flex items-end gap-3">
              <p className="text-7xl font-black leading-none text-[var(--temple-emerald)]">{stats.totalPts}</p>
              <p className="pb-2 text-sm text-[var(--temple-muted)]">synced to leaderboard</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value, color }: { icon: LucideIcon; label: string; value: string | number; color: string }) {
  return (
    <div className="pixel-panel rounded-lg border border-[var(--temple-border)] p-4 transition hover:-translate-y-0.5">
      <Icon className="mb-3 h-5 w-5" style={{ color }} />
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--temple-soft)]">{label}</p>
    </div>
  )
}
