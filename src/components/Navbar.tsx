import { Link, useLocation } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'
import { MessageSquareText, Sparkles, Trophy, UserCircle } from 'lucide-react'

const NAV = [
  { path: '/review', label: 'Reviews', icon: MessageSquareText },
  { path: '/grialo', label: 'Grialo', icon: Sparkles },
  { path: '/leaderboard', label: 'Rank', icon: Trophy },
  { path: '/profile', label: 'Profile', icon: UserCircle },
]

export default function Navbar() {
  const location = useLocation()

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[var(--temple-border)] bg-[#070807]/82 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--temple-border)] bg-white/[0.035] shadow-[0_0_28px_rgba(56,216,139,0.08)]">
            <img src="/logo-mark.svg" alt="" className="h-8 w-8" />
          </span>
          <span className="temple-wordmark hidden text-base font-semibold text-[var(--temple-text)] sm:inline">Rialo Temple</span>
        </Link>
        <div className="flex items-center gap-1 rounded-lg border border-[var(--temple-border)] bg-black/20 p-1">
          {NAV.map(item => {
            const active = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path}
                className="relative flex items-center gap-1.5 rounded-md px-2.5 py-2 text-[11px] font-semibold transition-colors sm:px-3"
                style={{ color: active ? '#07100a' : 'var(--temple-muted)' }}>
                {active && <motion.div layoutId="nav" className="absolute inset-0 rounded-md bg-[linear-gradient(135deg,#38d88b,#e6c45f)]" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
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
                className="temple-button max-w-[88px] truncate rounded-lg px-3 py-2.5 text-xs font-bold sm:max-w-none sm:px-4 sm:text-sm"
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
