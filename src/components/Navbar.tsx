import { Link, useLocation } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'
import { Map, MessageSquareText, Sparkles, Trophy, UserCircle } from 'lucide-react'

const NAV = [
  { path: '/review', label: 'Reviews', icon: MessageSquareText },
  { path: '/grialo', label: 'Grialo', icon: Sparkles },
  { path: '/rialo-city', label: 'Rialo City', icon: Map },
  { path: '/leaderboard', label: 'Rank', icon: Trophy },
  { path: '/profile', label: 'Profile', icon: UserCircle },
]

export default function Navbar() {
  const location = useLocation()

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 px-3 pt-3 sm:px-6">
      <div className="nav-cloud mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-2 px-3 sm:px-5">
        <Link to="/" className="brand-pill group flex min-w-0 items-center gap-2 rounded-full px-2 py-1.5 transition">
          <span className="logo-charm relative flex h-12 w-12 items-center justify-center rounded-full">
            <img src="/logo-mark.svg" alt="" className="relative z-10 h-12 w-12 transition group-hover:scale-110" />
          </span>
          <span className="temple-wordmark hidden text-lg font-black text-[var(--temple-text)] sm:inline">Rialo Temple</span>
        </Link>
        <div className="nav-bubble flex items-center gap-1 rounded-full p-1">
          {NAV.map(item => {
            const active = item.path === '/rialo-city' ? location.pathname.startsWith('/rialo-city') : location.pathname === item.path
            return (
              <Link key={item.path} to={item.path}
                className="nav-link relative flex items-center gap-1.5 rounded-full px-2.5 py-2 text-[11px] font-black transition-colors sm:px-3"
                style={{ color: active ? '#06100c' : 'var(--temple-muted)' }}>
                {active && <motion.div layoutId="nav" className="nav-active absolute inset-0 rounded-full" transition={{ type: 'spring', stiffness: 430, damping: 28 }} />}
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
                className="temple-button nav-connect max-w-[88px] truncate rounded-full px-3 py-2.5 text-xs font-black sm:max-w-none sm:px-4 sm:text-sm"
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
