import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Loader2, Send, Sparkles } from 'lucide-react'
import { useAccount, useReadContract, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import ProfileGate from '@/components/ProfileGate'
import { ARC_CHAIN, ARC_EXPLORER_TX_BASE, RIALO_TEMPLE_ABI, RIALO_TEMPLE_ADDRESS } from '@/config/contracts'
import { fmtAddress, parseUnifiedUser, parseWishes, type WishData } from '@/lib/rialo'

const WISH_LIMIT = 12n
const MAX_WISH_BYTES = 280

export default function RialoWish() {
  return (
    <ProfileGate>
      {(profile, _stats, refetchProfile) => <WishInner username={profile.name} xHandle={profile.xHandle} refetchProfile={refetchProfile} />}
    </ProfileGate>
  )
}

function WishInner({ username, xHandle, refetchProfile }: { username: string; xHandle: string; refetchProfile: () => void }) {
  const { address } = useAccount()
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  const [submittedWish, setSubmittedWish] = useState<{ message: string; hash: `0x${string}` } | null>(null)
  const byteCount = useMemo(() => new TextEncoder().encode(message).length, [message])

  const countQuery = useReadContract({
    address: RIALO_TEMPLE_ADDRESS,
    abi: RIALO_TEMPLE_ABI,
    chainId: ARC_CHAIN.id,
    functionName: 'getWishCount',
    query: { refetchInterval: 12000, retry: 1 },
  })
  const wishCount = typeof countQuery.data === 'bigint' ? countQuery.data : 0n
  const start = wishCount > WISH_LIMIT ? wishCount - WISH_LIMIT : 0n
  const wishesQuery = useReadContract({
    address: RIALO_TEMPLE_ADDRESS,
    abi: RIALO_TEMPLE_ABI,
    chainId: ARC_CHAIN.id,
    functionName: 'getWishes',
    args: [start, WISH_LIMIT],
    query: { refetchInterval: 12000, retry: 1 },
  })
  const wishes = useMemo(() => parseWishes(wishesQuery.data).reverse(), [wishesQuery.data])
  const authorQueries = useReadContracts({
    contracts: wishes.map((wish) => ({
      address: RIALO_TEMPLE_ADDRESS,
      abi: RIALO_TEMPLE_ABI,
      chainId: ARC_CHAIN.id,
      functionName: 'getUser',
      args: [wish.author],
    })),
    query: { enabled: wishes.length > 0, refetchInterval: 15000, retry: 1 },
  })
  const authors = useMemo(() => authorQueries.data?.map((item) => parseUnifiedUser(item.result)) ?? [], [authorQueries.data])

  const { data: wishHash, writeContract, isPending, reset } = useWriteContract({
    mutation: {
      onError: (error) => setStatus(friendlyWishError(error.message)),
    },
  })
  const receipt = useWaitForTransactionReceipt({
    hash: wishHash,
    query: { enabled: Boolean(wishHash), refetchOnWindowFocus: false },
  })

  useEffect(() => {
    if (!wishHash) return
    setStatus(receipt.isLoading ? 'Wish sent. Waiting for Arc confirmation...' : 'Wish submitted.')
  }, [receipt.isLoading, wishHash])

  useEffect(() => {
    if (!receipt.isSuccess || !wishHash) return
    setSubmittedWish({ message, hash: wishHash })
    setStatus('Wish sealed onchain.')
    setMessage('')
    void countQuery.refetch()
    void wishesQuery.refetch()
    refetchProfile()
    reset()
  }, [countQuery, message, receipt.isSuccess, refetchProfile, reset, wishHash, wishesQuery])

  function submitWish() {
    const clean = message.trim()
    if (!clean) {
      setStatus('Write a wish before sending it onchain.')
      return
    }
    if (byteCount > MAX_WISH_BYTES) {
      setStatus('Your wish is too long. Keep it under 280 characters.')
      return
    }
    setStatus('Open your wallet to send this wish onchain.')
    writeContract({
      address: RIALO_TEMPLE_ADDRESS,
      abi: RIALO_TEMPLE_ABI,
      chainId: ARC_CHAIN.id,
      functionName: 'submitWish',
      args: [clean],
    })
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6">
      <section className="temple-card spark-field overflow-hidden rounded-lg p-5 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--temple-gold)]">Rialo Wish</p>
            <h1 className="arcade-title mt-3 text-5xl font-black leading-none sm:text-7xl">Send a Temple Wish</h1>
            <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-[var(--temple-muted)]">
              Leave one thought, feedback note, or hope for Rialo. The V2Lite contract keeps it as an onchain temple scroll.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--temple-border)] bg-white/[0.045] px-4 py-2 text-xs font-black text-[var(--temple-muted)]">
              <Sparkles className="h-4 w-4 text-[var(--temple-emerald)]" /> {username} / @{xHandle || 'xhandle'}
            </div>
          </div>
          <div className="pixel-panel rounded-lg border border-[var(--temple-border)] p-4 sm:p-5">
            <label className="text-xs font-black uppercase tracking-wider text-[var(--temple-soft)]">Share your wish, thought, or feedback</label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="temple-input mt-3 min-h-40 w-full resize-none rounded-lg p-4 text-sm"
              maxLength={MAX_WISH_BYTES}
              placeholder="I wish Rialo Temple could..."
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className={`text-xs font-black ${byteCount > MAX_WISH_BYTES ? 'text-[var(--temple-red)]' : 'text-[var(--temple-muted)]'}`}>{byteCount}/{MAX_WISH_BYTES} bytes</p>
              <button type="button" onClick={submitWish} disabled={isPending || receipt.isLoading || byteCount > MAX_WISH_BYTES} className="temple-button inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50">
                {isPending || receipt.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {receipt.isLoading ? 'Sealing wish...' : 'Send Wish Onchain'}
              </button>
            </div>
            {status ? <p className="mt-3 text-sm font-semibold text-[var(--temple-muted)]">{status}</p> : null}
          </div>
        </div>
      </section>

      {submittedWish ? (
        <section className="temple-card mt-6 rounded-lg p-5">
          <p className="text-xs font-black uppercase tracking-wider text-[var(--temple-gold)]">Wish confirmation</p>
          <p className="mt-3 text-lg font-black">"{submittedWish.message}"</p>
          <p className="mt-2 text-sm font-semibold text-[var(--temple-muted)]">by {username} / @{xHandle || 'xhandle'} / {fmtAddress(address)}</p>
          <a href={`${ARC_EXPLORER_TX_BASE}/${submittedWish.hash}`} target="_blank" rel="noreferrer" className="temple-button-secondary mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black">
            View on Arc Explorer <ExternalLink className="h-4 w-4" />
          </a>
        </section>
      ) : null}

      <section className="mt-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--temple-gold)]">Wish feed</p>
            <h2 className="text-3xl font-black">Latest temple scrolls</h2>
          </div>
          <p className="text-xs font-black uppercase tracking-wider text-[var(--temple-soft)]">{Number(wishCount)} total</p>
        </div>

        {wishesQuery.isLoading ? (
          <div className="temple-card flex items-center justify-center rounded-lg py-16 text-sm text-[var(--temple-muted)]">
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-[var(--temple-emerald)]" /> Loading wishes
          </div>
        ) : wishes.length === 0 ? (
          <div className="temple-card spark-field rounded-lg py-16 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-[var(--temple-gold)]" />
            <p className="text-sm font-semibold text-[var(--temple-muted)]">No wishes yet. Send the first temple scroll.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {wishes.map((wish, index) => <WishCard key={`${wish.wishId}-${wish.author}`} wish={wish} author={authors[index]} index={index} />)}
          </div>
        )}
      </section>
    </main>
  )
}

function WishCard({ wish, author, index }: { wish: WishData; author?: ReturnType<typeof parseUnifiedUser>; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035 }}
      className="temple-card rounded-lg p-5"
    >
      <p className="text-xs font-black uppercase tracking-wider text-[var(--temple-soft)]">Wish #{wish.wishId}</p>
      <p className="mt-3 min-h-20 text-base font-semibold leading-7">"{wish.message}"</p>
      <div className="mt-4 rounded-lg border border-[var(--temple-border)] bg-white/[0.04] p-3">
        <p className="text-sm font-black">{author?.name || fmtAddress(wish.author)}</p>
        <p className="text-xs font-semibold text-[var(--temple-muted)]">@{author?.xHandle || 'xhandle'} / {fmtAddress(wish.author)}</p>
        <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-[var(--temple-soft)]">{wish.createdAt ? new Date(wish.createdAt * 1000).toLocaleString() : 'Onchain scroll'}</p>
      </div>
    </motion.article>
  )
}

function friendlyWishError(message: string) {
  if (message.includes('PROFILE_REQUIRED')) return 'Seal your Rialo Passport first.'
  if (message.includes('MESSAGE_TOO_LONG')) return 'Your wish is too long. Keep it under 280 characters.'
  return message.split('\n')[0] || 'Wish transaction failed.'
}
