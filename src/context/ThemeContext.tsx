import { createContext, useContext } from 'react'

const C = {
  bg: '#070908',
  card: 'rgba(13,18,15,0.84)',
  cardHover: 'rgba(20,29,23,0.92)',
  border: 'rgba(229,231,199,0.11)',
  border2: 'rgba(229,231,199,0.18)',
  text: '#f8f6e9',
  muted: '#aeb7a2',
  subtle: '#6f796b',
  accent: '#32d583',
  accentLight: '#f4c95d',
  success: '#22c55e',
  gold: '#f4c95d',
  silver: '#9ca3af',
  bronze: '#cd7f32',
  violet: '#a78bfa',
}

const Ctx = createContext({ colors: C })
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <Ctx.Provider value={{ colors: C }}>{children}</Ctx.Provider>
}
export const useTheme = () => useContext(Ctx)
