import type { Address } from 'viem'

export type ProfileData = {
  name: string
  xUrl: string
  xHandle: string
  avatarUrl: string
  followers: number
  following: number
  exists: boolean
}

export type UserStatsData = {
  lastCheckInDay: number
  currentStreak: number
  bestStreak: number
  totalCheckIns: number
  reviewCount: number
  totalPts: number
}

export type ReviewData = {
  id: number
  category: number
  reviewer: Address
  title: string
  originOrImdb: string
  imageUrl: string
  rating: number
  reviewText: string
  timestamp: number
}

export type LeaderboardData = {
  user: Address
  name: string
  xHandle: string
  avatarUrl: string
  currentStreak: number
  bestStreak: number
  totalCheckIns: number
  reviewCount: number
  totalPts: number
}

export type GrialoStatsData = {
  totalPts: number
  grialoPts: number
  quizPts: number
  totalSpins: number
  currentStreak: number
  bestStreak: number
  lastSpinAt: number
  bestTier: number
  totalQuizzes: number
  totalWishes: number
  spinReady: boolean
  waitTime: number
}

export type GrialoUserData = ProfileData & GrialoStatsData & {
  sealedAt: number
}

export type GrialoSpinData = {
  spinId: number
  tier: number
  ptsGained: number
  streakAfter: number
  spunAt: number
  exists: boolean
}

export type GrialoLeaderboardData = {
  user: Address
  username: string
  xHandle: string
  totalPts: number
  grialoPts: number
  quizPts: number
  totalSpins: number
  bestStreak: number
  bestTier: number
  totalQuizzes: number
  totalWishes: number
  rankingValue: number
}

export type WishData = {
  wishId: number
  author: Address
  message: string
  createdAt: number
}

export type TotalsData = {
  totalUsers: number
  totalReviews: number
  balance: bigint
}

export const EMPTY_PROFILE: ProfileData = {
  name: '',
  xUrl: '',
  xHandle: '',
  avatarUrl: '',
  followers: 0,
  following: 0,
  exists: false,
}

export const EMPTY_STATS: UserStatsData = {
  lastCheckInDay: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalCheckIns: 0,
  reviewCount: 0,
  totalPts: 0,
}

export const EMPTY_GRIALO_STATS: GrialoStatsData = {
  totalPts: 0,
  grialoPts: 0,
  quizPts: 0,
  totalSpins: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastSpinAt: 0,
  bestTier: 0,
  totalQuizzes: 0,
  totalWishes: 0,
  spinReady: false,
  waitTime: 0,
}

export const EMPTY_GRIALO_USER: GrialoUserData = {
  ...EMPTY_PROFILE,
  ...EMPTY_GRIALO_STATS,
  sealedAt: 0,
}

export const EMPTY_GRIALO_SPIN: GrialoSpinData = {
  spinId: 0,
  tier: 0,
  ptsGained: 0,
  streakAfter: 0,
  spunAt: 0,
  exists: false,
}

export const TIERS = [
  { name: 'RialOne', range: '0-2 days', min: 0, pts: 10, color: '#32d583' },
  { name: 'Rialo club member', range: '3-6 days', min: 3, pts: 10, color: '#7dd3fc' },
  { name: 'Rialo Warrior', range: '7-13 days', min: 7, pts: 10, color: '#facc15' },
  { name: 'Rialo Builders', range: '14-29 days', min: 14, pts: 15, color: '#fb923c' },
  { name: 'Rialo Master', range: '30+ days', min: 30, pts: 20, color: '#d8b4fe' },
] as const

export const GRIALO_RARITIES = [
  { id: 0, tier: 'Common', boxName: 'Stone', text: 'grialo', color: '#9ca3af', accent: '#d1d5db', aura: 'stone', ptsHint: 'faint glow' },
  { id: 1, tier: 'Uncommon', boxName: 'Jade', text: 'Grialo!', color: '#57e39f', accent: '#b9ffd8', aura: 'jade', ptsHint: 'rune sparkle' },
  { id: 2, tier: 'Rare', boxName: 'Sapphire', text: 'GRIALO', color: '#4f8cff', accent: '#d9f4ff', aura: 'sapphire', ptsHint: 'hologram seal' },
  { id: 3, tier: 'Epic', boxName: 'Amethyst', text: 'GRIALOOO', color: '#b76cff', accent: '#f0d7ff', aura: 'amethyst', ptsHint: 'gem vortex' },
  { id: 4, tier: 'Legendary', boxName: 'Gold', text: 'GRIALO ✦', color: '#f2c866', accent: '#fff4c2', aura: 'gold', ptsHint: 'temple rays' },
  { id: 5, tier: 'Mythic', boxName: 'Crown', text: 'GRIALO KING', color: '#ff7ad9', accent: '#57e39f', aura: 'crown', ptsHint: 'royal shimmer' },
  { id: 6, tier: 'Secret', boxName: 'Void', text: 'grialo?', color: '#111827', accent: '#f7f1df', aura: 'void', ptsHint: 'reality tear' },
] as const

export function getGrialoRarity(tier: number) {
  return GRIALO_RARITIES.find((item) => item.id === tier) ?? GRIALO_RARITIES[0]
}

export function getTier(streak: number) {
  return [...TIERS].reverse().find((tier) => streak >= tier.min) ?? TIERS[0]
}

export function ptsForStreak(streak: number) {
  if (streak >= 30) return 20
  if (streak >= 14) return 15
  return 10
}

export function fmtAddress(address?: string) {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function fmtTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h}h ${m}m ${s}s`
}

export function fmtCountdown(seconds: number) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

export function normalizeXHandle(value: string) {
  const trimmed = value.trim()
  const fromUrl = trimmed.match(/x\.com\/([^/?#]+)/i) || trimmed.match(/twitter\.com\/([^/?#]+)/i)
  return (fromUrl?.[1] || trimmed).replace(/^@/, '')
}

export function toXUrl(value: string) {
  if (value.startsWith('http')) return value
  return `https://x.com/${normalizeXHandle(value)}`
}

export function toXAvatarUrl(handle: string) {
  return handle ? `https://unavatar.io/x/${encodeURIComponent(handle)}` : ''
}

export function parseProfileResult(data: unknown): { profile: ProfileData; stats: UserStatsData } {
  const profile = pick(data, 0, 'profile')
  const stats = pick(data, 1, 'userStats')
  return {
    profile: parseProfile(profile),
    stats: parseStats(stats),
  }
}

export function parseUnifiedUser(data: unknown): GrialoUserData {
  const row = (data ?? {}) as Record<string, unknown>
  const arr = Array.isArray(data) ? data : []
  const nestedProfile = row.profile ?? arr[0]
  const nestedStats = row.stats ?? arr[1]

  if (nestedProfile || nestedStats) {
    const profile = parseV2Profile(nestedProfile)
    const stats = {
      ...parseGrialoStats(nestedStats),
      spinReady: Boolean(row.spinReady ?? arr[2] ?? false),
      waitTime: toNumber(row.waitTime ?? arr[3]),
    }

    return {
      ...EMPTY_GRIALO_USER,
      ...stats,
      name: profile.name,
      xUrl: profile.xUrl,
      xHandle: profile.xHandle,
      avatarUrl: profile.avatarUrl,
      exists: profile.exists,
      sealedAt: profile.sealedAt,
    }
  }

  const username = String(row.username ?? row.name ?? arr[0] ?? '')
  const xHandle = normalizeXHandle(String(row.xHandle ?? arr[1] ?? ''))
  const profileSealed = Boolean(row.profileSealed ?? row.exists ?? arr[2] ?? false)
  const sealedAt = toNumber(row.sealedAt ?? arr[3])
  const stats = parseGrialoStats({
    totalSpins: row.totalSpins ?? arr[4],
    totalPts: row.totalPts ?? arr[5],
    currentStreak: row.currentStreak ?? arr[6],
    bestStreak: row.bestStreak ?? arr[7],
    lastSpinAt: row.lastSpinAt ?? arr[8],
    bestTier: row.bestTier ?? arr[9],
    spinReady: row.spinReady ?? arr[10],
    waitTime: row.waitTime ?? arr[11],
  })

  return {
    ...EMPTY_GRIALO_USER,
    ...stats,
    name: username,
    xUrl: toXUrl(xHandle),
    xHandle,
    avatarUrl: toXAvatarUrl(xHandle),
    exists: profileSealed,
    sealedAt,
  }
}

export function parseReviews(data: unknown): ReviewData[] {
  if (!Array.isArray(data)) return []
  return data.map((item) => {
    const row = item as Record<string, unknown>
    const arr = Array.isArray(item) ? item : []
    return {
      id: toNumber(row.id ?? arr[0]),
      category: toNumber(row.category ?? arr[1]),
      reviewer: String(row.reviewer ?? arr[2] ?? '0x0000000000000000000000000000000000000000') as Address,
      title: String(row.title ?? arr[3] ?? ''),
      originOrImdb: String(row.originOrImdb ?? arr[4] ?? ''),
      imageUrl: String(row.imageUrl ?? arr[5] ?? ''),
      rating: toNumber(row.rating ?? arr[6]),
      reviewText: String(row.reviewText ?? arr[7] ?? ''),
      timestamp: toNumber(row.timestamp ?? arr[8]),
    }
  })
}

export function parseLeaderboard(data: unknown): LeaderboardData[] {
  if (!Array.isArray(data)) return []
  return data.map((item) => {
    const row = item as Record<string, unknown>
    const arr = Array.isArray(item) ? item : []
    return {
      user: String(row.user ?? arr[0] ?? '0x0000000000000000000000000000000000000000') as Address,
      name: String(row.name ?? arr[1] ?? ''),
      xHandle: String(row.xHandle ?? arr[2] ?? ''),
      avatarUrl: String(row.avatarUrl ?? arr[3] ?? ''),
      currentStreak: toNumber(row.currentStreak ?? arr[4]),
      bestStreak: toNumber(row.bestStreak ?? arr[5]),
      totalCheckIns: toNumber(row.totalCheckIns ?? arr[6]),
      reviewCount: toNumber(row.reviewCount ?? arr[7]),
      totalPts: toNumber(row.totalPts ?? arr[8]),
    }
  })
}

export function parseTotals(data: unknown): TotalsData {
  const row = (data ?? {}) as Record<string, unknown>
  const arr = Array.isArray(data) ? data : []
  return {
    totalUsers: toNumber(row.totalUsers ?? arr[0]),
    totalReviews: toNumber(row.totalReviews ?? arr[1]),
    balance: toBigInt(row.balance ?? arr[2]),
  }
}

export function parseGrialoStats(data: unknown): GrialoStatsData {
  const row = (data ?? {}) as Record<string, unknown>
  const arr = Array.isArray(data) ? data : []
  return {
    totalPts: toNumber(row.totalPts ?? arr[0]),
    grialoPts: toNumber(row.grialoPts ?? arr[1]),
    quizPts: toNumber(row.quizPts ?? arr[2]),
    totalSpins: toNumber(row.totalSpins ?? arr[3] ?? row.totalCheckIns),
    currentStreak: toNumber(row.currentStreak ?? arr[4]),
    bestStreak: toNumber(row.bestStreak ?? arr[5]),
    lastSpinAt: toNumber(row.lastSpinAt ?? arr[6]),
    bestTier: toNumber(row.bestTier ?? arr[7]),
    totalQuizzes: toNumber(row.totalQuizzes ?? arr[8]),
    totalWishes: toNumber(row.totalWishes ?? arr[9]),
    spinReady: Boolean(row.spinReady ?? arr[10] ?? false),
    waitTime: toNumber(row.waitTime ?? arr[11]),
  }
}

export function parseGrialoSpin(data: unknown): GrialoSpinData {
  const row = (data ?? {}) as Record<string, unknown>
  const arr = Array.isArray(data) ? data : []
  return {
    spinId: toNumber(row.spinId ?? arr[0]),
    tier: toNumber(row.tier ?? arr[1]),
    ptsGained: toNumber(row.pts ?? row.ptsGained ?? arr[2]),
    streakAfter: toNumber(row.streakAfterSpin ?? row.streakAfter ?? arr[3]),
    spunAt: toNumber(row.timestamp ?? row.spunAt ?? arr[4]),
    exists: Boolean(row.exists ?? arr[5] ?? toNumber(row.timestamp ?? arr[4]) > 0),
  }
}

export function parseLeaderboardAddresses(data: unknown): { users: Address[]; values: number[] } {
  const row = (data ?? {}) as Record<string, unknown>
  const arr = Array.isArray(data) ? data : []
  const usersRaw = (row.topUsers ?? arr[0] ?? []) as unknown[]
  const valuesRaw = (row.values ?? arr[1] ?? []) as unknown[]

  return {
    users: usersRaw.map((user) => String(user) as Address).filter((user) => /^0x[a-fA-F0-9]{40}$/.test(user)),
    values: valuesRaw.map(toNumber),
  }
}

export function buildLeaderboardRows(users: Address[], values: number[], userResults: unknown[]): GrialoLeaderboardData[] {
  return users.map((user, index) => {
    const parsed = parseUnifiedUser(userResults[index])
    return {
      user,
      username: parsed.name,
      xHandle: parsed.xHandle,
      totalPts: parsed.totalPts,
      grialoPts: parsed.grialoPts,
      quizPts: parsed.quizPts,
      totalSpins: parsed.totalSpins,
      bestStreak: parsed.bestStreak,
      bestTier: parsed.bestTier,
      totalQuizzes: parsed.totalQuizzes,
      totalWishes: parsed.totalWishes,
      rankingValue: values[index] ?? 0,
    }
  })
}

export function parseWishes(data: unknown): WishData[] {
  if (!Array.isArray(data)) return []
  return data.map((item) => {
    const row = item as Record<string, unknown>
    const arr = Array.isArray(item) ? item : []
    return {
      wishId: toNumber(row.wishId ?? row.id ?? arr[0]),
      author: String(row.author ?? arr[1] ?? '0x0000000000000000000000000000000000000000') as Address,
      message: String(row.message ?? arr[2] ?? ''),
      createdAt: toNumber(row.createdAt ?? row.timestamp ?? arr[3]),
    }
  })
}

function parseProfile(data: unknown): ProfileData {
  const row = (data ?? {}) as Record<string, unknown>
  const arr = Array.isArray(data) ? data : []
  return {
    name: String(row.name ?? arr[0] ?? ''),
    xUrl: String(row.xUrl ?? arr[1] ?? ''),
    xHandle: String(row.xHandle ?? arr[2] ?? ''),
    avatarUrl: String(row.avatarUrl ?? arr[3] ?? ''),
    followers: toNumber(row.followers ?? arr[4]),
    following: toNumber(row.following ?? arr[5]),
    exists: Boolean(row.exists ?? arr[6] ?? false),
  }
}

function parseV2Profile(data: unknown): ProfileData & { sealedAt: number } {
  const row = (data ?? {}) as Record<string, unknown>
  const arr = Array.isArray(data) ? data : []
  const username = String(row.username ?? row.name ?? arr[0] ?? '')
  const xHandle = normalizeXHandle(String(row.xHandle ?? arr[1] ?? ''))

  return {
    name: username,
    xUrl: toXUrl(xHandle),
    xHandle,
    avatarUrl: toXAvatarUrl(xHandle),
    followers: 0,
    following: 0,
    exists: Boolean(row.isSealed ?? row.profileSealed ?? row.exists ?? arr[3] ?? false),
    sealedAt: toNumber(row.sealedAt ?? arr[2]),
  }
}

function parseStats(data: unknown): UserStatsData {
  const row = (data ?? {}) as Record<string, unknown>
  const arr = Array.isArray(data) ? data : []
  return {
    lastCheckInDay: toNumber(row.lastCheckInDay ?? arr[0]),
    currentStreak: toNumber(row.currentStreak ?? arr[1]),
    bestStreak: toNumber(row.bestStreak ?? arr[2]),
    totalCheckIns: toNumber(row.totalCheckIns ?? arr[3]),
    reviewCount: toNumber(row.reviewCount ?? arr[4]),
    totalPts: toNumber(row.totalPts ?? arr[5]),
  }
}

function pick(data: unknown, index: number, key: string) {
  if (Array.isArray(data)) return data[index]
  return (data as Record<string, unknown> | undefined)?.[key]
}

function toNumber(value: unknown) {
  if (typeof value === 'bigint') return Number(value)
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value || 0)
  return 0
}

function toBigInt(value: unknown) {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') return BigInt(value)
  if (typeof value === 'string') return BigInt(value || 0)
  return 0n
}
