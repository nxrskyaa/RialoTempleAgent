import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ChefHat, Clapperboard, ExternalLink, Film, Loader2, Popcorn, Send, Soup, Star, Utensils } from 'lucide-react'
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import ProfileGate from '@/components/ProfileGate'
import { ARC_CHAIN, RIALO_TEMPLE_ABI, RIALO_TEMPLE_ADDRESS } from '@/config/contracts'
import { ACTION_FEE, fmtAddress, parseReviews, REVIEW_PAGE_SIZE, type ReviewData } from '@/lib/rialo'

type Tab = 'all' | 'food' | 'film'
type WriteKind = 'food' | 'film'

const foodTags = ['Flavor bomb', 'Cozy', 'Street gem', 'Worth the bite']
const filmTags = ['Great story', 'Visual feast', 'Cozy watch', 'Big mood']

export default function ReviewPage() {
  return (
    <ProfileGate>
      {(_, _stats, refetchProfile) => <ReviewInner refetchProfile={refetchProfile} />}
    </ProfileGate>
  )
}

function ReviewInner({ refetchProfile }: { refetchProfile: () => void }) {
  const [tab, setTab] = useState<Tab>('all')
  const [kind, setKind] = useState<WriteKind>('food')
  const [title, setTitle] = useState('')
  const [originOrImdb, setOriginOrImdb] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [message, setMessage] = useState('')

  const query = tab === 'all'
    ? { functionName: 'getReviews' as const, args: [0n, REVIEW_PAGE_SIZE] as const }
    : { functionName: 'getReviewsByCategory' as const, args: [tab === 'food' ? 0 : 1, 0n, REVIEW_PAGE_SIZE] as const }

  const { data, isLoading, refetch } = useReadContract({
    address: RIALO_TEMPLE_ADDRESS,
    abi: RIALO_TEMPLE_ABI,
    chainId: ARC_CHAIN.id,
    functionName: query.functionName,
    args: query.args,
    query: { refetchInterval: 7000 },
  })

  const reviews = useMemo(() => parseReviews(data), [data])
  const activeTags = kind === 'food' ? foodTags : filmTags

  const { data: reviewTxHash, writeContract, isPending, reset } = useWriteContract({
    mutation: {
      onError: (error) => setMessage(error.message.split('\n')[0] || 'Review transaction failed.'),
    },
  })

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: reviewTxHash,
    query: { enabled: Boolean(reviewTxHash), refetchOnWindowFocus: false },
  })

  useEffect(() => {
    if (!reviewTxHash) return
    setMessage(isConfirming ? 'Review sent. Waiting for Arc confirmation...' : 'Review sent.')
  }, [isConfirming, reviewTxHash])

  useEffect(() => {
    if (!isConfirmed) return
    setMessage('Review saved. The temple critics are taking notes.')
    setTitle('')
    setOriginOrImdb('')
    setImageUrl('')
    setRating(0)
    setReviewText('')
    setSelectedTags([])
    void refetch()
    refetchProfile()
    reset()
    const clear = window.setTimeout(() => setMessage(''), 2200)
    return () => window.clearTimeout(clear)
  }, [isConfirmed, refetch, refetchProfile, reset])

  function toggleTag(tag: string) {
    setSelectedTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])
  }

  function submitReview() {
    if (!title.trim() || rating < 1) {
      setMessage('Title/name and rating are required.')
      return
    }

    const tagLine = selectedTags.length ? `\n\nMood: ${selectedTags.join(', ')}` : ''
    const textForChain = `${reviewText.trim()}${tagLine}`.trim()

    setMessage('Open your wallet and confirm the review transaction.')
    if (kind === 'food') {
      writeContract({
        address: RIALO_TEMPLE_ADDRESS,
        abi: RIALO_TEMPLE_ABI,
        chainId: ARC_CHAIN.id,
        functionName: 'submitFoodReview',
        args: [title.trim(), originOrImdb.trim(), imageUrl.trim(), rating, textForChain],
        value: ACTION_FEE,
      })
      return
    }

    writeContract({
      address: RIALO_TEMPLE_ADDRESS,
      abi: RIALO_TEMPLE_ABI,
      chainId: ARC_CHAIN.id,
      functionName: 'submitFilmReview',
      args: [title.trim(), originOrImdb.trim(), rating, textForChain],
      value: ACTION_FEE,
    })
  }

  return (
    <main className="review2-page mx-auto max-w-[1480px] px-4 pb-14 pt-6 sm:px-6">
      <section className="review2-hero">
        <div className="review2-hero-copy">
          <span className="review2-eyebrow">Rialo Taste & Reel Review Hub</span>
          <h1>Review Food & Movies</h1>
          <p>Share simple reviews and build your Rialo Temple taste profile. Rate the bite, the watch, and the memory.</p>
        </div>
        <div className="review2-hero-cards">
          <CategoryCard kind="food" active={kind === 'food'} onClick={() => setKind('food')} />
          <CategoryCard kind="film" active={kind === 'film'} onClick={() => setKind('film')} />
        </div>
      </section>

      <section className="review2-studio">
        <div className="review2-composer">
          <div className="review2-composer-head">
            <ReviewMascot kind={kind} />
            <div>
              <span className="review2-eyebrow">{kind === 'food' ? 'Food review' : 'Movie review'}</span>
              <h2>{kind === 'food' ? 'Was it worth the bite?' : 'Was it worth the watch?'}</h2>
              <p>{kind === 'food' ? 'Rate the flavor, vibe, and memory.' : 'Rate the story, visuals, and mood.'}</p>
            </div>
          </div>

          <div className="review2-form-grid">
            <Field label={kind === 'food' ? 'Dish or place' : 'Movie title'}>
              <input className="review2-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={kind === 'food' ? 'Soto Betawi Pak Haji' : 'Everything Everywhere All at Once'} />
            </Field>
            <Field label={kind === 'food' ? 'City / memory' : 'IMDb or source link'}>
              <input className="review2-input" value={originOrImdb} onChange={(event) => setOriginOrImdb(event.target.value)} placeholder={kind === 'food' ? 'Jakarta, late night bowl' : 'https://www.imdb.com/title/...'} />
            </Field>
            {kind === 'food' ? (
              <Field label="Food image URL">
                <input className="review2-input" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Optional image URL for the dish" />
              </Field>
            ) : null}
          </div>

          <Field label="Rating">
            <div className="review2-rating" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" onClick={() => setRating(value)} className={value <= rating ? 'is-active' : ''}>
                  <Star className="h-7 w-7" fill="currentColor" />
                </button>
              ))}
            </div>
          </Field>

          <Field label="Mood tags">
            <div className="review2-tags">
              {activeTags.map((tag) => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)} className={selectedTags.includes(tag) ? 'is-active' : ''}>{tag}</button>
              ))}
            </div>
          </Field>

          <Field label="Short review">
            <textarea className="review2-input review2-textarea" value={reviewText} onChange={(event) => setReviewText(event.target.value)} placeholder={kind === 'food' ? 'The broth was warm, peppery, and worth remembering...' : 'The story stayed with me after the credits...'} />
          </Field>

          {message ? <p className="review2-message">{message}</p> : null}

          <button onClick={submitReview} disabled={isPending || isConfirming} className="review2-submit">
            {isPending || isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {isConfirming ? 'Confirming on Arc' : isPending ? 'Waiting for wallet' : 'Publish review / 1 USDC'}
          </button>
        </div>

        <aside className={`review2-live-card ${kind}`}>
          <div className="review2-live-media">
            {kind === 'food' && imageUrl ? <img src={imageUrl} alt="" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : kind === 'food' ? <Soup className="h-14 w-14" /> : <Film className="h-14 w-14" />}
            {kind === 'food' ? <span className="review2-steam one" /> : <span className="review2-film-strip" />}
            {kind === 'food' ? <span className="review2-steam two" /> : null}
          </div>
          <span>{kind === 'food' ? 'Taste preview' : 'Reel preview'}</span>
          <h3>{title || (kind === 'food' ? 'Your next favorite bite' : 'Your next favorite watch')}</h3>
          <p>{reviewText || (kind === 'food' ? 'A short note about flavor, vibe, and memory will appear here.' : 'A short note about story, visuals, and mood will appear here.')}</p>
          <div className="review2-preview-stars">{[1, 2, 3, 4, 5].map((value) => <Star key={value} className="h-4 w-4" fill={value <= rating ? 'currentColor' : 'none'} />)}</div>
        </aside>
      </section>

      <section className="review2-gallery">
        <div className="review2-gallery-head">
          <div>
            <span className="review2-eyebrow">Review gallery</span>
            <h2>Latest temple notes</h2>
          </div>
          <div className="review2-filter">
            {(['all', 'food', 'film'] as const).map((item) => (
              <button key={item} type="button" onClick={() => setTab(item)} className={tab === item ? 'is-active' : ''}>{item}</button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="review2-state"><Loader2 className="h-5 w-5 animate-spin" /> Loading reviews</div>
        ) : reviews.length === 0 ? (
          <div className="review2-state">
            <ReviewMascot kind="food" />
            <strong>No reviews yet.</strong>
            <span>Drop the first taste or reel memory.</span>
          </div>
        ) : (
          <div className="review2-card-grid">
            {reviews.map((review, index) => <ReviewCard key={`${review.id}-${review.reviewer}`} review={review} index={index} />)}
          </div>
        )}
      </section>
    </main>
  )
}

function CategoryCard({ kind, active, onClick }: { kind: WriteKind; active: boolean; onClick: () => void }) {
  const isFood = kind === 'food'
  const Icon = isFood ? Utensils : Clapperboard
  return (
    <button type="button" onClick={onClick} className={`review2-category-card ${kind} ${active ? 'is-active' : ''}`}>
      <ReviewMascot kind={kind} />
      <div>
        <span><Icon className="h-4 w-4" /> {isFood ? 'Food Review' : 'Movie Review'}</span>
        <strong>{isFood ? 'Worth the bite?' : 'Worth the watch?'}</strong>
        <p>{isFood ? 'Flavor, vibe, memory.' : 'Story, visuals, mood.'}</p>
      </div>
    </button>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="review2-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function ReviewMascot({ kind }: { kind: WriteKind }) {
  return (
    <div className={`review2-mascot ${kind}`} aria-label={kind === 'food' ? 'Food critic mascot' : 'Movie critic mascot'} role="img">
      <span className="review2-mascot-shadow" />
      <div className="review2-mascot-body">
        <span className="review2-mascot-ear left" />
        <span className="review2-mascot-ear right" />
        <div className="review2-mascot-face">
          <span className="review2-mascot-eye left" />
          <span className="review2-mascot-eye right" />
          <span className="review2-mascot-mouth" />
        </div>
        <span className="review2-mascot-arm left" />
        <span className="review2-mascot-arm right" />
      </div>
      <span className="review2-mascot-tool">{kind === 'food' ? <ChefHat className="h-4 w-4" /> : <Popcorn className="h-4 w-4" />}</span>
    </div>
  )
}

function ReviewCard({ review, index }: { review: ReviewData; index: number }) {
  const isFood = review.category === 0
  const Icon = isFood ? Soup : Film
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025 }}
      className={`review2-card ${isFood ? 'food' : 'film'}`}
    >
      <div className="review2-card-media">
        {isFood && review.imageUrl ? <img src={review.imageUrl} alt="" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : <Icon className="h-8 w-8" />}
      </div>
      <div className="review2-card-body">
        <div className="review2-card-meta">
          <span>{isFood ? 'Food' : 'Movie'}</span>
          <span>{[1, 2, 3, 4, 5].map((value) => <Star key={value} className="h-3.5 w-3.5" fill={value <= review.rating ? 'currentColor' : 'none'} />)}</span>
        </div>
        <h3>{review.title}</h3>
        {review.originOrImdb ? (
          <a href={review.originOrImdb.startsWith('http') ? review.originOrImdb : undefined} target="_blank" rel="noreferrer">
            {review.originOrImdb} {review.originOrImdb.startsWith('http') ? <ExternalLink className="h-3 w-3" /> : null}
          </a>
        ) : null}
        {review.reviewText ? <p>{review.reviewText}</p> : null}
        <small>by {fmtAddress(review.reviewer)}</small>
      </div>
    </motion.article>
  )
}
