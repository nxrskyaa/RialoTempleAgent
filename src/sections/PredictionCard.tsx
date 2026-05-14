import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Snowflake, Zap, TrendingUp, TrendingDown, Loader2, Check, Wallet, TrendingUp as TrendingUpIcon, Cloud, Activity, Hash } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useWriteContract } from 'wagmi'
import { useVibeCheck } from '@/hooks/useVibeCheck'
import { CONTRACT_ADDRESS, VIBECHECK_ABI, CATEGORIES, VIBES } from '@/config/contract'
import XVerifyModal from '@/components/XVerifyModal'

const ICON_MAP: Record<string, React.ElementType> = {
  TrendingUp: TrendingUpIcon,
  Cloud: Cloud,
  Activity: Activity,
  Hash: Hash,
}

type CategoryChoices = {
  crypto: number | null
  weather: number | null
  market: number | null
  trending: number | null
}

function CountdownTimer() {
  const [time, setTime] = useState({ hours: 23, minutes: 47, seconds: 12 })
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => {
        let { hours, minutes, seconds } = prev
        seconds--
        if (seconds < 0) { seconds = 59; minutes-- }
        if (minutes < 0) { minutes = 59; hours-- }
        if (hours < 0) { hours = 23; minutes = 59; seconds = 59 }
        return { hours, minutes, seconds }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])
  const pad = (n: number) => n.toString().padStart(2, '0')
  return <span className="font-mono text-sm text-[#2DD4BF]">{pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}</span>
}

const VIBE_ICONS = [Snowflake, Zap, TrendingUp, TrendingDown]

export default function PredictionCard() {
  const { isConnected } = useAccount()
  const { currentDay, stakeAmount, predictorCount, needsApproval, handleApprove, isApproving, refetchUser } = useVibeCheck()

  const [choices, setChoices] = useState<CategoryChoices>({ crypto: null, weather: null, market: null, trending: null })
  const [showXModal, setShowXModal] = useState(false)
  const [status, setStatus] = useState<'idle' | 'approving' | 'submitting' | 'done'>('idle')

  const dayNum = currentDay ? Number(currentDay) : 1
  const poolSize = predictorCount ? Number(predictorCount) : 0
  const stake = stakeAmount ? Number(stakeAmount) / 1e6 : 1

  const allSelected = choices.crypto !== null && choices.weather !== null && choices.market !== null && choices.trending !== null

  const { writeContract: predictWrite, isPending: isPredicting } = useWriteContract({
    mutation: {
      onSuccess: () => {
        setStatus('done')
        refetchUser()
      },
      onError: () => {
        setStatus('idle')
      },
    },
  })

  const handleSelect = (category: keyof CategoryChoices, vibeId: number) => {
    setChoices(prev => ({ ...prev, [category]: vibeId }))
  }

  const handleSubmit = async () => {
    if (!allSelected) return

    if (needsApproval()) {
      setStatus('approving')
      handleApprove()
      return
    }

    setStatus('submitting')
    predictWrite({
      address: CONTRACT_ADDRESS,
      abi: VIBECHECK_ABI,
      functionName: 'predict',
      args: [
        choices.crypto! as 0 | 1 | 2 | 3,
        choices.weather! as 0 | 1 | 2 | 3,
        choices.market! as 0 | 1 | 2 | 3,
        choices.trending! as 0 | 1 | 2 | 3,
      ],
    })
  }

  // Done state
  if (status === 'done') {
    return (
      <section className="relative py-20">
        <div className="relative z-10 mx-auto max-w-[520px] px-4">
          <div className="rounded-3xl border border-[#2A2A3A] bg-[#1A1A24] p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#22C55E]/15">
              <Check className="h-8 w-8 text-[#22C55E]" />
            </div>
            <h3 className="mb-2 text-xl font-bold">Predictions Submitted!</h3>
            <p className="mb-4 text-sm text-[#8A8A9A]">
              You predicted vibes for all 4 categories. Good luck!
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {CATEGORIES.map((cat) => {
                const choice = choices[cat.id as keyof CategoryChoices]
                const vibe = VIBES.find(v => v.id === choice)
                return vibe ? (
                  <span key={cat.id} className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: vibe.bg, color: vibe.color, border: `1px solid ${vibe.border}` }}>
                    {cat.label}: {vibe.label}
                  </span>
                ) : null
              })}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative py-20">
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'radial-gradient(circle, rgba(45,212,191,0.05) 0%, transparent 70%)' }} />

      <div className="relative z-10 mx-auto max-w-[600px] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-[#2A2A3A] bg-[#1A1A24] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.3)] sm:p-8"
        >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <span className="text-xs tracking-wider text-[#5A5A6A] uppercase">Round #{dayNum}</span>
            <div className="flex items-center gap-1.5"><span className="text-xs text-[#5A5A6A]">Ends in</span><CountdownTimer /></div>
          </div>
          <div className="mb-6 h-px bg-[#2A2A3A]" />

          <h2 className="mb-1 text-center text-2xl font-bold sm:text-[28px]">Predict the Vibe</h2>
          <p className="mb-8 text-center text-sm text-[#8A8A9A]">Pick a vibe for each category &middot; Stake {stake} USDC total</p>

          {!isConnected ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Wallet className="h-12 w-12 text-[#5A5A6A]" />
              <p className="text-center text-[#8A8A9A]">Connect your wallet to start predicting</p>
            </div>
          ) : (
            <>
              {/* Per-Category Prediction */}
              <div className="space-y-5">
                {CATEGORIES.map((cat) => {
                  const CatIcon = ICON_MAP[cat.icon] || TrendingUpIcon
                  const selectedChoice = choices[cat.id as keyof CategoryChoices]
                  return (
                    <div key={cat.id} className="rounded-xl border border-[#2A2A3A] bg-[#12121A] p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <CatIcon className="h-4 w-4 text-[#8A8A9A]" />
                        <span className="text-sm font-medium text-[#F0F0F5]">{cat.label}</span>
                        <span className="text-xs text-[#5A5A6A]">{cat.description}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {VIBES.map((vibe) => {
                          const isSelected = selectedChoice === vibe.id
                          const IconComp = VIBE_ICONS[vibe.id]
                          return (
                            <motion.button
                              key={vibe.id}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleSelect(cat.id as keyof CategoryChoices, vibe.id)}
                              className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 py-3 transition-all"
                              style={{
                                backgroundColor: isSelected ? vibe.bg : 'transparent',
                                borderColor: isSelected ? vibe.color : vibe.border,
                              }}
                            >
                              <IconComp className="h-4 w-4" style={{ color: vibe.color }} />
                              <span className="text-[11px] font-semibold" style={{ color: vibe.color }}>{vibe.label}</span>
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Stake + Submit */}
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-center gap-2 text-sm text-[#8A8A9A]">
                  <span className="h-2 w-2 rounded-full bg-[#2775CA]" />
                  Total stake: {stake} USDC
                  {poolSize > 0 && <span className="text-[#5A5A6A]">&middot; {poolSize} predictions in pool</span>}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={!allSelected || status === 'approving' || status === 'submitting'}
                  className="w-full cursor-pointer rounded-2xl bg-[#2DD4BF] py-3.5 text-base font-semibold text-[#0A0A0F] shadow-[0_0_20px_rgba(45,212,191,0.15)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === 'approving' || isApproving ? (
                    <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Approve USDC in wallet...</span>
                  ) : status === 'submitting' || isPredicting ? (
                    <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</span>
                  ) : needsApproval() ? (
                    'Approve USDC & Predict'
                  ) : (
                    'Submit Predictions'
                  )}
                </motion.button>

                {status === 'approving' && (
                  <p className="mt-2 text-center text-xs text-[#F59E0B]">
                    Please confirm the USDC approval in your wallet. After approval, click submit again.
                  </p>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {showXModal && <XVerifyModal onClose={() => setShowXModal(false)} />}
    </section>
  )
}
