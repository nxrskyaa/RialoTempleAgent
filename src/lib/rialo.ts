import { parseEther, type Address } from 'viem'

export const ACTION_FEE = parseEther('1')
export const REVIEW_PAGE_SIZE = 24n

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

export const TIERS = [
  { name: 'RialOne', range: '0-2 days', min: 0, pts: 10, color: '#32d583' },
  { name: 'Rialo club member', range: '3-6 days', min: 3, pts: 10, color: '#7dd3fc' },
  { name: 'Rialo Warrior', range: '7-13 days', min: 7, pts: 10, color: '#facc15' },
  { name: 'Rialo Builders', range: '14-29 days', min: 14, pts: 15, color: '#fb923c' },
  { name: 'Rialo Master', range: '30+ days', min: 30, pts: 20, color: '#d8b4fe' },
] as const

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
