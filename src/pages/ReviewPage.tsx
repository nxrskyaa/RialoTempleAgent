import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Clapperboard, ExternalLink, ImageIcon, Loader2, Send, Star, Utensils } from 'lucide-react'
import { useReadContract, useWriteContract } from 'wagmi'
import ProfileGate from '@/components/ProfileGate'
import { RIALO_TEMPLE_ABI, RIALO_TEMPLE_ADDRESS } from '@/config/contracts'
import { ACTION_FEE, fmtAddress, parseReviews, REVIEW_PAGE_SIZE, type ReviewData } from '@/lib/rialo'

type Tab = 'all' | 'food' | 'film'
type WriteKind = 'food' | 'film'

export default function ReviewPage() {
  return (
    <ProfileGate>
      {(_, stats, refetchProfile) => <ReviewInner reviewCount={stats.reviewCount} refetchProfile={refetchProfile} />}
    </ProfileGate>
  )
}

function ReviewInner({ reviewCount, refetchProfile }: { reviewCount: number; refetchProfile: () => void }) {
  const [tab, setTab] = useState<Tab>('all')
  const [kind, setKind] = useState<WriteKind>('food')
  const [title, setTitle] = useState('')
  const [originOrImdb, setOriginOrImdb] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [message, setMessage] = useState('')

  const query = tab === 'all'
    ? {
        functionName: 'getReviews' as const,
        args: [0n, REVIEW_PAGE_SIZE] as const,
      }
    : {
        functionName: 'getReviewsByCategory' as const,
        args: [tab === 'food' ? 0 : 1, 0n, REVIEW_PAGE_SIZE] as const,
      }

  const { data, isLoading, refetch } = useReadContract({
    address: RIALO_TEMPLE_ADDRESS,
    abi: RIALO_TEMPLE_ABI,
    functionName: query.functionName,
    args: query.args,
    query: { refetchInterval: 7000 },
  })

  const reviews = useMemo(() => parseReviews(data), [data])

  const { writeContract, isPending } = useWriteContract({
    mutation: {
      onSuccess: () => {
        setMessage('Review submitted on-chain.')
        setTitle('')
        setOriginOrImdb('')
        setImageUrl('')
        setRating(0)
        setReviewText('')
        setTimeout(() => {
          refetch()
          refetchProfile()
          setMessage('')
        }, 1600)
      },
      onError: (error) => setMessage(error.message.split('\n')[0] || 'Review transaction failed.'),
    },
  })

  function submitReview() {
    if (!title.trim() || rating < 1) {
      setMessage('Title/name and rating are required.')
      return
    }

    if (kind === 'food') {
      writeContract({
        address: RIALO_TEMPLE_ADDRESS,
        abi: RIALO_TEMPLE_ABI,
        functionName: 'submitFoodReview',
        args: [title.trim(), originOrImdb.trim(), imageUrl.trim(), rating, reviewText.trim()],
        value: ACTION_FEE,
      })
      return
    }

    writeContract({
      address: RIALO_TEMPLE_ADDRESS,
      abi: RIALO_TEMPLE_ABI,
      functionName: 'submitFilmReview',
      args: [title.trim(), originOrImdb.trim(), rating, reviewText.trim()],
      value: ACTION_FEE,
    })
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[0.92fr_1.08fr]">
      <section className="temple-card rounded-lg p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--temple-gold)]">Review altar</p>
            <h1 className="mt-2 text-3xl font-black tracking-normal">Write on-chain taste notes</h1>
            <p className="mt-2 text-sm text-[var(--temple-muted)]">Food and film reviews cost 1 native USDC each. Your profile has {reviewCount} reviews.</p>
          </div>
          <div className="hidden h-14 w-14 items-center justify-center rounded-lg border border-[var(--temple-border)] bg-black/20 sm:flex">
            {kind === 'food' ? <Utensils className="h-6 w-6 text-[var(--temple-emerald)]" /> : <Clapperboard className="h-6 w-6 text-[var(--temple-gold)]" />}
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-lg border border-[var(--temple-border)] bg-black/20 p-1">
          {[
            { id: 'food' as const, label: 'Food', Icon: Utensils },
            { id: 'film' as const, label: 'Film', Icon: Clapperboard },
          ].map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setKind(id)} className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold ${kind === id ? 'temple-button' : 'text-[var(--temple-muted)]'}`}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <Field label={kind === 'food' ? 'Food name' : 'Film title'}>
            <input className="temple-input w-full rounded-lg px-3 py-3 text-sm" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={kind === 'food' ? 'Nasi Goreng Kampung' : 'Dune: Part Two'} />
          </Field>
          <Field label={kind === 'food' ? 'Origin / region' : 'IMDb link'}>
            <input className="temple-input w-full rounded-lg px-3 py-3 text-sm" value={originOrImdb} onChange={(event) => setOriginOrImdb(event.target.value)} placeholder={kind === 'food' ? 'Jakarta, Indonesia' : 'https://www.imdb.com/title/...'} />
          </Field>
          {kind === 'food' && (
            <Field label="Food image URL">
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--temple-soft)]" />
                <input className="temple-input w-full rounded-lg py-3 pl-10 pr-3 text-sm" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://images.example/food.jpg" />
              </div>
            </Field>
          )}
          <Field label="Rating">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" onClick={() => setRating(value)} className="rounded-md p-1.5">
                  <Star className="h-7 w-7" fill={value <= rating ? '#f4c95d' : 'none'} style={{ color: value <= rating ? '#f4c95d' : 'var(--temple-border)' }} />
                </button>
              ))}
            </div>
          </Field>
          <Field label="Review">
            <textarea className="temple-input h-28 w-full resize-none rounded-lg px-3 py-3 text-sm" value={reviewText} onChange={(event) => setReviewText(event.target.value)} placeholder="Write the part people should remember..." />
          </Field>

          {message && <p className="text-sm text-[var(--temple-gold)]">{message}</p>}
          <button onClick={submitReview} disabled={isPending} className="temple-button inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold disabled:opacity-55">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit review / 1 USDC
          </button>
        </div>
      </section>

      <section className="temple-card rounded-lg p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--temple-soft)]">Browse temple wall</p>
            <h2 className="text-2xl font-semibold">Latest reviews</h2>
          </div>
          <div className="grid grid-cols-3 rounded-lg border border-[var(--temple-border)] bg-black/20 p-1 text-xs font-semibold">
            {(['all', 'food', 'film'] as const).map((item) => (
              <button key={item} onClick={() => setTab(item)} className={`rounded-md px-3 py-2 capitalize ${tab === item ? 'temple-button' : 'text-[var(--temple-muted)]'}`}>{item}</button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-sm text-[var(--temple-muted)]"><Loader2 className="mr-2 h-4 w-4 animate-spin text-[var(--temple-emerald)]" /> Loading reviews</div>
        ) : reviews.length === 0 ? (
          <div className="rounded-lg border border-[var(--temple-border)] bg-black/20 py-16 text-center">
            <Star className="mx-auto mb-3 h-8 w-8 text-[var(--temple-soft)]" />
            <p className="text-sm text-[var(--temple-muted)]">No reviews in this category yet.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {reviews.map((review, index) => <ReviewCard key={`${review.id}-${review.reviewer}`} review={review} index={index} />)}
          </div>
        )}
      </section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--temple-soft)]">{label}</span>
      {children}
    </label>
  )
}

function ReviewCard({ review, index }: { review: ReviewData; index: number }) {
  const isFood = review.category === 0
  const Icon = isFood ? Utensils : Clapperboard
  return (
    <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.025 }} className="rounded-lg border border-[var(--temple-border)] bg-black/20 p-4">
      <div className="flex gap-4">
        {isFood && review.imageUrl ? <img src={review.imageUrl} alt="" className="h-24 w-24 rounded-lg object-cover" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-white/[0.035]">
            <Icon className="h-7 w-7 text-[var(--temple-emerald)]" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.04] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--temple-gold)]">
              <Icon className="h-3 w-3" /> {isFood ? 'Food' : 'Film'}
            </span>
            <span className="flex gap-0.5">{[1, 2, 3, 4, 5].map((value) => <Star key={value} className="h-3.5 w-3.5" fill={value <= review.rating ? '#f4c95d' : 'none'} style={{ color: value <= review.rating ? '#f4c95d' : 'var(--temple-border)' }} />)}</span>
          </div>
          <h3 className="truncate text-base font-semibold">{review.title}</h3>
          {review.originOrImdb && (
            <a href={review.originOrImdb.startsWith('http') ? review.originOrImdb : undefined} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs text-[var(--temple-muted)]">
              {review.originOrImdb} {review.originOrImdb.startsWith('http') && <ExternalLink className="h-3 w-3 shrink-0" />}
            </a>
          )}
          {review.reviewText && <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--temple-muted)]">{review.reviewText}</p>}
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--temple-soft)]">by {fmtAddress(review.reviewer)}</p>
        </div>
      </div>
    </motion.article>
  )
}
