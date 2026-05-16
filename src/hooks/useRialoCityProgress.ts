import { useCallback, useMemo, useState } from 'react'
import { RIALO_CITY_MODULES, RIALO_CITY_TOTAL_MODULES, type RialoCityModuleId } from '@/data/rialoCityModules'

const PASSPORT_KEY = 'rialoCityPassport'
const PROGRESS_KEY = 'rialoCityProgress'

export type RialoCityPassportData = {
  name: string
  role: string
  favoriteUseCase: string
  createdAt: string
}

export type RialoCityProgressData = {
  completedModules: RialoCityModuleId[]
  badges: string[]
  xp: number
}

type RialoCityState = {
  passport: RialoCityPassportData | null
  progress: RialoCityProgressData
}

const EMPTY_PROGRESS: RialoCityProgressData = {
  completedModules: [],
  badges: [],
  xp: 0,
}

const RANKS = [
  { min: 900, name: 'Architect' },
  { min: 600, name: 'Pioneer' },
  { min: 300, name: 'Citizen' },
  { min: 100, name: 'Explorer' },
  { min: 0, name: 'Visitor' },
] as const

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items))
}

function calculateXp(passport: RialoCityPassportData | null, completedModules: RialoCityModuleId[]) {
  const passportXp = passport ? 50 : 0
  const moduleXp = completedModules.length * 100
  const bonusXp = completedModules.length === RIALO_CITY_TOTAL_MODULES ? 300 : 0
  return passportXp + moduleXp + bonusXp
}

function getInitialState(): RialoCityState {
  const storedPassport = readJson<RialoCityPassportData | null>(PASSPORT_KEY, null)
  const storedProgress = readJson<RialoCityProgressData>(PROGRESS_KEY, EMPTY_PROGRESS)
  const completedModules = unique(storedProgress.completedModules ?? [])
  const badges = unique(storedProgress.badges ?? [])
  const progress = {
    completedModules,
    badges,
    xp: calculateXp(storedPassport, completedModules),
  }

  writeJson(PROGRESS_KEY, progress)
  return { passport: storedPassport, progress }
}

export function getRialoCityRank(xp: number) {
  return RANKS.find((rank) => xp >= rank.min)?.name ?? 'Visitor'
}

export function useRialoCityProgress() {
  const [{ passport, progress }, setCityState] = useState<RialoCityState>(getInitialState)

  const savePassport = useCallback((data: Omit<RialoCityPassportData, 'createdAt'>) => {
    const nextPassport = {
      ...data,
      createdAt: new Date().toISOString(),
    }

    writeJson(PASSPORT_KEY, nextPassport)
    setCityState((current) => {
      const next = {
        passport: nextPassport,
        progress: {
          ...current.progress,
          xp: calculateXp(nextPassport, current.progress.completedModules),
        },
      }
      writeJson(PROGRESS_KEY, next.progress)
      return next
    })
  }, [])

  const completeModule = useCallback((moduleId: RialoCityModuleId) => {
    const module = RIALO_CITY_MODULES.find((item) => item.id === moduleId)
    if (!module) return

    setCityState((current) => {
      const completedModules = unique([...current.progress.completedModules, moduleId])
      const badges = unique([...current.progress.badges, module.badge])
      const storedPassport = readJson<RialoCityPassportData | null>(PASSPORT_KEY, passport)
      const nextProgress = {
        completedModules,
        badges,
        xp: calculateXp(storedPassport, completedModules),
      }
      writeJson(PROGRESS_KEY, nextProgress)
      return {
        passport: storedPassport,
        progress: nextProgress,
      }
    })
  }, [passport])

  const stats = useMemo(() => {
    const completedCount = progress.completedModules.length
    const progressPercentage = Math.round((completedCount / RIALO_CITY_TOTAL_MODULES) * 100)
    const allCompleted = completedCount === RIALO_CITY_TOTAL_MODULES

    return {
      rank: getRialoCityRank(progress.xp),
      completedCount,
      progressPercentage,
      allCompleted,
      totalModules: RIALO_CITY_TOTAL_MODULES,
    }
  }, [progress])

  return {
    passport,
    progress,
    savePassport,
    completeModule,
    ...stats,
  }
}
