import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, ChevronLeft, Loader2, Sparkles, XCircle } from 'lucide-react'
import { useAccount, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import ProfileGate from '@/components/ProfileGate'
import { ARC_CHAIN, RIALO_TEMPLE_ABI, RIALO_TEMPLE_ADDRESS } from '@/config/contracts'

type Quiz = {
  id: number
  title: string
  reward: number
  difficulty: string
  theme: string
  questions: Array<{ prompt: string; options: string[]; answer: number; note: string }>
}

const QUIZZES: Quiz[] = [
  {
    id: 1,
    title: 'Rialo Basics',
    reward: 50,
    difficulty: 'Easy',
    theme: 'Temple Gate',
    questions: [
      { prompt: 'What is Rialo built for?', options: ['Only memes', 'Real-world blockchain apps', 'Offline spreadsheets'], answer: 1, note: 'Rialo focuses on apps that touch real-world data, identity, assets, and systems.' },
      { prompt: 'Why does speed matter?', options: ['Users hate waiting', 'It changes logo color', 'It removes wallets'], answer: 0, note: 'Real-world apps need quick, low-latency reactions.' },
      { prompt: 'What should permanent PTS come from?', options: ['Frontend cache', 'The V2Lite contract', 'Screenshots'], answer: 1, note: 'The contract is the source of truth.' },
    ],
  },
  {
    id: 2,
    title: 'Real World Assets',
    reward: 75,
    difficulty: 'Medium',
    theme: 'RWA Vault',
    questions: [
      { prompt: 'What can RWA represent?', options: ['Only profile pictures', 'Assets like invoices, houses, bonds, tickets', 'Only game skins'], answer: 1, note: 'RWA brings real-world value into programmable rails.' },
      { prompt: 'What makes Rialo RWA more useful?', options: ['Live updates and real events', 'Static images only', 'Manual copy paste forever'], answer: 0, note: 'Rialo assets can react to data and real-world state.' },
      { prompt: 'Why verify assets?', options: ['To make them heavier', 'To improve trust before apps use them', 'To hide all data'], answer: 1, note: 'Verification helps apps and agents use assets safely.' },
    ],
  },
  {
    id: 3,
    title: 'SCALE Agents',
    reward: 75,
    difficulty: 'Medium',
    theme: 'SCALE Lab',
    questions: [
      { prompt: 'What does SCALE help define?', options: ['Task terms, deadline, checks, payment', 'Only font size', 'Only avatars'], answer: 0, note: 'SCALE makes agent labor easier to coordinate and verify.' },
      { prompt: 'When should payment release?', options: ['Before the task exists', 'After verified work', 'Never'], answer: 1, note: 'Verification reduces risk when paying agents.' },
      { prompt: 'Why use judge agents?', options: ['To decorate UI', 'To check result quality', 'To remove deadlines'], answer: 1, note: 'A judge can inspect whether the output meets the terms.' },
    ],
  },
  {
    id: 4,
    title: 'Automation and Signals',
    reward: 80,
    difficulty: 'Medium',
    theme: 'Speed Engine',
    questions: [
      { prompt: 'What is real-world reactivity?', options: ['Apps reacting to live changes', 'Static banners', 'Manual refresh only'], answer: 0, note: 'Reactive apps can respond when events happen.' },
      { prompt: 'Which event could trigger an action?', options: ['A shipment update', 'A random color', 'A hidden emoji'], answer: 0, note: 'Real-world events can become signals.' },
      { prompt: 'What does connectivity help with?', options: ['Talking to APIs and real systems', 'Blocking all internet data', 'Deleting user identity'], answer: 0, note: 'Rialo helps contracts connect beyond crypto-only state.' },
    ],
  },
  {
    id: 5,
    title: 'Rialo Temple Mastery',
    reward: 100,
    difficulty: 'Hard',
    theme: 'Full Temple',
    questions: [
      { prompt: 'What should a Rialo agent economy protect?', options: ['Tasks, permissions, deadlines, payments', 'Only button colors', 'Only follower counts'], answer: 0, note: 'Agents need safe rails before touching real value.' },
      { prompt: 'Why is privacy important?', options: ['Some real-world data is sensitive', 'Everything must be public forever', 'It makes apps slower'], answer: 0, note: 'Finance, identity, and personal actions need privacy.' },
      { prompt: 'What combines into leaderboard PTS?', options: ['Only localStorage', 'Contract-backed activity', 'Wallet nickname length'], answer: 1, note: 'V2Lite unifies profile, Grialo, quiz, wishes, and rank.' },
      { prompt: 'What is the beginner promise of Rialo?', options: ['Real-world apps that feel useful', 'No real-world data ever', 'Only casino wheels'], answer: 0, note: 'Rialo is built for real-world blockchain experiences.' },
    ],
  },
]
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

export default function RialoQuiz() {
  return (
    <ProfileGate>
      {(_, _stats, refetchProfile) => <QuizInner refetchProfile={refetchProfile} />}
    </ProfileGate>
  )
}

function QuizInner({ refetchProfile }: { refetchProfile: () => void }) {
  const { address } = useAccount()
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [message, setMessage] = useState('')

  const statusQuery = useReadContracts({
    contracts: QUIZZES.flatMap((quiz) => [
      {
        address: RIALO_TEMPLE_ADDRESS,
        abi: RIALO_TEMPLE_ABI,
        chainId: ARC_CHAIN.id,
        functionName: 'isQuizCompleted',
        args: [address ?? ZERO_ADDRESS, quiz.id],
      },
      {
        address: RIALO_TEMPLE_ADDRESS,
        abi: RIALO_TEMPLE_ABI,
        chainId: ARC_CHAIN.id,
        functionName: 'quizActive',
        args: [quiz.id],
      },
      {
        address: RIALO_TEMPLE_ADDRESS,
        abi: RIALO_TEMPLE_ABI,
        chainId: ARC_CHAIN.id,
        functionName: 'quizReward',
        args: [quiz.id],
      },
    ]),
    query: { enabled: Boolean(address), refetchInterval: 12000, retry: 1 },
  })

  const statuses = useMemo(() => {
    return QUIZZES.map((quiz, index) => {
      const base = index * 3
      return {
        completed: Boolean(statusQuery.data?.[base]?.result),
        active: statusQuery.data?.[base + 1]?.status === 'success' ? Boolean(statusQuery.data[base + 1].result) : true,
        reward: typeof statusQuery.data?.[base + 2]?.result === 'bigint' ? Number(statusQuery.data[base + 2].result) : quiz.reward,
      }
    })
  }, [statusQuery.data])

  const selected = activeQuiz ? statuses[QUIZZES.findIndex((quiz) => quiz.id === activeQuiz.id)] : null
  const correct = activeQuiz ? activeQuiz.questions.filter((question, index) => answers[index] === question.answer).length : 0
  const passed = activeQuiz ? correct >= Math.ceil(activeQuiz.questions.length * 0.75) : false

  const { data: claimHash, writeContract, isPending, reset } = useWriteContract({
    mutation: {
      onError: (error) => setMessage(friendlyTxError(error.message)),
    },
  })
  const receipt = useWaitForTransactionReceipt({
    hash: claimHash,
    query: { enabled: Boolean(claimHash), refetchOnWindowFocus: false },
  })

  useEffect(() => {
    if (!receipt.isSuccess) return
    const timer = window.setTimeout(() => setMessage('Quiz PTS claimed. The temple ledger updated your mastery.'), 0)
    void statusQuery.refetch()
    refetchProfile()
    reset()
    return () => window.clearTimeout(timer)
  }, [receipt.isSuccess, refetchProfile, reset, statusQuery])

  function answer(questionIndex: number, optionIndex: number) {
    setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))
  }

  function claim() {
    if (!activeQuiz || !passed || selected?.completed) return
    setMessage('Open your wallet to claim quiz PTS.')
    writeContract({
      address: RIALO_TEMPLE_ADDRESS,
      abi: RIALO_TEMPLE_ABI,
      chainId: ARC_CHAIN.id,
      functionName: 'completeQuiz',
      args: [activeQuiz.id],
    })
  }

  function openQuiz(quiz: Quiz) {
    setActiveQuiz(quiz)
    setAnswers({})
    setMessage('')
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6">
      <section className="temple-card spark-field overflow-hidden rounded-lg p-5 sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--temple-gold)]">Rialo Quiz</p>
            <h1 className="arcade-title mt-3 text-5xl font-black leading-none sm:text-7xl">Learn. Pass. Claim.</h1>
            <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-[var(--temple-muted)]">
              Short rune challenges teach Rialo concepts before the contract releases Quiz PTS.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {QUIZZES.map((quiz, index) => (
              <button
                key={quiz.id}
                type="button"
                onClick={() => openQuiz(quiz)}
                className="pixel-panel rounded-lg border border-[var(--temple-border)] p-4 text-left transition hover:-translate-y-1 hover:border-[var(--temple-gold)]/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-[var(--temple-soft)]">Quiz {quiz.id} / {quiz.difficulty}</p>
                    <h2 className="mt-2 text-xl font-black">{quiz.title}</h2>
                    <p className="mt-1 text-xs font-semibold text-[var(--temple-muted)]">{quiz.theme}</p>
                  </div>
                  {statuses[index]?.completed ? <CheckCircle2 className="h-5 w-5 text-[var(--temple-emerald)]" /> : <Sparkles className="h-5 w-5 text-[var(--temple-gold)]" />}
                </div>
                <p className="mt-4 text-sm font-black text-[var(--temple-gold)]">+{statuses[index]?.reward ?? quiz.reward} PTS</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {activeQuiz ? (
          <motion.section
            key={activeQuiz.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="temple-card mt-6 rounded-lg p-5 sm:p-7"
          >
            <button type="button" onClick={() => setActiveQuiz(null)} className="mb-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--temple-muted)] hover:text-[var(--temple-gold)]">
              <ChevronLeft className="h-4 w-4" /> Back to quizzes
            </button>
            <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
              <div className="pixel-panel rounded-lg border border-[var(--temple-border)] p-5">
                <div className={`quiz-mascot ${passed ? 'is-happy' : ''}`}>
                  <span className="quiz-mascot-face"><i /><i /><b /></span>
                  <span className="quiz-mascot-scroll" />
                </div>
                <p className="mt-5 text-xs font-black uppercase tracking-wider text-[var(--temple-soft)]">{activeQuiz.theme}</p>
                <h2 className="mt-2 text-3xl font-black">{activeQuiz.title}</h2>
                <p className="mt-3 text-sm font-semibold text-[var(--temple-muted)]">
                  Score {correct}/{activeQuiz.questions.length}. Pass the rune check, then claim once onchain.
                </p>
                {message ? <p className="mt-4 rounded-lg border border-[var(--temple-border)] bg-white/[0.045] p-3 text-sm font-semibold text-[var(--temple-muted)]">{message}</p> : null}
                <button type="button" onClick={claim} disabled={!passed || selected?.completed || isPending || receipt.isLoading} className="temple-button mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50">
                  {isPending || receipt.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {selected?.completed ? 'Already completed' : passed ? `Claim ${selected?.reward ?? activeQuiz.reward} PTS` : 'Answer correctly to claim'}
                </button>
              </div>
              <div className="space-y-3">
                {activeQuiz.questions.map((question, questionIndex) => (
                  <div key={question.prompt} className="rounded-lg border border-[var(--temple-border)] bg-white/[0.045] p-4">
                    <p className="text-sm font-black">{question.prompt}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {question.options.map((option, optionIndex) => {
                        const selectedOption = answers[questionIndex] === optionIndex
                        const isCorrect = question.answer === optionIndex
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => answer(questionIndex, optionIndex)}
                            className={`rounded-lg border px-3 py-3 text-left text-xs font-black transition ${selectedOption ? isCorrect ? 'border-[var(--temple-emerald)] bg-[var(--temple-emerald)]/15 text-[var(--temple-text)]' : 'border-[var(--temple-red)] bg-red-500/10 text-[var(--temple-text)]' : 'border-[var(--temple-border)] bg-white/[0.035] text-[var(--temple-muted)] hover:bg-white/[0.07]'}`}
                          >
                            {option}
                          </button>
                        )
                      })}
                    </div>
                    {answers[questionIndex] !== undefined ? (
                      <p className="mt-3 flex items-start gap-2 text-xs font-semibold text-[var(--temple-muted)]">
                        {answers[questionIndex] === question.answer ? <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--temple-emerald)]" /> : <XCircle className="h-4 w-4 shrink-0 text-[var(--temple-red)]" />}
                        {question.note}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </main>
  )
}

function friendlyTxError(message: string) {
  if (message.includes('QUIZ_ALREADY_COMPLETED')) return 'You already completed this quiz.'
  if (message.includes('PROFILE_REQUIRED')) return 'Seal your Rialo Passport first.'
  return message.split('\n')[0] || 'Quiz transaction failed.'
}
