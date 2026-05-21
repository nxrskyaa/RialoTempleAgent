import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Box, Loader2, RotateCcw, Share2, Zap } from 'lucide-react'
import { useAccount, useChainId, useReadContract, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { decodeEventLog, type Log } from 'viem'
import ProfileGate from '@/components/ProfileGate'
import { ARC_CHAIN, RIALO_TEMPLE_ABI, RIALO_TEMPLE_ADDRESS } from '@/config/contracts'
import {
  EMPTY_GRIALO_SPIN,
  fmtCountdown,
  getGrialoRarity,
  parseGrialoSpin,
  parseUnifiedUser,
  type GrialoSpinData,
  type GrialoStatsData,
} from '@/lib/rialo'

type GrialoStage = 'idle' | 'spinning' | 'boxRevealed' | 'opening' | 'revealed' | 'cooldown'

export default function Grialo() {
  return (
    <ProfileGate>
      {(profile, stats, refetchProfile) => (
        <GrialoInner profileName={profile.name} fallbackStats={stats} refetchProfile={refetchProfile} />
      )}
    </ProfileGate>
  )
}

function GrialoInner({ profileName, fallbackStats, refetchProfile }: { profileName: string; fallbackStats: GrialoStatsData; refetchProfile: () => void }) {
  const { address } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const [stage, setStage] = useState<GrialoStage>('idle')
  const [cooldown, setCooldown] = useState(0)
  const [txMessage, setTxMessage] = useState('')
  const [revealedSpin, setRevealedSpin] = useState<GrialoSpinData | null>(null)

  const isWrongNetwork = Boolean(address) && chainId !== ARC_CHAIN.id

  const userQuery = useReadContract({
    address: RIALO_TEMPLE_ADDRESS,
    abi: RIALO_TEMPLE_ABI,
    chainId: ARC_CHAIN.id,
    functionName: 'getUser',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), refetchInterval: 7000, retry: 1 },
  })

  const canSpinQuery = useReadContract({
    address: RIALO_TEMPLE_ADDRESS,
    abi: RIALO_TEMPLE_ABI,
    chainId: ARC_CHAIN.id,
    functionName: 'canSpin',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), refetchInterval: 5000, retry: 1 },
  })

  const waitQuery = useReadContract({
    address: RIALO_TEMPLE_ADDRESS,
    abi: RIALO_TEMPLE_ABI,
    chainId: ARC_CHAIN.id,
    functionName: 'timeUntilNextSpin',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), refetchInterval: 5000, retry: 1 },
  })

  const nextSpinQuery = useReadContract({
    address: RIALO_TEMPLE_ADDRESS,
    abi: RIALO_TEMPLE_ABI,
    chainId: ARC_CHAIN.id,
    functionName: 'nextSpinAt',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), refetchInterval: 12000, retry: 1 },
  })

  const latestSpinQuery = useReadContract({
    address: RIALO_TEMPLE_ADDRESS,
    abi: RIALO_TEMPLE_ABI,
    chainId: ARC_CHAIN.id,
    functionName: 'getLatestSpin',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), retry: 1 },
  })

  const { data: spinHash, writeContract, isPending, reset } = useWriteContract({
    mutation: {
      onError: (error) => {
        setStage(cooldown > 0 ? 'cooldown' : 'idle')
        setTxMessage(error.message.split('\n')[0] || 'Spin cancelled.')
      },
    },
  })

  const receipt = useWaitForTransactionReceipt({
    hash: spinHash,
    query: { enabled: Boolean(spinHash), refetchOnWindowFocus: false },
  })

  const user = useMemo(() => parseUnifiedUser(userQuery.data), [userQuery.data])
  const stats = user.exists ? user : fallbackStats
  const latestSpin = useMemo(() => parseGrialoSpin(latestSpinQuery.data), [latestSpinQuery.data])
  const canSpin = Boolean(canSpinQuery.data) && cooldown === 0 && !isWrongNetwork
  const isBusy = isPending || receipt.isLoading || stage === 'spinning' || stage === 'opening'
  const bestRarity = getGrialoRarity(stats.bestTier)
  const displaySpin = revealedSpin ?? latestSpin ?? EMPTY_GRIALO_SPIN
  const displayRarity = getGrialoRarity(displaySpin.tier)
  const nextSpinAt = typeof nextSpinQuery.data === 'bigint' ? Number(nextSpinQuery.data) : 0

  useEffect(() => {
    const seconds = typeof waitQuery.data === 'bigint' ? Number(waitQuery.data) : stats.waitTime
    setCooldown(seconds)
    if (seconds <= 0) return
    const timer = window.setInterval(() => {
      setCooldown((value) => (value <= 1 ? 0 : value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [stats.waitTime, waitQuery.data])

  useEffect(() => {
    if (!receipt.isSuccess) return
    setTxMessage('Mystery Box formed. Open it when the temple seal settles.')
    const eventSpin = parseSpinFromReceipt(receipt.data?.logs)
    if (eventSpin) {
      setRevealedSpin(eventSpin)
      setStage('boxRevealed')
    }
    void latestSpinQuery.refetch().then((result) => {
      const chainSpin = parseGrialoSpin(result.data)
      if (chainSpin.spunAt > 0) {
        setRevealedSpin(chainSpin)
        setStage('boxRevealed')
      } else if (!eventSpin) {
        setStage('boxRevealed')
      }
    }).catch(() => {
      if (!eventSpin) setStage('boxRevealed')
    })
    void userQuery.refetch()
    void canSpinQuery.refetch()
    void waitQuery.refetch()
    void refetchProfile()
    reset()
  }, [canSpinQuery, latestSpinQuery, receipt.data?.logs, receipt.isSuccess, refetchProfile, reset, userQuery, waitQuery])

  useEffect(() => {
    if (!receipt.isError) return
    setStage(cooldown > 0 ? 'cooldown' : 'idle')
    setTxMessage(receipt.error?.message.split('\n')[0] || 'Spin transaction failed.')
    reset()
  }, [cooldown, receipt.error, receipt.isError, reset])

  useEffect(() => {
    if (cooldown > 0 && stage === 'idle') setStage('cooldown')
    if (cooldown === 0 && stage === 'cooldown') setStage('idle')
  }, [cooldown, stage])

  function spin() {
    if (!canSpin || isBusy) return
    setRevealedSpin(null)
    setTxMessage('Channeling temple energy. Confirm the spin in your wallet.')
    setStage('spinning')
    writeContract({
      address: RIALO_TEMPLE_ADDRESS,
      abi: RIALO_TEMPLE_ABI,
      chainId: ARC_CHAIN.id,
      functionName: 'spinGrialo',
      gas: 900000n,
    })
  }

  function openBox() {
    if (stage !== 'boxRevealed') return
    setStage('opening')
    setTxMessage('Rune seal breaking...')
    window.setTimeout(() => {
      setStage('revealed')
      setTxMessage('Grialo revealed.')
      void userQuery.refetch()
      void canSpinQuery.refetch()
      void waitQuery.refetch()
    }, displayRarity.id >= 5 ? 7600 : displayRarity.id >= 3 ? 6800 : 5600)
  }

  function resetToDashboard() {
    setStage(cooldown > 0 ? 'cooldown' : 'idle')
    setTxMessage('')
  }

  async function shareMoment() {
    const text = `${profileName} opened ${displayRarity.tier} / ${displayRarity.boxName} and revealed ${displayRarity.text} for +${displaySpin.ptsGained} PTS.`
    if (navigator.share) {
      await navigator.share({ title: 'Grialo revealed', text, url: window.location.href })
      return
    }
    await navigator.clipboard.writeText(text)
    setTxMessage('Reveal moment copied.')
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6">
      <section className="grialo-hero temple-card overflow-hidden rounded-lg p-5 sm:p-7">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--temple-gold)]">Grialo daily surprise ritual</p>
            <h1 className="arcade-title mt-3 text-5xl font-black leading-none text-[var(--temple-text)] sm:text-7xl">Channel Grialo</h1>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-[var(--temple-muted)]">
              Welcome, {profileName}. Spend one pulse of Temple Energy, form a Mystery Box, then open it to reveal today&apos;s Grialo tier, text, PTS, and streak.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <EnergyPanel cooldown={cooldown} canSpin={canSpin} nextSpinAt={nextSpinAt} />
              <div className="pixel-panel rounded-lg border border-[var(--temple-border)] p-4">
                <p className="text-xs font-black uppercase tracking-wider text-[var(--temple-soft)]">Best Grialo opened</p>
                <p className="mt-2 text-2xl font-black" style={{ color: bestRarity.color }}>{bestRarity.tier}</p>
                <p className="text-xs font-semibold text-[var(--temple-muted)]">{bestRarity.boxName} box</p>
              </div>
            </div>
          </div>

          <TempleStage
            stage={stage}
            isBusy={isBusy}
            canSpin={canSpin}
            isWrongNetwork={isWrongNetwork}
            isSwitching={isSwitching}
            cooldown={cooldown}
            rarity={displayRarity}
            spin={displaySpin}
            onSpin={spin}
            onOpen={openBox}
            onBack={resetToDashboard}
            onShare={shareMoment}
            onSwitch={() => switchChain({ chainId: ARC_CHAIN.id })}
          />
        </div>
      </section>

      {(txMessage || userQuery.error || latestSpinQuery.error) && (
        <div className="mt-4 rounded-lg border border-[var(--temple-border)] bg-white/[0.045] px-4 py-3 text-sm font-semibold text-[var(--temple-muted)]">
          {userQuery.error || latestSpinQuery.error ? 'Contract read is warming up. If this stays visible, refresh after the latest Arc RPC sync.' : txMessage}
        </div>
      )}

      <GrialoDashboard stats={stats} />
      <SpinHistory address={address} />
    </main>
  )
}

function parseSpinFromReceipt(logs?: readonly Log[]): GrialoSpinData | null {
  for (const log of logs ?? []) {
    if (log.address.toLowerCase() !== RIALO_TEMPLE_ADDRESS.toLowerCase()) continue

    try {
      const decoded = decodeEventLog({
        abi: RIALO_TEMPLE_ABI,
        data: log.data,
        topics: log.topics,
      })

      if (decoded.eventName !== 'GrialoSpun') continue
      const args = decoded.args as Record<string, unknown>

      return {
        tier: Number(args.tier ?? 0),
        ptsGained: Number(args.pts ?? 0),
        streakAfter: Number(args.streakAfterSpin ?? 0),
        spunAt: Number(args.timestamp ?? 0),
      }
    } catch {
      // Ignore unrelated logs in the receipt.
    }
  }

  return null
}

function GrialoDashboard({ stats }: { stats: GrialoStatsData }) {
  const bestRarity = getGrialoRarity(stats.bestTier)
  const items = [
    ['Total spins', stats.totalSpins, '#57e39f'],
    ['Total PTS', stats.totalPts, '#f2c866'],
    ['Current streak', `${stats.currentStreak}d`, '#57e39f'],
    ['Best streak', `${stats.bestStreak}d`, '#f2c866'],
    ['Best tier', bestRarity.tier, bestRarity.color],
    ['Temple Energy', stats.spinReady ? 'Ready' : fmtCountdown(stats.waitTime), stats.spinReady ? '#57e39f' : '#f2c866'],
  ]

  return (
    <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
      {items.map(([label, value, color]) => (
        <div key={label} className="temple-card rounded-lg p-4">
          <p className="text-2xl font-black" style={{ color: String(color) }}>{value}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-[var(--temple-soft)]">{label}</p>
        </div>
      ))}
    </section>
  )
}

function TempleStage({
  stage,
  isBusy,
  canSpin,
  isWrongNetwork,
  isSwitching,
  cooldown,
  rarity,
  spin,
  onSpin,
  onOpen,
  onBack,
  onShare,
  onSwitch,
}: {
  stage: GrialoStage
  isBusy: boolean
  canSpin: boolean
  isWrongNetwork: boolean
  isSwitching: boolean
  cooldown: number
  rarity: ReturnType<typeof getGrialoRarity>
  spin: GrialoSpinData
  onSpin: () => void
  onOpen: () => void
  onBack: () => void
  onShare: () => void
  onSwitch: () => void
}) {
  const isMystery = stage === 'boxRevealed' || stage === 'opening'
  const isReveal = stage === 'revealed'

  return (
    <div className={`grialo-stage-shell ${stage}`} style={{ '--grialo-rarity': rarity.color, '--grialo-accent': rarity.accent } as CSSProperties}>
      <div className="grialo-aurora" />
      <div className="grialo-rune-ring">
        {Array.from({ length: 12 }).map((_, index) => <span key={index} style={{ transform: `rotate(${index * 30}deg) translateY(-150px)` }} />)}
      </div>

      <AnimatePresence mode="wait">
        {!isMystery && !isReveal ? (
          <motion.div key="orb" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.04 }} className="grialo-orb-panel">
            <div className={`grialo-orb ${stage === 'spinning' ? 'is-spinning' : ''}`}>
              <span className="grialo-stone stone-1" />
              <span className="grialo-stone stone-2" />
              <span className="grialo-stone stone-3" />
              <span className="grialo-stone stone-4" />
            </div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-[var(--temple-gold)]">
              {canSpin ? 'Temple Energy Ready' : 'Energy regenerating'}
            </p>
            <h2 className="mt-2 text-3xl font-black">{stage === 'spinning' ? 'Channeling...' : 'Mystery waits inside'}</h2>
            <p className="mt-2 text-sm font-semibold text-[var(--temple-muted)]">
              {stage === 'spinning' ? 'Particles are being drawn into the orb.' : canSpin ? 'Spin to form a Mystery Box.' : `Next Grialo in ${fmtCountdown(cooldown)}`}
            </p>
          </motion.div>
        ) : isReveal ? (
          <motion.div key="reveal" initial={{ opacity: 0, y: 24, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className={`grialo-reveal ${rarity.aura}`}>
            <div className="grialo-reveal-shine" />
            <p className="text-xs font-black uppercase tracking-[0.18em]" style={{ color: rarity.color }}>{rarity.tier} / {rarity.boxName}</p>
            <h2 className="mt-3 text-5xl font-black sm:text-6xl">{rarity.text}</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <RevealStat label="PTS gained" value={`+${spin.ptsGained}`} />
              <RevealStat label="Streak" value={`${spin.streakAfter}d`} />
            </div>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={onShare} className="temple-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black">
                <Share2 className="h-4 w-4" /> Share
              </button>
              <button type="button" onClick={onBack} className="temple-button inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black">
                <RotateCcw className="h-4 w-4" /> Back to dashboard
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="box" initial={{ opacity: 0, y: -30, scale: 0.86 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 1.08 }} className={`grialo-box-card ${rarity.aura} ${stage === 'opening' ? 'is-opening' : ''}`}>
            <div className="grialo-box-light" />
            <div className="grialo-mystery-box">
              <span className="grialo-box-lid" />
              <span className="grialo-box-body" />
              <span className="grialo-box-seal" />
            </div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.2em]" style={{ color: rarity.color }}>{rarity.tier}</p>
            <h2 className="mt-2 text-3xl font-black">Mystery Box</h2>
            <p className="mt-2 text-sm font-semibold text-[var(--temple-muted)]">{rarity.boxName} box formed. Open to reveal the Grialo inside.</p>
            <button type="button" onClick={onOpen} disabled={stage === 'opening'} className="temple-button mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-60">
              {stage === 'opening' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Box className="h-4 w-4" />}
              {stage === 'opening' ? 'Opening temple seal...' : 'Open Mystery Box'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 mt-7 flex flex-wrap justify-center gap-3">
        {isWrongNetwork ? (
          <button type="button" onClick={onSwitch} disabled={isSwitching} className="temple-button rounded-full px-6 py-3 text-sm font-black disabled:opacity-60">
            {isSwitching ? 'Switching...' : 'Switch to Arc Testnet'}
          </button>
        ) : (
          <button type="button" onClick={onSpin} disabled={!canSpin || isBusy || stage === 'boxRevealed' || stage === 'opening'} className="temple-button inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-45">
            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {canSpin ? 'Channel Grialo' : `Next Grialo in ${fmtCountdown(cooldown)}`}
          </button>
        )}
      </div>
    </div>
  )
}

function EnergyPanel({ cooldown, canSpin, nextSpinAt }: { cooldown: number; canSpin: boolean; nextSpinAt: number }) {
  return (
    <div className="pixel-panel rounded-lg border border-[var(--temple-border)] p-4">
      <p className="text-xs font-black uppercase tracking-wider text-[var(--temple-soft)]">Temple Energy</p>
      <p className="mt-2 text-2xl font-black" style={{ color: canSpin ? '#57e39f' : '#f2c866' }}>
        {canSpin ? 'Ready' : fmtCountdown(cooldown)}
      </p>
      <p className="mt-1 text-xs font-semibold text-[var(--temple-muted)]">
        {canSpin ? 'One Grialo can be channeled now.' : nextSpinAt ? `Energy returns at ${new Date(nextSpinAt * 1000).toLocaleTimeString()}` : 'Energy regenerating'}
      </p>
    </div>
  )
}

function RevealStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--temple-border)] bg-white/[0.055] p-4">
      <p className="text-2xl font-black text-[var(--temple-gold)]">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-[var(--temple-soft)]">{label}</p>
    </div>
  )
}

function SpinHistory({ address }: { address?: `0x${string}` }) {
  const historyQuery = useReadContract({
    address: RIALO_TEMPLE_ADDRESS,
    abi: RIALO_TEMPLE_ABI,
    chainId: ARC_CHAIN.id,
    functionName: 'getSpinHistory',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), refetchInterval: 12000, retry: 1 },
  })
  const history = Array.isArray(historyQuery.data) ? historyQuery.data.map(parseGrialoSpin).slice(-6).reverse() : []

  if (!address || history.length === 0) return null

  return (
    <section className="mt-6 temple-card rounded-lg p-5">
      <p className="mb-4 text-xs font-black uppercase tracking-wider text-[var(--temple-soft)]">Recent Grialo openings</p>
      <div className="grid gap-3 md:grid-cols-3">
        {history.map((spin, index) => {
          const rarity = getGrialoRarity(spin.tier)
          return (
            <div key={`${spin.spunAt}-${index}`} className="pixel-panel rounded-lg border border-[var(--temple-border)] p-4">
              <p className="text-sm font-black" style={{ color: rarity.color }}>{rarity.tier} / {rarity.boxName}</p>
              <p className="mt-2 text-2xl font-black">{rarity.text}</p>
              <p className="mt-1 text-xs font-semibold text-[var(--temple-muted)]">+{spin.ptsGained} PTS / {spin.streakAfter}d streak</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
