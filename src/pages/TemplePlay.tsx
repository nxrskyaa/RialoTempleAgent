import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, MutableRefObject, PointerEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, CheckCircle2, Gamepad2, Loader2, MapPin, Sparkles, XCircle } from 'lucide-react'
import { useAccount, useReadContract, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { ARC_CHAIN, RIALO_TEMPLE_ABI, RIALO_TEMPLE_ADDRESS } from '@/config/contracts'
import { parseUnifiedUser } from '@/lib/rialo'

type Question = {
  prompt: string
  options: string[]
  answer: number
  note: string
}

type QuestNpc = {
  id: number
  quizId: number
  zone: string
  npc: string
  role: string
  x: number
  y: number
  color: string
  accent: string
  reward: number
  intro: string
  successLine: string
  questions: Question[]
}

type AmbientNpc = {
  name: string
  x: number
  y: number
  color: string
  line: string
}

type PlayerState = {
  x: number
  y: number
  dir: 'down' | 'up' | 'left' | 'right'
  moving: boolean
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const
const WORLD = { width: 2100, height: 1460 }
const PLAYER_SPEED = 245

const QUESTS: QuestNpc[] = [
  {
    id: 1,
    quizId: 1,
    zone: 'Temple Gate',
    npc: 'NXR',
    role: 'Builder Guide',
    x: 420,
    y: 420,
    color: '#f2c866',
    accent: '#57e39f',
    reward: 50,
    intro: 'Welcome to Temple Play. Prove you understand why Rialo is built for real-world apps.',
    successLine: 'You opened the gate. The temple ledger now knows you learned the basics.',
    questions: [
      {
        prompt: 'What is Rialo built for?',
        options: ['Only profile pictures', 'Real-world blockchain apps', 'Offline spreadsheets'],
        answer: 1,
        note: 'Rialo focuses on apps that touch real data, assets, identity, and systems.',
      },
      {
        prompt: 'Why should Temple Play record progress on-chain?',
        options: ['So progress is public and verifiable', 'So the map becomes slower', 'So NPCs disappear forever'],
        answer: 0,
        note: 'Quest completion becomes part of the player passport instead of a local save only.',
      },
      {
        prompt: 'What should permanent XP come from?',
        options: ['Screenshots', 'The contract', 'Browser memory only'],
        answer: 1,
        note: 'The contract is the source of truth for real progression.',
      },
    ],
  },
  {
    id: 2,
    quizId: 2,
    zone: 'RWA Vault',
    npc: 'Vault Keeper Mino',
    role: 'Asset Guardian',
    x: 1450,
    y: 360,
    color: '#ffad72',
    accent: '#f2c866',
    reward: 75,
    intro: 'The vault turns real-world value into useful on-chain records that apps and agents can verify.',
    successLine: 'Vault badge claimed. You can explain why RWA needs live state, not just static tokens.',
    questions: [
      {
        prompt: 'What can an RWA represent?',
        options: ['Only avatars', 'Invoices, houses, bonds, tickets, gold', 'Only game cosmetics'],
        answer: 1,
        note: 'RWA is about representing useful real-world value in programmable infrastructure.',
      },
      {
        prompt: 'Why should RWA react to live updates?',
        options: ['Real assets change status', 'It makes them random', 'It hides all ownership'],
        answer: 0,
        note: 'Invoices get paid, deliveries complete, prices move, and apps need to know.',
      },
      {
        prompt: 'Who benefits from verified asset state?',
        options: ['Only background art', 'Apps, users, and agents', 'Nobody'],
        answer: 1,
        note: 'Verified state lets automated systems make safer decisions.',
      },
    ],
  },
  {
    id: 3,
    quizId: 3,
    zone: 'Agent Camp',
    npc: 'Scout Luma',
    role: 'Agent Coordinator',
    x: 1050,
    y: 790,
    color: '#78ecff',
    accent: '#c886ff',
    reward: 75,
    intro: 'Agents become useful when they can read tasks, coordinate work, verify results, and get paid safely.',
    successLine: 'Agent badge claimed. The camp trusts you with task rails now.',
    questions: [
      {
        prompt: 'What is the safe agent flow?',
        options: ['Request -> Work -> Verify -> Pay', 'Pay -> Guess -> Forget', 'Hide -> Wait -> Panic'],
        answer: 0,
        note: 'The workflow needs terms, work, verification, and settlement.',
      },
      {
        prompt: 'Why use a judge/check step?',
        options: ['To verify quality before payment', 'To decorate the UI', 'To remove all deadlines'],
        answer: 0,
        note: 'A judge helps decide if the agent completed the requested output.',
      },
      {
        prompt: 'Why do agents need rules?',
        options: ['Because they touch real value', 'Because buttons need labels', 'Because maps need trees'],
        answer: 0,
        note: 'Rules protect users before automation handles money, data, or assets.',
      },
    ],
  },
  {
    id: 4,
    quizId: 4,
    zone: 'Signal Tower',
    npc: 'Zap Tiko',
    role: 'Signal Runner',
    x: 1650,
    y: 980,
    color: '#b9ff66',
    accent: '#78ecff',
    reward: 80,
    intro: 'Rialo apps can react to real-world signals like payments, market moves, deliveries, and deadlines.',
    successLine: 'Signal badge claimed. You can read the tower pulses now.',
    questions: [
      {
        prompt: 'What is real-world reactivity?',
        options: ['Apps responding when real events happen', 'Static cards blinking', 'Manual refresh forever'],
        answer: 0,
        note: 'Reactivity means the app can act when outside conditions change.',
      },
      {
        prompt: 'Which event can become a signal?',
        options: ['Delivery completed', 'A random shadow', 'A fake loading spinner'],
        answer: 0,
        note: 'A real status change can trigger useful app behavior.',
      },
      {
        prompt: 'Why does speed matter for real apps?',
        options: ['Users need timely responses', 'It changes the logo', 'It removes identity'],
        answer: 0,
        note: 'Real-world UX feels broken when actions lag too long.',
      },
    ],
  },
  {
    id: 5,
    quizId: 5,
    zone: 'SCALE Lab',
    npc: 'Professor Rune',
    role: 'SCALE Engineer',
    x: 720,
    y: 1080,
    color: '#c886ff',
    accent: '#57e39f',
    reward: 100,
    intro: 'SCALE defines task terms, deadlines, quality checks, and payment release so agent work is safer.',
    successLine: 'SCALE badge claimed. The lab machine approved your reasoning.',
    questions: [
      {
        prompt: 'What does SCALE help define?',
        options: ['Task terms, deadlines, checks, payment', 'Only font size', 'Only profile images'],
        answer: 0,
        note: 'SCALE is a coordination layer for agent labor and verification.',
      },
      {
        prompt: 'When should payment release?',
        options: ['After verified work', 'Before the task exists', 'Never'],
        answer: 0,
        note: 'Verification reduces risk before value moves.',
      },
      {
        prompt: 'What is the final approved action?',
        options: ['A checked result that can settle', 'A random animation', 'A missing deadline'],
        answer: 0,
        note: 'The result should meet terms before it becomes settlement.',
      },
      {
        prompt: 'Why does this matter for AI agents?',
        options: ['Agents need safe rails before real value', 'Agents only need jokes', 'Agents should avoid rules'],
        answer: 0,
        note: 'Autonomous work needs explicit constraints and proof.',
      },
    ],
  },
]

const AMBIENT_NPCS: AmbientNpc[] = [
  { name: 'Boba Byte', x: 310, y: 880, color: '#ff7ad9', line: 'Rain makes the data spring louder.' },
  { name: 'Mossy Dex', x: 640, y: 630, color: '#57e39f', line: 'Try walking near a glowing NPC and press E.' },
  { name: 'Peeko Bond', x: 870, y: 300, color: '#f2c866', line: 'RWA vaults like clean verification stamps.' },
  { name: 'Firo Mail', x: 1260, y: 610, color: '#78ecff', line: 'Bridge Gate scrolls carry API messages out and back.' },
  { name: 'Jade Numi', x: 1800, y: 570, color: '#b9ff66', line: 'Temple Energy returns when the daily ritual cools down.' },
  { name: 'Pixel Kora', x: 360, y: 1230, color: '#c886ff', line: 'Privacy chambers turn plain scrolls into protected ones.' },
  { name: 'Tama Tick', x: 1340, y: 1180, color: '#ffad72', line: 'Signals are tiny real-world updates with big consequences.' },
  { name: 'Orb Nalo', x: 1880, y: 1120, color: '#57e39f', line: 'Every badge is better when the ledger can verify it.' },
]

export default function TemplePlay() {
  return <TemplePlayInner />
}

function TemplePlayInner() {
  const { address, isConnected } = useAccount()
  const [activeQuest, setActiveQuest] = useState<QuestNpc | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [quizDone, setQuizDone] = useState(false)
  const [nearNpcId, setNearNpcId] = useState<number | null>(QUESTS[0].id)
  const [toast, setToast] = useState('')
  const [joystick, setJoystick] = useState({ active: false, x: 0, y: 0 })
  const [claimingQuest, setClaimingQuest] = useState<QuestNpc | null>(null)
  const completedRef = useRef<Set<number>>(new Set())
  const openQuestRef = useRef<(quest: QuestNpc) => void>(() => undefined)
  const joystickVector = useRef({ x: 0, y: 0 })

  const userQuery = useReadContract({
    address: RIALO_TEMPLE_ADDRESS,
    abi: RIALO_TEMPLE_ABI,
    chainId: ARC_CHAIN.id,
    functionName: 'getUser',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
      staleTime: 20_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  })
  const user = useMemo(() => parseUnifiedUser(userQuery.data), [userQuery.data])

  const statusQuery = useReadContracts({
    contracts: QUESTS.flatMap((quest) => [
      {
        address: RIALO_TEMPLE_ADDRESS,
        abi: RIALO_TEMPLE_ABI,
        chainId: ARC_CHAIN.id,
        functionName: 'isQuizCompleted',
        args: [address ?? ZERO_ADDRESS, quest.quizId],
      },
      {
        address: RIALO_TEMPLE_ADDRESS,
        abi: RIALO_TEMPLE_ABI,
        chainId: ARC_CHAIN.id,
        functionName: 'quizReward',
        args: [quest.quizId],
      },
    ]),
    query: { enabled: Boolean(address), refetchInterval: 10_000, retry: 1 },
  })

  const questStatus = useMemo(() => {
    return QUESTS.map((quest, index) => {
      const base = index * 2
      return {
        quizId: quest.quizId,
        completed: Boolean(statusQuery.data?.[base]?.result),
        reward: typeof statusQuery.data?.[base + 1]?.result === 'bigint' ? Number(statusQuery.data[base + 1].result) : quest.reward,
      }
    })
  }, [statusQuery.data])

  const completedIds = useMemo(() => {
    const ids = new Set<number>()
    questStatus.forEach((status) => {
      if (status.completed) ids.add(status.quizId)
    })
    return ids
  }, [questStatus])

  useEffect(() => {
    completedRef.current = completedIds
  }, [completedIds])

  const activeStatus = activeQuest ? questStatus.find((status) => status.quizId === activeQuest.quizId) : undefined
  const answeredCount = activeQuest ? activeQuest.questions.filter((_, index) => answers[index] !== undefined).length : 0
  const correctCount = activeQuest ? activeQuest.questions.filter((question, index) => answers[index] === question.answer).length : 0
  const score = activeQuest ? Math.round((correctCount / activeQuest.questions.length) * 100) : 0
  const passed = Boolean(activeQuest && quizDone && score >= 70)
  const hasCompletedActive = Boolean(activeQuest && completedIds.has(activeQuest.quizId))

  const { data: claimHash, isPending, writeContract, reset } = useWriteContract({
    mutation: {
      onError: (error) => setToast(friendlyPlayError(error.message)),
    },
  })
  const receipt = useWaitForTransactionReceipt({
    hash: claimHash,
    query: { enabled: Boolean(claimHash), refetchOnWindowFocus: false },
  })

  useEffect(() => {
    if (!receipt.isSuccess || !claimingQuest) return

    const reward = activeStatus?.reward ?? claimingQuest.reward
    const timer = window.setTimeout(() => {
      completedRef.current = new Set([...completedRef.current, claimingQuest.quizId])
      setToast(`+${reward} XP gained. ${claimingQuest.zone} badge recorded on Arc.`)
      void statusQuery.refetch()
      void userQuery.refetch()
      setClaimingQuest(null)
      reset()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [activeStatus?.reward, claimingQuest, receipt.isSuccess, reset, statusQuery, userQuery])

  const openQuest = useCallback((quest: QuestNpc) => {
    setActiveQuest(quest)
    setAnswers({})
    setQuizDone(false)
    setToast(quest.intro)
  }, [])

  useEffect(() => {
    openQuestRef.current = openQuest
  }, [openQuest])

  function answer(questionIndex: number, optionIndex: number) {
    if (quizDone) return
    setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))
  }

  function finishQuiz() {
    if (!activeQuest || answeredCount < activeQuest.questions.length) return
    setQuizDone(true)
    setToast(correctCount >= Math.ceil(activeQuest.questions.length * 0.7)
      ? 'Nice. Claim the badge to record this quest on-chain.'
      : 'Close, but the NPC wants you to try the questions again.')
  }

  function retryQuiz() {
    setAnswers({})
    setQuizDone(false)
    setToast(activeQuest?.intro ?? '')
  }

  function claimBadge() {
    if (!activeQuest || !passed || hasCompletedActive) return
    if (!isConnected) {
      setToast('Connect wallet from the navbar before claiming an on-chain badge.')
      return
    }
    if (!user.exists) {
      setToast('Seal your Rialo Passport first, then come back to claim this badge.')
      return
    }
    setClaimingQuest(activeQuest)
    setToast('Open your wallet to claim this Temple Play badge.')
    writeContract({
      address: RIALO_TEMPLE_ADDRESS,
      abi: RIALO_TEMPLE_ABI,
      chainId: ARC_CHAIN.id,
      functionName: 'completeQuiz',
      args: [activeQuest.quizId],
    })
  }

  const nearestQuest = nearNpcId ? QUESTS.find((quest) => quest.id === nearNpcId) : null

  return (
    <main className="temple-play-page mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6">
      <section className="temple-card temple-play-shell overflow-hidden rounded-lg">
        <div className="temple-play-topbar">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--temple-gold)]">Temple Play</p>
            <h1 className="arcade-title text-3xl font-black sm:text-5xl">Pixel Rialo Quest Map</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-[var(--temple-muted)]">
              Walk with WASD, talk to NPCs, answer Rialo lessons, then claim badges on Arc Testnet.
            </p>
          </div>
          <div className="temple-play-passport">
            <span>{user.name || 'Rialo Player'}</span>
            <strong>{user.totalPts} PTS</strong>
            <small>{isConnected ? `${completedIds.size}/${QUESTS.length} badges` : 'connect to claim'}</small>
          </div>
        </div>

        <div className="temple-play-stage">
          <TemplePlayCanvas
            completedIds={completedIds}
            joystickVectorRef={joystickVector}
            onNearQuestChange={setNearNpcId}
            onOpenQuest={(quest) => openQuestRef.current(quest)}
          />

          <div className="temple-play-hud">
            <span><Gamepad2 className="h-4 w-4" /> WASD / Arrow keys</span>
            <span><MapPin className="h-4 w-4" /> Press E near glowing NPC</span>
          </div>

          <div className="temple-play-miniquest">
            <p>{nearestQuest ? 'Nearby guide' : 'Quest radar'}</p>
            <strong>{nearestQuest ? `${nearestQuest.npc} / ${nearestQuest.zone}` : 'Find a glowing NPC'}</strong>
            <button type="button" disabled={!nearestQuest} onClick={() => nearestQuest && openQuest(nearestQuest)}>
              {nearestQuest ? 'Talk' : 'Walk closer'}
            </button>
          </div>

          <Joystick value={joystick} setValue={setJoystick} joystickVectorRef={joystickVector} />
        </div>
      </section>

      <section className="temple-play-questbar">
        {QUESTS.map((quest) => {
          const status = questStatus.find((item) => item.quizId === quest.quizId)
          const completed = completedIds.has(quest.quizId)
          return (
            <button
              key={quest.id}
              type="button"
              onClick={() => openQuest(quest)}
              className={`temple-play-zone-pill ${completed ? 'is-complete' : ''}`}
              style={{ '--quest-color': quest.color } as CSSProperties}
            >
              <span>{quest.zone}</span>
              <strong>{completed ? 'Claimed' : `+${status?.reward ?? quest.reward} XP`}</strong>
            </button>
          )
        })}
      </section>

      <AnimatePresence>
        {activeQuest ? (
          <QuizOverlay
            quest={activeQuest}
            answers={answers}
            answeredCount={answeredCount}
            correctCount={correctCount}
            score={score}
            quizDone={quizDone}
            passed={passed}
            completed={hasCompletedActive}
            reward={activeStatus?.reward ?? activeQuest.reward}
            isPending={isPending || receipt.isLoading}
            onAnswer={answer}
            onClose={() => setActiveQuest(null)}
            onFinish={finishQuiz}
            onRetry={retryQuiz}
            onClaim={claimBadge}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {toast ? (
          <motion.div
            className="temple-play-toast"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
          >
            <Sparkles className="h-4 w-4 text-[var(--temple-gold)]" />
            <span>{toast}</span>
            <button type="button" onClick={() => setToast('')}>OK</button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  )
}

function TemplePlayCanvas({
  completedIds,
  joystickVectorRef,
  onNearQuestChange,
  onOpenQuest,
}: {
  completedIds: Set<number>
  joystickVectorRef: MutableRefObject<{ x: number; y: number }>
  onNearQuestChange: (id: number | null) => void
  onOpenQuest: (quest: QuestNpc) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const keys = useRef(new Set<string>())
  const player = useRef<PlayerState>({ x: 470, y: 500, dir: 'down', moving: false })
  const nearId = useRef<number | null>(null)
  const completedLatest = useRef(completedIds)
  const nxrImage = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    completedLatest.current = completedIds
  }, [completedIds])

  useEffect(() => {
    const image = new Image()
    image.src = '/temple-play/nxr-sprites.png'
    image.onload = () => {
      nxrImage.current = image
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const context = canvas.getContext('2d')
    if (!context) return

    let frame = 0
    let last = performance.now()
    let disposed = false

    function resize() {
      if (!canvas || !wrap) return
      const rect = wrap.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.imageSmoothingEnabled = false
      }
    }

    function keyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase()
      keys.current.add(key)
      if (key === 'e') {
        const quest = QUESTS.find((item) => item.id === nearId.current)
        if (quest) onOpenQuest(quest)
      }
    }

    function keyUp(event: KeyboardEvent) {
      keys.current.delete(event.key.toLowerCase())
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)

    function tick(now: number) {
      if (disposed || !canvas || !context || !wrap) return
      const rect = wrap.getBoundingClientRect()
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      frame += dt

      const input = movementFromInput(keys.current, joystickVectorRef.current)
      const current = player.current
      current.moving = Math.abs(input.x) > 0.01 || Math.abs(input.y) > 0.01
      if (current.moving) {
        current.x = clamp(current.x + input.x * PLAYER_SPEED * dt, 90, WORLD.width - 90)
        current.y = clamp(current.y + input.y * PLAYER_SPEED * dt, 90, WORLD.height - 90)
        if (Math.abs(input.x) > Math.abs(input.y)) current.dir = input.x < 0 ? 'left' : 'right'
        else current.dir = input.y < 0 ? 'up' : 'down'
      }

      const nearest = nearestQuest(current)
      if (nearest?.id !== nearId.current) {
        nearId.current = nearest?.id ?? null
        onNearQuestChange(nearId.current)
      }

      const camera = {
        x: clamp(current.x - rect.width / 2, 0, Math.max(0, WORLD.width - rect.width)),
        y: clamp(current.y - rect.height / 2, 0, Math.max(0, WORLD.height - rect.height)),
      }

      drawWorld(context, rect.width, rect.height, camera, frame, current, completedLatest.current, nxrImage.current, nearId.current)
      window.requestAnimationFrame(tick)
    }

    window.requestAnimationFrame(tick)

    return () => {
      disposed = true
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
    }
  }, [joystickVectorRef, onNearQuestChange, onOpenQuest])

  return (
    <div ref={wrapRef} className="temple-play-canvas-wrap">
      <canvas ref={canvasRef} aria-label="Temple Play pixel art world" />
    </div>
  )
}

function QuizOverlay({
  quest,
  answers,
  answeredCount,
  correctCount,
  score,
  quizDone,
  passed,
  completed,
  reward,
  isPending,
  onAnswer,
  onClose,
  onFinish,
  onRetry,
  onClaim,
}: {
  quest: QuestNpc
  answers: Record<number, number>
  answeredCount: number
  correctCount: number
  score: number
  quizDone: boolean
  passed: boolean
  completed: boolean
  reward: number
  isPending: boolean
  onAnswer: (questionIndex: number, optionIndex: number) => void
  onClose: () => void
  onFinish: () => void
  onRetry: () => void
  onClaim: () => void
}) {
  return (
    <motion.div className="temple-play-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.section
        className="temple-play-quiz-card"
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.97 }}
      >
        <div className="temple-play-quiz-header">
          <div className="temple-play-npc-portrait" style={{ '--npc': quest.color, '--npc-accent': quest.accent } as CSSProperties}>
            <i />
            <b />
            <span />
          </div>
          <div>
            <p>{quest.npc} / {quest.role}</p>
            <h2>{quest.zone}</h2>
            <span>{quest.intro}</span>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>

        <div className="temple-play-quiz-progress">
          <span>{answeredCount}/{quest.questions.length} answered</span>
          <strong>{quizDone ? `${score}% score` : `+${reward} XP badge`}</strong>
        </div>

        <div className="temple-play-question-list">
          {quest.questions.map((question, questionIndex) => (
            <div key={question.prompt} className="temple-play-question-card">
              <p>{question.prompt}</p>
              <div>
                {question.options.map((option, optionIndex) => {
                  const selected = answers[questionIndex] === optionIndex
                  const correct = question.answer === optionIndex
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onAnswer(questionIndex, optionIndex)}
                      className={selected ? (correct ? 'is-correct' : 'is-wrong') : ''}
                    >
                      {selected ? correct ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" /> : <span />}
                      {option}
                    </button>
                  )
                })}
              </div>
              {answers[questionIndex] !== undefined ? <small>{question.note}</small> : null}
            </div>
          ))}
        </div>

        <div className="temple-play-quiz-actions">
          <div>
            <span>Correct answers</span>
            <strong>{correctCount}/{quest.questions.length}</strong>
          </div>
          {!quizDone ? (
            <button type="button" onClick={onFinish} disabled={answeredCount < quest.questions.length}>
              Finish Quiz
            </button>
          ) : completed ? (
            <button type="button" disabled className="is-complete">
              <Award className="h-4 w-4" /> Badge already claimed
            </button>
          ) : passed ? (
            <button type="button" onClick={onClaim} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
              {isPending ? 'Confirming on Arc' : `Claim Badge +${reward} XP`}
            </button>
          ) : (
            <button type="button" onClick={onRetry}>Try Again</button>
          )}
        </div>
      </motion.section>
    </motion.div>
  )
}

function Joystick({
  value,
  setValue,
  joystickVectorRef,
}: {
  value: { active: boolean; x: number; y: number }
  setValue: (value: { active: boolean; x: number; y: number }) => void
  joystickVectorRef: MutableRefObject<{ x: number; y: number }>
}) {
  const baseRef = useRef<HTMLDivElement | null>(null)

  function update(pointer: PointerEvent<HTMLDivElement>) {
    const rect = baseRef.current?.getBoundingClientRect()
    if (!rect) return
    const dx = pointer.clientX - (rect.left + rect.width / 2)
    const dy = pointer.clientY - (rect.top + rect.height / 2)
    const length = Math.hypot(dx, dy) || 1
    const max = rect.width * 0.34
    const x = (dx / Math.max(max, length)) * Math.min(length, max)
    const y = (dy / Math.max(max, length)) * Math.min(length, max)
    const normalized = length > 10 ? { x: dx / length, y: dy / length } : { x: 0, y: 0 }
    joystickVectorRef.current = normalized
    setValue({ active: true, x, y })
  }

  function release() {
    joystickVectorRef.current = { x: 0, y: 0 }
    setValue({ active: false, x: 0, y: 0 })
  }

  return (
    <div
      ref={baseRef}
      className="temple-play-joystick"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        update(event)
      }}
      onPointerMove={(event) => {
        if (value.active) update(event)
      }}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <span style={{ transform: `translate(${value.x}px, ${value.y}px)` }} />
    </div>
  )
}

function movementFromInput(keys: Set<string>, joystick: { x: number; y: number }) {
  let x = joystick.x
  let y = joystick.y
  if (keys.has('a') || keys.has('arrowleft')) x -= 1
  if (keys.has('d') || keys.has('arrowright')) x += 1
  if (keys.has('w') || keys.has('arrowup')) y -= 1
  if (keys.has('s') || keys.has('arrowdown')) y += 1
  const length = Math.hypot(x, y)
  return length > 0 ? { x: x / length, y: y / length } : { x: 0, y: 0 }
}

function nearestQuest(player: PlayerState) {
  let nearest: QuestNpc | null = null
  let distance = Number.POSITIVE_INFINITY
  for (const quest of QUESTS) {
    const current = Math.hypot(player.x - quest.x, player.y - quest.y)
    if (current < distance) {
      nearest = quest
      distance = current
    }
  }
  return distance < 118 ? nearest : null
}

function drawWorld(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  camera: { x: number; y: number },
  time: number,
  player: PlayerState,
  completedIds: Set<number>,
  nxr: HTMLImageElement | null,
  nearNpcId: number | null,
) {
  ctx.clearRect(0, 0, width, height)
  ctx.save()
  ctx.translate(-camera.x, -camera.y)
  drawGround(ctx, time)
  drawPaths(ctx, time)
  drawWater(ctx, time)
  drawBuildings(ctx, time, completedIds)
  drawTrees(ctx, time)
  drawNpcLayer(ctx, time, completedIds, nearNpcId)
  drawPlayer(ctx, player, time, nxr)
  drawWeather(ctx, camera, width, height, time)
  ctx.restore()
  drawScanlines(ctx, width, height)
}

function drawGround(ctx: CanvasRenderingContext2D, time: number) {
  ctx.fillStyle = '#28442f'
  ctx.fillRect(0, 0, WORLD.width, WORLD.height)
  for (let y = 0; y < WORLD.height; y += 64) {
    for (let x = 0; x < WORLD.width; x += 64) {
      const tone = (x / 64 + y / 64) % 3
      ctx.fillStyle = tone === 0 ? '#2f4b35' : tone === 1 ? '#314f39' : '#294530'
      ctx.fillRect(x, y, 64, 64)
      if ((x + y) % 256 === 0) {
        ctx.fillStyle = '#6d8350'
        ctx.fillRect(x + 18, y + 20 + Math.sin(time + x) * 2, 6, 18)
        ctx.fillRect(x + 42, y + 36, 5, 14)
      }
      if ((x * 3 + y) % 448 === 0) {
        ctx.fillStyle = '#b66ce8'
        ctx.fillRect(x + 12, y + 11, 11, 11)
        ctx.fillStyle = '#dbc9d7'
        ctx.fillRect(x + 44, y + 42, 12, 10)
      }
    }
  }
}

function drawPaths(ctx: CanvasRenderingContext2D, time: number) {
  ctx.fillStyle = '#705746'
  drawPixelPath(ctx, [[270, 510], [520, 510], [780, 780], [1090, 790], [1450, 360], [1710, 980]])
  drawPixelPath(ctx, [[780, 780], [720, 1080], [360, 1230]])
  drawPixelPath(ctx, [[420, 420], [870, 300], [1260, 610], [1800, 570]])
  ctx.strokeStyle = `rgba(242, 200, 102, ${0.24 + Math.sin(time * 2) * 0.08})`
  ctx.lineWidth = 5
  ctx.setLineDash([18, 20])
  ctx.beginPath()
  ctx.moveTo(420, 420)
  ctx.lineTo(1450, 360)
  ctx.lineTo(1650, 980)
  ctx.lineTo(720, 1080)
  ctx.stroke()
  ctx.setLineDash([])
}

function drawPixelPath(ctx: CanvasRenderingContext2D, points: Array<[number, number]>) {
  ctx.lineWidth = 58
  ctx.lineCap = 'square'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#80624b'
  ctx.beginPath()
  points.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
  ctx.stroke()
  ctx.lineWidth = 40
  ctx.strokeStyle = '#997455'
  ctx.stroke()
}

function drawWater(ctx: CanvasRenderingContext2D, time: number) {
  ctx.fillStyle = '#263d68'
  ctx.fillRect(1120, 750, 360, 245)
  ctx.strokeStyle = '#7aa0c9'
  ctx.lineWidth = 8
  ctx.strokeRect(1120, 750, 360, 245)
  for (let i = 0; i < 12; i++) {
    const x = 1150 + (i * 47) % 310
    const y = 790 + (i * 31) % 170
    ctx.fillStyle = i % 3 === 0 ? '#b985d8' : '#4c6d55'
    ctx.fillRect(x + Math.sin(time * 1.3 + i) * 5, y, 34, 10)
    ctx.fillStyle = '#f2c866'
    ctx.fillRect(x + 10, y - 7, 10, 7)
  }
}

function drawBuildings(ctx: CanvasRenderingContext2D, time: number, completedIds: Set<number>) {
  drawTempleBuilding(ctx, 250, 260, 270, 190, '#87674d', '#f2c866', 'Gate')
  drawTempleBuilding(ctx, 1320, 180, 300, 230, '#685149', '#f2c866', 'RWA Vault')
  drawTempleBuilding(ctx, 910, 650, 310, 220, '#4c5d65', '#78ecff', 'Agent Camp')
  drawTempleBuilding(ctx, 1525, 820, 260, 260, '#493b64', '#b9ff66', 'Signal Tower')
  drawTempleBuilding(ctx, 585, 920, 300, 220, '#4b3d65', '#c886ff', 'SCALE Lab')
  drawTempleBuilding(ctx, 1170, 470, 270, 160, '#3e605a', '#57e39f', 'Bridge Gate')
  drawTempleBuilding(ctx, 170, 1030, 230, 170, '#455d45', '#ff7ad9', 'Privacy Grove')

  QUESTS.forEach((quest) => {
    if (!completedIds.has(quest.quizId)) return
    ctx.save()
    ctx.translate(quest.x, quest.y - 78)
    ctx.rotate(Math.sin(time * 2.5 + quest.id) * 0.06)
    ctx.fillStyle = quest.color
    ctx.strokeStyle = '#07100c'
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(0, -22)
    ctx.lineTo(18, 0)
    ctx.lineTo(0, 22)
    ctx.lineTo(-18, 0)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#07100c'
    ctx.fillRect(-8, -3, 16, 6)
    ctx.restore()
  })
}

function drawTempleBuilding(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, wall: string, glow: string, label: string) {
  ctx.fillStyle = 'rgba(0,0,0,.25)'
  ctx.fillRect(x + 18, y + h - 16, w, 34)
  ctx.fillStyle = wall
  ctx.fillRect(x, y + 52, w, h - 52)
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.moveTo(x + w / 2, y)
  ctx.lineTo(x + w + 18, y + 64)
  ctx.lineTo(x - 18, y + 64)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#07100c'
  ctx.lineWidth = 6
  ctx.stroke()
  ctx.fillStyle = '#161611'
  ctx.fillRect(x + w / 2 - 30, y + h - 74, 60, 74)
  ctx.fillStyle = 'rgba(247,241,223,.8)'
  for (let i = 0; i < 5; i++) ctx.fillRect(x + 26 + i * 48, y + 92, 20, 28)
  ctx.fillStyle = '#07100c'
  ctx.fillRect(x + 18, y + h + 14, Math.max(116, label.length * 12), 34)
  ctx.fillStyle = glow
  ctx.font = '900 18px monospace'
  ctx.fillText(label, x + 30, y + h + 38)
}

function drawTrees(ctx: CanvasRenderingContext2D, time: number) {
  for (let i = 0; i < 52; i++) {
    const x = 90 + ((i * 257) % (WORLD.width - 180))
    const y = 120 + ((i * 181) % (WORLD.height - 240))
    if (x > 1050 && x < 1540 && y > 700 && y < 1040) continue
    const sway = Math.sin(time * 1.4 + i) * 3
    ctx.fillStyle = '#4b3427'
    ctx.fillRect(x + 10, y + 28, 16, 32)
    ctx.fillStyle = i % 4 === 0 ? '#57e39f' : '#3d724b'
    ctx.fillRect(x + sway, y + 6, 36, 32)
    ctx.fillRect(x + 7 + sway, y - 7, 24, 27)
    ctx.fillStyle = '#2b4f35'
    ctx.fillRect(x + 4 + sway, y + 23, 28, 14)
  }
}

function drawNpcLayer(ctx: CanvasRenderingContext2D, time: number, completedIds: Set<number>, nearNpcId: number | null) {
  AMBIENT_NPCS.forEach((npc, index) => drawMonsterNpc(ctx, npc.x, npc.y, npc.color, time + index, npc.name, false, false))
  QUESTS.forEach((quest) => {
    const completed = completedIds.has(quest.quizId)
    drawMonsterNpc(ctx, quest.x, quest.y, quest.color, time + quest.id, quest.npc, nearNpcId === quest.id, completed, quest.accent)
  })
}

function drawMonsterNpc(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, time: number, name: string, near: boolean, completed: boolean, accent = '#f2c866') {
  const bob = Math.sin(time * 3) * 4
  ctx.fillStyle = 'rgba(0,0,0,.32)'
  ctx.fillRect(x - 28, y + 37, 56, 13)
  if (near) {
    ctx.strokeStyle = color
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(x, y + 10, 58 + Math.sin(time * 5) * 4, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.fillStyle = color
  ctx.strokeStyle = '#07100c'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.roundRect(x - 30, y - 40 + bob, 60, 76, 18)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = accent
  ctx.fillRect(x - 20, y - 58 + bob, 40, 20)
  ctx.strokeRect(x - 20, y - 58 + bob, 40, 20)
  ctx.fillStyle = '#f7f1df'
  ctx.fillRect(x - 16, y - 18 + bob, 10, 12)
  ctx.fillRect(x + 6, y - 18 + bob, 10, 12)
  if (Math.sin(time * 6) > 0.94) {
    ctx.fillStyle = '#07100c'
    ctx.fillRect(x - 16, y - 13 + bob, 10, 3)
    ctx.fillRect(x + 6, y - 13 + bob, 10, 3)
  } else {
    ctx.fillStyle = '#07100c'
    ctx.fillRect(x - 13, y - 16 + bob, 4, 6)
    ctx.fillRect(x + 9, y - 16 + bob, 4, 6)
  }
  ctx.fillRect(x - 8, y + 7 + bob, 16, 5)
  ctx.fillStyle = completed ? '#57e39f' : 'rgba(7,16,12,.9)'
  ctx.fillRect(x - 52, y - 86 + bob, Math.max(74, name.length * 9), 24)
  ctx.fillStyle = completed ? '#07100c' : '#f7f1df'
  ctx.font = '900 12px monospace'
  ctx.fillText(completed ? `${name} ✓` : name, x - 44, y - 69 + bob)
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState, time: number, nxr: HTMLImageElement | null) {
  ctx.fillStyle = 'rgba(0,0,0,.34)'
  ctx.fillRect(player.x - 32, player.y + 42, 64, 16)
  if (!nxr) {
    drawMonsterNpc(ctx, player.x, player.y, '#f2c866', time, 'NXR', false, false, '#57e39f')
    return
  }

  const frame = player.moving ? Math.floor(time * 8) % 4 + 1 : Math.floor(time * 1.8) % 2 === 0 ? 0 : 6
  const cols = 4
  const rows = 2
  const frameW = nxr.width / cols
  const frameH = nxr.height / rows
  const sx = (frame % cols) * frameW
  const sy = Math.floor(frame / cols) * frameH
  const scale = player.dir === 'up' ? 0.5 : 0.56
  const dw = frameW * scale
  const dh = frameH * scale
  ctx.save()
  if (player.dir === 'left') {
    ctx.translate(player.x + dw / 2, player.y - dh / 2)
    ctx.scale(-1, 1)
    ctx.drawImage(nxr, sx, sy, frameW, frameH, 0, 0, dw, dh)
  } else {
    ctx.drawImage(nxr, sx, sy, frameW, frameH, player.x - dw / 2, player.y - dh / 2, dw, dh)
  }
  ctx.restore()
}

function drawWeather(ctx: CanvasRenderingContext2D, camera: { x: number; y: number }, width: number, height: number, time: number) {
  ctx.save()
  ctx.translate(camera.x, camera.y)
  for (let i = 0; i < 16; i++) {
    const x = ((i * 190 + time * 22) % (width + 260)) - 150
    const y = 30 + (i * 47) % Math.max(120, height * 0.46)
    ctx.fillStyle = 'rgba(247,241,223,.16)'
    ctx.fillRect(x, y, 96, 18)
    ctx.fillRect(x + 24, y - 12, 58, 18)
  }
  ctx.strokeStyle = 'rgba(210,232,255,.28)'
  ctx.lineWidth = 2
  for (let i = 0; i < 54; i++) {
    const x = (i * 73 + time * 230) % (width + 80)
    const y = (i * 97 + time * 350) % (height + 160)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - 12, y + 32)
    ctx.stroke()
  }
  ctx.restore()
}

function drawScanlines(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = 'rgba(0,0,0,.08)'
  for (let y = 0; y < height; y += 4) ctx.fillRect(0, y, width, 1)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function friendlyPlayError(message: string) {
  if (message.includes('QUIZ_ALREADY_COMPLETED')) return 'This badge was already claimed.'
  if (message.includes('PROFILE_REQUIRED')) return 'Seal your Rialo Passport first.'
  if (message.includes('QUIZ_NOT_ACTIVE')) return 'This quest badge is not active on the contract yet.'
  return message.split('\n')[0] || 'Temple Play transaction failed.'
}
