import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, CheckCircle2, Loader2, Sparkles, XCircle } from 'lucide-react'
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
  topic: string
  dialogue: string[]
  activity: AmbientActivity
  persona?: NpcPersona
  pair?: string
}

type AmbientActivity =
  | 'wander'
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
  | 'npcKGufran'
  | 'npcRikky'
  | 'npcVibevortex'
  | 'npcWisnu'
  | 'npcRaka'
  | 'npcJepanya'
  | 'npcAqc'
  | 'npcDp'
  | 'npcIshu'
  | 'npcJeams'
  | 'npcKoushik'
  | 'npcKingJ'
  | 'npcRichard12'
  | 'npcLuka'
  | 'npcSilverwave'
  | 'npcSuleyman'
  | 'npcYozi'
  | 'npcDora'
  | 'npcDarma'
  | 'npcFlippedFace'
  | 'npcEcelannister'
  | 'npcAli'
  | 'npcLongLife'
  | 'npcBjoestar'
  | 'npcKeep'
  | 'npcSukanto'
  | 'npcElias'
  | 'npcSza'
  | 'npcSpider'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const
const MAP_W = 58
const MAP_H = 46
const TILE_SIZE = 32
const WORLD = { width: MAP_W * TILE_SIZE, height: MAP_H * TILE_SIZE }
const CENTER_HUB = { tx: 29, ty: 23 }
const HUBS = [
  [12, 9],
  [12, 34],
  [49, 11],
  [48, 36],
] as const
const POND = { tx: 5, ty: 27, tw: 8, th: 6 }
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
const DESKTOP_CAMERA_ZOOM = 0.78
const TABLET_CAMERA_ZOOM = 0.68
const MOBILE_CAMERA_ZOOM = 0.52
const RIALO_SIGN_INTERACT = { x: 928, y: 860 }
const RIALO_SIGN_PROFILE_URL = 'https://x.com/nxrskyaa'

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
  // park set
  | 'parkBench'
  | 'parkLantern'
  | 'parkBush'
  | 'parkPlanter'
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
  | 'buildingNenMatcha'
  | 'buildingRialoSign'

const SPRITES: Record<SpriteKey, SpriteSheet> = {
  nxr: { src: '/temple-play/sprites/nxr-v2.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcOracle: { src: '/temple-play/characters/walk/vika-joestar.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcForestGuide: { src: '/temple-play/characters/walk/ade.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcBuilder: { src: '/temple-play/characters/walk/barong.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcCaptain: { src: '/temple-play/characters/walk/eric-argent.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcNavigator: { src: '/temple-play/characters/walk/garuda.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcShadowAgent: { src: '/temple-play/characters/walk/rollins.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcSage: { src: '/temple-play/characters/walk/pinkeu.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcHerbalist: { src: '/temple-play/characters/walk/blond.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcAlchemist: { src: '/temple-play/characters/walk/dikzzy.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcKGufran: { src: '/temple-play/characters/walk/k-gufran.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcRikky: { src: '/temple-play/characters/walk/rikky.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcVibevortex: { src: '/temple-play/characters/walk/vibevortex.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcWisnu: { src: '/temple-play/characters/walk/wisnu.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcRaka: { src: '/temple-play/characters/walk/raka.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcJepanya: { src: '/temple-play/characters/walk/jepanya.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcAqc: { src: '/temple-play/characters/walk/aqc.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcDp: { src: '/temple-play/characters/walk/dp.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcIshu: { src: '/temple-play/characters/walk/ishu.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcJeams: { src: '/temple-play/characters/walk/jeams.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcKoushik: { src: '/temple-play/characters/walk/koushik.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcKingJ: { src: '/temple-play/characters/walk/kingj.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcRichard12: { src: '/temple-play/characters/walk/richard12.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcLuka: { src: '/temple-play/characters/walk/luka.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcSilverwave: { src: '/temple-play/characters/walk/silverwave.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcSuleyman: { src: '/temple-play/characters/walk/suleyman.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcYozi: { src: '/temple-play/characters/walk/yozi.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcDora: { src: '/temple-play/characters/walk/dora.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcDarma: { src: '/temple-play/characters/walk/darma.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcFlippedFace: { src: '/temple-play/characters/walk/flippedface.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcEcelannister: { src: '/temple-play/characters/walk/ecelannister.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcAli: { src: '/temple-play/characters/walk/ali.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcLongLife: { src: '/temple-play/characters/walk/longlife.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcBjoestar: { src: '/temple-play/characters/walk/bjoestar.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcKeep: { src: '/temple-play/characters/walk/keep.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcSukanto: { src: '/temple-play/characters/walk/sukanto.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcElias: { src: '/temple-play/characters/walk/elias.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcSza: { src: '/temple-play/characters/walk/sza.png', frameW: 210, frameH: 280, frames: 16, drawW: 58, drawH: 82 },
  npcSpider: { src: '/temple-play/characters/walk/spider.png', frameW: 210, frameH: 280, frames: 16, drawW: 48, drawH: 62 },
}

const CHARACTER_CHOICES: Array<{ key: SpriteKey; label: string }> = [
  { key: 'nxr', label: 'NXR' },
  { key: 'npcOracle', label: 'Vika' },
  { key: 'npcForestGuide', label: 'Ade' },
  { key: 'npcBuilder', label: 'Barong' },
  { key: 'npcCaptain', label: 'Eric Argent' },
  { key: 'npcNavigator', label: 'Garuda' },
  { key: 'npcShadowAgent', label: 'Rollins' },
  { key: 'npcSage', label: 'Pinkeu' },
  { key: 'npcHerbalist', label: 'Blond' },
  { key: 'npcAlchemist', label: 'Dikzzy' },
  { key: 'npcKGufran', label: 'K.Gufran' },
  { key: 'npcRikky', label: 'Rikky' },
  { key: 'npcVibevortex', label: 'VibeVortex' },
  { key: 'npcWisnu', label: 'Wisnu' },
  { key: 'npcRaka', label: 'Raka' },
  { key: 'npcJepanya', label: 'Jepanya' },
  { key: 'npcAqc', label: 'Aqc' },
  { key: 'npcDp', label: 'DP' },
  { key: 'npcIshu', label: 'Ishu' },
  { key: 'npcJeams', label: 'Jeams' },
  { key: 'npcKoushik', label: 'Koushik' },
  { key: 'npcKingJ', label: 'KingJ' },
  { key: 'npcRichard12', label: 'Richard12' },
  { key: 'npcLuka', label: 'Luka' },
  { key: 'npcSilverwave', label: 'Silverwave' },
  { key: 'npcSuleyman', label: 'Suleyman' },
  { key: 'npcYozi', label: 'Yozi' },
  { key: 'npcDora', label: 'Dora' },
  { key: 'npcDarma', label: 'Darma' },
  { key: 'npcFlippedFace', label: 'FlippedFace' },
  { key: 'npcEcelannister', label: 'Ecelannister' },
  { key: 'npcAli', label: 'Ali' },
  { key: 'npcLongLife', label: 'LongLife' },
  { key: 'npcBjoestar', label: 'Bjoestar' },
  { key: 'npcKeep', label: 'Keep' },
  { key: 'npcSukanto', label: 'Sukanto' },
  { key: 'npcElias', label: 'Elias' },
  { key: 'npcSza', label: 'Sza' },
  { key: 'npcSpider', label: 'Spider' },
]

const RIALO_TEAM_HELPER_KEYS = new Set<SpriteKey>([
  'npcForestGuide',
  'npcAli',
  'npcAqc',
  'npcDora',
  'npcDp',
  'npcEcelannister',
  'npcCaptain',
  'npcFlippedFace',
  'npcJeams',
  'npcKGufran',
  'npcKeep',
  'npcKingJ',
  'npcKoushik',
  'npcLongLife',
  'npcLuka',
  'npcRichard12',
  'npcShadowAgent',
  'npcSilverwave',
  'npcSuleyman',
  'npcVibevortex',
  'npcYozi',
])

const CHARACTER_CHOICE_SECTIONS = [
  {
    title: 'Rialo Team & Helper',
    choices: CHARACTER_CHOICES.filter((choice) => RIALO_TEAM_HELPER_KEYS.has(choice.key)),
  },
  {
    title: 'Character Selection',
    choices: CHARACTER_CHOICES.filter((choice) => !RIALO_TEAM_HELPER_KEYS.has(choice.key)),
  },
]

function initialPlayerSprite(): SpriteKey {
  if (typeof window === 'undefined') return 'nxr'
  const stored = localStorage.getItem('temple-player-sprite') as SpriteKey | null
  return stored && CHARACTER_CHOICES.some((choice) => choice.key === stored) ? stored : 'nxr'
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
  parkBench: '/temple-play/world/park/park-bench.png',
  parkLantern: '/temple-play/world/park/park-lantern.png',
  parkBush: '/temple-play/world/park/park-bush.png',
  parkPlanter: '/temple-play/world/park/park-planter.png',
  // 10 building slots reuse 3 designs (aspect-matched to minimise distortion)
  balineseTemple: '/temple-play/world/building/building-3.png',
  buildingScaleDojo: '/temple-play/world/building/building-1.png',
  buildingStoneVault: '/temple-play/world/building/building-1.png',
  buildingTempleLodge: '/temple-play/world/building/building-2.png',
  buildingMarketHall: '/temple-play/world/building/building-2.png',
  buildingGreenhouseInn: '/temple-play/world/building/building-3.png',
  buildingOracleHouse: '/temple-play/world/building/building-1.png',
  buildingWoodenCabin: '/temple-play/world/building/warungpecel-v2.png',
  buildingNenMatcha: '/temple-play/world/building/nenmatcha.png',
  buildingOrangeCottage: '/temple-play/world/building/building-1.png',
  buildingGuildHouse: '/temple-play/world/building/building-2.png',
  buildingRialoSign: '/temple-play/world/building/rialo-sign.png',
}

const QUESTS: QuestNpc[] = [
  {
    id: 1,
    quizId: 1,
    zone: 'Temple Gate',
    npc: 'NXR',
    role: 'Builder Guide',
    sprite: 'nxr',
    x: 928,
    y: 880,
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
    npc: 'Blond',
    role: 'Asset Guardian',
    sprite: 'npcHerbalist',
    x: 1515,
    y: 470,
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
    npc: 'Rollins',
    role: 'Agent Coordinator',
    sprite: 'npcShadowAgent',
    x: 615,
    y: 1150,
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
    npc: 'Garuda',
    role: 'Signal Runner',
    sprite: 'npcNavigator',
    x: 1365,
    y: 1328,
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
    npc: 'Vika Joestar',
    role: 'SCALE Engineer',
    sprite: 'npcOracle',
    x: 320,
    y: 430,
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
  {
    name: 'Ade',
    sprite: 'npcForestGuide',
    x: 230,
    y: 420,
    color: '#57e39f',
    accent: '#78ecff',
    line: 'Forest paths are quiet, but data never sleeps.',
    topic: 'Data Spring',
    dialogue: [
      'Rialo apps can listen to live real-world data, not just old values already written onchain.',
      'Imagine weather, market prices, shipment status, or ratings flowing into a temple pool after being checked.',
      'That lets contracts and agents react to what is happening outside crypto right now.',
    ],
    activity: 'wander',
    persona: 'wanderer',
  },
  {
    name: 'Barong',
    sprite: 'npcBuilder',
    x: 1530,
    y: 1295,
    color: '#57e39f',
    accent: '#c886ff',
    line: 'Every badge is better when the ledger can verify it.',
    topic: 'Onchain Progress',
    dialogue: [
      'A local game save can disappear, but an onchain badge can be checked by anyone.',
      'Temple Play uses quests like tiny proof-of-learning stamps for your Rialo Passport.',
      'That is why progression should come from the contract, not from hidden browser memory.',
    ],
    activity: 'wander',
    persona: 'pacer',
  },
  {
    name: 'Eric Argent',
    sprite: 'npcCaptain',
    x: 1180,
    y: 950,
    color: '#78ecff',
    accent: '#ff7ad9',
    line: 'Bridge Gate scrolls carry API messages out and back.',
    topic: 'Bridge Gate',
    dialogue: [
      'Rialo is built so apps can talk to real internet services and systems.',
      'A contract can send a request, wait for an API or real-world response, then use that result.',
      'That makes blockchain apps feel closer to the apps normal people already use.',
    ],
    activity: 'stroll',
    persona: 'wanderer',
  },
  {
    name: 'Pinkeu',
    sprite: 'npcSage',
    x: 530,
    y: 1195,
    color: '#ff7ad9',
    accent: '#f2c866',
    line: 'The map gets brighter when badges are claimed.',
    topic: 'Quest Board',
    dialogue: [
      'Quests turn learning into little actions instead of long boring reading.',
      'Each badge should prove you understood one Rialo concept, like RWA, agents, or signals.',
      'The fun part is simple: explore, learn, answer, then claim the proof.',
    ],
    activity: 'tend',
    persona: 'homebody',
  },
  {
    name: 'Dikzzy',
    sprite: 'npcAlchemist',
    x: 445,
    y: 1190,
    color: '#c886ff',
    accent: '#f2c866',
    line: 'Privacy chambers turn plain scrolls into protected ones.',
    topic: 'Privacy Chamber',
    dialogue: [
      'Real-world apps often touch identity, finance, and personal messages.',
      'Not every detail should be public forever, especially when users are normal people.',
      'Rialo needs privacy patterns so useful apps can stay safe and respectful.',
    ],
    activity: 'dance',
    persona: 'homebody',
  },
  {
    name: 'K.Gufran',
    sprite: 'npcKGufran',
    x: 1110,
    y: 900,
    color: '#88d7ff',
    accent: '#ff8066',
    line: 'A response scroll always comes back through Bridge Gate.',
    topic: 'Real-World Connectivity',
    dialogue: [
      'Connectivity means contracts are not trapped inside a sealed box.',
      'They can coordinate with payments, delivery systems, databases, marketplaces, and more.',
      'Less middleware means the app can feel more direct and easier to trust.',
    ],
    activity: 'gather',
    persona: 'wanderer',
  },
  {
    name: 'Rikky',
    sprite: 'npcRikky',
    x: 1135,
    y: 1220,
    color: '#ffad72',
    accent: '#78ecff',
    line: 'Signals are tiny real-world updates with big consequences.',
    topic: 'Speed Engine',
    dialogue: [
      'Real-world apps need fast reaction, not long waiting screens.',
      'A payment, check-in, price update, or deadline can become a trigger.',
      'When signals move fast, automations and agents can respond while the moment still matters.',
    ],
    activity: 'meditate',
    persona: 'homebody',
  },
  {
    name: 'VibeVortex',
    sprite: 'npcVibevortex',
    x: 1435,
    y: 815,
    color: '#57e39f',
    accent: '#c886ff',
    line: 'I keep the ritual energy moving between quests.',
    topic: 'Grialo Ritual',
    dialogue: [
      'Grialo is the daily ritual loop: channel energy, open the mystery box, earn PTS.',
      'The box reveal is visual dopamine, but the score belongs to your onchain profile.',
      'That makes the temple feel playful while still keeping progression verifiable.',
    ],
    activity: 'dance',
    persona: 'homebody',
  },
  {
    name: 'Wisnu',
    sprite: 'npcWisnu',
    x: 760,
    y: 1210,
    color: '#f2c866',
    accent: '#88d7ff',
    line: 'Every clean signal needs a calm verifier.',
    topic: 'SCALE Verification',
    dialogue: [
      'SCALE helps define agent work before payment moves.',
      'A task needs terms, a deadline, a quality check, and a clear settlement rule.',
      'That gives AI agents safer rails before they touch real value.',
    ],
    activity: 'meditate',
    persona: 'homebody',
  },
  {
    name: 'Raka',
    sprite: 'npcRaka',
    x: 690,
    y: 360,
    color: '#ffad72',
    accent: '#57e39f',
    line: 'I patrol the gate so new explorers stay on track.',
    topic: 'Rialo Passport',
    dialogue: [
      'Your Rialo Passport is the identity layer for this temple world.',
      'It connects username, X handle, Grialo PTS, quiz PTS, and wish count.',
      'A beginner should feel like they have a home in the app before doing bigger onchain actions.',
    ],
    activity: 'stroll',
    persona: 'pacer',
  },
  {
    name: 'Jepanya',
    sprite: 'npcJepanya',
    x: 1140,
    y: 850,
    color: '#78ecff',
    accent: '#f2c866',
    line: 'Boxes, scrolls, and data all need a route home.',
    topic: 'RWA Vault',
    dialogue: [
      'RWA means real-world assets become useful inside blockchain apps.',
      'An invoice, house, ticket, or gold record should update when real-world status changes.',
      'That is the difference between a static token and an asset agents can actually use.',
    ],
    activity: 'wander',
    persona: 'wanderer',
  },
  {
    name: 'Aqc',
    sprite: 'npcAqc',
    x: 1040,
    y: 890,
    color: '#57e39f',
    accent: '#78ecff',
    line: 'The sign plaza is where every signal gets noticed.',
    topic: 'Rialo Signal Plaza',
    dialogue: [
      'The RialoSign marks the center of the map: learn, gather, then move with purpose.',
      'When many explorers meet here, it feels like the temple has a real heartbeat.',
      'Signals matter because they turn outside-world changes into app actions.',
    ],
    activity: 'wander',
    persona: 'wanderer',
  },
  {
    name: 'DP',
    sprite: 'npcDp',
    x: 575,
    y: 680,
    color: '#ffad72',
    accent: '#f2c866',
    line: 'A clear passport makes every quest easier to trust.',
    topic: 'Temple Passport',
    dialogue: [
      'Your Rialo Passport connects identity, quest proof, and score without needing a messy profile system.',
      'A wallet can hold progress, but username and X handle make the world feel human.',
      'That is why onboarding should feel familiar before the app asks for deeper Web3 actions.',
    ],
    activity: 'stroll',
    persona: 'pacer',
  },
  {
    name: 'Ishu',
    sprite: 'npcIshu',
    x: 820,
    y: 980,
    color: '#c886ff',
    accent: '#78ecff',
    line: 'Fast apps need live triggers, not sleepy buttons.',
    topic: 'Real-World Reactivity',
    dialogue: [
      'Rialo apps should react when a real event happens: payment, delivery, deadline, or price move.',
      'The app should not make users refresh forever while the world already changed.',
      'That is the difference between a static chain app and a real-world app.',
    ],
    activity: 'dance',
    persona: 'homebody',
  },
  {
    name: 'Jeams',
    sprite: 'npcJeams',
    x: 1190,
    y: 950,
    color: '#57e39f',
    accent: '#ff7ad9',
    line: 'I keep the API scrolls neat before they cross the gate.',
    topic: 'API Connectivity',
    dialogue: [
      'Real-world connectivity means smart contracts can coordinate with internet services.',
      'A request can leave the temple, check an external system, then return with a useful result.',
      'That is how blockchain starts talking to apps people already use.',
    ],
    activity: 'gather',
    persona: 'wanderer',
  },
  {
    name: 'Koushik',
    sprite: 'npcKoushik',
    x: 320,
    y: 740,
    color: '#88d7ff',
    accent: '#f2c866',
    line: 'Data needs a filter before it becomes app truth.',
    topic: 'Real-World Data',
    dialogue: [
      'Live data is useful only when the app can understand and check it.',
      'Weather, price, shipment, or review data can become an input for onchain logic.',
      'Better data makes agents and users less blind.',
    ],
    activity: 'wander',
    persona: 'wanderer',
  },
  {
    name: 'KingJ',
    sprite: 'npcKingJ',
    x: 420,
    y: 900,
    color: '#f2c866',
    accent: '#57e39f',
    line: 'A good vault turns ownership into something apps can use.',
    topic: 'RWA Utility',
    dialogue: [
      'RWA is not just making a token and calling it a day.',
      'Useful real-world assets should update with status, verification, and live conditions.',
      'Then agents can reason about them instead of staring at a static badge.',
    ],
    activity: 'meditate',
    persona: 'homebody',
  },
  {
    name: 'Richard12',
    sprite: 'npcRichard12',
    x: 1120,
    y: 1285,
    color: '#78ecff',
    accent: '#c886ff',
    line: 'SCALE keeps agent work from turning into chaos.',
    topic: 'Agent Work Terms',
    dialogue: [
      'Agents need clear tasks, limits, deadlines, and verification before payment.',
      'SCALE makes those terms easier to coordinate between users, agents, and judges.',
      'That is safer than hoping an AI did the right thing.',
    ],
    activity: 'stroll',
    persona: 'pacer',
  },
  {
    name: 'Luka',
    sprite: 'npcLuka',
    x: 1450,
    y: 845,
    color: '#ff7ad9',
    accent: '#78ecff',
    line: 'Private messages should stay private.',
    topic: 'Real-World Privacy',
    dialogue: [
      'Not every real-world interaction belongs on a public wall.',
      'Identity, finance, and personal updates need careful privacy design.',
      'A useful app protects the user while still giving the system enough proof.',
    ],
    activity: 'sit',
    persona: 'homebody',
  },
  {
    name: 'Silverwave',
    sprite: 'npcSilverwave',
    x: 1540,
    y: 925,
    color: '#78ecff',
    accent: '#f2c866',
    line: 'Signal Tower watches for the little updates that matter.',
    topic: 'Automation Signals',
    dialogue: [
      'Automation starts when a condition becomes true.',
      'A deadline passes, a delivery completes, or a price crosses a line.',
      'Rialo makes those signals easier for apps and agents to use.',
    ],
    activity: 'wander',
    persona: 'wanderer',
  },
  {
    name: 'Suleyman',
    sprite: 'npcSuleyman',
    x: 430,
    y: 1165,
    color: '#b9ff66',
    accent: '#57e39f',
    line: 'Quests are tiny lessons with proof attached.',
    topic: 'Learning Quests',
    dialogue: [
      'Temple Play makes learning interactive instead of dumping a long document on users.',
      'Talk, answer, claim, then see progress through your profile.',
      'A beginner should understand by walking the world, not just reading a pitch.',
    ],
    activity: 'tend',
    persona: 'homebody',
  },
  {
    name: 'Yozi',
    sprite: 'npcYozi',
    x: 730,
    y: 1285,
    color: '#c886ff',
    accent: '#ffad72',
    line: 'Judges make agent work less risky.',
    topic: 'Verification',
    dialogue: [
      'A judge step checks whether an output matches the requested task.',
      'That matters before payment releases or before an agent touches real-world value.',
      'Verification turns agent work from vibes into a process.',
    ],
    activity: 'dance',
    persona: 'homebody',
  },
  {
    name: 'Dora',
    sprite: 'npcDora',
    x: 875,
    y: 320,
    color: '#ffad72',
    accent: '#ff7ad9',
    line: 'The bridge is only useful if the response comes back clean.',
    topic: 'Response Loops',
    dialogue: [
      'Connectivity is a loop: ask a real system, receive the result, then act with it.',
      'Without the return path, the contract only shouts into the void.',
      'Rialo’s real-world direction is about closing that loop cleanly.',
    ],
    activity: 'stroll',
    persona: 'wanderer',
  },
  {
    name: 'Darma',
    sprite: 'npcDarma',
    x: 1450,
    y: 880,
    color: '#f2c866',
    accent: '#88d7ff',
    line: 'The best apps feel simple even when the rails are serious.',
    topic: 'Rialo UX',
    dialogue: [
      'A real-world blockchain app should not feel like homework.',
      'Good UX hides complexity until the user actually needs it.',
      'That is why this world teaches with characters, movement, and small proofs.',
    ],
    activity: 'wander',
    persona: 'wanderer',
  },
  {
    name: 'FlippedFace',
    sprite: 'npcFlippedFace',
    x: 980,
    y: 1045,
    color: '#f2c866',
    accent: '#57e39f',
    line: 'I keep the builder sign readable for new explorers.',
    topic: 'Build For Rialo',
    dialogue: [
      'Rialo Temple is a gamified education world built for Rialo by nxrskyaa.',
      'The goal is simple: make real-world blockchain ideas feel playable, not intimidating.',
      'If a concept is hard, the temple turns it into a character, quest, or visual ritual.',
    ],
    activity: 'wander',
    persona: 'homebody',
  },
  {
    name: 'Ecelannister',
    sprite: 'npcEcelannister',
    x: 720,
    y: 1015,
    color: '#ff7ad9',
    accent: '#f2c866',
    line: 'A friendly identity flow beats a scary onboarding wall.',
    topic: 'Real-World Identity',
    dialogue: [
      'Real-world users should not need to understand every wallet detail on day one.',
      'Rialo can support friendlier identity patterns like familiar accounts and clear profiles.',
      'That is why the temple uses a passport: it makes Web3 feel like a place you can enter.',
    ],
    activity: 'dance',
    persona: 'homebody',
  },
  {
    name: 'Ali',
    sprite: 'npcAli',
    x: 1285,
    y: 1135,
    color: '#88d7ff',
    accent: '#57e39f',
    line: 'Safety is the mask before the message leaves the temple.',
    topic: 'Privacy and Safety',
    dialogue: [
      'Real-world apps touch personal messages, finance, identity, and status updates.',
      'A useful blockchain experience needs privacy and safer coordination, not public chaos.',
      'That is why Rialo concepts include private communication, verification, and clear action rules.',
    ],
    activity: 'meditate',
    persona: 'homebody',
  },
  {
    name: 'LongLife',
    sprite: 'npcLongLife',
    x: 1510,
    y: 1125,
    color: '#57e39f',
    accent: '#ffad72',
    line: 'A world stays alive when the community keeps returning.',
    topic: 'Temple Community',
    dialogue: [
      'Daily rituals, quizzes, wishes, and leaderboards give people reasons to come back.',
      'Those loops only matter when progress is connected to the same onchain profile.',
      'That is how Rialo Temple can grow from a demo into a living education hub.',
    ],
    activity: 'stroll',
    persona: 'wanderer',
  },
  {
    name: 'Bjoestar',
    sprite: 'npcBjoestar',
    x: 250,
    y: 820,
    color: '#ffad72',
    accent: '#78ecff',
    line: 'I keep the map routes clean for new builders.',
    topic: 'Builder Routes',
    dialogue: [
      'A good onboarding world should feel easy to walk through.',
      'Rialo Temple uses characters and small quests so users learn by exploring.',
      'The smoother the route, the easier it is to understand real-world blockchain ideas.',
    ],
    activity: 'stroll',
    persona: 'pacer',
  },
  {
    name: 'Keep',
    sprite: 'npcKeep',
    x: 1035,
    y: 930,
    color: '#b9ff66',
    accent: '#57e39f',
    line: 'I keep the helper notes near RialoSign tidy.',
    topic: 'Rialo Team & Helper',
    dialogue: [
      'Helpers make the temple feel alive by answering small questions around the map.',
      'A beginner can ask what Rialo does, why agents need rails, or how quests become proof.',
      'Good helpers turn confusion into a short path forward.',
    ],
    activity: 'wander',
    persona: 'homebody',
  },
  {
    name: 'Sukanto',
    sprite: 'npcSukanto',
    x: 1600,
    y: 1180,
    color: '#f2c866',
    accent: '#ff7ad9',
    line: 'I trade short lessons for better quests.',
    topic: 'Temple Lessons',
    dialogue: [
      'Rialo ideas are easier when each zone teaches one clear thing.',
      'Data, identity, privacy, assets, and agents all become little stories here.',
      'That is why Temple Play should feel like a learning RPG, not a plain form.',
    ],
    activity: 'wander',
    persona: 'wanderer',
  },
  {
    name: 'Elias',
    sprite: 'npcElias',
    x: 675,
    y: 1330,
    color: '#88d7ff',
    accent: '#f2c866',
    line: 'Signals should arrive fast and clean.',
    topic: 'Signal Timing',
    dialogue: [
      'Real-world apps need quick reaction when something important changes.',
      'A payment clears, a delivery updates, or a deadline passes: the app should know.',
      'Rialo is interesting because it makes those real-world signals more usable.',
    ],
    activity: 'meditate',
    persona: 'homebody',
  },
  {
    name: 'Sza',
    sprite: 'npcSza',
    x: 1105,
    y: 1520,
    color: '#ff7ad9',
    accent: '#78ecff',
    line: 'Matcha first, then we talk protocols.',
    topic: 'Nen Matcha',
    dialogue: [
      'Welcome to Nen Matcha, the calmest corner of the temple grounds.',
      'Builders think better with warm matcha — even agents queue here between quests.',
      'Real-world commerce like this little shop is exactly what Rialo wants onchain: simple, verifiable, useful.',
    ],
    activity: 'tend',
    persona: 'homebody',
  },
  {
    name: 'Spider',
    sprite: 'npcSpider',
    x: 1238,
    y: 1000,
    color: '#57e39f',
    accent: '#f2c866',
    line: 'Grialo!, Im Spider',
    topic: 'Eric Argent Pet',
    dialogue: [
      'Grialo!, Im Spider.',
      'I follow Eric Argent and sniff out Bridge Gate messages.',
      'If the API scroll returns clean, I do a tiny victory patrol.',
    ],
    activity: 'wander',
    persona: 'pacer',
  },
]

const ERIC_ARGENT_NPC_INDEX = AMBIENT_NPCS.findIndex((npc) => npc.name === 'Eric Argent')
const SPIDER_NPC_INDEX = AMBIENT_NPCS.findIndex((npc) => npc.name === 'Spider')

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
  { key: 'buildingRialoSign', x: 928, y: 760, w: 360, h: 360, label: 'Rialo Sign', color: '#f2c866' },
  { key: 'buildingScaleDojo', x: 320, y: 360, w: 250, h: 282, label: 'SCALE Lab', color: '#c886ff' },
  { key: 'buildingStoneVault', x: 1515, y: 400, w: 258, h: 306, label: 'RWA Vault', color: '#f2c866' },
  { key: 'buildingTempleLodge', x: 615, y: 1085, w: 318, h: 268, label: 'Agent Camp', color: '#78ecff' },
  { key: 'buildingMarketHall', x: 1365, y: 1235, w: 278, h: 266, label: 'Signal Tower', color: '#b9ff66' },
  { key: 'buildingGreenhouseInn', x: 285, y: 1400, w: 230, h: 296, label: 'Privacy Grove', color: '#ff7ad9' },
  { key: 'buildingOracleHouse', x: 1300, y: 900, w: 248, h: 276, label: 'Bridge Gate', color: '#57e39f' },
  { key: 'buildingWoodenCabin', x: 970, y: 1345, w: 250, h: 220, label: 'Warung Pecel', color: '#ffad72' },
  { key: 'buildingNenMatcha', x: 1220, y: 1500, w: 235, h: 235, label: 'Nen Matcha', color: '#a8e05f' },
  { key: 'buildingOrangeCottage', x: 1660, y: 1370, w: 206, h: 210, label: 'Quest Hut', color: '#f2c866' },
  { key: 'buildingGuildHouse', x: 1650, y: 760, w: 248, h: 236, label: 'Guild Hall', color: '#78ecff' },
]

const RIALO_SIGN_GATHER_SPOTS = [
  { x: 800, y: 900 },
  { x: 870, y: 920 },
  { x: 945, y: 910 },
  { x: 1030, y: 910 },
  { x: 1120, y: 900 },
  { x: 820, y: 980 },
  { x: 930, y: 1010 },
  { x: 1060, y: 980 },
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
  { key: 'tree', x: 1740, y: 300, w: 132, h: 144, solid: true },
  { key: 'tree', x: 90, y: 470, w: 120, h: 132, solid: true },
  { key: 'tree', x: 300, y: 660, w: 132, h: 144, solid: true },
  { key: 'tree', x: 110, y: 1010, w: 132, h: 144, solid: true },
  { key: 'tree', x: 200, y: 1340, w: 120, h: 132, solid: true },
  { key: 'tree', x: 1230, y: 1460, w: 132, h: 144, solid: true },
  { key: 'tree', x: 1465, y: 1440, w: 132, h: 144, solid: true },
  { key: 'tree', x: 1450, y: 560, w: 120, h: 132, solid: true },
  { key: 'tree', x: 380, y: 520, w: 132, h: 144, solid: true },
  // lamp posts framing the sign plaza, pond edge, and main approach paths
  { key: 'lamp', x: 610, y: 590, w: 78, h: 160, solid: true },
  { key: 'lamp', x: 690, y: 620, w: 78, h: 160, solid: true },
  { key: 'lamp', x: 700, y: 780, w: 78, h: 160, solid: true },
  { key: 'lamp', x: 1145, y: 820, w: 78, h: 160, solid: true },
  { key: 'lamp', x: 118, y: 920, w: 78, h: 160, solid: true },
  { key: 'lamp', x: 420, y: 940, w: 78, h: 160, solid: true },
  // park nook in the open pocket between Bridge Gate / Guild Hall / Signal Tower
  { key: 'parkBench', x: 1490, y: 880, w: 104, h: 78, solid: true },
  { key: 'parkLantern', x: 1605, y: 900, w: 86, h: 104, solid: true },
  { key: 'parkBush', x: 1570, y: 1015, w: 104, h: 100 },
  { key: 'parkPlanter', x: 1640, y: 990, w: 104, h: 101 },
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
  // garden plot collider — prevent walking through crops (values match GARDEN const defined later)
  { x: 478, y: 1128, w: 208, h: 144 },
]

export default function TemplePlay() {
  return <TemplePlayInner />
}

function TemplePlayInner() {
  const { address, isConnected } = useAccount()
  const [activeQuest, setActiveQuest] = useState<QuestNpc | null>(null)
  const [activeTalkNpc, setActiveTalkNpc] = useState<AmbientNpc | null>(null)
  const [activeSignInfo, setActiveSignInfo] = useState(false)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [quizDone, setQuizDone] = useState(false)
  const [nearNpcId, setNearNpcId] = useState<number | null>(null)
  const [nearAmbientIndex, setNearAmbientIndex] = useState<number | null>(null)
  const [nearSign, setNearSign] = useState(false)
  const [showGuide, setShowGuide] = useState(true)
  const [playerSprite, setPlayerSprite] = useState<SpriteKey>(() => initialPlayerSprite())
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
    setActiveTalkNpc(null)
    setActiveSignInfo(false)
    setActiveQuest(quest)
    setAnswers({})
    setQuizDone(false)
    setToast('')
  }, [])

  useEffect(() => {
    openQuestRef.current = openQuest
  }, [openQuest])

  const openAmbientTalk = useCallback((npc: AmbientNpc) => {
    playTempleSfx('talk')
    setActiveQuest(null)
    setActiveSignInfo(false)
    setActiveTalkNpc(npc)
    setToast('')
  }, [])

  const openSignInfo = useCallback(() => {
    playTempleSfx('talk')
    setActiveQuest(null)
    setActiveTalkNpc(null)
    setActiveSignInfo(true)
    setToast('')
  }, [])

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
  const nearestAmbientNpc = nearAmbientIndex !== null ? AMBIENT_NPCS[nearAmbientIndex] : null
  const nearestSign = nearSign && !nearestQuest && !nearestAmbientNpc
  const selectedCharacter = CHARACTER_CHOICES.find((choice) => choice.key === playerSprite) ?? CHARACTER_CHOICES[0]

  const chooseCharacter = useCallback((sprite: SpriteKey) => {
    setPlayerSprite(sprite)
    localStorage.setItem('temple-player-sprite', sprite)
    playTempleSfx('tap')
  }, [])

  return (
    <main className="temple-play-page">
      <section className={`temple-play-shell ${activeQuest || activeTalkNpc || activeSignInfo ? 'is-dialog-open' : ''}`}>
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
            playerSprite={playerSprite}
            onNearQuestChange={setNearNpcId}
            onNearAmbientChange={setNearAmbientIndex}
            onNearSignChange={setNearSign}
            onOpenQuest={(quest) => openQuestRef.current(quest)}
            onOpenAmbientTalk={openAmbientTalk}
            onOpenSignInfo={openSignInfo}
          />

          <div className="temple-play-audio-control">
            <button
              type="button"
              aria-label={lofiMuted ? 'Unmute lofi music' : 'Mute lofi music'}
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
              onChange={(event) => {
                const volume = Number(event.target.value)
                setLofiVolume(volume)
                localStorage.setItem('temple-lofi-vol', String(volume))
                if (audioRef.current) audioRef.current.volume = volume
              }}
            />
          </div>

          <CharacterPicker selected={playerSprite} selectedLabel={selectedCharacter.label} onSelect={chooseCharacter} />

          <div className="temple-play-miniquest">
            <p>{nearestQuest || nearestAmbientNpc || nearestSign ? 'Interact now' : 'Next destination'}</p>
            <strong>
              {nearestQuest
                ? `${nearestQuest.npc} / ${nearestQuest.zone}`
                : nearestAmbientNpc
                  ? `${nearestAmbientNpc.name} / ${nearestAmbientNpc.topic}`
                  : nearestSign
                    ? 'RialoSign / Temple Info'
                  : `${nextQuest.zone}`}
            </strong>
            <button
              type="button"
              disabled={!nearestQuest && !nearestAmbientNpc && !nearestSign}
              onClick={() => nearestQuest ? openQuest(nearestQuest) : nearestAmbientNpc ? openAmbientTalk(nearestAmbientNpc) : nearestSign && openSignInfo()}
            >
              {nearestQuest || nearestAmbientNpc ? 'Talk' : nearestSign ? 'Open Info' : 'Find NPC'}
            </button>
          </div>

          <AnimatePresence>
            {showGuide && !activeQuest && !activeTalkNpc && !activeSignInfo ? (
              <GuideOverlay selected={playerSprite} onSelect={chooseCharacter} onClose={() => setShowGuide(false)} />
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

          <AnimatePresence>
            {activeTalkNpc ? (
              <AmbientTalkPanel key={activeTalkNpc.name} npc={activeTalkNpc} onClose={() => setActiveTalkNpc(null)} />
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {activeSignInfo ? (
              <RialoSignPanel onClose={() => setActiveSignInfo(false)} />
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
  playerSprite,
  onNearQuestChange,
  onNearAmbientChange,
  onNearSignChange,
  onOpenQuest,
  onOpenAmbientTalk,
  onOpenSignInfo,
}: {
  completedIds: Set<number>
  nextQuest: QuestNpc
  playerSprite: SpriteKey
  onNearQuestChange: (id: number | null) => void
  onNearAmbientChange: (index: number | null) => void
  onNearSignChange: (near: boolean) => void
  onOpenQuest: (quest: QuestNpc) => void
  onOpenAmbientTalk: (npc: AmbientNpc) => void
  onOpenSignInfo: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const keys = useRef(new Set<string>())
  const player = useRef<PlayerState>({ x: 928, y: 940, dir: 'down', moving: false })
  const nearId = useRef<number | null>(null)
  const nearAmbient = useRef<number | null>(null)
  const nearSignRef = useRef(false)
  const completedLatest = useRef(completedIds)
  const assetsRef = useRef<TemplePlayAssets | null>(null)
  const tapTarget = useRef<{ x: number; y: number; questId?: number; ambientIndex?: number; sign?: boolean } | null>(null)
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
          return
        }
        if (nearAmbient.current !== null) {
          const npc = AMBIENT_NPCS[nearAmbient.current]
          if (npc) {
            playTempleSfx('talk')
            onOpenAmbientTalk(npc)
          }
          return
        }
        if (nearSignRef.current) {
          playTempleSfx('talk')
          onOpenSignInfo()
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

      updateAmbientNpcs(dt)

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
          const arrivedAmbient = tapTarget.current.ambientIndex
          const arrivedSign = tapTarget.current.sign
          tapTarget.current = null
          input = { x: 0, y: 0 }
          if (arrivedQuest) {
            const quest = QUESTS.find((item) => item.id === arrivedQuest)
            if (quest && Math.hypot(current.x - quest.x, current.y - quest.y) < 105) {
              playTempleSfx('talk')
              onOpenQuest(quest)
            }
          } else if (arrivedAmbient !== undefined) {
            const npc = AMBIENT_NPCS[arrivedAmbient]
            const motion = npcRuntime[arrivedAmbient]
            if (npc && motion && Math.hypot(current.x - motion.x, current.y - motion.y) < 105) {
              playTempleSfx('talk')
              onOpenAmbientTalk(npc)
            }
          } else if (arrivedSign) {
            if (Math.hypot(current.x - RIALO_SIGN_INTERACT.x, current.y - RIALO_SIGN_INTERACT.y) < 128) {
              playTempleSfx('talk')
              onOpenSignInfo()
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
      const ambient = nearId.current ? null : nearestAmbientNpc(current)
      const ambientIndex = ambient?.index ?? null
      if (ambientIndex !== nearAmbient.current) {
        nearAmbient.current = ambientIndex
        onNearAmbientChange(nearAmbient.current)
      }
      const signClose = !nearId.current && !nearAmbient.current && nearestRialoSign(current)
      if (signClose !== nearSignRef.current) {
        nearSignRef.current = signClose
        onNearSignChange(signClose)
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

      drawWorld(context, rect.width, rect.height, viewport.width, viewport.height, camera, zoom, frame, current, completedLatest.current, nearId.current, nearAmbient.current, nearSignRef.current, assets, tapTarget.current, nextQuest, playerSprite)
      window.requestAnimationFrame(tick)
    }

    window.requestAnimationFrame(tick)

    return () => {
      disposed = true
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
    }
  }, [nextQuest, onNearQuestChange, onNearAmbientChange, onNearSignChange, onOpenQuest, onOpenAmbientTalk, onOpenSignInfo, playerSprite])

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
          const tappedAmbient = tappedQuest ? null : tappedAmbientNpc(target)
          const tappedSign = !tappedQuest && !tappedAmbient && Math.hypot(target.x - RIALO_SIGN_INTERACT.x, target.y - RIALO_SIGN_INTERACT.y) < 140
          const targetActor = tappedQuest ?? tappedAmbient ?? (tappedSign ? RIALO_SIGN_INTERACT : null)
          const walkTarget = targetActor
            ? approachPoint(player.current, targetActor, 76)
            : target
          tapTarget.current = isMovementBlocked(walkTarget.x, walkTarget.y)
            ? null
            : { ...walkTarget, questId: tappedQuest?.id, ambientIndex: tappedAmbient?.index, sign: tappedSign }
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

function AmbientTalkPanel({
  npc,
  onClose,
}: {
  npc: AmbientNpc
  onClose: () => void
}) {
  const [lineIndex, setLineIndex] = useState(0)
  const portrait = SPRITES[npc.sprite]
  const currentLine = npc.dialogue[lineIndex] ?? npc.line
  const isLast = lineIndex >= npc.dialogue.length - 1

  return (
    <motion.section
      className="temple-play-talk-panel"
      style={{ '--npc': npc.color, '--npc-accent': npc.accent } as CSSProperties}
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
    >
      <div className="temple-play-talk-portrait">
        <span
          style={{
            backgroundImage: `url(${portrait.src})`,
            backgroundSize: `${portrait.frames * 100}% 100%`,
            backgroundPosition: '0 0',
          }}
        />
      </div>
      <div className="temple-play-talk-copy">
        <p>{npc.name} / {npc.topic}</p>
        <strong>{currentLine}</strong>
        <small>{lineIndex + 1}/{npc.dialogue.length} field note</small>
      </div>
      <div className="temple-play-talk-actions">
        <button type="button" onClick={onClose}>Close</button>
        <button
          type="button"
          onClick={() => {
            if (isLast) {
              onClose()
              return
            }
            playTempleSfx('tap')
            setLineIndex((current) => current + 1)
          }}
        >
          {isLast ? 'Done' : 'Next'}
        </button>
      </div>
    </motion.section>
  )
}

function RialoSignPanel({ onClose }: { onClose: () => void }) {
  return (
    <motion.section
      className="temple-play-talk-panel temple-play-sign-panel"
      style={{ '--npc': '#f2c866', '--npc-accent': '#57e39f' } as CSSProperties}
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
    >
      <div className="temple-play-sign-mark" aria-hidden="true">
        <span />
      </div>
      <div className="temple-play-talk-copy">
        <p>RialoSign / Temple Info</p>
        <strong>Rialo Temple is a gamified education experience built for Rialo by nxrskyaa.</strong>
        <small>Builder: nxrskyaa. Explore, talk to NPCs, learn real-world blockchain concepts, and collect onchain learning badges.</small>
      </div>
      <div className="temple-play-talk-actions">
        <button type="button" onClick={onClose}>Close</button>
        <a href={RIALO_SIGN_PROFILE_URL} target="_blank" rel="noreferrer">Visit Nxrskyaa</a>
      </div>
    </motion.section>
  )
}

function CharacterPicker({
  selected,
  selectedLabel,
  onSelect,
}: {
  selected: SpriteKey
  selectedLabel: string
  onSelect: (sprite: SpriteKey) => void
}) {
  return (
    <details className="temple-play-character-picker">
      <summary>
        <span>Character</span>
        <strong>{selectedLabel}</strong>
      </summary>
      <div className="temple-play-character-sections">
        <CharacterChoiceSections selected={selected} onSelect={onSelect} />
      </div>
    </details>
  )
}

function CharacterChoiceSections({
  selected,
  onSelect,
}: {
  selected: SpriteKey
  onSelect: (sprite: SpriteKey) => void
}) {
  return (
    <>
      {CHARACTER_CHOICE_SECTIONS.map((section) => (
        <section key={section.title} className="temple-play-character-section">
          <p>{section.title}</p>
          <div className="temple-play-character-grid">
            {section.choices.map((choice) => {
              const sheet = SPRITES[choice.key]
              return (
                <button
                  key={choice.key}
                  type="button"
                  className={choice.key === selected ? 'is-selected' : ''}
                  onClick={() => onSelect(choice.key)}
                >
                  <span
                    style={{
                      backgroundImage: `url(${sheet.src})`,
                      backgroundSize: `${sheet.frames * 100}% 100%`,
                      backgroundPosition: '0 0',
                    }}
                  />
                  {choice.label}
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </>
  )
}

function GuideOverlay({
  selected,
  onSelect,
  onClose,
}: {
  selected: SpriteKey
  onSelect: (sprite: SpriteKey) => void
  onClose: () => void
}) {
  const portrait = SPRITES[selected]

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
            This is a pixel quest for learning Rialo. Tap the map to move, walk near a character, talk to NPCs, answer mini quizzes, then claim badges on-chain.
          </span>
          <div className="temple-play-guide-actions">
            <small>Tap map: move</small>
            <small>Near NPC: talk</small>
            <small>E key: talk nearby</small>
          </div>
          <div className="temple-play-guide-characters" aria-label="Choose player character">
            <CharacterChoiceSections selected={selected} onSelect={onSelect} />
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

type AmbientHit = { index: number; x: number; y: number }

function nearestAmbientNpc(player: PlayerState): AmbientHit | null {
  let nearest: { index: number; x: number; y: number } | null = null
  let distance = Number.POSITIVE_INFINITY
  for (let index = 0; index < npcRuntime.length; index++) {
    const runtime = npcRuntime[index]
    const current = Math.hypot(player.x - runtime.x, player.y - runtime.y)
    if (current < distance) {
      nearest = { index, x: runtime.x, y: runtime.y }
      distance = current
    }
  }
  return distance < 112 ? nearest : null
}

function nearestRialoSign(player: PlayerState) {
  return Math.hypot(player.x - RIALO_SIGN_INTERACT.x, player.y - RIALO_SIGN_INTERACT.y) < 135
}

function tappedAmbientNpc(point: { x: number; y: number }): AmbientHit | null {
  let nearest: { index: number; x: number; y: number } | null = null
  let distance = Number.POSITIVE_INFINITY
  for (let index = 0; index < npcRuntime.length; index++) {
    const runtime = npcRuntime[index]
    const current = Math.hypot(point.x - runtime.x, point.y - runtime.y)
    if (current < distance) {
      nearest = { index, x: runtime.x, y: runtime.y }
      distance = current
    }
  }
  return distance < 70 ? nearest : null
}

function isMovementBlocked(x: number, y: number) {
  return WORLD_BLOCKERS.some((rect) => pointInRect(x, y, rect))
}

function isNpcMovementBlocked(x: number, y: number) {
  return WORLD_BLOCKERS.some((rect) => pointInRect(x, y, expandRect(rect, NPC_BLOCKER_MARGIN)))
}

function pointInRect(x: number, y: number, rect: { x: number; y: number; w: number; h: number }) {
  return x > rect.x && x < rect.x + rect.w && y > rect.y && y < rect.y + rect.h
}

function expandRect(rect: { x: number; y: number; w: number; h: number }, margin: number) {
  return {
    x: rect.x - margin,
    y: rect.y - margin,
    w: rect.w + margin * 2,
    h: rect.h + margin * 2,
  }
}

function buildingCollider(building: BuildingSpec) {
  if (building.key === 'buildingRialoSign') {
    const w = building.w * 0.82
    const h = building.h * 0.52
    return {
      x: building.x - w / 2,
      y: building.y - h + 18,
      w,
      h,
    }
  }
  const w = building.w * 0.72
  const h = building.h * 0.35
  return {
    x: building.x - w / 2,
    y: building.y - h,
    w,
    h,
  }
}

function npcPathBlocked(ax: number, ay: number, bx: number, by: number) {
  return WORLD_BLOCKERS.some((rect) => lineIntersectsRect(ax, ay, bx, by, expandRect(rect, NPC_BLOCKER_MARGIN)))
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

function approachPoint(player: PlayerState, actor: { x: number; y: number }, distance: number) {
  const dx = player.x - actor.x
  const dy = player.y - actor.y
  const len = Math.hypot(dx, dy) || 1
  return {
    x: clamp(actor.x + (dx / len) * distance, 90, WORLD.width - 90),
    y: clamp(actor.y + (dy / len) * distance, 90, WORLD.height - 90),
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
  nearAmbientIndex: number | null,
  nearSign: boolean,
  assets: TemplePlayAssets,
  target: { x: number; y: number } | null,
  nextQuest: QuestNpc,
  playerSprite: SpriteKey,
) {
  ctx.clearRect(0, 0, width, height)
  ctx.save()
  ctx.scale(zoom, zoom)
  ctx.translate(-camera.x, -camera.y)
  drawGround(ctx, time, assets)
  drawPaths(ctx, time)
  drawWater(ctx, assets)
  drawEnvironmentProps(ctx, time, assets)
  drawFlyingLanterns(ctx, time)
  drawTapTarget(ctx, time, target)
  drawQuestHint(ctx, time, nextQuest, nearNpcId)
  drawRialoSignHint(ctx, time, nearSign)
  drawActors(ctx, time, completedIds, nearNpcId, nearAmbientIndex, player, assets, playerSprite)
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

function drawQuestHint(
  ctx: CanvasRenderingContext2D,
  time: number,
  quest: QuestNpc,
  nearNpcId: number | null,
) {
  const close = nearNpcId === quest.id
  drawPixelInteractCue(ctx, quest.x, quest.y, 62, 34, time, close ? '#57e39f' : '#f2c866', close)
  if (close) {
    drawPixelNameTag(ctx, quest.x, quest.y - 148, 'Tap / E to talk', '#07100c', true, '#57e39f', true)
  }
}

function drawRialoSignHint(ctx: CanvasRenderingContext2D, time: number, active: boolean) {
  drawPixelInteractCue(ctx, RIALO_SIGN_INTERACT.x, RIALO_SIGN_INTERACT.y, 88, 42, time + 1.2, active ? '#f2c866' : '#57e39f', active)
  if (active) {
    drawPixelNameTag(ctx, RIALO_SIGN_INTERACT.x, RIALO_SIGN_INTERACT.y - 112, 'Open RialoSign', '#07100c', true, '#f2c866', true)
  }
}

function drawPixelInteractCue(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  time: number,
  color: string,
  active: boolean,
) {
  const pulse = active ? 1 + Math.sin(time * 4.4) * 0.08 : 1
  const ringW = Math.round(width * (active ? 0.82 : 0.66) * pulse)
  const ringH = Math.round(Math.max(10, height * 0.28) * pulse)
  const centerY = Math.round(y - 4)

  ctx.save()
  ctx.globalAlpha = active ? 0.82 : 0.34
  ctx.strokeStyle = color
  ctx.lineWidth = active ? 3 : 2
  ctx.beginPath()
  ctx.ellipse(Math.round(x), centerY, ringW / 2, ringH / 2, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = 'rgba(7,16,12,.42)'
  ctx.fillRect(Math.round(x - ringW * 0.28), centerY - 1, Math.round(ringW * 0.56), 2)
  if (active) {
    ctx.fillStyle = color
    ctx.fillRect(Math.round(x - ringW / 2 - 6), centerY - 2, 4, 4)
    ctx.fillRect(Math.round(x + ringW / 2 + 2), centerY - 2, 4, 4)
    ctx.fillStyle = '#f7f1df'
    ctx.fillRect(Math.round(x - 2), centerY + Math.round(ringH / 2) - 2, 4, 4)
  }

  ctx.restore()
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
const GARDEN = { x: 470, y: 1120, w: 224, h: 160 }

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

function drawCompletedBadges(_ctx: CanvasRenderingContext2D, _time: number, _completedIds: Set<number>) {
  // Completed state is carried by the NPC name color and quest UI.
  // Keep the playfield clean: no overhead badges that fight the pixel-art scene.
}

function drawBuildingAsset(
  ctx: CanvasRenderingContext2D,
  assets: TemplePlayAssets,
  building: BuildingSpec,
) {
  const { key, x, y, w, h } = building
  if (key === 'buildingRialoSign') {
    drawRialoSignPlatform(ctx, x, y, w)
  }
  drawPropBottomCenter(ctx, assets, key, x, y, w, h)
}

function drawRialoSignPlatform(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  const left = Math.round(x - w * 0.58)
  const top = Math.round(y - 70)
  const width = Math.round(w * 1.16)
  const height = 122
  ctx.save()
  ctx.fillStyle = 'rgba(10, 16, 14, .38)'
  ctx.fillRect(left - 8, top + 8, width + 16, height)
  ctx.fillStyle = 'rgba(75, 75, 86, .88)'
  ctx.fillRect(left, top, width, height)
  ctx.strokeStyle = 'rgba(242, 200, 102, .72)'
  ctx.lineWidth = 4
  ctx.strokeRect(left + 2, top + 2, width - 4, height - 4)
  ctx.strokeStyle = 'rgba(245, 239, 218, .16)'
  ctx.lineWidth = 1
  for (let yy = top + 18; yy < top + height - 10; yy += 18) {
    ctx.beginPath()
    ctx.moveTo(left + 12, yy)
    ctx.lineTo(left + width - 12, yy)
    ctx.stroke()
  }
  for (let xx = left + 28; xx < left + width - 12; xx += 34) {
    ctx.beginPath()
    ctx.moveTo(xx, top + 10)
    ctx.lineTo(xx - 10, top + height - 10)
    ctx.stroke()
  }
  ctx.fillStyle = '#f2c866'
  for (let i = 0; i < 8; i++) {
    const px = left + 20 + i * Math.max(22, Math.floor((width - 40) / 7))
    ctx.fillRect(px, top - 8, 8, 18)
    ctx.fillRect(px - 4, top - 12, 16, 5)
  }
  ctx.restore()
}

const FLOWERS: PropKey[] = ['flowerBlue', 'flowerAmber', 'flowerCream', 'flowerYellow', 'flowerRed', 'flowerOrange', 'flowerPink', 'flowerPurple']
const GRASSES: PropKey[] = ['grass1', 'grass2', 'grass3']

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

  // garden crop rows — canvas-drawn pixel art with VFX (sway, sparkle, growth shimmer)
  drawGardenCrops(ctx, time)

  drawFloatingLeaves(ctx, time)
}

// ═══════════════════════════════════════════════════════════
// Canvas-drawn pixel art crops with VFX — replaces image-based crops
// ═══════════════════════════════════════════════════════════

function drawGardenCrops(ctx: CanvasRenderingContext2D, time: number) {
  ctx.save()

  // 3 rows x 4 cols, alternating leafy and root crops
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const cx = GARDEN.x + 32 + col * 48
      const cy = GARDEN.y + 40 + row * 48
      const isLeafy = row % 2 === 0
      const stage = (col + row) % 4  // 0=sprout, 1=small, 2=medium, 3=mature

      // gentle sway — each crop has a phase offset for organic feel
      const sway = Math.sin(time * 1.4 + col * 0.7 + row * 1.3) * 2.2

      if (isLeafy) {
        drawPixelCropLeafy(ctx, cx + sway, cy, stage, time, row * 4 + col)
      } else {
        drawPixelCropRoot(ctx, cx + sway, cy, stage, time, row * 4 + col)
      }

      // sparkle VFX on mature crops
      if (stage === 3) {
        const sparklePhase = time * 2.5 + row * 4 + col * 3
        const sparkleAlpha = 0.3 + Math.sin(sparklePhase) * 0.3
        if (sparkleAlpha > 0.15) {
          ctx.globalAlpha = sparkleAlpha
          ctx.fillStyle = '#ffeb6b'
          // 3 sparkle dots around the crop
          const sx = cx + sway + Math.sin(time * 1.8 + col) * 8
          const sy = cy - 30 + Math.cos(time * 2.1 + row) * 6
          ctx.fillRect(Math.round(sx), Math.round(sy), 3, 3)
          ctx.fillRect(Math.round(sx + 12), Math.round(sy + 5), 2, 2)
          ctx.fillRect(Math.round(sx - 10), Math.round(sy + 8), 2, 2)
          ctx.globalAlpha = 1
        }
      }

      // growth shimmer — subtle green glow on stages 1-2
      if (stage === 1 || stage === 2) {
        const shimmerAlpha = 0.08 + Math.sin(time * 3 + col * 2 + row) * 0.06
        ctx.globalAlpha = Math.max(0, shimmerAlpha)
        ctx.fillStyle = '#b9ff66'
        ctx.fillRect(cx - 14, cy - 24, 28, 24)
        ctx.globalAlpha = 1
      }
    }
  }

  // soil moisture shimmer — subtle blue tint that sweeps across the plot
  const moisturePhase = (time * 0.3) % 1
  const moistureX = GARDEN.x + moisturePhase * GARDEN.w
  ctx.globalAlpha = 0.06
  ctx.fillStyle = '#5fc6ee'
  ctx.fillRect(moistureX - 20, GARDEN.y, 40, GARDEN.h)
  ctx.globalAlpha = 1

  ctx.restore()
}

// ── Leafy crop (lettuce/cabbage style) — 4 growth stages ──
function drawPixelCropLeafy(ctx: CanvasRenderingContext2D, cx: number, cy: number, stage: number, _time: number, _seed: number) {
  const p = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect(Math.round(cx + x), Math.round(cy + y), w, h)
  }

  // soil mound (always present)
  p(-14, -4, 28, 4, '#6b4423')
  p(-12, -3, 24, 3, '#7a5030')

  if (stage === 0) {
    // sprout — 2 tiny leaves poking out
    p(-3, -8, 6, 5, '#5fb84e')
    p(-5, -6, 4, 3, '#7fd45f')
    p(1, -6, 4, 3, '#7fd45f')
    p(-1, -10, 2, 3, '#b9ff66')
  } else if (stage === 1) {
    // small — cluster of leaves
    p(-7, -12, 14, 9, '#5fb84e')
    p(-5, -14, 10, 6, '#7fd45f')
    p(-3, -15, 6, 4, '#b9ff66')
    p(-8, -8, 4, 4, '#4a9e3e')
    p(4, -8, 4, 4, '#4a9e3e')
  } else if (stage === 2) {
    // medium — fuller bush with detail
    p(-10, -18, 20, 14, '#5fb84e')
    p(-8, -22, 16, 8, '#7fd45f')
    p(-6, -24, 12, 5, '#b9ff66')
    p(-12, -14, 6, 8, '#4a9e3e')
    p(6, -14, 6, 8, '#4a9e3e')
    // leaf veins
    p(-2, -20, 1, 8, '#3d8a32')
    p(2, -18, 1, 6, '#3d8a32')
  } else {
    // mature — full canopy with fruit/flower
    p(-14, -26, 28, 22, '#5fb84e')
    p(-12, -30, 24, 10, '#7fd45f')
    p(-8, -32, 16, 6, '#b9ff66')
    p(-16, -20, 6, 12, '#4a9e3e')
    p(10, -20, 6, 12, '#4a9e3e')
    // fruit (small red berries)
    p(-6, -22, 4, 4, '#e85d5d')
    p(3, -24, 4, 4, '#e85d5d')
    p(-1, -18, 3, 3, '#ff7676')
    // highlight
    p(-5, -23, 2, 2, '#ffaaaa')
    p(4, -25, 2, 2, '#ffaaaa')
    // leaf veins
    p(-2, -24, 1, 12, '#3d8a32')
    p(3, -22, 1, 10, '#3d8a32')
  }
}

// ── Root crop (carrot/turnip style) — 4 growth stages ──
function drawPixelCropRoot(ctx: CanvasRenderingContext2D, cx: number, cy: number, stage: number, _time: number, _seed: number) {
  const p = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect(Math.round(cx + x), Math.round(cy + y), w, h)
  }

  // soil mound
  p(-14, -4, 28, 4, '#6b4423')
  p(-12, -3, 24, 3, '#7a5030')

  if (stage === 0) {
    // sprout — single stem with 2 tiny leaves
    p(-1, -10, 2, 6, '#5fb84e')
    p(-4, -8, 3, 3, '#7fd45f')
    p(1, -8, 3, 3, '#7fd45f')
  } else if (stage === 1) {
    // small — taller stem with leaf clusters
    p(-1, -14, 2, 10, '#5fb84e')
    p(-5, -12, 4, 4, '#7fd45f')
    p(1, -12, 4, 4, '#7fd45f')
    p(-3, -14, 3, 3, '#b9ff66')
    p(0, -15, 3, 3, '#b9ff66')
  } else if (stage === 2) {
    // medium — bushy top, slight root visible
    p(-1, -18, 2, 14, '#5fb84e')
    p(-7, -16, 6, 5, '#7fd45f')
    p(1, -16, 6, 5, '#7fd45f')
    p(-4, -19, 4, 4, '#b9ff66')
    p(0, -20, 4, 4, '#b9ff66')
    // root top poking out
    p(-3, -2, 6, 3, '#e8821e')
    p(-2, 0, 4, 2, '#d4740e')
  } else {
    // mature — full leafy top + exposed carrot
    p(-1, -24, 2, 20, '#5fb84e')
    p(-9, -22, 8, 7, '#7fd45f')
    p(1, -22, 8, 7, '#7fd45f')
    p(-5, -25, 5, 5, '#b9ff66')
    p(0, -26, 5, 5, '#b9ff66')
    // leaf detail
    p(-6, -23, 1, 6, '#3d8a32')
    p(5, -23, 1, 6, '#3d8a32')
    // exposed carrot root
    p(-4, -4, 8, 6, '#e8821e')
    p(-3, 2, 6, 4, '#d4740e')
    p(-2, 6, 4, 3, '#b8650a')
    p(-1, 9, 2, 2, '#9a5208')
    // highlight on carrot
    p(-3, -3, 2, 4, '#ffb050')
  }
}

function drawFlyingLanterns(ctx: CanvasRenderingContext2D, time: number) {
  ctx.save()
  for (let i = 0; i < 10; i++) {
    const lane = i % 5
    const loop = 18 + lane * 1.9
    const progress = (time / loop + i * 0.173) % 1
    const y = WORLD.height + 110 - progress * (WORLD.height + 240)
    const xBase = 150 + lane * 340 + (i % 2) * 70
    const x = (xBase + Math.sin(time * 0.32 + i) * 28 + WORLD.width) % WORLD.width
    const fade = clamp(Math.min(progress * 8, (1 - progress) * 8), 0, 1)
    const glow = 0.42 + Math.sin(time * 1.6 + i) * 0.1
    if (y < -90 || y > WORLD.height + 130) continue
    ctx.globalAlpha = 0.22 + fade * 0.58
    ctx.fillStyle = `rgba(242, 200, 102, ${0.16 + glow * 0.2})`
    ctx.fillRect(x - 14, y - 16, 28, 32)
    ctx.fillStyle = 'rgba(7, 16, 12, .72)'
    ctx.fillRect(x - 10, y - 13, 20, 3)
    ctx.fillRect(x - 10, y + 12, 20, 3)
    ctx.fillStyle = '#f2c866'
    ctx.fillRect(x - 7, y - 8, 14, 18)
    ctx.fillStyle = '#ffad72'
    ctx.fillRect(x - 4, y - 3, 8, 9)
    ctx.fillStyle = 'rgba(87, 227, 159, .5)'
    ctx.fillRect(x - 2, y + 17, 4, 10)
  }
  ctx.globalAlpha = 1
  ctx.restore()
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
    [440, 940, 1010, 1300],
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
  nearAmbientIndex: number | null,
  player: PlayerState,
  assets: TemplePlayAssets,
  playerSprite: SpriteKey,
) {
  const actors: Array<{ y: number; draw: () => void }> = BUILDINGS.map((building) => ({
    y: building.y,
    draw: () => drawBuildingAsset(ctx, assets, building),
  }))
  SCENERY.forEach((s) => {
    actors.push({
      y: s.y,
      draw: () => {
        drawPropBottomCenter(ctx, assets, s.key, s.x, s.y, s.w, s.h)
      },
    })
  })
  const ambientMotions: NpcMotion[] = npcRuntime.map((r) => ({ x: r.x, y: r.y, moving: r.moving, direction: r.dir }))

  AMBIENT_NPCS.forEach((npc, index) => {
    const motion = ambientMotions[index]
    actors.push({
      y: motion.y,
      draw: () => {
        drawSpriteActor(ctx, assets, {
          sprite: npc.sprite,
          x: motion.x,
          y: motion.y,
          name: npc.name,
          tone: npc.color,
          accent: npc.accent,
          time,
          seed: index * 0.73,
          near: nearAmbientIndex === index,
          compact: true,
          moving: motion.moving,
          direction: motion.direction,
          activity: npc.activity,
        })
        if (index === SPIDER_NPC_INDEX) {
          const eric = ambientMotions[ERIC_ARGENT_NPC_INDEX]
          if (eric && Math.hypot(motion.x - eric.x, motion.y - eric.y) < 112) {
            drawMiniBubble(ctx, motion.x, motion.y - 118, 'Grialo!, Im Spider', npc.color)
          }
        }
        if (nearAmbientIndex === index) {
          drawPixelNameTag(ctx, motion.x, motion.y - 134, 'Tap / E to chat', '#07100c', true, npc.color, true)
        }
      },
    })
  })

  QUESTS.forEach((quest) => {
    const completed = completedIds.has(quest.quizId)
    const action = questNpcMotion(quest, time)
    actors.push({
      y: action.y,
      draw: () => {
        drawSpriteActor(ctx, assets, {
          sprite: quest.sprite,
          x: action.x,
          y: action.y,
          name: quest.npc,
          tone: quest.color,
          accent: quest.accent,
          time,
          seed: quest.id * 0.48,
          near: nearNpcId === quest.id,
          completed,
          moving: action.moving,
          direction: action.direction,
        })
      },
    })
  })

  actors.push({
    y: player.y,
    draw: () => drawSpriteActor(ctx, assets, {
      sprite: playerSprite,
      x: player.x,
      y: player.y,
      name: `${characterName(playerSprite)} (you)`,
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

// Stateful ambient NPC controller: roamers walk to a random nearby point, pause,
// then pick a new one (with collision). Stationary personas stay at their spot.
type NpcRuntime = {
  home: { x: number; y: number }
  x: number
  y: number
  dir: PlayerState['dir']
  moving: boolean
  target: { x: number; y: number } | null
  pause: number
  roams: boolean
  signTrip: 'idle' | 'toSign' | 'atSign' | 'returnHome'
  visitCooldown: number
}

const ROAM_ACTIVITIES = new Set<AmbientActivity>(['wander', 'stroll'])
const NPC_SPEED = 36
const NPC_ROAM_RADIUS = 118
const NPC_BLOCKER_MARGIN = 48

const npcRuntime: NpcRuntime[] = AMBIENT_NPCS.map((npc) => ({
  home: { x: npc.x, y: npc.y },
  x: npc.x,
  y: npc.y,
  dir: 'down',
  moving: false,
  target: null,
  pause: Math.random() * 2.5,
  roams: ROAM_ACTIVITIES.has(npc.activity),
  signTrip: 'idle',
  visitCooldown: 2 + Math.random() * 14,
}))

function pickNpcTarget(r: NpcRuntime, radius = NPC_ROAM_RADIUS) {
  for (let tries = 0; tries < 14; tries++) {
    const angle = Math.random() * Math.PI * 2
    const distance = 30 + Math.random() * radius
    const x = clamp(r.home.x + Math.cos(angle) * distance, 80, WORLD.width - 80)
    const y = clamp(r.home.y + Math.sin(angle) * distance, 80, WORLD.height - 80)
    if (!isNpcMovementBlocked(x, y) && !npcPathBlocked(r.x, r.y, x, y)) return { x, y }
  }
  return null
}

function pickRialoSignTarget(r: NpcRuntime) {
  const start = Math.floor(Math.random() * RIALO_SIGN_GATHER_SPOTS.length)
  for (let i = 0; i < RIALO_SIGN_GATHER_SPOTS.length; i++) {
    const spot = RIALO_SIGN_GATHER_SPOTS[(start + i) % RIALO_SIGN_GATHER_SPOTS.length]
    const x = spot.x + (Math.random() - 0.5) * 24
    const y = spot.y + (Math.random() - 0.5) * 18
    if (!isNpcMovementBlocked(x, y) && !npcPathBlocked(r.x, r.y, x, y)) return { x, y }
  }
  return null
}

function pickHomeTarget(r: NpcRuntime) {
  if (!isNpcMovementBlocked(r.home.x, r.home.y) && !npcPathBlocked(r.x, r.y, r.home.x, r.home.y)) return { ...r.home }
  return pickNpcTarget(r, 46)
}

function pickSpiderTarget(r: NpcRuntime, eric: NpcRuntime) {
  const farFromEric = Math.hypot(r.x - eric.x, r.y - eric.y) > 150
  const baseX = farFromEric ? eric.x : eric.x + (Math.random() - 0.5) * 42
  const baseY = farFromEric ? eric.y : eric.y + (Math.random() - 0.5) * 30
  const minDistance = farFromEric ? 26 : 42
  const radius = farFromEric ? 64 : 94
  for (let tries = 0; tries < 16; tries++) {
    const angle = Math.random() * Math.PI * 2
    const distance = minDistance + Math.random() * radius
    const x = clamp(baseX + Math.cos(angle) * distance, 80, WORLD.width - 80)
    const y = clamp(baseY + Math.sin(angle) * distance, 80, WORLD.height - 80)
    if (!isNpcMovementBlocked(x, y) && !npcPathBlocked(r.x, r.y, x, y)) return { x, y }
  }
  return null
}

function updateAmbientNpcs(dt: number) {
  for (let index = 0; index < npcRuntime.length; index++) {
    const r = npcRuntime[index]
    const eric = npcRuntime[ERIC_ARGENT_NPC_INDEX]
    const isSpider = index === SPIDER_NPC_INDEX && Boolean(eric)
    if (isSpider && eric) {
      r.home = { x: eric.x, y: eric.y }
      r.signTrip = 'idle'
      r.visitCooldown = 6
      r.roams = true
    }
    if (r.pause > 0) { r.pause -= dt; r.moving = false; continue }
    if (!r.target) {
      if (isSpider && eric) {
        r.target = pickSpiderTarget(r, eric)
        if (!r.target) {
          r.pause = 0.35
          r.moving = false
          continue
        }
      } else if (r.signTrip === 'atSign') {
        r.target = pickHomeTarget(r)
        r.signTrip = 'returnHome'
        if (!r.target) {
          r.signTrip = 'idle'
          r.visitCooldown = 6 + Math.random() * 16
          r.pause = 0.8
          continue
        }
      } else if (r.signTrip === 'idle') {
        r.visitCooldown -= dt
        if (r.visitCooldown <= 0) {
          r.target = pickRialoSignTarget(r)
          if (r.target) {
            r.signTrip = 'toSign'
          } else {
            r.visitCooldown = 3 + Math.random() * 8
            r.pause = 0.4
            continue
          }
        } else if (r.roams) {
          r.target = pickNpcTarget(r)
          if (!r.target) { r.pause = 0.6; continue }
        } else {
          r.moving = false
          continue
        }
      } else {
        r.signTrip = 'idle'
        r.visitCooldown = 5 + Math.random() * 12
        r.moving = false
        continue
      }
    }
    const dx = r.target.x - r.x
    const dy = r.target.y - r.y
    const dist = Math.hypot(dx, dy)
    if (dist < 3) {
      r.target = null
      if (isSpider) {
        r.pause = 0.25 + Math.random() * 0.55
      } else if (r.signTrip === 'toSign') {
        r.signTrip = 'atSign'
        r.pause = 2.4 + Math.random() * 4.2
      } else if (r.signTrip === 'returnHome') {
        r.signTrip = 'idle'
        r.visitCooldown = 8 + Math.random() * 22
        r.pause = 1 + Math.random() * 2
      } else {
        r.pause = 1.4 + Math.random() * 2.6
      }
      r.moving = false
      continue
    }
    const step = Math.min(dist, NPC_SPEED * dt)
    const nx = r.x + (dx / dist) * step
    const ny = r.y + (dy / dist) * step
    const prevX = r.x
    const prevY = r.y
    let moved = false
    if (!isNpcMovementBlocked(nx, r.y)) { r.x = nx; moved = true }
    if (!isNpcMovementBlocked(r.x, ny)) { r.y = ny; moved = true }
    if (!moved) {
      r.target = null
      r.pause = 0.4 + Math.random()
      if (r.signTrip !== 'idle') {
        r.signTrip = 'idle'
        r.visitCooldown = 4 + Math.random() * 12
      }
    }
    const movedX = r.x - prevX
    const movedY = r.y - prevY
    r.moving = moved && Math.hypot(movedX, movedY) > 0.15
    if (r.moving) {
      if (Math.abs(movedX) > Math.abs(movedY)) r.dir = movedX < 0 ? 'left' : 'right'
      else r.dir = movedY < 0 ? 'up' : 'down'
    }
  }
}

// Single scheduler so only ONE ambient event ever runs at a time, each followed
// by a calm gap (state returns to normal). Prevents overlapping / stuck bubbles.
const EVENT_SLOT = 5
function drawNpcEventLayer(ctx: CanvasRenderingContext2D, time: number, motions: NpcMotion[]) {
  if (motions.length === 0) return
  const slot = Math.floor(time / EVENT_SLOT)
  const local = time % EVENT_SLOT
  const kind = slot % 3

  if (kind === 0 && local < 1.35) {
    const randomTexts = ['LOL', 'GG', 'WAGMI', '?!', 'ser', 'gm']
    const index = slot % motions.length
    const motion = motions[index]
    if (!motion) return
    const lift = Math.sin((local / 1.35) * Math.PI) * 14
    drawMiniBubble(ctx, motion.x, motion.y - 148 - lift, randomTexts[index % randomTexts.length], '#f2c866')
    return
  }

  if (kind === 1 && local < 3) {
    const pair = nearestSocialPair(motions)
    if (!pair) return
    const turn = Math.floor(local / 0.75)
    const active = turn % 2 === 0 ? pair.a : pair.b
    drawPixelSignal(ctx, active.x, active.y - 122, '#57e39f', time + turn)
    ctx.save()
    ctx.strokeStyle = 'rgba(87,227,159,.48)'
    ctx.lineWidth = 3
    ctx.setLineDash([5, 8])
    ctx.beginPath()
    ctx.moveTo(pair.a.x, pair.a.y - 82)
    ctx.lineTo(pair.b.x, pair.b.y - 82)
    ctx.stroke()
    ctx.restore()
    return
  }

  if (kind === 2 && local < 1.3) {
    const greeters = [1, 8, 10]
    const index = greeters[slot % greeters.length]
    const motion = motions[index]
    if (!motion) return
    const scale = easeOutBack(Math.min(1, local / 0.3))
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

function questNpcMotion(quest: QuestNpc, time: number) {
  const phase = time + quest.id * 0.83
  return {
    x: quest.x + Math.sin(phase * 1.1) * 1.4,
    y: quest.y + Math.sin(phase * 1.8) * 1.2,
    moving: false,
    direction: 'down' as const,
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
    activity,
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
    activity?: AmbientActivity
  },
) {
  const sheet = SPRITES[sprite]
  const image = assets.sprites[sprite]
  const frame = chooseSpriteFrame(sprite, sheet.frames, time, seed, moving, near, completed, player, direction)
  const flipX = shouldFlipSprite(sprite, sheet.frames, direction)
  const walkPhase = Math.sin(time * 10 + seed)
  const bodyOffset = player
    ? moving ? -Math.abs(walkPhase) * 3.2 : -Math.abs(Math.sin(time * 2.4 + seed)) * 1
    : moving ? -Math.abs(walkPhase) * 1.4 : -Math.abs(Math.sin(time * 2.2 + seed)) * 1.1
  const facingDir = direction === 'left' ? -1 : direction === 'right' ? 1 : 0.35
  const rotation = player && moving ? walkPhase * 0.025 * facingDir : 0
  const baseDrawW = sprite === 'nxr' && !player ? 58 : sheet.drawW
  const baseDrawH = sprite === 'nxr' && !player ? 82 : sheet.drawH
  const drawW = baseDrawW
  const drawH = baseDrawH

  ctx.fillStyle = 'rgba(0,0,0,.22)'
  ctx.fillRect(Math.round(x - drawW * 0.24), Math.round(y - 8), Math.round(drawW * 0.48), 8)

  if (near) {
    drawPixelInteractCue(ctx, x, y, drawW * 1.16, drawH * 0.6, time + seed, tone, true)
  }

  ctx.save()
  ctx.translate(Math.round(x), Math.round(y))
  ctx.rotate(rotation)
  if (flipX) ctx.scale(-1, 1)
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

  if (activity) {
    drawActivityCue(ctx, x, y, drawW, drawH, time + seed, activity, tone, accent)
  }

  drawPixelNameTag(ctx, x, y - drawH - (compact ? 18 : 24), name, completed ? '#57e39f' : '#f7f1df', compact, tone)
}

function drawActivityCue(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  drawW: number,
  drawH: number,
  time: number,
  activity: AmbientActivity,
  tone: string,
  accent: string,
) {
  ctx.save()
  const markerX = Math.round(x + drawW * 0.43)
  const markerY = Math.round(y - drawH * 0.76 + Math.sin(time * 3) * 2)
  if (activity === 'dance') {
    const beat = Math.sin(time * 5)
    ctx.fillStyle = beat > 0 ? accent : tone
    ctx.fillRect(markerX, markerY, 5, 9)
    ctx.fillRect(markerX + 5, markerY + 6, 6, 4)
    ctx.fillRect(Math.round(x - drawW * 0.48), Math.round(y - drawH * 0.58 - beat * 2), 5, 5)
  } else if (activity === 'meditate') {
    ctx.fillStyle = 'rgba(242,200,102,.86)'
    ctx.fillRect(Math.round(x - 3), Math.round(y - drawH - 18 + Math.sin(time * 2) * 3), 6, 6)
    ctx.fillStyle = 'rgba(247,241,223,.72)'
    ctx.fillRect(Math.round(x - 1), Math.round(y - drawH - 24 + Math.sin(time * 2) * 3), 2, 2)
  } else if (activity === 'tend') {
    ctx.fillStyle = 'rgba(87,227,159,.82)'
    ctx.fillRect(Math.round(x + drawW * 0.35), Math.round(y - drawH * 0.35), 12, 7)
    ctx.fillRect(Math.round(x + drawW * 0.48), Math.round(y - drawH * 0.43), 9, 5)
  } else if (activity === 'gather') {
    ctx.fillStyle = tone
    ctx.fillRect(markerX, markerY, 4, 4)
    ctx.fillStyle = accent
    ctx.fillRect(markerX + 7, markerY - 3, 4, 4)
    ctx.fillStyle = 'rgba(247,241,223,.74)'
    ctx.fillRect(markerX + 3, markerY + 7, 4, 4)
  } else if (activity === 'couple') {
    ctx.fillStyle = 'rgba(255,122,217,.9)'
    const heartY = Math.round(y - drawH - 17 + Math.sin(time * 2.6) * 3)
    const heartX = Math.round(x - 5)
    ctx.fillRect(heartX, heartY + 3, 4, 4)
    ctx.fillRect(heartX + 6, heartY + 3, 4, 4)
    ctx.fillRect(heartX + 3, heartY + 7, 6, 4)
    ctx.fillRect(heartX + 5, heartY + 11, 2, 3)
  } else if (activity === 'sit') {
    ctx.fillStyle = 'rgba(247,241,223,.76)'
    ctx.fillRect(markerX, markerY, 10, 3)
    ctx.fillRect(markerX + 3, markerY + 4, 7, 3)
  }
  ctx.restore()
}

function drawPixelSignal(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, time: number) {
  const lift = Math.round(Math.sin(time * 4) * 2)
  ctx.save()
  ctx.fillStyle = 'rgba(7, 16, 12, .72)'
  ctx.fillRect(Math.round(x - 9), Math.round(y - 9 + lift), 18, 18)
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.strokeRect(Math.round(x - 9) + 0.5, Math.round(y - 9 + lift) + 0.5, 17, 17)
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x - 3), Math.round(y - 4 + lift), 6, 6)
  ctx.fillStyle = '#f7f1df'
  ctx.fillRect(Math.round(x - 1), Math.round(y + 4 + lift), 2, 2)
  ctx.restore()
}

function chooseSpriteFrame(
  _sprite: SpriteKey,
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
  if (frameCount >= 16) {
    // Unified 4x4 sheet: row 0=down, 1=up, 2=left, 3=right; 4 walk frames per row.
    const row = direction === 'up' ? 1 : direction === 'left' ? 2 : direction === 'right' ? 3 : 0
    const step = moving ? Math.floor(time * 6.4 + seed) % 4 : Math.floor(time * 1.6 + seed) % 2
    return Math.min(frameCount - 1, row * 4 + step)
  }
  return 0
}

function shouldFlipSprite(_sprite: SpriteKey, _frameCount: number, _direction: PlayerState['dir']) {
  // All sheets now ship dedicated left AND right rows — no mirroring needed.
  return false
}

function characterName(sprite: SpriteKey) {
  return CHARACTER_CHOICES.find((choice) => choice.key === sprite)?.label ?? 'Player'
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
  // drifting cloud shapes (soft alpha, no pixel snapping for smooth float)
  for (let i = 0; i < 16; i++) {
    const x = ((i * 190 + time * (12 + (i % 3) * 4)) % (width + 300)) - 170
    const y = 28 + (i * 47 + Math.sin(time * 0.32 + i) * 14) % Math.max(120, height * 0.46)
    ctx.fillStyle = 'rgba(247,241,223,.13)'
    ctx.fillRect(x, y, 104, 18)
    ctx.fillRect(x + 22, y - 12, 66, 18)
    ctx.fillRect(x + 52, y + 11, 46, 12)
  }
  const wind = Math.sin(time * 0.36) * 14
  // rain — two layers with sub-pixel positioning for buttery motion
  for (let layer = 0; layer < 2; layer++) {
    ctx.strokeStyle = layer === 0 ? 'rgba(210,232,255,.19)' : 'rgba(247,241,223,.14)'
    ctx.lineWidth = layer === 0 ? 2 : 1
    const count = layer === 0 ? 44 : 32
    for (let i = 0; i < count; i++) {
      const speed = layer === 0 ? 245 : 170
      const x = (i * 79 + time * (speed + (i % 5) * 9) + wind * 4) % (width + 160) - 80
      const y = (i * 101 + time * (285 + (i % 4) * 24)) % (height + 190) - 40
      const slant = -7 + wind * 0.18 + Math.sin(time * 0.7 + i) * 2
      const length = layer === 0 ? 28 + (i % 3) * 7 : 18 + (i % 4) * 4
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + slant, y + length)
      ctx.stroke()
    }
  }

  // floating fireflies / pollen
  for (let i = 0; i < 18; i++) {
    const x = (i * 131 + time * 42) % (width + 80) - 40
    const y = (i * 73 + time * 28) % (height + 120) - 20
    ctx.fillStyle = i % 2 === 0 ? 'rgba(185,255,102,.34)' : 'rgba(87,227,159,.28)'
    ctx.fillRect(x + Math.sin(time + i) * 7, y, 9, 5)
  }

  // pond ripples — smooth float ellipses
  ctx.strokeStyle = 'rgba(210, 251, 255, .3)'
  ctx.lineWidth = 2
  for (let i = 0; i < 10; i++) {
    const x = POND_RECT.x - camera.x + 24 + ((i * 31 + time * 24) % Math.max(40, POND_RECT.w - 48))
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
