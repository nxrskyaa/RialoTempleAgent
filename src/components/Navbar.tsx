import { Link, useLocation } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'
import { Flame, MessageSquareText, Sparkles, Trophy, UserCircle } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

const NAV = [
  { path: '/review', label: 'Reviews', icon: MessageSquareText },
  { path: '/grialo', label: 'Grialo', icon: Sparkles },
  { path: '/leaderboard', label: 'Rank', icon: Trophy },
  { path: '/profile', label: 'Profile', icon: UserCircle },
]

export default function Navbar() {
  const { colors } = useTheme()
  const location = useLocation()

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b" style={{ backgroundColor: 'rgba(7,9,8,0.78)', backdropFilter: 'blur(18px)', borderColor: colors.border }}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-1 px-2 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-lg border" style={{ borderColor: colors.border2, backgroundColor: 'rgba(50,213,131,0.08)' }}>
            <img src="/logo-icon.png" alt="" className="h-6 w-6" />
            <Flame className="absolute -right-1 -top-1 h-3.5 w-3.5" style={{ color: colors.gold }} />
          </span>
          <span className="hidden text-sm font-semibold sm:inline" style={{ color: colors.text }}>Rialo Temple</span>
        </Link>
        <div className="flex items-center gap-0.5 rounded-lg border p-1" style={{ borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.03)' }}>
          {NAV.map(item => {
            const active = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path}
                className="relative flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors sm:px-3"
                style={{ color: active ? '#071009' : colors.muted }}>
                {active && <motion.div layoutId="nav" className="absolute inset-0 rounded-md" style={{ background: 'linear-gradient(135deg,#32d583,#f4c95d)' }} transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                <item.icon className="relative z-10 h-3.5 w-3.5" />
                <span className="relative z-10 hidden sm:inline">{item.label}</span>
              </Link>
            )
          })}
        </div>
        <ConnectButton.Custom>
          {({ account, chain, mounted, openAccountModal, openChainModal, openConnectModal }) => {
            const ready = mounted
            const connected = ready && account && chain
            return (
              <button
                type="button"
                onClick={connected ? (chain.unsupported ? openChainModal : openAccountModal) : openConnectModal}
                className="temple-button max-w-[86px] truncate rounded-lg px-3 py-2 text-xs font-bold sm:max-w-none sm:px-4 sm:text-sm"
              >
                {!ready ? '...' : connected ? (chain.unsupported ? 'Switch' : account.displayName) : 'Connect'}
              </button>
            )
          }}
        </ConnectButton.Custom>
      </div>
    </nav>
  )
}
