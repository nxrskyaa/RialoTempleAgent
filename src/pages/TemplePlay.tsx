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
  sprite: SpriteKey
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
  sprite: SpriteKey
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

type SpriteKey =
  | 'nxr'
  | 'npcOracle'
  | 'npcForestGuide'
  | 'npcBuilder'
  | 'npcCaptain'
  | 'npcNavigator'
  | 'npcShadowAgent'
  | 'npcSage'
  | 'npcHerbalist'
  | 'npcAlchemist'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const
const WORLD = { width: 3400, height: 2050 }
const PLAYER_SPEED = 245
const DESKTOP_CAMERA_ZOOM = 0.42
const TABLET_CAMERA_ZOOM = 0.44
const MOBILE_CAMERA_ZOOM = 0.38

type SpriteSheet = {
  src: string
  frameW: number
  frameH: number
  frames: number
  drawW: number
  drawH: number
}

type TemplePlayAssets = {
  sprites: Record<SpriteKey, HTMLImageElement>
  props: Record<PropKey, HTMLImageElement>
  loaded: boolean
}

type PropKey =
  | 'balineseTemple'
  | 'guardianStatue'
  | 'gardenTile'
  | 'soilTile'
  | 'soilCross'
  | 'vineCornerA'
  | 'vineCornerB'
  | 'vineCornerC'
  | 'leafPlant'
  | 'pepperPlant'
  | 'pepperCluster'
  | 'sunflower'
  | 'smallPepper'
  | 'buildingMarketHall'
  | 'buildingWoodenCabin'
  | 'buildingOracleHouse'
  | 'buildingGuildHouse'
  | 'buildingTempleLodge'
  | 'buildingStoneVault'
  | 'buildingScaleDojo'
  | 'buildingGreenhouseInn'
  | 'buildingOrangeCottage'

const SPRITES: Record<SpriteKey, SpriteSheet> = {
  nxr: { src: '/temple-play/sprites/nxr-v2.png', frameW: 210, frameH: 280, frames: 16, drawW: 70, drawH: 94 },
  npcOracle: { src: '/temple-play/sprites/npc-oracle.png', frameW: 160, frameH: 220, frames: 4, drawW: 62, drawH: 86 },
  npcForestGuide: { src: '/temple-play/sprites/npc-forest-guide.png', frameW: 160, frameH: 220, frames: 4, drawW: 62, drawH: 86 },
  npcBuilder: { src: '/temple-play/sprites/npc-builder.png', frameW: 160, frameH: 220, frames: 4, drawW: 62, drawH: 86 },
  npcCaptain: { src: '/temple-play/sprites/npc-captain.png', frameW: 160, frameH: 220, frames: 4, drawW: 62, drawH: 86 },
  npcNavigator: { src: '/temple-play/sprites/npc-navigator.png', frameW: 160, frameH: 220, frames: 4, drawW: 62, drawH: 86 },
  npcShadowAgent: { src: '/temple-play/sprites/npc-shadow-agent.png', frameW: 160, frameH: 220, frames: 4, drawW: 62, drawH: 86 },
  npcSage: { src: '/temple-play/sprites/npc-sage.png', frameW: 160, frameH: 220, frames: 4, drawW: 62, drawH: 86 },
  npcHerbalist: { src: '/temple-play/sprites/npc-herbalist.png', frameW: 160, frameH: 220, frames: 4, drawW: 62, drawH: 86 },
  npcAlchemist: { src: '/temple-play/sprites/npc-alchemist.png', frameW: 160, frameH: 220, frames: 4, drawW: 62, drawH: 86 },
}

const PROPS: Record<PropKey, string> = {
  balineseTemple: '/temple-play/sprites/balinese-temple.png',
  guardianStatue: '/temple-play/sprites/guardian-statue.png',
  gardenTile: '/temple-play/sprites/garden-tile.png',
  soilTile: '/temple-play/sprites/soil-tile.png',
  soilCross: '/temple-play/sprites/soil-cross.png',
  vineCornerA: '/temple-play/sprites/vine-corner-a.png',
  vineCornerB: '/temple-play/sprites/vine-corner-b.png',
  vineCornerC: '/temple-play/sprites/vine-corner-c.png',
  leafPlant: '/temple-play/sprites/leaf-plant.png',
  pepperPlant: '/temple-play/sprites/pepper-plant.png',
  pepperCluster: '/temple-play/sprites/pepper-cluster.png',
  sunflower: '/temple-play/sprites/sunflower.png',
  smallPepper: '/temple-play/sprites/small-pepper.png',
  buildingMarketHall: '/temple-play/buildings/market-hall.png',
  buildingWoodenCabin: '/temple-play/buildings/wooden-cabin.png',
  buildingOracleHouse: '/temple-play/buildings/oracle-house.png',
  buildingGuildHouse: '/temple-play/buildings/guild-house.png',
  buildingTempleLodge: '/temple-play/buildings/temple-lodge.png',
  buildingStoneVault: '/temple-play/buildings/stone-vault.png',
  buildingScaleDojo: '/temple-play/buildings/scale-dojo.png',
  buildingGreenhouseInn: '/temple-play/buildings/greenhouse-inn.png',
  buildingOrangeCottage: '/temple-play/buildings/orange-cottage.png',
}

const QUESTS: QuestNpc[] = [
  {
    id: 1,
    quizId: 1,
    zone: 'Temple Gate',
    npc: 'NXR',
    role: 'Builder Guide',
    sprite: 'nxr',
    x: 520,
    y: 600,
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
    sprite: 'npcHerbalist',
    x: 2170,
    y: 650,
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
    sprite: 'npcShadowAgent',
    x: 1320,
    y: 1480,
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
    sprite: 'npcNavigator',
    x: 2320,
    y: 1520,
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
    sprite: 'npcAlchemist',
    x: 720,
    y: 1770,
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
  { name: 'Boba Byte', sprite: 'npcSage', x: 300, y: 1040, color: '#ff7ad9', accent: '#f2c866', line: 'Rain makes the data spring louder.' },
  { name: 'Mossy Dex', sprite: 'npcForestGuide', x: 690, y: 700, color: '#57e39f', accent: '#78ecff', line: 'Try walking near a glowing NPC and press E.' },
  { name: 'Peeko Bond', sprite: 'npcHerbalist', x: 1160, y: 430, color: '#f2c866', accent: '#ffad72', line: 'RWA vaults like clean verification stamps.' },
  { name: 'Firo Mail', sprite: 'npcCaptain', x: 1560, y: 650, color: '#78ecff', accent: '#ff7ad9', line: 'Bridge Gate scrolls carry API messages out and back.' },
  { name: 'Jade Numi', sprite: 'npcAlchemist', x: 2490, y: 620, color: '#b9ff66', accent: '#57e39f', line: 'Temple Energy returns when the daily ritual cools down.' },
  { name: 'Pixel Kora', sprite: 'npcOracle', x: 360, y: 1700, color: '#c886ff', accent: '#f2c866', line: 'Privacy chambers turn plain scrolls into protected ones.' },
  { name: 'Tama Tick', sprite: 'npcNavigator', x: 1640, y: 1360, color: '#ffad72', accent: '#78ecff', line: 'Signals are tiny real-world updates with big consequences.' },
  { name: 'Orb Nalo', sprite: 'npcBuilder', x: 2460, y: 1600, color: '#57e39f', accent: '#c886ff', line: 'Every badge is better when the ledger can verify it.' },
  { name: 'Rune Pika', sprite: 'npcShadowAgent', x: 920, y: 1270, color: '#ffe36e', accent: '#57e39f', line: 'Quest boards like brave learners.' },
  { name: 'Minty Mox', sprite: 'npcSage', x: 1900, y: 1690, color: '#67ffc0', accent: '#f2c866', line: 'The map gets brighter when badges are claimed.' },
  { name: 'Sera API', sprite: 'npcCaptain', x: 2470, y: 280, color: '#88d7ff', accent: '#ff8066', line: 'A response scroll always comes back through Bridge Gate.' },
  { name: 'Candi Dot', sprite: 'npcForestGuide', x: 1500, y: 290, color: '#b9ff66', accent: '#f2c866', line: 'The temple is friendlier when every system can talk.' },
]

const BUILDING_COLLIDERS = [
  { x: 230, y: 220, w: 300, h: 300 },
  { x: 1160, y: 300, w: 330, h: 310 },
  { x: 1940, y: 250, w: 370, h: 360 },
  { x: 1000, y: 1010, w: 440, h: 390 },
  { x: 2130, y: 1060, w: 360, h: 390 },
  { x: 470, y: 1260, w: 390, h: 380 },
  { x: 120, y: 1410, w: 360, h: 330 },
  { x: 1570, y: 1510, w: 280, h: 230 },
  { x: 2420, y: 1620, w: 270, h: 230 },
  { x: 2880, y: 700, w: 330, h: 310 },
  { x: 3040, y: 1350, w: 280, h: 260 },
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
    playTempleSfx('talk')
    setActiveQuest(quest)
    setAnswers({})
    setQuizDone(false)
    setToast('')
  }, [])

  useEffect(() => {
    openQuestRef.current = openQuest
  }, [openQuest])

  function answer(questionIndex: number, optionIndex: number) {
    if (quizDone) return
    const correct = activeQuest?.questions[questionIndex]?.answer === optionIndex
    playTempleSfx(correct ? 'correct' : 'wrong')
    setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))
  }

  function finishQuiz() {
    if (!activeQuest || answeredCount < activeQuest.questions.length) return
    playTempleSfx(correctCount >= Math.ceil(activeQuest.questions.length * 0.7) ? 'success' : 'wrong')
    setQuizDone(true)
    setToast(correctCount >= Math.ceil(activeQuest.questions.length * 0.7)
      ? 'Nice. Claim the badge to record this quest on-chain.'
      : 'Close, but the NPC wants you to try the questions again.')
  }

  function retryQuiz() {
    setAnswers({})
    setQuizDone(false)
    setToast('')
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
    playTempleSfx('claim')
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
      <section className={`temple-play-shell ${activeQuest ? 'is-dialog-open' : ''}`}>
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
            <span><Gamepad2 className="h-4 w-4" /> Click / tap map to move</span>
            <span><Gamepad2 className="h-4 w-4" /> WASD optional</span>
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
        </div>

      </section>

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
  const assetsRef = useRef<TemplePlayAssets | null>(null)
  const tapTarget = useRef<{ x: number; y: number } | null>(null)
  const cameraRef = useRef({ x: 0, y: 0, zoom: DESKTOP_CAMERA_ZOOM })

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
        if (quest) {
          playTempleSfx('talk')
          onOpenQuest(quest)
        }
      }
    }

    function keyUp(event: KeyboardEvent) {
      keys.current.delete(event.key.toLowerCase())
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)

    void loadTemplePlayAssets().then((assets) => {
      if (disposed) return
      assetsRef.current = assets
    })

    function tick(now: number) {
      if (disposed || !canvas || !context || !wrap) return
      const rect = wrap.getBoundingClientRect()
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      frame += dt

      const assets = assetsRef.current
      if (!assets) {
        drawAssetLoading(context, rect.width, rect.height, frame)
        window.requestAnimationFrame(tick)
        return
      }

      let input = movementFromInput(keys.current, joystickVectorRef.current)
      const current = player.current
      const hasManualInput = Math.abs(input.x) > 0.01 || Math.abs(input.y) > 0.01
      if (hasManualInput) {
        tapTarget.current = null
      } else if (tapTarget.current) {
        const dx = tapTarget.current.x - current.x
        const dy = tapTarget.current.y - current.y
        const distance = Math.hypot(dx, dy)
        if (distance < 10) {
          tapTarget.current = null
          input = { x: 0, y: 0 }
        } else {
          input = { x: dx / distance, y: dy / distance }
        }
      }
      current.moving = Math.abs(input.x) > 0.01 || Math.abs(input.y) > 0.01
      if (current.moving) {
        const nextX = clamp(current.x + input.x * PLAYER_SPEED * dt, 90, WORLD.width - 90)
        const nextY = clamp(current.y + input.y * PLAYER_SPEED * dt, 90, WORLD.height - 90)
        if (!isMovementBlocked(nextX, current.y)) {
          current.x = nextX
        } else {
          tapTarget.current = null
        }
        if (!isMovementBlocked(current.x, nextY)) {
          current.y = nextY
        } else {
          tapTarget.current = null
        }
        if (Math.abs(input.x) > Math.abs(input.y)) current.dir = input.x < 0 ? 'left' : 'right'
        else current.dir = input.y < 0 ? 'up' : 'down'
      }

      const nearest = nearestQuest(current)
      if (nearest?.id !== nearId.current) {
        nearId.current = nearest?.id ?? null
        onNearQuestChange(nearId.current)
      }

      const zoom = cameraZoom(rect.width)
      const viewport = { width: rect.width / zoom, height: rect.height / zoom }
      const camera = {
        x: clamp(current.x - viewport.width / 2, 0, Math.max(0, WORLD.width - viewport.width)),
        y: clamp(current.y - viewport.height / 2, 0, Math.max(0, WORLD.height - viewport.height)),
      }
      cameraRef.current = { ...camera, zoom }

      drawWorld(context, rect.width, rect.height, viewport.width, viewport.height, camera, zoom, frame, current, completedLatest.current, nearId.current, assets, tapTarget.current)
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
      <canvas
        ref={canvasRef}
        aria-label="Temple Play pixel art world"
        onPointerDown={(event) => {
          if (event.button !== 0) return
          const rect = event.currentTarget.getBoundingClientRect()
          const camera = cameraRef.current
          const target = {
            x: clamp((event.clientX - rect.left) / camera.zoom + camera.x, 90, WORLD.width - 90),
            y: clamp((event.clientY - rect.top) / camera.zoom + camera.y, 90, WORLD.height - 90),
          }
          tapTarget.current = isMovementBlocked(target.x, target.y) ? null : target
          playTempleSfx('tap')
        }}
      />
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
  const portrait = SPRITES[quest.sprite]
  const portraitFrame = portrait.frames > 6 ? 6 : 0
  const currentQuestionIndex = Math.min(answeredCount, quest.questions.length - 1)
  const currentQuestion = quest.questions[currentQuestionIndex]
  const selectedAnswer = answers[currentQuestionIndex]

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
            <span
              className="temple-play-npc-sprite"
              style={{
                backgroundImage: `url(${portrait.src})`,
                backgroundSize: `${portrait.frames * 100}% 100%`,
                backgroundPosition: portrait.frames > 1 ? `${(portraitFrame / (portrait.frames - 1)) * 100}% 0` : '0 0',
              }}
            />
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
          <div className="temple-play-question-card">
            <p>{currentQuestion.prompt}</p>
            <div>
              {currentQuestion.options.map((option, optionIndex) => {
                const selected = selectedAnswer === optionIndex
                const correct = currentQuestion.answer === optionIndex
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => onAnswer(currentQuestionIndex, optionIndex)}
                    className={selected ? (correct ? 'is-correct' : 'is-wrong') : ''}
                  >
                    {selected ? correct ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" /> : <span />}
                    {option}
                  </button>
                )
              })}
            </div>
            {selectedAnswer !== undefined ? <small>{currentQuestion.note}</small> : null}
          </div>
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

async function loadTemplePlayAssets(): Promise<TemplePlayAssets> {
  const spriteEntries = await Promise.all(
    Object.entries(SPRITES).map(async ([key, sheet]) => [key, await loadImage(sheet.src)] as const),
  )
  const propEntries = await Promise.all(
    Object.entries(PROPS).map(async ([key, src]) => [key, await loadImage(src)] as const),
  )

  return {
    sprites: Object.fromEntries(spriteEntries) as Record<SpriteKey, HTMLImageElement>,
    props: Object.fromEntries(propEntries) as Record<PropKey, HTMLImageElement>,
    loaded: true,
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load ${src}`))
    image.src = src
  })
}

function drawAssetLoading(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  ctx.fillStyle = '#101711'
  ctx.fillRect(0, 0, width, height)
  const cx = width / 2
  const cy = height / 2
  ctx.fillStyle = '#f2c866'
  ctx.font = '900 14px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('LOADING TEMPLE SPRITES', cx, cy - 28)
  ctx.fillStyle = 'rgba(245,239,218,.18)'
  ctx.fillRect(cx - 110, cy, 220, 18)
  ctx.fillStyle = '#57e39f'
  ctx.fillRect(cx - 106, cy + 4, 32 + ((Math.sin(time * 4) + 1) / 2) * 148, 10)
  ctx.textAlign = 'left'
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

function cameraZoom(width: number) {
  const fillWidthZoom = width / WORLD.width
  const baseZoom = width < 680 ? MOBILE_CAMERA_ZOOM : width < 1100 ? TABLET_CAMERA_ZOOM : DESKTOP_CAMERA_ZOOM
  return Math.max(baseZoom, fillWidthZoom)
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

function isMovementBlocked(x: number, y: number) {
  return BUILDING_COLLIDERS.some((rect) => x > rect.x && x < rect.x + rect.w && y > rect.y && y < rect.y + rect.h)
}

function drawWorld(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number,
  camera: { x: number; y: number },
  zoom: number,
  time: number,
  player: PlayerState,
  completedIds: Set<number>,
  nearNpcId: number | null,
  assets: TemplePlayAssets,
  target: { x: number; y: number } | null,
) {
  ctx.clearRect(0, 0, width, height)
  ctx.save()
  ctx.scale(zoom, zoom)
  ctx.translate(-camera.x, -camera.y)
  drawGround(ctx, time, assets)
  drawPaths(ctx, time)
  drawWater(ctx, time)
  drawEnvironmentProps(ctx, time, assets)
  drawBuildings(ctx, time, completedIds, assets)
  drawTapTarget(ctx, time, target)
  drawActors(ctx, time, completedIds, nearNpcId, player, assets)
  drawWeather(ctx, camera, viewportWidth, viewportHeight, time)
  ctx.restore()
  drawScanlines(ctx, width, height)
}

function drawTapTarget(ctx: CanvasRenderingContext2D, time: number, target: { x: number; y: number } | null) {
  if (!target) return
  const pulse = 1 + Math.sin(time * 6) * 0.12
  ctx.save()
  ctx.translate(target.x, target.y)
  ctx.strokeStyle = 'rgba(242, 200, 102, .92)'
  ctx.fillStyle = 'rgba(87, 227, 159, .18)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.ellipse(0, -4, 30 * pulse, 16 * pulse, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#f2c866'
  ctx.fillRect(-4, -28, 8, 18)
  ctx.fillRect(-18, -14, 36, 8)
  ctx.restore()
}

function drawGround(ctx: CanvasRenderingContext2D, time: number, assets: TemplePlayAssets) {
  ctx.fillStyle = '#315f43'
  ctx.fillRect(0, 0, WORLD.width, WORLD.height)
  for (let y = 0; y < WORLD.height; y += 64) {
    for (let x = 0; x < WORLD.width; x += 64) {
      const grove = x > 1880 && y > 980
      const spring = x < 720 && y > 940
      const garden = x > 110 && x < 540 && y > 900 && y < 1400
      const tone = (x / 64 + y / 64) % 4
      ctx.fillStyle = grove
        ? tone % 2 === 0 ? '#455c55' : '#52685b'
        : spring
          ? tone % 2 === 0 ? '#2f8c78' : '#327f73'
          : garden
            ? tone % 2 === 0 ? '#5f8b48' : '#6b944d'
            : tone === 0 ? '#5d9a3f' : tone === 1 ? '#67a64a' : tone === 2 ? '#568f3d' : '#70ad50'
      ctx.fillRect(x, y, 64, 64)
      ctx.fillStyle = 'rgba(247, 241, 223, .1)'
      ctx.fillRect(x + 18, y + 18, 6, 6)
      ctx.fillRect(x + 42, y + 38, 5, 5)
      if (!garden && (x + y) % 256 === 0) {
        ctx.fillStyle = '#7bc66d'
        ctx.fillRect(x + 18, y + 20 + Math.sin(time + x) * 1.5, 6, 18)
        ctx.fillRect(x + 42, y + 36, 5, 14)
      }
      if ((x * 3 + y) % 448 === 0) {
        ctx.fillStyle = '#d576ff'
        ctx.fillRect(x + 12, y + 11, 11, 11)
        ctx.fillStyle = '#dbc9d7'
        ctx.fillRect(x + 44, y + 42, 12, 10)
      }
    }
  }

  for (let y = 960; y <= 1320; y += 110) {
    for (let x = 145; x <= 470; x += 112) {
      drawProp(ctx, assets, 'soilTile', x, y, 82, 82)
      const plant: PropKey = (x + y) % 3 === 0 ? 'pepperCluster' : (x + y) % 3 === 1 ? 'pepperPlant' : 'leafPlant'
      drawProp(ctx, assets, plant, x + 12, y + 4 + Math.sin(time * 1.5 + x) * 2, 58, 64)
    }
  }
}

function drawPaths(ctx: CanvasRenderingContext2D, time: number) {
  drawOrganicPath(ctx, [
    [190, 680], [430, 430], [760, 560], [1070, 590], [1320, 450],
    [1650, 220], [1900, 330], [2210, 420], [2660, 330], [3280, 440],
  ], 122, time)
  drawOrganicPath(ctx, [
    [520, 520], [430, 780], [650, 1020], [850, 1260], [820, 1610],
    [1010, 1830], [1420, 1800], [1820, 1740], [2260, 1780], [2780, 1720], [3290, 1640],
  ], 136, time)
  drawOrganicPath(ctx, [
    [1500, 1760], [1490, 1390], [1600, 1140], [1880, 1000],
    [2260, 980], [2640, 1120], [3080, 1200], [3340, 1420],
  ], 124, time)
  drawOrganicPlaza(ctx, 440, 520, 310, 230, time)
  drawOrganicPlaza(ctx, 1120, 1180, 380, 260, time)
  drawOrganicPlaza(ctx, 2080, 470, 430, 250, time)
  drawOrganicPlaza(ctx, 2290, 1320, 300, 260, time)
  drawOrganicPlaza(ctx, 610, 1540, 360, 260, time)
}

function drawOrganicPath(ctx: CanvasRenderingContext2D, points: Array<[number, number]>, width: number, time: number) {
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#4c842c'
  ctx.lineWidth = width + 28
  drawSmoothLine(ctx, points)
  ctx.stroke()
  ctx.strokeStyle = '#b7cb48'
  ctx.lineWidth = width + 12
  drawSmoothLine(ctx, points)
  ctx.stroke()
  ctx.strokeStyle = '#e8bd76'
  ctx.lineWidth = width
  drawSmoothLine(ctx, points)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(129, 92, 45, .2)'
  ctx.lineWidth = 4
  ctx.setLineDash([8, 34])
  ctx.lineDashOffset = -time * 10
  drawSmoothLine(ctx, points)
  ctx.stroke()
  ctx.restore()
}

function drawSmoothLine(ctx: CanvasRenderingContext2D, points: Array<[number, number]>) {
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i]
    const [nextX, nextY] = points[i + 1]
    ctx.quadraticCurveTo(x, y, (x + nextX) / 2, (y + nextY) / 2)
  }
  const last = points[points.length - 1]
  ctx.lineTo(last[0], last[1])
}

function drawOrganicPlaza(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, time: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = '#b7cb48'
  ctx.beginPath()
  for (let i = 0; i < 18; i++) {
    const angle = (Math.PI * 2 * i) / 18
    const wobble = 0.92 + Math.sin(time * 0.35 + i * 1.7) * 0.035
    const px = Math.cos(angle) * w * 0.5 * wobble
    const py = Math.sin(angle) * h * 0.5 * wobble
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#e8bd76'
  ctx.beginPath()
  for (let i = 0; i < 18; i++) {
    const angle = (Math.PI * 2 * i) / 18
    const wobble = 0.88 + Math.sin(time * 0.35 + i * 1.7) * 0.03
    const px = Math.cos(angle) * w * 0.5 * wobble
    const py = Math.sin(angle) * h * 0.5 * wobble
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = 'rgba(129,92,45,.2)'
  for (let i = 0; i < 18; i++) ctx.fillRect(-w * 0.4 + ((i * 47) % w), -h * 0.34 + ((i * 31) % h), 12, 5)
  ctx.restore()
}

function drawWater(ctx: CanvasRenderingContext2D, time: number) {
  ctx.fillStyle = '#263d68'
  ctx.fillRect(1580, 850, 390, 260)
  ctx.strokeStyle = '#7aa0c9'
  ctx.lineWidth = 8
  ctx.strokeRect(1580, 850, 390, 260)
  for (let i = 0; i < 12; i++) {
    const x = 1610 + (i * 51) % 330
    const y = 892 + (i * 31) % 174
    ctx.fillStyle = i % 3 === 0 ? '#b985d8' : '#4c6d55'
    ctx.fillRect(x + Math.sin(time * 1.3 + i) * 5, y, 34, 10)
    ctx.fillStyle = '#f2c866'
    ctx.fillRect(x + 10, y - 7, 10, 7)
  }
}

function drawBuildings(ctx: CanvasRenderingContext2D, time: number, completedIds: Set<number>, assets: TemplePlayAssets) {
  drawBuildingAsset(ctx, assets, 'balineseTemple', 255, 170, 250, 318, 'NXR Temple', '#f2c866', time)
  drawBuildingAsset(ctx, assets, 'buildingOracleHouse', 1170, 250, 305, 340, 'Bridge Gate', '#57e39f', time)
  drawBuildingAsset(ctx, assets, 'buildingStoneVault', 1985, 210, 315, 374, 'RWA Vault', '#f2c866', time)
  drawBuildingAsset(ctx, assets, 'buildingTempleLodge', 1010, 970, 420, 354, 'Agent Camp', '#78ecff', time)
  drawBuildingAsset(ctx, assets, 'buildingMarketHall', 2120, 1040, 350, 334, 'Signal Tower', '#b9ff66', time)
  drawBuildingAsset(ctx, assets, 'buildingScaleDojo', 500, 1240, 340, 384, 'SCALE Lab', '#c886ff', time)
  drawBuildingAsset(ctx, assets, 'buildingGreenhouseInn', 140, 1395, 300, 386, 'Privacy Grove', '#ff7ad9', time)
  drawBuildingAsset(ctx, assets, 'buildingWoodenCabin', 1580, 1500, 260, 240, 'Rest Stop', '#ffad72', time)
  drawBuildingAsset(ctx, assets, 'buildingOrangeCottage', 2430, 1605, 250, 254, 'Quest Hut', '#f2c866', time)
  drawBuildingAsset(ctx, assets, 'buildingGuildHouse', 2890, 655, 320, 305, 'Guild Hall', '#78ecff', time)
  drawBuildingAsset(ctx, assets, 'buildingOrangeCottage', 3050, 1320, 270, 274, 'Farm Hut', '#f2c866', time)

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

function drawBuildingAsset(
  ctx: CanvasRenderingContext2D,
  assets: TemplePlayAssets,
  key: PropKey,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  color: string,
  time: number,
) {
  const bob = Math.sin(time * 1.1 + x * 0.01) * 1.2
  ctx.fillStyle = 'rgba(0,0,0,.24)'
  ctx.fillRect(x + 18, y + h - 14, w - 22, 26)
  drawProp(ctx, assets, key, x, y + bob, w, h)
  drawBuildingLabel(ctx, x + 18, y + h + 10, label, color)
}

function drawBuildingLabel(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, color: string) {
  const width = Math.max(118, label.length * 11 + 24)
  ctx.fillStyle = '#07100c'
  ctx.fillRect(x, y, width, 30)
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.strokeRect(x + 1, y + 1, width - 2, 28)
  ctx.fillStyle = color
  ctx.font = '900 16px monospace'
  ctx.fillText(label, x + 12, y + 21)
}

function drawEnvironmentProps(ctx: CanvasRenderingContext2D, time: number, assets: TemplePlayAssets) {
  drawProp(ctx, assets, 'sunflower', 116, 850 + Math.sin(time * 1.4) * 2, 50, 58)
  drawProp(ctx, assets, 'pepperCluster', 528, 1090 + Math.sin(time * 1.2) * 2, 58, 62)
  drawProp(ctx, assets, 'guardianStatue', 1180, 386, 82, 104)
  drawProp(ctx, assets, 'guardianStatue', 1608, 386, 82, 104)
  drawProp(ctx, assets, 'vineCornerA', 2050, 1540, 88, 88)
  drawProp(ctx, assets, 'vineCornerB', 2580, 960, 88, 88)
  drawProp(ctx, assets, 'vineCornerC', 88, 1770, 88, 88)

  for (let i = 0; i < 76; i++) {
    const x = 90 + ((i * 257) % (WORLD.width - 180))
    const y = 120 + ((i * 181) % (WORLD.height - 240))
    if (isNearMainPlaySpace(x, y)) continue
    const sway = Math.sin(time * 1.1 + i) * 1.8
    ctx.fillStyle = '#4b3427'
    ctx.fillRect(x + 10, y + 28, 16, 32)
    ctx.fillStyle = i % 4 === 0 ? '#57e39f' : '#3d724b'
    ctx.fillRect(x + sway, y + 6, 36, 32)
    ctx.fillRect(x + 7 + sway, y - 7, 24, 27)
    ctx.fillStyle = '#2b4f35'
    ctx.fillRect(x + 4 + sway, y + 23, 28, 14)
  }
}

function isNearMainPlaySpace(x: number, y: number) {
  const blockedRects = [
    [120, 120, 720, 760],
    [1040, 180, 1640, 680],
    [1850, 120, 2380, 760],
    [950, 900, 1500, 1580],
    [2030, 960, 2570, 1640],
    [400, 1160, 950, 1840],
    [80, 1320, 540, 1870],
    [1450, 1420, 1900, 1780],
    [2380, 1540, 2720, 1900],
    [2840, 600, 3260, 1060],
    [3000, 1260, 3350, 1660],
    [240, 500, 2680, 760],
    [580, 1650, 2760, 1980],
  ]
  return blockedRects.some(([left, top, right, bottom]) => x > left && x < right && y > top && y < bottom)
}

function drawProp(
  ctx: CanvasRenderingContext2D,
  assets: TemplePlayAssets,
  key: PropKey,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const image = assets.props[key]
  if (!image) return
  ctx.drawImage(image, Math.round(x), Math.round(y), Math.round(w), Math.round(h))
}

function drawActors(
  ctx: CanvasRenderingContext2D,
  time: number,
  completedIds: Set<number>,
  nearNpcId: number | null,
  player: PlayerState,
  assets: TemplePlayAssets,
) {
  const actors: Array<{ y: number; draw: () => void }> = []

  AMBIENT_NPCS.forEach((npc, index) => {
    const idleY = Math.sin(time * 1.15 + index * 0.91) * 0.9
    const directionCycle: Array<PlayerState['dir']> = ['down', 'right', 'down', 'left']
    const direction = directionCycle[Math.floor(time / 5 + index) % directionCycle.length]
    actors.push({
      y: npc.y + idleY,
      draw: () => drawSpriteActor(ctx, assets, {
        sprite: npc.sprite,
        x: npc.x,
        y: npc.y + idleY,
        name: npc.name,
        tone: npc.color,
        accent: npc.accent,
        time,
        seed: index * 0.73,
        compact: true,
        moving: false,
        direction,
      }),
    })
  })

  QUESTS.forEach((quest) => {
    const completed = completedIds.has(quest.quizId)
    actors.push({
      y: quest.y,
      draw: () => drawSpriteActor(ctx, assets, {
        sprite: quest.sprite,
        x: quest.x,
        y: quest.y,
        name: completed ? `${quest.npc} OK` : quest.npc,
        tone: quest.color,
        accent: quest.accent,
        time,
        seed: quest.id * 0.48,
        near: nearNpcId === quest.id,
        completed,
        direction: 'down',
      }),
    })
  })

  actors.push({
    y: player.y,
    draw: () => drawSpriteActor(ctx, assets, {
      sprite: 'nxr',
      x: player.x,
      y: player.y,
      name: 'NXR (you)',
      tone: '#f2c866',
      accent: '#57e39f',
      time,
      seed: 1.4,
      player: true,
      moving: player.moving,
      direction: player.dir,
    }),
  })

  actors.sort((a, b) => a.y - b.y).forEach((actor) => actor.draw())
}

function drawSpriteActor(
  ctx: CanvasRenderingContext2D,
  assets: TemplePlayAssets,
  {
    sprite,
    x,
    y,
    name,
    tone,
    accent,
    time,
    seed,
    near = false,
    completed = false,
    compact = false,
    player = false,
    moving = false,
    direction = 'down',
  }: {
    sprite: SpriteKey
    x: number
    y: number
    name: string
    tone: string
    accent: string
    time: number
    seed: number
    near?: boolean
    completed?: boolean
    compact?: boolean
    player?: boolean
    moving?: boolean
    direction?: PlayerState['dir']
  },
) {
  const sheet = SPRITES[sprite]
  const image = assets.sprites[sprite]
  const frame = chooseSpriteFrame(sprite, sheet.frames, time, seed, moving, near, completed, player, direction)
  const breathe = moving ? 0 : Math.sin(time * 1.8 + seed) * 0.75
  const drawW = player ? sheet.drawW * 1.04 : sheet.drawW
  const drawH = player ? sheet.drawH * 1.04 : sheet.drawH
  const dx = Math.round(x - drawW / 2)
  const dy = Math.round(y - drawH + breathe)

  ctx.fillStyle = 'rgba(0,0,0,.34)'
  ctx.fillRect(Math.round(x - drawW * 0.28), Math.round(y - 10), Math.round(drawW * 0.56), 12)

  if (near) {
    const pulse = 1 + Math.sin(time * 5) * 0.08
    ctx.strokeStyle = tone
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.ellipse(x, y - drawH * 0.45, drawW * 0.54 * pulse, drawH * 0.48 * pulse, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = 'rgba(242,200,102,.16)'
    ctx.beginPath()
    ctx.ellipse(x, y - drawH * 0.45, drawW * 0.42, drawH * 0.36, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.drawImage(
    image,
    frame * sheet.frameW,
    0,
    sheet.frameW,
    sheet.frameH,
    dx,
    dy,
    drawW,
    drawH,
  )

  if (completed) {
    ctx.fillStyle = accent
    ctx.strokeStyle = '#07100c'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x + drawW * 0.34, y - drawH * 0.88)
    ctx.lineTo(x + drawW * 0.44, y - drawH * 0.76)
    ctx.lineTo(x + drawW * 0.29, y - drawH * 0.8)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  drawPixelNameTag(ctx, x, y - drawH - (compact ? 18 : 24), name, completed ? '#57e39f' : '#f7f1df', compact, tone)
}

function chooseSpriteFrame(
  sprite: SpriteKey,
  frameCount: number,
  time: number,
  seed: number,
  moving: boolean,
  _near: boolean,
  _completed: boolean,
  _player: boolean,
  direction: PlayerState['dir'],
) {
  if (frameCount <= 1) return 0
  if (sprite === 'nxr') {
    const row = direction === 'up' ? 1 : direction === 'left' ? 3 : direction === 'right' ? 2 : 0
    const step = moving ? Math.floor(time * 6.4 + seed) % 4 : 0
    return Math.min(frameCount - 1, row * 4 + step)
  }
  if (frameCount === 4) return frameForDirection(direction)
  return 0
}

function frameForDirection(direction: PlayerState['dir']) {
  if (direction === 'right') return 1
  if (direction === 'up') return 2
  if (direction === 'left') return 3
  return 0
}

function drawPixelNameTag(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string, compact = false, border = '#f2c866') {
  const fontSize = compact ? 11 : 12
  ctx.font = `900 ${fontSize}px monospace`
  const width = Math.ceil(ctx.measureText(text).width) + 16
  ctx.fillStyle = 'rgba(7, 16, 12, .9)'
  ctx.fillRect(Math.round(x - width / 2), Math.round(y), width, compact ? 20 : 22)
  ctx.strokeStyle = border
  ctx.lineWidth = 1
  ctx.strokeRect(Math.round(x - width / 2) + 0.5, Math.round(y) + 0.5, width - 1, (compact ? 20 : 22) - 1)
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

let templeAudioContext: AudioContext | null = null

function playTempleSfx(kind: 'tap' | 'talk' | 'correct' | 'wrong' | 'success' | 'claim') {
  if (typeof window === 'undefined') return
  const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextCtor) return
  templeAudioContext ??= new AudioContextCtor()
  const ctx = templeAudioContext
  if (ctx.state === 'suspended') void ctx.resume()

  const now = ctx.currentTime
  const gain = ctx.createGain()
  gain.connect(ctx.destination)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.045, now + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24)

  const tones: Record<typeof kind, number[]> = {
    tap: [260, 392],
    talk: [392, 523],
    correct: [523, 659, 784],
    wrong: [220, 164],
    success: [392, 523, 659, 880],
    claim: [330, 494, 740],
  }

  tones[kind].forEach((frequency, index) => {
    const osc = ctx.createOscillator()
    osc.type = kind === 'wrong' ? 'triangle' : 'square'
    osc.frequency.setValueAtTime(frequency, now + index * 0.045)
    osc.connect(gain)
    osc.start(now + index * 0.045)
    osc.stop(now + index * 0.045 + 0.09)
  })
}

function friendlyPlayError(message: string) {
  if (message.includes('QUIZ_ALREADY_COMPLETED')) return 'This badge was already claimed.'
  if (message.includes('PROFILE_REQUIRED')) return 'Seal your Rialo Passport first.'
  if (message.includes('QUIZ_NOT_ACTIVE')) return 'This quest badge is not active on the contract yet.'
  return message.split('\n')[0] || 'Temple Play transaction failed.'
}
