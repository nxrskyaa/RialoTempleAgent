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
  kind: PixelCharacterKind
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
  kind: PixelCharacterKind
  x: number
  y: number
  color: string
  accent: string
  line: string
}

type PlayerState = {
  x: number
  y: number
  dir: 'down' | 'up' | 'left' | 'right'
  moving: boolean
}

type PixelCharacterKind =
  | 'builder'
  | 'keeper'
  | 'scout'
  | 'signal'
  | 'professor'
  | 'boba'
  | 'moss'
  | 'bond'
  | 'messenger'
  | 'jade'
  | 'privacy'
  | 'timer'
  | 'orb'

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
    kind: 'builder',
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
    kind: 'keeper',
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
    kind: 'scout',
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
    kind: 'signal',
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
    kind: 'professor',
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
  { name: 'Boba Byte', kind: 'boba', x: 310, y: 880, color: '#ff7ad9', accent: '#f2c866', line: 'Rain makes the data spring louder.' },
  { name: 'Mossy Dex', kind: 'moss', x: 640, y: 630, color: '#57e39f', accent: '#78ecff', line: 'Try walking near a glowing NPC and press E.' },
  { name: 'Peeko Bond', kind: 'bond', x: 870, y: 300, color: '#f2c866', accent: '#ffad72', line: 'RWA vaults like clean verification stamps.' },
  { name: 'Firo Mail', kind: 'messenger', x: 1260, y: 610, color: '#78ecff', accent: '#ff7ad9', line: 'Bridge Gate scrolls carry API messages out and back.' },
  { name: 'Jade Numi', kind: 'jade', x: 1800, y: 570, color: '#b9ff66', accent: '#57e39f', line: 'Temple Energy returns when the daily ritual cools down.' },
  { name: 'Pixel Kora', kind: 'privacy', x: 360, y: 1230, color: '#c886ff', accent: '#f2c866', line: 'Privacy chambers turn plain scrolls into protected ones.' },
  { name: 'Tama Tick', kind: 'timer', x: 1340, y: 1180, color: '#ffad72', accent: '#78ecff', line: 'Signals are tiny real-world updates with big consequences.' },
  { name: 'Orb Nalo', kind: 'orb', x: 1880, y: 1120, color: '#57e39f', accent: '#c886ff', line: 'Every badge is better when the ledger can verify it.' },
  { name: 'Rune Pika', kind: 'scout', x: 520, y: 1010, color: '#ffe36e', accent: '#57e39f', line: 'Quest boards like brave learners.' },
  { name: 'Minty Mox', kind: 'moss', x: 1510, y: 1260, color: '#67ffc0', accent: '#f2c866', line: 'The map gets brighter when badges are claimed.' },
  { name: 'Sera API', kind: 'messenger', x: 1930, y: 290, color: '#88d7ff', accent: '#ff8066', line: 'A response scroll always comes back through Bridge Gate.' },
  { name: 'Candi Dot', kind: 'jade', x: 1130, y: 260, color: '#b9ff66', accent: '#f2c866', line: 'The temple is friendlier when every system can talk.' },
]

export default function TemplePlay() {
  return <TemplePlayInner />
}

function TemplePlayInner() {
  const { address, isConnected } = useAccount()
  const [activeQuest, setActiveQuest] = useState<QuestNpc | null>(null)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [quizDone, setQuizDone] = useState(false)
  const [nearNpcId, setNearNpcId] = useState<number | null>(null)
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
    <main className="temple-play-page">
      <section className="temple-play-shell">
        <div className="temple-play-topbar">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--temple-gold)]">Temple Play</p>
            <h1 className="arcade-title text-3xl font-black sm:text-5xl">Rialo Pixel Quest</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-[var(--temple-muted)]">
              Explore the map, meet pixel NPCs, clear Rialo lessons, then claim badges on Arc Testnet.
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

        <section className="temple-play-questbar" aria-label="Temple Play quest shortcuts">
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
  const player = useRef<PlayerState>({ x: 570, y: 570, dir: 'down', moving: false })
  const nearId = useRef<number | null>(null)
  const completedLatest = useRef(completedIds)

  useEffect(() => {
    completedLatest.current = completedIds
  }, [completedIds])

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

      drawWorld(context, rect.width, rect.height, camera, frame, current, completedLatest.current, nearId.current)
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
  drawPlayer(ctx, player, time)
  drawWeather(ctx, camera, width, height, time)
  ctx.restore()
  drawScanlines(ctx, width, height)
}

function drawGround(ctx: CanvasRenderingContext2D, time: number) {
  ctx.fillStyle = '#2f6f45'
  ctx.fillRect(0, 0, WORLD.width, WORLD.height)
  for (let y = 0; y < WORLD.height; y += 64) {
    for (let x = 0; x < WORLD.width; x += 64) {
      const plaza = (x > 610 && x < 1880 && y > 110 && y < 610) || (x > 760 && x < 1680 && y > 520 && y < 1120)
      const grove = x > 1370 && y > 820
      const spring = x < 690 && y > 860
      const tone = (x / 64 + y / 64) % 4
      ctx.fillStyle = plaza
        ? tone % 2 === 0 ? '#b58b58' : '#c39a65'
        : grove
          ? tone % 2 === 0 ? '#604b86' : '#6c5595'
          : spring
            ? tone % 2 === 0 ? '#2f8c78' : '#327f73'
            : tone === 0 ? '#34784d' : tone === 1 ? '#3b8255' : tone === 2 ? '#317148' : '#3f8959'
      ctx.fillRect(x, y, 64, 64)
      ctx.fillStyle = plaza ? 'rgba(89, 60, 39, .18)' : 'rgba(247, 241, 223, .12)'
      ctx.fillRect(x + 18, y + 18, 6, 6)
      ctx.fillRect(x + 42, y + 38, 5, 5)
      if ((x + y) % 256 === 0) {
        ctx.fillStyle = plaza ? '#8f6d44' : '#7bc66d'
        ctx.fillRect(x + 18, y + 20 + Math.sin(time + x) * 1.5, 6, 18)
        ctx.fillRect(x + 42, y + 36, 5, 14)
      }
      if ((x * 3 + y) % 448 === 0) {
        ctx.fillStyle = plaza ? '#ff7ad9' : '#d576ff'
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
  AMBIENT_NPCS.forEach((npc, index) => drawPixelCritter(ctx, {
    x: npc.x,
    y: npc.y,
    kind: npc.kind,
    primary: npc.color,
    accent: npc.accent,
    name: npc.name,
    time,
    seed: index * 0.67,
    scale: 3.2,
    compactLabel: true,
  }))
  QUESTS.forEach((quest) => {
    const completed = completedIds.has(quest.quizId)
    drawPixelCharacter(ctx, {
      x: quest.x,
      y: quest.y,
      kind: quest.kind,
      primary: quest.color,
      accent: quest.accent,
      name: quest.npc,
      time,
      seed: quest.id * 0.48,
      scale: 3.8,
      near: nearNpcId === quest.id,
      completed,
    })
  })
}

function drawPixelCritter(
  ctx: CanvasRenderingContext2D,
  {
    x,
    y,
    kind,
    primary,
    accent,
    name,
    time,
    seed = 0,
    scale = 3.2,
    compactLabel = true,
  }: {
    x: number
    y: number
    kind: PixelCharacterKind
    primary: string
    accent: string
    name: string
    time: number
    seed?: number
    scale?: number
    compactLabel?: boolean
  },
) {
  const s = scale
  const left = Math.round(x - 8 * s)
  const top = Math.round(y - 20 * s)
  const blink = Math.sin(time * 3.2 + seed) > 0.965
  const wiggle = Math.sin(time * 2 + seed)
  const px = (gx: number, gy: number, gw: number, gh: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect(Math.round(left + gx * s), Math.round(top + gy * s), Math.ceil(gw * s), Math.ceil(gh * s))
  }

  ctx.fillStyle = 'rgba(0,0,0,.3)'
  ctx.fillRect(Math.round(x - 6 * s), Math.round(y - 1 * s), Math.round(12 * s), Math.round(3 * s))

  if (kind === 'boba') {
    px(3, 5, 10, 12, '#07100c')
    px(4, 6, 8, 10, primary)
    px(5, 3, 6, 4, '#07100c')
    px(6, 4, 4, 2, accent)
    px(12, 8 + wiggle * 0.4, 3, 4, '#07100c')
    px(12.6, 8.5 + wiggle * 0.4, 2, 2, accent)
  } else if (kind === 'moss') {
    px(2, 8, 12, 9, '#07100c')
    px(3, 9, 10, 7, primary)
    px(2, 5 + wiggle * 0.4, 4, 4, '#07100c')
    px(3, 6 + wiggle * 0.4, 2, 2, accent)
    px(10, 4 - wiggle * 0.4, 5, 5, '#07100c')
    px(11, 5 - wiggle * 0.4, 3, 3, accent)
  } else if (kind === 'bond') {
    px(3, 6, 10, 10, '#07100c')
    px(4, 7, 8, 8, primary)
    px(2, 4, 4, 4, '#07100c')
    px(10, 4, 4, 4, '#07100c')
    px(3, 5, 2, 2, accent)
    px(11, 5, 2, 2, accent)
    px(12, 12, 3, 2, '#07100c')
  } else if (kind === 'messenger') {
    px(4, 5, 8, 11, '#07100c')
    px(5, 6, 6, 9, primary)
    px(1, 9 + wiggle * 0.5, 4, 4, '#07100c')
    px(11, 9 - wiggle * 0.5, 4, 4, '#07100c')
    px(2, 10 + wiggle * 0.5, 2, 2, accent)
    px(12, 10 - wiggle * 0.5, 2, 2, accent)
    px(6, 3, 4, 2, accent)
  } else if (kind === 'jade') {
    px(3, 7, 10, 10, '#07100c')
    px(4, 8, 8, 8, primary)
    px(7, 3, 2, 5, '#07100c')
    px(6, 2, 2, 3, accent)
    px(9, 2, 2, 3, accent)
  } else if (kind === 'privacy') {
    px(3, 4, 10, 13, '#07100c')
    px(4, 5, 8, 11, primary)
    px(5, 11, 6, 3, accent)
    px(6, 2, 4, 3, '#07100c')
    px(7, 3, 2, 1, accent)
  } else if (kind === 'timer') {
    px(3, 5, 10, 11, '#07100c')
    px(4, 6, 8, 9, primary)
    px(5, 3, 2, 3, '#07100c')
    px(10, 3, 2, 3, '#07100c')
    px(7, 10, 2, 1, accent)
    px(8, 8, 1, 4, '#07100c')
  } else {
    px(3, 6, 10, 10, '#07100c')
    px(4, 7, 8, 8, primary)
    px(6, 2 + wiggle * 0.4, 4, 4, '#07100c')
    px(7, 3 + wiggle * 0.4, 2, 2, accent)
  }

  if (blink) {
    px(5, 10, 2, 0.8, '#07100c')
    px(9, 10, 2, 0.8, '#07100c')
  } else {
    px(5, 9, 2, 2, '#f7f1df')
    px(9, 9, 2, 2, '#f7f1df')
    px(5.5, 9.5, 1, 1, '#07100c')
    px(9.5, 9.5, 1, 1, '#07100c')
  }
  px(7, 13, 2, 0.8, '#07100c')
  drawPixelNameTag(ctx, x, y - 23 * s, name, '#f7f1df', compactLabel)
}

function drawPixelCharacter(
  ctx: CanvasRenderingContext2D,
  {
    x,
    y,
    kind,
    primary,
    accent,
    name,
    time,
    seed = 0,
    scale = 4,
    near = false,
    completed = false,
    moving = false,
    compactLabel = false,
  }: {
    x: number
    y: number
    kind: PixelCharacterKind
    primary: string
    accent: string
    name: string
    time: number
    seed?: number
    scale?: number
    near?: boolean
    completed?: boolean
    moving?: boolean
    compactLabel?: boolean
  },
) {
  const s = scale
  const left = Math.round(x - 9 * s)
  const top = Math.round(y - 27 * s)
  const walk = moving ? Math.floor(time * 9 + seed) % 2 : 0
  const breath = moving ? (walk === 0 ? 0 : -1) : Math.sin(time * 2.2 + seed) > 0.35 ? -0.35 : 0
  const blink = !moving && Math.sin(time * 3.4 + seed) > 0.965
  const wave = Math.sin(time * 2.6 + seed)

  const px = (gx: number, gy: number, gw: number, gh: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect(Math.round(left + gx * s), Math.round(top + gy * s), Math.ceil(gw * s), Math.ceil(gh * s))
  }

  ctx.fillStyle = 'rgba(0,0,0,.34)'
  ctx.fillRect(Math.round(x - 7 * s), Math.round(y - 1 * s), Math.round(14 * s), Math.round(3 * s))

  if (near) {
    ctx.strokeStyle = primary
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(x, y - 13 * s, 15 * s + Math.sin(time * 4) * 3, 0, Math.PI * 2)
    ctx.stroke()
  }

  const bodyY = 14 + breath
  const headY = 4 + breath
  const armLift = kind === 'messenger' || kind === 'scout' ? Math.max(0, wave) : 0

  px(5, 23 + (walk === 0 ? 0 : -1), 3, 3, '#07100c')
  px(10, 23 + (walk === 1 ? 0 : -1), 3, 3, '#07100c')
  px(6, 22 + (walk === 0 ? 0 : -1), 2, 3, primary)
  px(10, 22 + (walk === 1 ? 0 : -1), 2, 3, primary)

  px(4, bodyY, 10, 8, '#07100c')
  px(5, bodyY + 1, 8, 6, primary)
  px(7, bodyY + 1, 4, 2, accent)
  px(6, bodyY + 5, 6, 1, '#f2c866')

  px(2, bodyY + 2 - armLift, 3, 5, '#07100c')
  px(13, bodyY + 2 + armLift * 0.25, 3, 5, '#07100c')
  px(2.6, bodyY + 2.5 - armLift, 2, 3.4, primary)
  px(13.4, bodyY + 2.5 + armLift * 0.25, 2, 3.4, primary)

  if (kind === 'builder') {
    px(1, headY + 3, 3, 5, '#07100c')
    px(14, headY + 3, 3, 5, '#07100c')
    px(1.7, headY + 4, 2, 3, '#f7f1df')
    px(14.3, headY + 4, 2, 3, '#f7f1df')
    px(5, headY - 2, 8, 3, '#07100c')
    px(6, headY - 1, 6, 2, accent)
    px(7, headY - 2.8, 1, 1, '#f2c866')
    px(10, headY - 2.8, 1, 1, '#f2c866')
  } else if (kind === 'keeper') {
    px(2, headY + 1, 3, 4, '#07100c')
    px(13, headY + 1, 3, 4, '#07100c')
    px(2.8, headY + 1.8, 2, 2.5, accent)
    px(13.2, headY + 1.8, 2, 2.5, accent)
    px(6, headY - 1, 6, 2, '#07100c')
    px(7, headY - 0.4, 4, 1.4, accent)
  } else if (kind === 'signal' || kind === 'timer') {
    px(8, headY - 3, 2, 4, '#07100c')
    px(8.5, headY - 4, 1, 1, accent)
    px(5, headY - 1, 8, 2, '#07100c')
    px(6, headY - 0.4, 6, 1.4, accent)
  } else if (kind === 'professor') {
    px(3, headY - 3, 12, 3, '#07100c')
    px(5, headY - 6, 8, 4, '#07100c')
    px(6, headY - 5, 6, 3, accent)
    px(2, bodyY + 6, 14, 2, '#07100c')
    px(3, bodyY + 6, 12, 1, '#f7f1df')
  } else if (kind === 'privacy') {
    px(4, headY - 2, 10, 4, '#07100c')
    px(5, headY - 1, 8, 3, accent)
    px(7, bodyY + 2, 4, 4, '#07100c')
    px(8, bodyY + 3, 2, 2, '#f7f1df')
  } else if (kind === 'orb') {
    px(13, headY - 2 + Math.sin(time * 2 + seed) * 0.45, 3, 3, '#07100c')
    px(13.5, headY - 1.5 + Math.sin(time * 2 + seed) * 0.45, 2, 2, accent)
  } else if (kind === 'bond' || kind === 'jade') {
    px(5, headY - 2, 8, 3, '#07100c')
    px(6, headY - 1.2, 6, 2, accent)
  } else if (kind === 'boba') {
    px(4, headY - 2, 10, 3, '#07100c')
    px(5, headY - 1, 8, 2, accent)
    px(11, headY - 3, 2, 2, '#07100c')
    px(11.5, headY - 2.5, 1, 1, '#f7f1df')
  } else if (kind === 'moss') {
    px(3, headY - 1, 12, 3, '#07100c')
    px(4, headY - 0.2, 3, 2, accent)
    px(8, headY - 0.8, 2, 2, accent)
    px(11, headY - 0.2, 3, 2, accent)
  } else if (kind === 'scout' || kind === 'messenger') {
    px(5, headY - 3, 8, 4, '#07100c')
    px(6, headY - 2.2, 6, 3, accent)
    px(12, headY - 1, 3, 1.5, '#07100c')
  }

  px(3, headY + 2, 12, 11, '#07100c')
  px(4, headY + 3, 10, 9, '#f7d983')
  px(4, headY + 3, 10, 2, primary)

  if (blink) {
    px(6, headY + 7, 2, 0.8, '#07100c')
    px(10, headY + 7, 2, 0.8, '#07100c')
  } else {
    px(6, headY + 6, 2, 2, '#f7f1df')
    px(10, headY + 6, 2, 2, '#f7f1df')
    px(6.5, headY + 6.5, 1, 1, '#07100c')
    px(10.5, headY + 6.5, 1, 1, '#07100c')
  }
  px(7.5, headY + 10, 3, 0.8, '#07100c')

  if (near || completed) {
    px(14.5, bodyY + 1, 2, 2, completed ? '#57e39f' : '#f2c866')
  }

  drawPixelNameTag(ctx, x, y - 31 * s, completed ? `${name} OK` : name, completed ? '#57e39f' : '#f7f1df', compactLabel)
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState, time: number) {
  drawPixelCharacter(ctx, {
    x: player.x,
    y: player.y,
    kind: 'builder',
    primary: '#f2c866',
    accent: '#57e39f',
    name: 'You',
    time,
    scale: 4.45,
    moving: player.moving,
  })
}

function drawPixelNameTag(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string, compact = false) {
  const fontSize = compact ? 11 : 12
  ctx.font = `900 ${fontSize}px monospace`
  const width = Math.ceil(ctx.measureText(text).width) + 16
  ctx.fillStyle = 'rgba(7, 16, 12, .92)'
  ctx.fillRect(Math.round(x - width / 2), Math.round(y), width, compact ? 20 : 22)
  ctx.fillStyle = color
  ctx.fillText(text, Math.round(x - width / 2 + 8), Math.round(y + (compact ? 14 : 16)))
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
