import type { Address } from 'viem'

export const RIALO_TEMPLE_ADDRESS = (
  import.meta.env.VITE_RIALO_TEMPLE_ADDRESS || '0x677D6d43C8F235a22Fec0efE8A571447E30D0f72'
) as Address

export const RIALO_TEMPLE_ABI = [
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'xUrl', type: 'string' },
      { internalType: 'string', name: 'xHandle', type: 'string' },
      { internalType: 'string', name: 'avatarUrl', type: 'string' },
      { internalType: 'uint256', name: 'followers', type: 'uint256' },
      { internalType: 'uint256', name: 'following', type: 'uint256' },
    ],
    name: 'setupProfile',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'checkIn',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'origin', type: 'string' },
      { internalType: 'string', name: 'imageUrl', type: 'string' },
      { internalType: 'uint8', name: 'rating', type: 'uint8' },
      { internalType: 'string', name: 'reviewText', type: 'string' },
    ],
    name: 'submitFoodReview',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'title', type: 'string' },
      { internalType: 'string', name: 'imdbUrl', type: 'string' },
      { internalType: 'uint8', name: 'rating', type: 'uint8' },
      { internalType: 'string', name: 'reviewText', type: 'string' },
    ],
    name: 'submitFilmReview',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getProfile',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'xUrl', type: 'string' },
          { internalType: 'string', name: 'xHandle', type: 'string' },
          { internalType: 'string', name: 'avatarUrl', type: 'string' },
          { internalType: 'uint256', name: 'followers', type: 'uint256' },
          { internalType: 'uint256', name: 'following', type: 'uint256' },
          { internalType: 'bool', name: 'exists', type: 'bool' },
        ],
        internalType: 'struct RialoTemple.Profile',
        name: 'profile',
        type: 'tuple',
      },
      {
        components: [
          { internalType: 'uint256', name: 'lastCheckInDay', type: 'uint256' },
          { internalType: 'uint256', name: 'currentStreak', type: 'uint256' },
          { internalType: 'uint256', name: 'bestStreak', type: 'uint256' },
          { internalType: 'uint256', name: 'totalCheckIns', type: 'uint256' },
          { internalType: 'uint256', name: 'reviewCount', type: 'uint256' },
          { internalType: 'uint256', name: 'totalPts', type: 'uint256' },
        ],
        internalType: 'struct RialoTemple.UserStats',
        name: 'userStats',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getMyProfile',
    outputs: [
      {
        components: [
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'xUrl', type: 'string' },
          { internalType: 'string', name: 'xHandle', type: 'string' },
          { internalType: 'string', name: 'avatarUrl', type: 'string' },
          { internalType: 'uint256', name: 'followers', type: 'uint256' },
          { internalType: 'uint256', name: 'following', type: 'uint256' },
          { internalType: 'bool', name: 'exists', type: 'bool' },
        ],
        internalType: 'struct RialoTemple.Profile',
        name: 'profile',
        type: 'tuple',
      },
      {
        components: [
          { internalType: 'uint256', name: 'lastCheckInDay', type: 'uint256' },
          { internalType: 'uint256', name: 'currentStreak', type: 'uint256' },
          { internalType: 'uint256', name: 'bestStreak', type: 'uint256' },
          { internalType: 'uint256', name: 'totalCheckIns', type: 'uint256' },
          { internalType: 'uint256', name: 'reviewCount', type: 'uint256' },
          { internalType: 'uint256', name: 'totalPts', type: 'uint256' },
        ],
        internalType: 'struct RialoTemple.UserStats',
        name: 'userStats',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'offset', type: 'uint256' },
      { internalType: 'uint256', name: 'limit', type: 'uint256' },
    ],
    name: 'getReviews',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'enum RialoTemple.ReviewCategory', name: 'category', type: 'uint8' },
          { internalType: 'address', name: 'reviewer', type: 'address' },
          { internalType: 'string', name: 'title', type: 'string' },
          { internalType: 'string', name: 'originOrImdb', type: 'string' },
          { internalType: 'string', name: 'imageUrl', type: 'string' },
          { internalType: 'uint8', name: 'rating', type: 'uint8' },
          { internalType: 'string', name: 'reviewText', type: 'string' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
        ],
        internalType: 'struct RialoTemple.Review[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'enum RialoTemple.ReviewCategory', name: 'category', type: 'uint8' },
      { internalType: 'uint256', name: 'offset', type: 'uint256' },
      { internalType: 'uint256', name: 'limit', type: 'uint256' },
    ],
    name: 'getReviewsByCategory',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'id', type: 'uint256' },
          { internalType: 'enum RialoTemple.ReviewCategory', name: 'category', type: 'uint8' },
          { internalType: 'address', name: 'reviewer', type: 'address' },
          { internalType: 'string', name: 'title', type: 'string' },
          { internalType: 'string', name: 'originOrImdb', type: 'string' },
          { internalType: 'string', name: 'imageUrl', type: 'string' },
          { internalType: 'uint8', name: 'rating', type: 'uint8' },
          { internalType: 'string', name: 'reviewText', type: 'string' },
          { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
        ],
        internalType: 'struct RialoTemple.Review[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'limit', type: 'uint256' }],
    name: 'getLeaderboard',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'user', type: 'address' },
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'string', name: 'xHandle', type: 'string' },
          { internalType: 'string', name: 'avatarUrl', type: 'string' },
          { internalType: 'uint256', name: 'currentStreak', type: 'uint256' },
          { internalType: 'uint256', name: 'bestStreak', type: 'uint256' },
          { internalType: 'uint256', name: 'totalCheckIns', type: 'uint256' },
          { internalType: 'uint256', name: 'reviewCount', type: 'uint256' },
          { internalType: 'uint256', name: 'totalPts', type: 'uint256' },
        ],
        internalType: 'struct RialoTemple.LeaderboardEntry[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTotals',
    outputs: [
      { internalType: 'uint256', name: 'totalUsers', type: 'uint256' },
      { internalType: 'uint256', name: 'totalReviews', type: 'uint256' },
      { internalType: 'uint256', name: 'balance', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'canCheckIn',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'timeUntilNextCheckIn',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'streak', type: 'uint256' }],
    name: 'ptsForStreak',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'pure',
    type: 'function',
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
