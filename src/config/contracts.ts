import type { Address } from 'viem'

export const RIALO_TEMPLE_ADDRESS = (
  import.meta.env.VITE_RIALO_TEMPLE_ADDRESS || '0x568e94aAf7Daf29af6Ffc53C54b58E7d2DCc3BD5'
) as Address

const PROFILE_COMPONENTS = [
  { internalType: 'string', name: 'username', type: 'string' },
  { internalType: 'string', name: 'xHandle', type: 'string' },
  { internalType: 'uint256', name: 'sealedAt', type: 'uint256' },
  { internalType: 'bool', name: 'isSealed', type: 'bool' },
] as const

const STATS_COMPONENTS = [
  { internalType: 'uint256', name: 'totalPts', type: 'uint256' },
  { internalType: 'uint256', name: 'grialoPts', type: 'uint256' },
  { internalType: 'uint256', name: 'quizPts', type: 'uint256' },
  { internalType: 'uint256', name: 'totalSpins', type: 'uint256' },
  { internalType: 'uint256', name: 'currentStreak', type: 'uint256' },
  { internalType: 'uint256', name: 'bestStreak', type: 'uint256' },
  { internalType: 'uint256', name: 'lastSpinAt', type: 'uint256' },
  { internalType: 'uint8', name: 'bestTier', type: 'uint8' },
  { internalType: 'uint256', name: 'totalQuizzes', type: 'uint256' },
  { internalType: 'uint256', name: 'totalWishes', type: 'uint256' },
] as const

const SPIN_COMPONENTS = [
  { internalType: 'uint256', name: 'spinId', type: 'uint256' },
  { internalType: 'uint8', name: 'tier', type: 'uint8' },
  { internalType: 'uint256', name: 'pts', type: 'uint256' },
  { internalType: 'uint256', name: 'streakAfterSpin', type: 'uint256' },
  { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
  { internalType: 'bool', name: 'exists', type: 'bool' },
] as const

const WISH_COMPONENTS = [
  { internalType: 'uint256', name: 'wishId', type: 'uint256' },
  { internalType: 'address', name: 'author', type: 'address' },
  { internalType: 'string', name: 'message', type: 'string' },
  { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
] as const

export const RIALO_TEMPLE_ABI = [
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'username', type: 'string' },
      { internalType: 'string', name: 'xHandle', type: 'string' },
    ],
    name: 'sealProfile',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'hasProfile',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getProfile',
    outputs: [{ components: PROFILE_COMPONENTS, internalType: 'struct RialoTempleV2Lite.Profile', name: '', type: 'tuple' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getStats',
    outputs: [{ components: STATS_COMPONENTS, internalType: 'struct RialoTempleV2Lite.Stats', name: '', type: 'tuple' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getUser',
    outputs: [
      { components: PROFILE_COMPONENTS, internalType: 'struct RialoTempleV2Lite.Profile', name: 'profile', type: 'tuple' },
      { components: STATS_COMPONENTS, internalType: 'struct RialoTempleV2Lite.Stats', name: 'stats', type: 'tuple' },
      { internalType: 'bool', name: 'spinReady', type: 'bool' },
      { internalType: 'uint256', name: 'waitTime', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'spinGrialo',
    outputs: [{ components: SPIN_COMPONENTS, internalType: 'struct RialoTempleV2Lite.SpinResult', name: 'result', type: 'tuple' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'canSpin',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'timeUntilNextSpin',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'nextSpinAt',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getLatestSpin',
    outputs: [{ components: SPIN_COMPONENTS, internalType: 'struct RialoTempleV2Lite.SpinResult', name: '', type: 'tuple' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint16', name: 'quizId', type: 'uint16' }],
    name: 'completeQuiz',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'user', type: 'address' },
      { internalType: 'uint16', name: 'quizId', type: 'uint16' },
    ],
    name: 'isQuizCompleted',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint16', name: 'quizId', type: 'uint16' }],
    name: 'quizReward',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint16', name: 'quizId', type: 'uint16' }],
    name: 'quizActive',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'string', name: 'message', type: 'string' }],
    name: 'submitWish',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'wishId', type: 'uint256' }],
    name: 'getWish',
    outputs: [{ components: WISH_COMPONENTS, internalType: 'struct RialoTempleV2Lite.Wish', name: '', type: 'tuple' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getWishCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'start', type: 'uint256' },
      { internalType: 'uint256', name: 'limit', type: 'uint256' },
    ],
    name: 'getWishes',
    outputs: [{ components: WISH_COMPONENTS, internalType: 'struct RialoTempleV2Lite.Wish[]', name: '', type: 'tuple[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getUserWishCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getUserWishIds',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'limit', type: 'uint256' }],
    name: 'getTopByPts',
    outputs: [
      { internalType: 'address[]', name: 'topUsers', type: 'address[]' },
      { internalType: 'uint256[]', name: 'values', type: 'uint256[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'limit', type: 'uint256' }],
    name: 'getTopByStreak',
    outputs: [
      { internalType: 'address[]', name: 'topUsers', type: 'address[]' },
      { internalType: 'uint256[]', name: 'values', type: 'uint256[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'limit', type: 'uint256' }],
    name: 'getTopByGrialoPts',
    outputs: [
      { internalType: 'address[]', name: 'topUsers', type: 'address[]' },
      { internalType: 'uint256[]', name: 'values', type: 'uint256[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'limit', type: 'uint256' }],
    name: 'getTopByQuizPts',
    outputs: [
      { internalType: 'address[]', name: 'topUsers', type: 'address[]' },
      { internalType: 'uint256[]', name: 'values', type: 'uint256[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getPlayerCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'index', type: 'uint256' }],
    name: 'getPlayerAt',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'start', type: 'uint256' },
      { internalType: 'uint256', name: 'limit', type: 'uint256' },
    ],
    name: 'getPlayers',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'spinId', type: 'uint256' },
      { indexed: false, internalType: 'uint8', name: 'tier', type: 'uint8' },
      { indexed: false, internalType: 'uint256', name: 'pts', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'streakAfterSpin', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'totalPts', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'GrialoSpun',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'user', type: 'address' },
      { indexed: false, internalType: 'string', name: 'username', type: 'string' },
      { indexed: false, internalType: 'string', name: 'xHandle', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    name: 'ProfileSealed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'author', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'wishId', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'message', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'createdAt', type: 'uint256' },
    ],
    name: 'WishSubmitted',
    type: 'event',
  },
] as const

export const ARC_CHAIN = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
  blockExplorers: { default: { name: 'Arcscan', url: 'https://testnet.arcscan.app' } },
  testnet: true,
} as const

export const ARC_EXPLORER_TX_BASE =
  import.meta.env.VITE_ARC_EXPLORER_TX_BASE || `${ARC_CHAIN.blockExplorers.default.url}/tx`
