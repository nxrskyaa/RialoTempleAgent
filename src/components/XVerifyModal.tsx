import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Check } from 'lucide-react'
import { useAccount, useSignMessage, useWriteContract } from 'wagmi'
import { CONTRACT_ADDRESS, VIBECHECK_ABI } from '@/config/contract'

interface XVerifyModalProps {
  onClose: () => void
}

function getXAvatarUrl(username: string): string {
  return `https://unavatar.io/twitter/${username}?fallback=false`
}

export default function XVerifyModal({ onClose }: XVerifyModalProps) {
  const { address } = useAccount()

  const [username, setUsername] = useState('')
  const [status, setStatus] = useState<'idle' | 'signing' | 'submitting' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  const { signMessageAsync } = useSignMessage()
  const { writeContractAsync } = useWriteContract()

  const cleanUsername = username.replace(/^@/, '').trim().toLowerCase()
  const avatarUrl = cleanUsername ? getXAvatarUrl(cleanUsername) : ''

  const handleSubmit = async () => {
    if (!cleanUsername || !address) {
      setError('Please enter your X username')
      return
    }

    setError('')
    setStatus('signing')

    try {
      const message = `VibeCheck:LinkX:@${cleanUsername}:${address}`
      const signature = await signMessageAsync({ message })

      setStatus('submitting')
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: VIBECHECK_ABI,
        functionName: 'linkXAccount',
        args: [cleanUsername, BigInt(0), false, signature as `0x${string}`],
      })

      setStatus('done')
      setTimeout(() => onClose(), 1500)
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Transaction failed')
      setStatus('error')
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', duration: 0.4 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[400px] overflow-hidden rounded-2xl border border-[#2A2A3A] bg-[#12121A] p-6 shadow-2xl"
        >
          {status !== 'done' && (
            <button onClick={onClose} className="absolute top-4 right-4 text-[#5A5A6A] transition-colors hover:text-[#F0F0F5]">
              <X className="h-5 w-5" />
            </button>
          )}

          {status === 'done' ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#22C55E]/15">
                <Check className="h-7 w-7 text-[#22C55E]" />
              </div>
              <p className="text-lg font-semibold">@{cleanUsername} linked!</p>
              <p className="text-center text-sm text-[#8A8A9A]">Your X account is now connected.</p>
            </div>
          ) : (
            <>
              <h3 className="mb-1 text-xl font-bold">Link Your X Account</h3>
              <p className="mb-6 text-sm text-[#8A8A9A]">Connect your X identity to unlock social score.</p>

              <div>
                <label className="mb-1.5 block text-sm text-[#8A8A9A]">Twitter / X username (without @)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A6A]">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace('@', ''))}
                    placeholder="elonmusk"
                    disabled={status === 'signing' || status === 'submitting'}
                    className="w-full rounded-xl border border-[#2A2A3A] bg-[#1A1A24] py-2.5 pr-4 pl-8 text-sm text-[#F0F0F5] placeholder-[#5A5A6A] outline-none transition-colors focus:border-[#2DD4BF] disabled:opacity-50"
                  />
                </div>
              </div>

              {cleanUsername && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-4 rounded-xl border border-[#2A2A3A] bg-[#1A1A24] p-4"
                >
                  <img
                    src={avatarUrl}
                    alt={`@${cleanUsername}`}
                    className="h-14 w-14 rounded-full bg-[#2A2A3A] object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanUsername}` }}
                  />
                  <div>
                    <p className="font-medium text-[#F0F0F5]">@{cleanUsername}</p>
                    <p className="text-xs text-[#5A5A6A]">X Profile</p>
                  </div>
                </motion.div>
              )}

              {error && <p className="mt-3 text-xs text-[#EF4444]">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={status === 'signing' || status === 'submitting'}
                className="mt-5 w-full cursor-pointer rounded-xl bg-[#2DD4BF] py-3 text-sm font-semibold text-[#0A0A0F] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === 'signing' ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Signing...</span>
                ) : status === 'submitting' ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</span>
                ) : (
                  'Link X Account'
                )}
              </button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
