import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
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
  activity: AmbientActivity
  persona?: NpcPersona
  pair?: string
}

type AmbientActivity =
  | 'wander'
  | 'fish'
  | 'dance'
  | 'gather'
  | 'stroll'
  | 'meditate'
  | 'sit'
  | 'tend'
  | 'couple'

type NpcPersona = 'homebody' | 'wanderer' | 'pacer'

type NpcMotion = {
  x: number
  y: number
  moving: boolean
  direction: PlayerState['dir']
  activityPulse: number
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
const MAP_W = 50
const MAP_H = 40
const TILE_SIZE = 32
const WORLD = { width: MAP_W * TILE_SIZE, height: MAP_H * TILE_SIZE }
const CENTER_HUB = { tx: 25, ty: 20 }
const HUBS = [
  [13, 9],
  [12, 26],
  [40, 11],
  [38, 30],
] as const
const POND = { tx: 5, ty: 24, tw: 8, th: 6 }
const POND_RECT = {
  x: POND.tx * TILE_SIZE,
  y: POND.ty * TILE_SIZE,
  w: POND.tw * TILE_SIZE,
  h: POND.th * TILE_SIZE,
}
const T = {
  GRASS: 0,
  GRASS2: 1,
  PATH: 2,
  WATER: 3,
  SAND: 4,
  MYSTIC: 5,
  COAST: 6,
  FLOWER: 7,
  SAND2: 8,
  MYSTIC2: 9,
} as const
type TileType = (typeof T)[keyof typeof T]
const PLAYER_SPEED = 245
const DESKTOP_CAMERA_ZOOM = 1.0
const TABLET_CAMERA_ZOOM = 0.9
const MOBILE_CAMERA_ZOOM = 0.7

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
  // tileable ground textures (drawn as repeating patterns)
  | 'groundGrass'
  | 'groundRoad'
  | 'groundSoil'
  // nature + decor
  | 'tree'
  | 'lamp'
  | 'pond'
  | 'grass1'
  | 'grass2'
  | 'grass3'
  | 'flowerBlue'
  | 'flowerAmber'
  | 'flowerCream'
  | 'flowerYellow'
  | 'flowerRed'
  | 'flowerOrange'
  | 'flowerPink'
  | 'flowerPurple'
  // garden crops (growth stages)
  | 'cropLeafy0'
  | 'cropLeafy1'
  | 'cropLeafy2'
  | 'cropLeafy3'
  | 'cropRoot0'
  | 'cropRoot1'
  | 'cropRoot2'
  | 'cropRoot3'
  // park set
  | 'parkBench'
  | 'parkLantern'
  | 'parkBush'
  | 'parkPlanter'
  // fishing set
  | 'fishingRod'
  | 'fishingBobber'
  | 'fishingBucket'
  | 'fishingNet'
  // buildings (10 slots reuse 3 cozy-village designs)
  | 'balineseTemple'
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
  npcOracle: { src: '/temple-play/sprites/npc-shrine-maiden.png', frameW: 160, frameH: 220, frames: 4, drawW: 52, drawH: 72 },
  npcForestGuide: { src: '/temple-play/sprites/npc-merchant.png', frameW: 160, frameH: 220, frames: 4, drawW: 52, drawH: 72 },
  npcBuilder: { src: '/temple-play/sprites/npc-samurai.png', frameW: 160, frameH: 220, frames: 4, drawW: 52, drawH: 72 },
  npcCaptain: { src: '/temple-play/sprites/npc-samurai.png', frameW: 160, frameH: 220, frames: 4, drawW: 52, drawH: 72 },
  npcNavigator: { src: '/temple-play/sprites/npc-merchant.png', frameW: 160, frameH: 220, frames: 4, drawW: 52, drawH: 72 },
  npcShadowAgent: { src: '/temple-play/sprites/npc-ninja.png', frameW: 160, frameH: 220, frames: 4, drawW: 52, drawH: 72 },
  npcSage: { src: '/temple-play/sprites/npc-shrine-maiden.png', frameW: 160, frameH: 220, frames: 4, drawW: 52, drawH: 72 },
  npcHerbalist: { src: '/temple-play/sprites/npc-herbalist-jp.png', frameW: 160, frameH: 220, frames: 4, drawW: 52, drawH: 72 },
  npcAlchemist: { src: '/temple-play/sprites/npc-alchemist-jp.png', frameW: 160, frameH: 220, frames: 4, drawW: 52, drawH: 72 },
}

const PROPS: Record<PropKey, string> = {
  groundGrass: '/temple-play/world/tile/ground-grass.png',
  groundRoad: '/temple-play/world/tile/ground-road.png',
  groundSoil: '/temple-play/world/tile/ground-soil.png',
  tree: '/temple-play/world/tree/tree.png',
  lamp: '/temple-play/world/lamp/lamp.png',
  pond: '/temple-play/world/pond/pond.png',
  grass1: '/temple-play/world/grass/grass-1.png',
  grass2: '/temple-play/world/grass/grass-2.png',
  grass3: '/temple-play/world/grass/grass-3.png',
  flowerBlue: '/temple-play/world/flower/flower-blue.png',
  flowerAmber: '/temple-play/world/flower/flower-amber.png',
  flowerCream: '/temple-play/world/flower/flower-cream.png',
  flowerYellow: '/temple-play/world/flower/flower-yellow.png',
  flowerRed: '/temple-play/world/flower/flower-red.png',
  flowerOrange: '/temple-play/world/flower/flower-orange.png',
  flowerPink: '/temple-play/world/flower/flower-pink.png',
  flowerPurple: '/temple-play/world/flower/flower-purple.png',
  cropLeafy0: '/temple-play/world/crop/crop-leafy-0.png',
  cropLeafy1: '/temple-play/world/crop/crop-leafy-1.png',
  cropLeafy2: '/temple-play/world/crop/crop-leafy-2.png',
  cropLeafy3: '/temple-play/world/crop/crop-leafy-3.png',
  cropRoot0: '/temple-play/world/crop/crop-root-0.png',
  cropRoot1: '/temple-play/world/crop/crop-root-1.png',
  cropRoot2: '/temple-play/world/crop/crop-root-2.png',
  cropRoot3: '/temple-play/world/crop/crop-root-3.png',
  parkBench: '/temple-play/world/park/park-bench.png',
  parkLantern: '/temple-play/world/park/park-lantern.png',
  parkBush: '/temple-play/world/park/park-bush.png',
  parkPlanter: '/temple-play/world/park/park-planter.png',
  fishingRod: '/temple-play/world/fishing/fishing-rod.png',
  fishingBobber: '/temple-play/world/fishing/fishing-bobber.png',
  fishingBucket: '/temple-play/world/fishing/fishing-bucket.png',
  fishingNet: '/temple-play/world/fishing/fishing-net.png',
  // 10 building slots reuse 3 designs (aspect-matched to minimise distortion)
  balineseTemple: '/temple-play/world/building/building-3.png',
  buildingScaleDojo: '/temple-play/world/building/building-1.png',
  buildingStoneVault: '/temple-play/world/building/building-1.png',
  buildingTempleLodge: '/temple-play/world/building/building-2.png',
  buildingMarketHall: '/temple-play/world/building/building-2.png',
  buildingGreenhouseInn: '/temple-play/world/building/building-3.png',
  buildingOracleHouse: '/temple-play/world/building/building-1.png',
  buildingWoodenCabin: '/temple-play/world/building/building-2.png',
  buildingOrangeCottage: '/temple-play/world/building/building-1.png',
  buildingGuildHouse: '/temple-play/world/building/building-2.png',
}

const QUESTS: QuestNpc[] = [
  {
    id: 1,
    quizId: 1,
    zone: 'Temple Gate',
    npc: 'NXR',
    role: 'Builder Guide',
    sprite: 'nxr',
    x: 792,
    y: 700,
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
    x: 1290,
    y: 430,
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
    x: 580,
    y: 985,
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
    x: 1180,
    y: 1175,
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
    x: 395,
    y: 400,
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
  { name: 'Boba Byte', sprite: 'npcSage', x: 430, y: 955, color: '#ff7ad9', accent: '#f2c866', line: 'Rain makes the data spring louder.', activity: 'fish', persona: 'homebody' },
  { name: 'Mossy Dex', sprite: 'npcForestGuide', x: 250, y: 360, color: '#57e39f', accent: '#78ecff', line: 'Forest paths are quiet, but data never sleeps.', activity: 'wander', persona: 'wanderer' },
  { name: 'Peeko Bond', sprite: 'npcHerbalist', x: 1185, y: 450, color: '#f2c866', accent: '#ffad72', line: 'RWA vaults like clean verification stamps.', activity: 'gather', persona: 'homebody' },
  { name: 'Firo Mail', sprite: 'npcCaptain', x: 930, y: 590, color: '#78ecff', accent: '#ff7ad9', line: 'Bridge Gate scrolls carry API messages out and back.', activity: 'stroll', persona: 'wanderer' },
  { name: 'Jade Numi', sprite: 'npcAlchemist', x: 1290, y: 650, color: '#b9ff66', accent: '#57e39f', line: 'Temple Energy returns when the daily ritual cools down.', activity: 'meditate', persona: 'homebody' },
  { name: 'Pixel Kora', sprite: 'npcOracle', x: 440, y: 1120, color: '#c886ff', accent: '#f2c866', line: 'Privacy chambers turn plain scrolls into protected ones.', activity: 'sit', persona: 'homebody' },
  { name: 'Tama Tick', sprite: 'npcNavigator', x: 1010, y: 1000, color: '#ffad72', accent: '#78ecff', line: 'Signals are tiny real-world updates with big consequences.', activity: 'stroll', persona: 'pacer' },
  { name: 'Orb Nalo', sprite: 'npcBuilder', x: 1250, y: 1160, color: '#57e39f', accent: '#c886ff', line: 'Every badge is better when the ledger can verify it.', activity: 'wander', persona: 'pacer' },
  { name: 'Rune Pika', sprite: 'npcShadowAgent', x: 790, y: 815, color: '#ffe36e', accent: '#57e39f', line: 'Quest boards like brave learners.', activity: 'dance', persona: 'homebody' },
  { name: 'Minty Mox', sprite: 'npcSage', x: 530, y: 1110, color: '#67ffc0', accent: '#f2c866', line: 'The map gets brighter when badges are claimed.', activity: 'tend', persona: 'homebody' },
  { name: 'Sera API', sprite: 'npcCaptain', x: 1000, y: 245, color: '#88d7ff', accent: '#ff8066', line: 'A response scroll always comes back through Bridge Gate.', activity: 'wander', persona: 'wanderer' },
  { name: 'Candi Dot', sprite: 'npcForestGuide', x: 1210, y: 420, color: '#b9ff66', accent: '#f2c866', line: 'The temple is friendlier when every system can talk.', activity: 'couple', persona: 'homebody', pair: 'Peeko Bond' },
]

const NPC_INTERACTIONS = [
  { from: 2, to: 11, label: 'verify', color: '#f2c866' },
  { from: 3, to: 10, label: 'api', color: '#78ecff' },
  { from: 6, to: 9, label: 'signal', color: '#ffad72' },
  { from: 7, to: 4, label: 'energy', color: '#57e39f' },
  { from: 0, to: 5, label: 'pond', color: '#ff7ad9' },
]

type BuildingSpec = {
  key: PropKey
  x: number
  y: number
  w: number
  h: number
  label: string
  color: string
}

const BUILDINGS: BuildingSpec[] = [
  { key: 'balineseTemple', x: 792, y: 630, w: 235, h: 298, label: 'NXR Temple', color: '#f2c866' },
  { key: 'buildingScaleDojo', x: 395, y: 332, w: 250, h: 282, label: 'SCALE Lab', color: '#c886ff' },
  { key: 'buildingStoneVault', x: 1290, y: 370, w: 258, h: 306, label: 'RWA Vault', color: '#f2c866' },
  { key: 'buildingTempleLodge', x: 580, y: 900, w: 318, h: 268, label: 'Agent Camp', color: '#78ecff' },
  { key: 'buildingMarketHall', x: 1180, y: 1050, w: 278, h: 266, label: 'Signal Tower', color: '#b9ff66' },
  { key: 'buildingGreenhouseInn', x: 270, y: 1276, w: 230, h: 296, label: 'Privacy Grove', color: '#ff7ad9' },
  { key: 'buildingOracleHouse', x: 1035, y: 535, w: 248, h: 276, label: 'Bridge Gate', color: '#57e39f' },
  { key: 'buildingWoodenCabin', x: 850, y: 1150, w: 198, h: 184, label: 'Rest Stop', color: '#ffad72' },
  { key: 'buildingOrangeCottage', x: 1430, y: 1150, w: 206, h: 210, label: 'Quest Hut', color: '#f2c866' },
  { key: 'buildingGuildHouse', x: 1425, y: 620, w: 248, h: 236, label: 'Guild Hall', color: '#78ecff' },
]

const BUILDING_COLLIDERS = BUILDINGS.map((building) => buildingCollider(building))

// Tall scenery that must y-sort with actors (occludes things behind it).
// Drawn bottom-center anchored at (x, y). `solid` adds a small base collider.
type ScenerySpec = { key: PropKey; x: number; y: number; w: number; h: number; solid?: boolean }
const SCENERY: ScenerySpec[] = [
  // trees ringing the world + filling open gaps (off paths & buildings)
  { key: 'tree', x: 140, y: 200, w: 132, h: 144, solid: true },
  { key: 'tree', x: 700, y: 180, w: 132, h: 144, solid: true },
  { key: 'tree', x: 860, y: 190, w: 120, h: 132, solid: true },
  { key: 'tree', x: 1540, y: 210, w: 132, h: 144, solid: true },
  { key: 'tree', x: 90, y: 470, w: 120, h: 132, solid: true },
  { key: 'tree', x: 300, y: 660, w: 132, h: 144, solid: true },
  { key: 'tree', x: 110, y: 1010, w: 132, h: 144, solid: true },
  { key: 'tree', x: 500, y: 1250, w: 120, h: 132, solid: true },
  { key: 'tree', x: 1000, y: 1255, w: 132, h: 144, solid: true },
  { key: 'tree', x: 1560, y: 1250, w: 132, h: 144, solid: true },
  { key: 'tree', x: 1560, y: 780, w: 120, h: 132, solid: true },
  { key: 'tree', x: 380, y: 520, w: 132, h: 144, solid: true },
  // lamp posts framing the central plaza + main paths
  { key: 'lamp', x: 620, y: 560, w: 78, h: 160, solid: true },
  { key: 'lamp', x: 980, y: 560, w: 78, h: 160, solid: true },
  { key: 'lamp', x: 620, y: 770, w: 78, h: 160, solid: true },
  { key: 'lamp', x: 980, y: 770, w: 78, h: 160, solid: true },
  { key: 'lamp', x: 430, y: 560, w: 78, h: 160, solid: true },
  { key: 'lamp', x: 250, y: 760, w: 78, h: 160, solid: true },
  // park nook in the open pocket between temple / oracle / market / guild
  { key: 'parkBench', x: 1000, y: 640, w: 104, h: 78, solid: true },
  { key: 'parkLantern', x: 1180, y: 650, w: 86, h: 104, solid: true },
  { key: 'parkBush', x: 1000, y: 760, w: 104, h: 100 },
  { key: 'parkPlanter', x: 1180, y: 762, w: 104, h: 101 },
]

function sceneryCollider(s: ScenerySpec) {
  const w = s.w * 0.34
  const h = 12
  return { x: s.x - w / 2, y: s.y - h, w, h }
}

const WORLD_BLOCKERS = [
  ...BUILDING_COLLIDERS,
  ...SCENERY.filter((s) => s.solid).map(sceneryCollider),
  { x: POND_RECT.x + 10, y: POND_RECT.y + 8, w: POND_RECT.w - 20, h: POND_RECT.h - 16 },
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
  const [showGuide, setShowGuide] = useState(true)
  const [toast, setToast] = useState('')
  const [claimingQuest, setClaimingQuest] = useState<QuestNpc | null>(null)
  const completedRef = useRef<Set<number>>(new Set())
  const openQuestRef = useRef<(quest: QuestNpc) => void>(() => undefined)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lofiStarted = useRef(false)
  const [lofiMuted, setLofiMuted] = useState(() => (typeof window === 'undefined' ? false : localStorage.getItem('temple-lofi-mute') === 'true'))
  const [lofiVolume, setLofiVolume] = useState(() => {
    if (typeof window === 'undefined') return 0.4
    const stored = Number(localStorage.getItem('temple-lofi-vol') ?? 0.4)
    return Number.isFinite(stored) ? stored : 0.4
  })
  const initialLofiMuted = useRef(lofiMuted)
  const initialLofiVolume = useRef(lofiVolume)

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

  const nextQuest = useMemo(() => QUESTS.find((quest) => !completedIds.has(quest.quizId)) ?? QUESTS[0], [completedIds])

  useEffect(() => {
    completedRef.current = completedIds
  }, [completedIds])

  useEffect(() => {
    // Audio source: OpenGameArt "Chill Lofi Inspired" by RubberDucky, CC0.
    const audio = new Audio('/temple-play/audio/lofi-loop.mp3')
    audio.loop = true
    audio.volume = initialLofiVolume.current
    audio.muted = initialLofiMuted.current
    audioRef.current = audio

    const start = () => {
      if (!lofiStarted.current) {
        lofiStarted.current = true
        void audio.play().catch(() => undefined)
      }
    }

    window.addEventListener('click', start, { once: true })
    window.addEventListener('keydown', start, { once: true })

    return () => {
      window.removeEventListener('click', start)
      window.removeEventListener('keydown', start)
      audio.pause()
      audio.src = ''
    }
  }, [])

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
            nextQuest={nextQuest}
            onNearQuestChange={setNearNpcId}
            onOpenQuest={(quest) => openQuestRef.current(quest)}
          />

          <div style={{
            position: 'absolute',
            bottom: 48,
            left: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(7,16,12,.88)',
            border: '1px solid #f2c866',
            padding: '4px 10px',
            borderRadius: 4,
            zIndex: 10,
          }}>
            <button
              type="button"
              aria-label={lofiMuted ? 'Unmute lofi music' : 'Mute lofi music'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f2c866', fontSize: 12, fontWeight: 900 }}
              onClick={() => {
                const muted = !lofiMuted
                setLofiMuted(muted)
                localStorage.setItem('temple-lofi-mute', String(muted))
                if (audioRef.current) audioRef.current.muted = muted
              }}
            >
              {lofiMuted ? 'MUTE' : 'LOFI'}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={lofiVolume}
              aria-label="Temple lofi volume"
              style={{ width: 72, accentColor: '#f2c866' }}
              onChange={(event) => {
                const volume = Number(event.target.value)
                setLofiVolume(volume)
                localStorage.setItem('temple-lofi-vol', String(volume))
                if (audioRef.current) audioRef.current.volume = volume
              }}
            />
          </div>

          <div className="temple-play-hud">
            <span><Gamepad2 className="h-4 w-4" /> Click / tap map to move</span>
            <span><MapPin className="h-4 w-4" /> Follow the gold arrow</span>
            <span><Gamepad2 className="h-4 w-4" /> WASD optional on desktop</span>
          </div>

          <div className="temple-play-miniquest">
            <p>{nearestQuest ? 'Talk now' : 'Next destination'}</p>
            <strong>{nearestQuest ? `${nearestQuest.npc} / ${nearestQuest.zone}` : `${nextQuest.zone} - follow arrow`}</strong>
            <button type="button" disabled={!nearestQuest} onClick={() => nearestQuest && openQuest(nearestQuest)}>
              {nearestQuest ? 'Talk' : 'Move there'}
            </button>
          </div>

          <AnimatePresence>
            {showGuide && !activeQuest ? (
              <GuideOverlay onClose={() => setShowGuide(false)} />
            ) : null}
          </AnimatePresence>

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
  nextQuest,
  onNearQuestChange,
  onOpenQuest,
}: {
  completedIds: Set<number>
  nextQuest: QuestNpc
  onNearQuestChange: (id: number | null) => void
  onOpenQuest: (quest: QuestNpc) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const keys = useRef(new Set<string>())
  const player = useRef<PlayerState>({ x: 792, y: 780, dir: 'down', moving: false })
  const nearId = useRef<number | null>(null)
  const completedLatest = useRef(completedIds)
  const assetsRef = useRef<TemplePlayAssets | null>(null)
  const tapTarget = useRef<{ x: number; y: number; questId?: number } | null>(null)
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

      let input = movementFromInput(keys.current)
      const current = player.current
      const hasManualInput = Math.abs(input.x) > 0.01 || Math.abs(input.y) > 0.01
      if (hasManualInput) {
        tapTarget.current = null
      } else if (tapTarget.current) {
        const dx = tapTarget.current.x - current.x
        const dy = tapTarget.current.y - current.y
        const distance = Math.hypot(dx, dy)
        if (distance < 10) {
          const arrivedQuest = tapTarget.current.questId
          tapTarget.current = null
          input = { x: 0, y: 0 }
          if (arrivedQuest) {
            const quest = QUESTS.find((item) => item.id === arrivedQuest)
            if (quest && Math.hypot(current.x - quest.x, current.y - quest.y) < 105) {
              playTempleSfx('talk')
              onOpenQuest(quest)
            }
          }
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
      const targetCamera = {
        x: clamp(current.x - viewport.width / 2, 0, Math.max(0, WORLD.width - viewport.width)),
        y: clamp(current.y - viewport.height / 2, 0, Math.max(0, WORLD.height - viewport.height)),
      }
      const previousCamera = cameraRef.current
      const camera = {
        x: previousCamera.x + (targetCamera.x - previousCamera.x) * 0.12,
        y: previousCamera.y + (targetCamera.y - previousCamera.y) * 0.12,
      }
      cameraRef.current = { ...camera, zoom }

      drawWorld(context, rect.width, rect.height, viewport.width, viewport.height, camera, zoom, frame, current, completedLatest.current, nearId.current, assets, tapTarget.current, nextQuest)
      window.requestAnimationFrame(tick)
    }

    window.requestAnimationFrame(tick)

    return () => {
      disposed = true
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
    }
  }, [nextQuest, onNearQuestChange, onOpenQuest])

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
          const tappedQuest = QUESTS.find((quest) => Math.hypot(target.x - quest.x, target.y - quest.y) < 70)
          const walkTarget = tappedQuest
            ? approachPoint(player.current, tappedQuest, 76)
            : target
          tapTarget.current = isMovementBlocked(walkTarget.x, walkTarget.y) ? null : { ...walkTarget, questId: tappedQuest?.id }
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

function GuideOverlay({ onClose }: { onClose: () => void }) {
  const portrait = SPRITES.nxr

  return (
    <motion.div className="temple-play-guide-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.section
        className="temple-play-guide-card"
        initial={{ y: 26, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 16, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 230, damping: 22 }}
      >
        <div className="temple-play-guide-avatar" style={{ '--npc': '#f2c866', '--npc-accent': '#57e39f' } as CSSProperties}>
          <span
            className="temple-play-guide-sprite"
            style={{
              backgroundImage: `url(${portrait.src})`,
              backgroundSize: `${portrait.frames * 100}% 100%`,
              backgroundPosition: '0 0',
            }}
          />
        </div>
        <div className="temple-play-guide-copy">
          <p>NXR Guide</p>
          <h2>Welcome to Temple Play</h2>
          <span>
            This is a pixel quest for learning Rialo. Tap the map to move, follow the gold arrow, talk to NPCs, answer mini quizzes, then claim badges on-chain.
          </span>
          <div>
            <small>Tap map: move</small>
            <small>Arrow: next quest</small>
            <small>E key: talk nearby</small>
          </div>
        </div>
        <button type="button" onClick={onClose}>Start</button>
      </motion.section>
    </motion.div>
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

function movementFromInput(keys: Set<string>) {
  let x = 0
  let y = 0
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
  return WORLD_BLOCKERS.some((rect) => pointInRect(x, y, rect))
}

function pointInRect(x: number, y: number, rect: { x: number; y: number; w: number; h: number }) {
  return x > rect.x && x < rect.x + rect.w && y > rect.y && y < rect.y + rect.h
}

function buildingCollider(building: BuildingSpec) {
  const w = building.w * 0.72
  const h = building.h * 0.35
  return {
    x: building.x - w / 2,
    y: building.y - h,
    w,
    h,
  }
}

function pathBlocked(ax: number, ay: number, bx: number, by: number) {
  return WORLD_BLOCKERS.some((rect) => lineIntersectsRect(ax, ay, bx, by, rect))
}

function lineIntersectsRect(ax: number, ay: number, bx: number, by: number, rect: { x: number; y: number; w: number; h: number }) {
  if (pointInRect(ax, ay, rect) || pointInRect(bx, by, rect)) return true
  const x1 = rect.x
  const y1 = rect.y
  const x2 = rect.x + rect.w
  const y2 = rect.y + rect.h
  return segmentsIntersect(ax, ay, bx, by, x1, y1, x2, y1)
    || segmentsIntersect(ax, ay, bx, by, x2, y1, x2, y2)
    || segmentsIntersect(ax, ay, bx, by, x2, y2, x1, y2)
    || segmentsIntersect(ax, ay, bx, by, x1, y2, x1, y1)
}

function segmentsIntersect(ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number) {
  const d1 = direction(cx, cy, dx, dy, ax, ay)
  const d2 = direction(cx, cy, dx, dy, bx, by)
  const d3 = direction(ax, ay, bx, by, cx, cy)
  const d4 = direction(ax, ay, bx, by, dx, dy)
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
}

function direction(ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
  return (cx - ax) * (by - ay) - (cy - ay) * (bx - ax)
}

function approachPoint(player: PlayerState, quest: QuestNpc, distance: number) {
  const dx = player.x - quest.x
  const dy = player.y - quest.y
  const len = Math.hypot(dx, dy) || 1
  return {
    x: clamp(quest.x + (dx / len) * distance, 90, WORLD.width - 90),
    y: clamp(quest.y + (dy / len) * distance, 90, WORLD.height - 90),
  }
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
  nextQuest: QuestNpc,
) {
  ctx.clearRect(0, 0, width, height)
  ctx.save()
  ctx.scale(zoom, zoom)
  ctx.translate(-camera.x, -camera.y)
  drawGround(ctx, time, assets)
  drawPaths(ctx, time)
  drawWater(ctx, assets)
  drawEnvironmentProps(ctx, time, assets)
  drawTapTarget(ctx, time, target)
  drawQuestDirection(ctx, time, player, nextQuest, nearNpcId)
  drawActors(ctx, time, completedIds, nearNpcId, player, assets)
  drawWeather(ctx, camera, viewportWidth, viewportHeight, time)
  drawShootingStar(ctx, camera, viewportWidth, viewportHeight, time)
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

function drawQuestDirection(
  ctx: CanvasRenderingContext2D,
  time: number,
  player: PlayerState,
  quest: QuestNpc,
  nearNpcId: number | null,
) {
  const dx = quest.x - player.x
  const dy = quest.y - player.y
  const distance = Math.hypot(dx, dy)
  const angle = Math.atan2(dy, dx)
  const close = nearNpcId === quest.id || distance < 130
  const arrowDistance = clamp(distance * 0.34, 84, 172)
  const ax = player.x + Math.cos(angle) * arrowDistance
  const ay = player.y + Math.sin(angle) * arrowDistance - 44 + Math.sin(time * 3) * 5

  ctx.save()
  ctx.globalAlpha = close ? 0.55 : 0.96
  ctx.strokeStyle = 'rgba(242, 200, 102, 0.84)'
  ctx.lineWidth = 5
  ctx.setLineDash([16, 14])
  ctx.lineDashOffset = -time * 38
  ctx.beginPath()
  ctx.moveTo(player.x, player.y - 42)
  ctx.lineTo(quest.x, quest.y - 44)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.translate(ax, ay)
  ctx.rotate(angle)
  ctx.fillStyle = '#f2c866'
  ctx.strokeStyle = '#07100c'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(34, 0)
  ctx.lineTo(-24, -24)
  ctx.lineTo(-13, 0)
  ctx.lineTo(-24, 24)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#57e39f'
  ctx.fillRect(-12, -6, 24, 12)
  ctx.restore()

  const ring = 1 + Math.sin(time * 4.2) * 0.08
  ctx.save()
  ctx.translate(quest.x, quest.y - 12)
  ctx.strokeStyle = close ? 'rgba(87, 227, 159, 0.9)' : 'rgba(242, 200, 102, 0.86)'
  ctx.fillStyle = close ? 'rgba(87, 227, 159, 0.18)' : 'rgba(242, 200, 102, 0.14)'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.ellipse(0, 0, 60 * ring, 26 * ring, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  drawPixelNameTag(ctx, quest.x, quest.y - 170, close ? 'Tap Talk' : `Next: ${quest.zone}`, '#07100c', false, '#f2c866', true)
}

const WORLD_TILES = buildWorldTiles()

function buildWorldTiles(): TileType[][] {
  const tiles = Array.from({ length: MAP_H }, () => Array<TileType>(MAP_W).fill(T.GRASS))
  const pathTiles = buildPathSet()

  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      const dx = tx - CENTER_HUB.tx
      const dy = ty - CENTER_HUB.ty
      const seamWarpX = valueNoise(tx * 0.16, ty * 0.16, 11) * 6 - 3
      const seamWarpY = valueNoise(tx * 0.15, ty * 0.15, 23) * 6 - 3
      const variety = valueNoise(tx * 0.38, ty * 0.38, 47)
      const distCenter = Math.hypot(dx, dy)
      let tile: TileType

      if (distCenter <= 5.2) {
        tile = T.PATH
      } else if (tx < CENTER_HUB.tx + seamWarpX && ty < CENTER_HUB.ty + seamWarpY) {
        tile = variety > 0.74 ? T.FLOWER : variety > 0.42 ? T.GRASS2 : T.GRASS
      } else if (tx < CENTER_HUB.tx + seamWarpX && ty >= CENTER_HUB.ty + seamWarpY) {
        tile = variety > 0.68 ? T.COAST : variety > 0.55 ? T.SAND : T.COAST
      } else if (tx >= CENTER_HUB.tx + seamWarpX && ty < CENTER_HUB.ty + seamWarpY) {
        tile = variety > 0.6 ? T.SAND2 : T.SAND
      } else {
        tile = variety > 0.54 ? T.MYSTIC2 : T.MYSTIC
      }

      if (tx >= POND.tx - 1 && tx < POND.tx + POND.tw + 1 && ty >= POND.ty - 1 && ty < POND.ty + POND.th + 1) {
        tile = T.SAND
      }
      if (tx >= POND.tx && tx < POND.tx + POND.tw && ty >= POND.ty && ty < POND.ty + POND.th) {
        tile = T.WATER
      }
      if (pathTiles.has(tileKey(tx, ty)) && !insidePond(tx, ty)) {
        tile = T.PATH
      }
      tiles[ty][tx] = tile
    }
  }
  return tiles
}

function buildPathSet() {
  const set = new Set<string>()
  const center = CENTER_HUB
  for (const [hubX, hubY] of HUBS) {
    const vx = hubX - center.tx
    const vy = hubY - center.ty
    const length = Math.hypot(vx, vy) || 1
    const px = -vy / length
    const py = vx / length
    for (let i = 0; i <= 120; i++) {
      const t = i / 120
      const wobble = (valueNoise(t * 7, hubX * 0.2 + hubY * 0.13, 91) - 0.5) * 4
      const tx = Math.round(center.tx + vx * t + px * wobble)
      const ty = Math.round(center.ty + vy * t + py * wobble)
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          if (Math.abs(ox) + Math.abs(oy) > 1) continue
          const nx = tx + ox
          const ny = ty + oy
          if (nx < 0 || nx >= MAP_W || ny < 0 || ny >= MAP_H || insidePond(nx, ny)) continue
          set.add(tileKey(nx, ny))
        }
      }
    }
  }
  return set
}

// tilled garden plot (soil texture + crops), aligned to the tile grid
const GARDEN = { x: 480, y: 928, w: 224, h: 160 }

const patternCache = new WeakMap<HTMLImageElement, CanvasPattern>()
function tilePattern(ctx: CanvasRenderingContext2D, image: HTMLImageElement | undefined) {
  if (!image) return null
  const cached = patternCache.get(image)
  if (cached) return cached
  const pattern = ctx.createPattern(image, 'repeat')
  if (pattern) patternCache.set(image, pattern)
  return pattern
}

function drawCobblePulse(ctx: CanvasRenderingContext2D, time: number) {
  ctx.save()
  const pulseTile = Math.floor(time * 7) % 120
  let seen = 0
  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      if (WORLD_TILES[ty][tx] !== T.PATH) continue
      if (seen % 120 === pulseTile) {
        ctx.fillStyle = 'rgba(242,200,102,.32)'
        ctx.fillRect(tx * TILE_SIZE + 10, ty * TILE_SIZE + 10, 12, 12)
      }
      seen++
    }
  }
  ctx.restore()
}

function insidePond(tx: number, ty: number) {
  return tx >= POND.tx && tx < POND.tx + POND.tw && ty >= POND.ty && ty < POND.ty + POND.th
}

function tileKey(tx: number, ty: number) {
  return `${tx}:${ty}`
}

function valueNoise(x: number, y: number, seed = 0) {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const x1 = x0 + 1
  const y1 = y0 + 1
  const sx = smoothstep(x - x0)
  const sy = smoothstep(y - y0)
  const n0 = lerp(hash2(x0 + seed, y0 - seed), hash2(x1 + seed, y0 - seed), sx)
  const n1 = lerp(hash2(x0 + seed, y1 - seed), hash2(x1 + seed, y1 - seed), sx)
  return lerp(n0, n1, sy)
}

function hash2(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
  return s - Math.floor(s)
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t)
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}


function drawGround(ctx: CanvasRenderingContext2D, _time: number, assets: TemplePlayAssets) {
  // grass base across the whole world
  const grass = tilePattern(ctx, assets.props.groundGrass)
  ctx.fillStyle = grass ?? '#2d4a2d'
  ctx.fillRect(0, 0, WORLD.width, WORLD.height)

  // stone road on path tiles (pattern is world-anchored, so cells stay seamless)
  const road = tilePattern(ctx, assets.props.groundRoad)
  if (road) {
    ctx.fillStyle = road
    for (let ty = 0; ty < MAP_H; ty++) {
      for (let tx = 0; tx < MAP_W; tx++) {
        if (WORLD_TILES[ty][tx] === T.PATH) {
          ctx.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE)
        }
      }
    }
  }

  // tilled garden soil plot
  const soil = tilePattern(ctx, assets.props.groundSoil)
  if (soil) {
    ctx.fillStyle = soil
    ctx.fillRect(GARDEN.x, GARDEN.y, GARDEN.w, GARDEN.h)
  }
}

function drawPaths(ctx: CanvasRenderingContext2D, time: number) {
  drawCobblePulse(ctx, time)
}

function drawWater(ctx: CanvasRenderingContext2D, assets: TemplePlayAssets) {
  const img = assets.props.pond
  if (!img) return
  const cx = POND_RECT.x + POND_RECT.w / 2
  const cy = POND_RECT.y + POND_RECT.h / 2
  const w = POND_RECT.w + 96
  const h = Math.round((w * img.height) / img.width)
  ctx.drawImage(img, Math.round(cx - w / 2), Math.round(cy - h / 2), w, h)
}

function drawCompletedBadges(ctx: CanvasRenderingContext2D, time: number, completedIds: Set<number>) {
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
  building: BuildingSpec,
) {
  const { key, x, y, w, h, label, color } = building
  ctx.fillStyle = 'rgba(0,0,0,.24)'
  ctx.fillRect(Math.round(x - w * 0.36), Math.round(y - 16), Math.round(w * 0.72), 26)
  drawPropBottomCenter(ctx, assets, key, x, y, w, h)
  drawBuildingLabel(ctx, x, y + 12, label, color)
}

function drawBuildingLabel(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, color: string) {
  const width = Math.max(118, label.length * 11 + 24)
  ctx.fillStyle = '#07100c'
  ctx.fillRect(Math.round(x - width / 2), y, width, 30)
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.strokeRect(Math.round(x - width / 2) + 1, y + 1, width - 2, 28)
  ctx.fillStyle = color
  ctx.font = '900 16px monospace'
  ctx.fillText(label, Math.round(x - width / 2 + 12), y + 21)
}

const FLOWERS: PropKey[] = ['flowerBlue', 'flowerAmber', 'flowerCream', 'flowerYellow', 'flowerRed', 'flowerOrange', 'flowerPink', 'flowerPurple']
const GRASSES: PropKey[] = ['grass1', 'grass2', 'grass3']
const CROP_STAGES: PropKey[][] = [
  ['cropLeafy0', 'cropLeafy1', 'cropLeafy2', 'cropLeafy3'],
  ['cropRoot0', 'cropRoot1', 'cropRoot2', 'cropRoot3'],
]

function drawEnvironmentProps(ctx: CanvasRenderingContext2D, time: number, assets: TemplePlayAssets) {
  // grass tufts scattered across open ground
  for (let i = 0; i < 90; i++) {
    const x = 90 + ((i * 257) % (WORLD.width - 180))
    const y = 120 + ((i * 181) % (WORLD.height - 240))
    if (isNearMainPlaySpace(x, y)) continue
    drawProp(ctx, assets, GRASSES[i % GRASSES.length], x, y, 38, 30)
  }

  // wildflowers (8 colours) sprinkled around, denser off the play space
  for (let i = 0; i < 46; i++) {
    const x = 120 + ((i * 293) % (WORLD.width - 240))
    const y = 140 + ((i * 211) % (WORLD.height - 280))
    if (isNearMainPlaySpace(x, y) && i % 3 !== 0) continue
    const bob = Math.sin(time * 1.7 + i) * 1.5
    drawProp(ctx, assets, FLOWERS[i % FLOWERS.length], x, y + bob, 34, 33)
  }

  // garden crop rows on the tilled soil plot (varied growth stages)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const stages = CROP_STAGES[row % CROP_STAGES.length]
      const key = stages[(col + row) % stages.length]
      const x = GARDEN.x + 32 + col * 48
      const y = GARDEN.y + 40 + row * 48
      drawPropBottomCenter(ctx, assets, key, x, y, 40, 44)
    }
  }

  // fishing nook on the east bank of the pond
  drawProp(ctx, assets, 'fishingBobber', 352, 884 + Math.sin(time * 1.6) * 2, 20, 24)
  drawProp(ctx, assets, 'fishingNet', 506, 992, 50, 40)
  drawPropBottomCenter(ctx, assets, 'fishingBucket', 466, 992, 40, 50)

  drawFloatingLeaves(ctx, time)
}

function drawFloatingLeaves(ctx: CanvasRenderingContext2D, time: number) {
  ctx.save()
  for (let i = 0; i < 42; i++) {
    const drift = Math.sin(time * 0.8 + i * 1.9) * 18
    const x = (i * 197 + time * (14 + (i % 4) * 5) + drift) % WORLD.width
    const y = (i * 113 + time * (8 + (i % 3) * 4)) % WORLD.height
    const size = 6 + (i % 4) * 2
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(Math.sin(time * 1.2 + i) * 0.7)
    ctx.fillStyle = i % 3 === 0 ? 'rgba(185, 255, 102, .46)' : i % 3 === 1 ? 'rgba(87, 227, 159, .42)' : 'rgba(242, 200, 102, .36)'
    ctx.fillRect(-size / 2, -size / 3, size, Math.max(3, size / 2))
    ctx.fillRect(0, -size / 2, Math.max(2, size / 3), size)
    ctx.restore()
  }
  ctx.restore()
}

function isNearMainPlaySpace(x: number, y: number) {
  const blockedRects = [
    [230, 40, 950, 660],
    [900, 40, 1560, 660],
    [400, 600, 960, 940],
    [470, 940, 1010, 1210],
    [1010, 760, 1560, 1190],
    [POND_RECT.x - 90, POND_RECT.y - 90, POND_RECT.x + POND_RECT.w + 90, POND_RECT.y + POND_RECT.h + 320],
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

function drawPropBottomCenter(
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
  ctx.drawImage(image, Math.round(x - w / 2), Math.round(y - h), Math.round(w), Math.round(h))
}

function drawActors(
  ctx: CanvasRenderingContext2D,
  time: number,
  completedIds: Set<number>,
  nearNpcId: number | null,
  player: PlayerState,
  assets: TemplePlayAssets,
) {
  const actors: Array<{ y: number; draw: () => void }> = BUILDINGS.map((building) => ({
    y: building.y,
    draw: () => drawBuildingAsset(ctx, assets, building),
  }))
  SCENERY.forEach((s) => {
    actors.push({
      y: s.y,
      draw: () => {
        ctx.fillStyle = 'rgba(0,0,0,.22)'
        ctx.fillRect(Math.round(s.x - s.w * 0.26), Math.round(s.y - 8), Math.round(s.w * 0.52), 9)
        drawPropBottomCenter(ctx, assets, s.key, s.x, s.y, s.w, s.h)
      },
    })
  })
  const ambientMotions = AMBIENT_NPCS.map((npc, index) => ambientNpcMotion(npc, index, time))

  drawAmbientInteractions(ctx, time, ambientMotions)

  AMBIENT_NPCS.forEach((npc, index) => {
    const motion = ambientMotions[index]
    actors.push({
      y: motion.y,
      draw: () => {
        drawNpcActivity(ctx, npc, motion, index, time, 'behind')
        drawSpriteActor(ctx, assets, {
          sprite: npc.sprite,
          x: motion.x,
          y: motion.y,
          name: npc.name,
          tone: npc.color,
          accent: npc.accent,
          time,
          seed: index * 0.73,
          compact: true,
          moving: motion.moving,
          direction: motion.direction,
        })
        drawNpcActivity(ctx, npc, motion, index, time, 'front')
      },
    })
  })

  QUESTS.forEach((quest) => {
    const completed = completedIds.has(quest.quizId)
    const action = questNpcMotion(quest, time)
    actors.push({
      y: action.y,
      draw: () => {
        drawQuestStationActivity(ctx, quest, action, time, 'behind')
        drawSpriteActor(ctx, assets, {
          sprite: quest.sprite,
          x: action.x,
          y: action.y,
          name: completed ? `${quest.npc} OK` : quest.npc,
          tone: quest.color,
          accent: quest.accent,
          time,
          seed: quest.id * 0.48,
          near: nearNpcId === quest.id,
          completed,
          moving: action.moving,
          direction: action.direction,
        })
        drawQuestStationActivity(ctx, quest, action, time, 'front')
      },
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
  drawCompletedBadges(ctx, time, completedIds)
  drawNpcEventLayer(ctx, time, ambientMotions)
}

function ambientNpcMotion(npc: AmbientNpc, index: number, time: number): NpcMotion {
  const activityPulse = (Math.sin(time * 1.8 + index * 0.77) + 1) / 2
  const persona = npc.persona ?? (index % 3 === 0 ? 'homebody' : index % 3 === 1 ? 'wanderer' : 'pacer')
  if (npc.activity === 'wander') {
    const radius = persona === 'wanderer' ? 110 : persona === 'pacer' ? 40 : 70
    const phase = time * (persona === 'pacer' ? 1.45 : 0.56) + index * 1.3
    const target = {
      x: npc.x + Math.sin(phase) * radius,
      y: npc.y + Math.cos(phase * 0.72) * radius * 0.55,
    }
    const safe = safeNpcTarget(npc.x, npc.y, target.x, target.y)
    const direction: PlayerState['dir'] = safe.x > npc.x ? 'right' : safe.x < npc.x ? 'left' : 'down'
    const idleChance = persona === 'homebody' ? 0.6 : persona === 'wanderer' ? 0.3 : 0.18
    const idling = activityPulse < idleChance
    return { x: idling ? npc.x : safe.x, y: idling ? npc.y : safe.y, moving: !idling, direction, activityPulse }
  }
  if (npc.activity === 'stroll') {
    const route = [
      { x: npc.x, y: npc.y },
      { x: 800, y: 670 },
      { x: index % 2 === 0 ? 1260 : 410, y: index % 2 === 0 ? 940 : 350 },
      { x: npc.x, y: npc.y },
    ]
    const segment = Math.floor(time * 0.16 + index) % (route.length - 1)
    const t = (time * 0.16 + index) % 1
    const from = route[segment]
    const to = route[segment + 1]
    const target = { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t) }
    const safe = safeNpcTarget(from.x, from.y, target.x, target.y)
    return { x: safe.x, y: safe.y, moving: true, direction: to.x > from.x ? 'right' : 'left', activityPulse }
  }
  if (npc.activity === 'gather') {
    const phase = time * 0.55 + index
    const x = npc.x + Math.sin(phase) * 22
    const y = npc.y + Math.cos(phase * 1.2) * 12
    return { x, y, moving: activityPulse > 0.5, direction: 'right', activityPulse }
  }
  if (npc.activity === 'couple') {
    const partner = AMBIENT_NPCS.find((item) => item.name === npc.pair)
    const direction: PlayerState['dir'] = partner && partner.x < npc.x ? 'left' : 'right'
    return { x: npc.x, y: npc.y + Math.sin(time * 1.4 + index) * 2, moving: false, direction, activityPulse }
  }
  if (npc.activity === 'dance') {
    const step = Math.floor(time * 3 + index) % 4
    const direction: PlayerState['dir'] = step === 0 ? 'down' : step === 1 ? 'right' : step === 2 ? 'up' : 'left'
    return { x: npc.x + Math.sin(time * 5 + index) * 6, y: npc.y + Math.sin(time * 7 + index) * 4, moving: false, direction, activityPulse }
  }
  if (npc.activity === 'fish' || npc.activity === 'meditate' || npc.activity === 'sit' || npc.activity === 'tend') {
    const direction: PlayerState['dir'] = npc.activity === 'fish' ? 'right' : npc.activity === 'tend' ? 'down' : 'left'
    return { x: npc.x, y: npc.y + Math.sin(time * 1.6 + index) * 2, moving: false, direction, activityPulse }
  }
  return {
    x: npc.x,
    y: npc.y,
    moving: false,
    direction: 'down' as PlayerState['dir'],
    activityPulse,
  }
}

function safeNpcTarget(homeX: number, homeY: number, targetX: number, targetY: number) {
  const x = clamp(targetX, 70, WORLD.width - 70)
  const y = clamp(targetY, 70, WORLD.height - 70)
  if (isMovementBlocked(x, y) || pathBlocked(homeX, homeY, x, y)) return { x: homeX, y: homeY }
  return { x, y }
}

function drawAmbientInteractions(ctx: CanvasRenderingContext2D, time: number, motions: NpcMotion[]) {
  NPC_INTERACTIONS.forEach((link, index) => {
    const from = motions[link.from]
    const to = motions[link.to]
    if (!from || !to) return
    const phase = (time * (0.22 + index * 0.025)) % 1
    const sx = from.x
    const sy = from.y - 86
    const ex = to.x
    const ey = to.y - 86
    const cx = sx + (ex - sx) * phase
    const cy = sy + (ey - sy) * phase + Math.sin(phase * Math.PI) * -38

    ctx.save()
    ctx.globalAlpha = 0.42
    ctx.strokeStyle = link.color
    ctx.lineWidth = 3
    ctx.setLineDash([8, 18])
    ctx.lineDashOffset = -time * 14
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.quadraticCurveTo((sx + ex) / 2, Math.min(sy, ey) - 52, ex, ey)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.globalAlpha = 0.96
    drawTinyScroll(ctx, cx, cy, link.color, time + index)
    if (Math.sin(time * 0.8 + index) > 0.72) {
      drawMiniBubble(ctx, (sx + ex) / 2, Math.min(sy, ey) - 70, link.label, link.color)
    }
    ctx.restore()
  })
}

function drawNpcEventLayer(ctx: CanvasRenderingContext2D, time: number, motions: NpcMotion[]) {
  const randomTexts = ['LOL', 'GG', 'WAGMI', '?!', 'ser', 'gm']
  const eventWindow = time % 9
  if (eventWindow < 1.35) {
    const index = Math.floor(time / 9) % motions.length
    const motion = motions[index]
    if (motion) {
      const lift = Math.sin((eventWindow / 1.35) * Math.PI) * 14
      drawMiniBubble(ctx, motion.x, motion.y - 148 - lift, randomTexts[index % randomTexts.length], '#f2c866')
      ctx.save()
      ctx.translate(motion.x, motion.y - 72 - lift)
      ctx.rotate((eventWindow / 1.35) * Math.PI * 2)
      ctx.strokeStyle = '#f2c866'
      ctx.lineWidth = 3
      ctx.strokeRect(-12, -12, 24, 24)
      ctx.restore()
    }
  }

  const socialWindow = time % 4.5
  if (socialWindow < 3.75) {
    const pair = nearestSocialPair(motions)
    if (pair) {
      const emotes = ['!', 'note', 'spark', '~', '?']
      const turn = Math.floor(socialWindow / 0.75)
      const active = turn % 2 === 0 ? pair.a : pair.b
      drawMiniBubble(ctx, active.x, active.y - 142, emotes[turn % emotes.length], '#57e39f')
      ctx.save()
      ctx.strokeStyle = 'rgba(87,227,159,.48)'
      ctx.lineWidth = 3
      ctx.setLineDash([5, 8])
      ctx.beginPath()
      ctx.moveTo(pair.a.x, pair.a.y - 82)
      ctx.lineTo(pair.b.x, pair.b.y - 82)
      ctx.stroke()
      ctx.restore()
    }
  }

  const greetWindow = time % 3.2
  if (greetWindow < 1.3) {
    const greeters = [1, 8, 11]
    const index = greeters[Math.floor(time / 3.2) % greeters.length]
    const motion = motions[index]
    if (!motion) return
    const scale = easeOutBack(Math.min(1, greetWindow / 0.3))
    ctx.save()
    ctx.translate(motion.x, motion.y - 154)
    ctx.scale(scale, scale)
    drawMiniBubble(ctx, 0, 0, 'Gritual!', '#ffad72')
    ctx.restore()
  }
}

function nearestSocialPair(motions: NpcMotion[]) {
  for (let i = 0; i < motions.length; i++) {
    for (let j = i + 1; j < motions.length; j++) {
      const a = motions[i]
      const b = motions[j]
      if (Math.hypot(a.x - b.x, a.y - b.y) < 130) return { a, b }
    }
  }
  return null
}

function easeOutBack(t: number) {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function drawNpcActivity(
  ctx: CanvasRenderingContext2D,
  npc: AmbientNpc,
  motion: NpcMotion,
  index: number,
  time: number,
  layer: 'behind' | 'front',
) {
  const x = motion.x
  const y = motion.y
  const pulse = motion.activityPulse

  if (layer === 'behind') {
    if (npc.activity === 'meditate' || npc.activity === 'sit') {
      drawRuneCircle(ctx, x, y - 4, npc.accent, time + index)
    }
    if (npc.activity === 'wander' && npc.persona === 'pacer') {
      drawWorkBench(ctx, x - 52, y - 24, npc.accent, time)
    }
    if (npc.activity === 'tend') {
      drawWateringTrail(ctx, x, y, npc.accent, time + index)
    }
    if (npc.activity === 'fish') {
      drawFishingRig(ctx, x, y, time)
    }
    if (npc.activity === 'gather' || npc.activity === 'couple') {
      drawGuidePing(ctx, x, y - 70, npc.accent, time + index)
    }
    return
  }

  switch (npc.activity) {
    case 'tend':
      drawTinyTool(ctx, x + 30, y - 48, 'watering', npc.accent, time)
      if (pulse > 0.72) drawMiniBubble(ctx, x, y - 136, 'grow', npc.accent)
      break
    case 'gather':
      drawTinyTool(ctx, x - 34, y - 54, 'stamp', npc.accent, time)
      if (pulse > 0.68) drawMiniBubble(ctx, x, y - 136, 'verified', npc.accent)
      break
    case 'meditate':
      drawFloatingOrb(ctx, x + 28, y - 94, npc.accent, time)
      if (pulse > 0.75) drawMiniBubble(ctx, x, y - 136, 'spark', npc.accent)
      break
    case 'sit':
      drawShieldSpark(ctx, x + 34, y - 78, npc.accent, time)
      drawWaveMarks(ctx, x - 38, y - 96, npc.accent, time)
      break
    case 'stroll':
      drawSignalTicks(ctx, x + 34, y - 90, npc.accent, time)
      if (pulse > 0.78) drawMiniBubble(ctx, x, y - 136, 'ping', npc.accent)
      break
    case 'dance':
      drawDanceNotes(ctx, x, y - 112, npc.accent, time)
      break
    case 'wander':
      drawTinyScroll(ctx, x - 32, y - 62, npc.accent, time)
      if (pulse > 0.84) drawMiniBubble(ctx, x, y - 136, npc.persona === 'pacer' ? 'busy' : 'gm', npc.accent)
      break
    case 'fish':
      if (pulse > 0.78) drawMiniBubble(ctx, x + 48, y - 110, '!', npc.accent)
      break
    case 'couple':
      drawHearts(ctx, x, y - 118, npc.accent, time)
      break
  }
}

function drawTinyScroll(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, time: number) {
  ctx.save()
  ctx.translate(Math.round(x), Math.round(y + Math.sin(time * 4) * 2))
  ctx.rotate(Math.sin(time * 2.2) * 0.08)
  ctx.fillStyle = '#f7f1df'
  ctx.strokeStyle = '#07100c'
  ctx.lineWidth = 2
  ctx.fillRect(-13, -8, 26, 16)
  ctx.strokeRect(-13, -8, 26, 16)
  ctx.fillStyle = color
  ctx.fillRect(-8, -3, 16, 3)
  ctx.fillRect(-8, 3, 10, 3)
  ctx.restore()
}

function drawMiniBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string) {
  ctx.save()
  ctx.font = '900 11px monospace'
  const width = Math.ceil(ctx.measureText(text).width) + 16
  ctx.fillStyle = 'rgba(7, 16, 12, .88)'
  ctx.fillRect(Math.round(x - width / 2), Math.round(y), width, 22)
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.strokeRect(Math.round(x - width / 2) + 0.5, Math.round(y) + 0.5, width - 1, 21)
  ctx.fillStyle = '#f7f1df'
  ctx.fillText(text, Math.round(x - width / 2 + 8), Math.round(y + 15))
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x - 4), Math.round(y + 21), 8, 5)
  ctx.restore()
}

function drawRuneCircle(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, time: number) {
  const radius = 28 + Math.sin(time * 2) * 3
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(time * 0.35)
  ctx.strokeStyle = color
  ctx.globalAlpha = 0.56
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.ellipse(0, 0, radius, 13, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.globalAlpha = 0.78
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6
    ctx.fillStyle = i % 2 === 0 ? color : '#f2c866'
    ctx.fillRect(Math.cos(angle) * radius - 3, Math.sin(angle) * 13 - 3, 6, 6)
  }
  ctx.restore()
}

function drawWorkBench(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, time: number) {
  ctx.save()
  ctx.fillStyle = 'rgba(7, 16, 12, .36)'
  ctx.fillRect(x - 4, y + 22, 80, 10)
  ctx.fillStyle = '#7b4a2b'
  ctx.fillRect(x, y, 70, 20)
  ctx.fillStyle = '#3d2619'
  ctx.fillRect(x + 8, y + 20, 8, 22)
  ctx.fillRect(x + 54, y + 20, 8, 22)
  ctx.fillStyle = color
  ctx.fillRect(x + 20 + Math.sin(time * 4) * 4, y - 8, 12, 10)
  ctx.restore()
}

function drawWateringTrail(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, time: number) {
  ctx.save()
  for (let i = 0; i < 7; i++) {
    const dx = 24 + i * 8
    const dy = -44 + ((time * 42 + i * 13) % 42)
    ctx.fillStyle = i % 2 === 0 ? color : '#78ecff'
    ctx.globalAlpha = 0.62
    ctx.fillRect(x + dx, y + dy, 4, 7)
  }
  ctx.restore()
}

function drawGuidePing(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, time: number) {
  ctx.save()
  ctx.translate(x, y)
  const pulse = 1 + ((time * 1.8) % 1) * 0.6
  ctx.strokeStyle = color
  ctx.globalAlpha = 0.5 * (2 - pulse)
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.ellipse(0, 0, 22 * pulse, 10 * pulse, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function drawTinyTool(ctx: CanvasRenderingContext2D, x: number, y: number, kind: 'watering' | 'stamp', color: string, time: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(kind === 'stamp' ? Math.sin(time * 4) * 0.18 : -0.25)
  ctx.fillStyle = '#7b4a2b'
  ctx.fillRect(-3, -17, 6, 28)
  ctx.fillStyle = color
  if (kind === 'stamp') {
    const stampY = 8 + Math.sin(time * 5) * 3
    ctx.fillRect(-12, stampY, 24, 10)
    ctx.strokeStyle = '#07100c'
    ctx.lineWidth = 2
    ctx.strokeRect(-12, stampY, 24, 10)
  } else {
    ctx.fillRect(-14, -3, 25, 16)
    ctx.fillRect(8, -8, 14, 6)
    ctx.strokeStyle = '#07100c'
    ctx.lineWidth = 2
    ctx.strokeRect(-14, -3, 25, 16)
  }
  ctx.restore()
}

function drawTinySign(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string) {
  ctx.save()
  ctx.fillStyle = '#4b3427'
  ctx.fillRect(x - 3, y + 14, 6, 24)
  ctx.fillStyle = color
  ctx.strokeStyle = '#07100c'
  ctx.lineWidth = 2
  ctx.fillRect(x - 18, y, 36, 18)
  ctx.strokeRect(x - 18, y, 36, 18)
  ctx.fillStyle = '#07100c'
  ctx.font = '900 10px monospace'
  ctx.fillText(text, x - 9, y + 13)
  ctx.restore()
}

function drawFloatingOrb(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, time: number) {
  ctx.save()
  ctx.translate(x, y + Math.sin(time * 2.4) * 5)
  ctx.fillStyle = color
  ctx.globalAlpha = 0.82
  ctx.fillRect(-9, -9, 18, 18)
  ctx.fillStyle = '#f7f1df'
  ctx.fillRect(-3, -3, 6, 6)
  ctx.restore()
}

function drawShieldSpark(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, time: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.strokeStyle = color
  ctx.fillStyle = 'rgba(7, 16, 12, .38)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(0, -18)
  ctx.lineTo(17, -7)
  ctx.lineTo(11, 16)
  ctx.lineTo(0, 24)
  ctx.lineTo(-11, 16)
  ctx.lineTo(-17, -7)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  for (let i = 0; i < 4; i++) {
    const a = time * 2 + i * 1.57
    ctx.fillStyle = color
    ctx.fillRect(Math.cos(a) * 27, Math.sin(a) * 18, 5, 5)
  }
  ctx.restore()
}

function drawSignalTicks(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, time: number) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  for (let i = 0; i < 3; i++) {
    const radius = 10 + i * 12 + Math.sin(time * 4 + i) * 2
    ctx.globalAlpha = 0.35 + i * 0.16
    ctx.beginPath()
    ctx.arc(x, y, radius, -0.9, 0.9)
    ctx.stroke()
  }
  ctx.restore()
}

function drawHammerSwing(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, time: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(-0.55 + Math.sin(time * 5) * 0.25)
  ctx.fillStyle = '#7b4a2b'
  ctx.fillRect(-3, -18, 6, 36)
  ctx.fillStyle = color
  ctx.fillRect(-15, -24, 30, 12)
  ctx.strokeStyle = '#07100c'
  ctx.lineWidth = 2
  ctx.strokeRect(-15, -24, 30, 12)
  ctx.restore()
}

function drawDanceNotes(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, time: number) {
  ctx.save()
  for (let i = 0; i < 3; i++) {
    const px = x - 24 + i * 22 + Math.sin(time * 3 + i) * 5
    const py = y - ((time * 26 + i * 19) % 44)
    ctx.fillStyle = i % 2 === 0 ? color : '#f2c866'
    ctx.fillRect(px, py, 7, 18)
    ctx.fillRect(px + 7, py + 12, 10, 7)
  }
  ctx.restore()
}

function drawPortalGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, time: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(time * 0.8)
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  ctx.strokeRect(-15, -15, 30, 30)
  ctx.rotate(-time * 1.6)
  ctx.strokeStyle = '#f2c866'
  ctx.strokeRect(-9, -9, 18, 18)
  ctx.restore()
}

function drawWaveMarks(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, time: number) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  for (let i = 0; i < 3; i++) {
    const offset = i * 9 + Math.sin(time * 3 + i) * 2
    ctx.beginPath()
    ctx.moveTo(x + offset, y - 10)
    ctx.quadraticCurveTo(x + offset + 9, y - 18, x + offset + 18, y - 10)
    ctx.stroke()
  }
  ctx.restore()
}

function drawFishingRig(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  const bobX = POND_RECT.x + POND_RECT.w - 36
  const bobY = POND_RECT.y + 72 + Math.sin(time * 3) * 5
  ctx.save()
  ctx.strokeStyle = 'rgba(247,241,223,.72)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x + 22, y - 54)
  ctx.quadraticCurveTo((x + bobX) / 2, y - 94, bobX, bobY)
  ctx.stroke()
  ctx.fillStyle = '#ff8066'
  ctx.fillRect(bobX - 4, bobY - 4, 8, 8)
  if (Math.sin(time * 1.2) > 0.78) {
    ctx.fillStyle = '#f2c866'
    ctx.fillRect(bobX + 10, bobY - 22, 7, 7)
    ctx.fillStyle = '#f7f1df'
    ctx.fillRect(bobX + 22, bobY - 33, 9, 9)
  }
  ctx.restore()
}

function drawHearts(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, time: number) {
  ctx.save()
  for (let i = 0; i < 3; i++) {
    const yy = y - ((time * 22 + i * 18) % 48)
    const xx = x + Math.sin(time * 2 + i) * 12
    ctx.fillStyle = i % 2 === 0 ? '#ff7ad9' : color
    ctx.fillRect(xx - 4, yy, 8, 8)
    ctx.fillRect(xx + 2, yy - 4, 8, 8)
    ctx.fillRect(xx - 1, yy + 6, 7, 7)
  }
  ctx.restore()
}

function questNpcMotion(quest: QuestNpc, time: number) {
  const phase = time + quest.id * 0.83
  if (quest.id % 3 === 0) {
    return {
      x: quest.x + Math.sin(phase * 1.5) * 5,
      y: quest.y + Math.sin(phase * 3.2) * 3,
      moving: false,
      direction: Math.sin(phase * 1.5) > 0 ? 'right' as const : 'left' as const,
    }
  }
  if (quest.id % 3 === 1) {
    return {
      x: quest.x + Math.sin(phase * 0.72) * 16,
      y: quest.y,
      moving: true,
      direction: Math.cos(phase * 0.72) > 0 ? 'right' as const : 'left' as const,
    }
  }
  return {
    x: quest.x,
    y: quest.y + Math.sin(phase * 2.2) * 4,
    moving: false,
    direction: 'down' as const,
  }
}

function drawQuestStationActivity(
  ctx: CanvasRenderingContext2D,
  quest: QuestNpc,
  motion: { x: number; y: number; moving: boolean; direction: PlayerState['dir'] },
  time: number,
  layer: 'behind' | 'front',
) {
  const x = motion.x
  const y = motion.y
  if (layer === 'behind') {
    if (quest.zone === 'Temple Gate') drawGuidePing(ctx, x, y - 66, quest.accent, time + quest.id)
    if (quest.zone === 'RWA Vault') drawRuneCircle(ctx, x, y - 8, quest.accent, time + quest.id)
    if (quest.zone === 'Agent Camp') drawWorkBench(ctx, x - 48, y - 22, quest.accent, time + quest.id)
    if (quest.zone === 'Signal Tower') drawSignalTicks(ctx, x, y - 92, quest.accent, time + quest.id)
    if (quest.zone === 'SCALE Lab') drawPortalGlyph(ctx, x + 36, y - 72, quest.accent, time + quest.id)
    return
  }

  if (quest.zone === 'Temple Gate') {
    drawTinySign(ctx, x + 36, y - 56, 'START', quest.accent)
  } else if (quest.zone === 'RWA Vault') {
    drawTinyTool(ctx, x - 34, y - 54, 'stamp', quest.accent, time + quest.id)
  } else if (quest.zone === 'Agent Camp') {
    drawTinyScroll(ctx, x + 36, y - 70, quest.accent, time + quest.id)
  } else if (quest.zone === 'Signal Tower') {
    drawFloatingOrb(ctx, x + 32, y - 94, quest.accent, time + quest.id)
  } else if (quest.zone === 'SCALE Lab') {
    drawHammerSwing(ctx, x + 32, y - 58, quest.accent, time + quest.id)
  }
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
  const walkPhase = Math.sin(time * 12 + seed)
  const bodyOffset = player
    ? moving ? -Math.abs(walkPhase) * 5 : -Math.abs(Math.sin(time * 3.2 + seed)) * 1.6
    : moving ? -Math.abs(walkPhase) * 2.6 : -Math.abs(Math.sin(time * 4 + seed)) * 2.6
  const facingDir = direction === 'left' ? -1 : direction === 'right' ? 1 : 0.35
  const rotation = player && moving ? walkPhase * 0.06 * facingDir : 0
  const drawW = player ? sheet.drawW * 1.04 : sheet.drawW
  const drawH = player ? sheet.drawH * 1.04 : sheet.drawH

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

  ctx.save()
  ctx.translate(Math.round(x), Math.round(y))
  ctx.rotate(rotation)
  ctx.drawImage(
    image,
    frame * sheet.frameW,
    0,
    sheet.frameW,
    sheet.frameH,
    Math.round(-drawW / 2),
    Math.round(-drawH + bodyOffset),
    drawW,
    drawH,
  )
  ctx.restore()

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

function drawPixelNameTag(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string, compact = false, border = '#f2c866', filled = false) {
  const fontSize = compact ? 11 : 12
  ctx.font = `900 ${fontSize}px monospace`
  const width = Math.ceil(ctx.measureText(text).width) + 16
  ctx.fillStyle = filled ? border : 'rgba(7, 16, 12, .9)'
  ctx.fillRect(Math.round(x - width / 2), Math.round(y), width, compact ? 20 : 22)
  ctx.strokeStyle = filled ? '#07100c' : border
  ctx.lineWidth = 1
  ctx.strokeRect(Math.round(x - width / 2) + 0.5, Math.round(y) + 0.5, width - 1, (compact ? 20 : 22) - 1)
  ctx.fillStyle = color
  ctx.fillText(text, Math.round(x - width / 2 + 8), Math.round(y + (compact ? 14 : 16)))
}

function drawWeather(ctx: CanvasRenderingContext2D, camera: { x: number; y: number }, width: number, height: number, time: number) {
  ctx.save()
  ctx.translate(camera.x, camera.y)
  for (let i = 0; i < 16; i++) {
    const x = ((i * 190 + time * (18 + (i % 3) * 6)) % (width + 300)) - 170
    const y = 28 + (i * 47 + Math.sin(time * 0.4 + i) * 18) % Math.max(120, height * 0.46)
    ctx.fillStyle = 'rgba(247,241,223,.13)'
    ctx.fillRect(x, y, 104, 18)
    ctx.fillRect(x + 22, y - 12, 66, 18)
    ctx.fillRect(x + 52, y + 11, 46, 12)
  }
  const wind = Math.sin(time * 0.47) * 22
  for (let layer = 0; layer < 2; layer++) {
    ctx.strokeStyle = layer === 0 ? 'rgba(210,232,255,.22)' : 'rgba(247,241,223,.18)'
    ctx.lineWidth = layer === 0 ? 2 : 1
    const count = layer === 0 ? 58 : 42
    for (let i = 0; i < count; i++) {
      const speed = layer === 0 ? 310 : 220
      const x = (i * 73 + time * (speed + (i % 5) * 12) + wind * 5) % (width + 140) - 70
      const y = (i * 97 + time * (410 + (i % 4) * 30)) % (height + 190) - 40
      const slant = -10 + wind * 0.28 + Math.sin(time + i) * 4
      const length = layer === 0 ? 34 + (i % 3) * 8 : 21 + (i % 4) * 5
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + slant, y + length)
      ctx.stroke()
    }
  }

  for (let i = 0; i < 18; i++) {
    const x = (i * 131 + time * 70) % (width + 80) - 40
    const y = (i * 73 + time * 46) % (height + 120) - 20
    ctx.fillStyle = i % 2 === 0 ? 'rgba(185,255,102,.34)' : 'rgba(87,227,159,.28)'
    ctx.fillRect(x + Math.sin(time + i) * 7, y, 9, 5)
  }

  ctx.strokeStyle = 'rgba(210, 251, 255, .3)'
  ctx.lineWidth = 2
  for (let i = 0; i < 10; i++) {
    const x = POND_RECT.x - camera.x + 24 + ((i * 31 + time * 30) % Math.max(40, POND_RECT.w - 48))
    const y = POND_RECT.y - camera.y + 24 + ((i * 23) % Math.max(40, POND_RECT.h - 48))
    ctx.beginPath()
    ctx.ellipse(x, y, 12 + Math.sin(time * 3 + i) * 4, 5, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

function drawShootingStar(ctx: CanvasRenderingContext2D, camera: { x: number; y: number }, width: number, height: number, time: number) {
  const cycle = Math.floor(time / 14)
  if (hash2(cycle, 77) < 0.5) return
  const local = time % 14
  if (local > 0.9) return
  const progress = local / 0.9
  const sx = camera.x + 90 + hash2(cycle, 13) * Math.max(120, width - 280)
  const sy = camera.y + 70 + hash2(cycle, 29) * Math.max(80, height * 0.38)
  const x = sx + 260 * progress
  const y = sy + 120 * progress
  ctx.save()
  ctx.globalAlpha = progress < 0.55 ? 1 : 1 - (progress - 0.55) / 0.45
  ctx.strokeStyle = 'rgba(247,241,223,.78)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(x - 54, y - 25)
  ctx.lineTo(x, y)
  ctx.stroke()
  ctx.fillStyle = '#f2c866'
  ctx.fillRect(x - 4, y - 4, 8, 8)
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
