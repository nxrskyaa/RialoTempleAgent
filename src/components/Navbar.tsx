import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'
import { Gamepad2, Globe2, IdCard, Menu, MessageSquareText, ScrollText, Sparkles, Trophy, UserCircle, Wand2, X } from 'lucide-react'

const NAV = [
  { path: '/grialo', label: 'Grialo', icon: Sparkles },
  { path: '/world', label: 'World', icon: Globe2 },
  { path: '/temple-play', label: 'Temple Play', icon: Gamepad2 },
  { path: '/quiz', label: 'Quiz', icon: Wand2 },
  { path: '/wish', label: 'Wish', icon: ScrollText },
  { path: '/review', label: 'Reviews', icon: MessageSquareText },
  { path: '/signature-card', label: 'Signature Card', icon: IdCard },
  { path: '/leaderboard', label: 'Rank', icon: Trophy },
  { path: '/profile', label: 'Profile', icon: UserCircle },
]

export default function Navbar() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const isTemplePlay = location.pathname === '/temple-play'

  // close the mobile menu whenever the route changes
  useEffect(() => setOpen(false), [location.pathname])

  return (
    <nav className={`fixed left-0 right-0 top-0 z-50 px-3 pt-3 sm:px-6 ${isTemplePlay ? 'is-temple-play-nav' : ''}`}>
      <div className={`nav-cloud flex h-[68px] max-w-7xl items-center justify-between gap-2 px-3 sm:px-5 ${isTemplePlay ? 'ml-auto mr-2 nav-cloud-game' : 'mx-auto'}`}>
        <Link to="/" className="brand-pill group flex min-w-0 items-center gap-2 rounded-full px-2 py-1.5 transition">
          <span className="logo-charm relative flex h-12 w-12 items-center justify-center rounded-full">
            <img src="/rialo_logo.png" alt="" className="rialo-nav-logo relative z-10 transition group-hover:scale-110" />
          </span>
          <span className="temple-wordmark hidden text-lg font-black text-[var(--temple-text)] sm:inline">Rialo Temple</span>
        </Link>

        {/* desktop inline nav: icon-only, label shown only for the active item */}
        {!isTemplePlay && <div className="nav-bubble hidden items-center gap-0.5 rounded-full p-1 lg:flex">
          {NAV.map(item => {
            const active = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path} title={item.label} aria-label={item.label}
                className="nav-link relative flex items-center gap-1.5 rounded-full px-2.5 py-2 text-[11px] font-black transition-colors"
                style={{ color: active ? '#06100c' : 'var(--temple-muted)' }}>
                {active && <motion.div layoutId="nav" className="nav-active absolute inset-0 rounded-full" transition={{ type: 'spring', stiffness: 430, damping: 28 }} />}
                <item.icon className="relative z-10 h-4 w-4" />
                {active && <span className="relative z-10 whitespace-nowrap">{item.label}</span>}
              </Link>
            )
          })}
        </div>}

        <div className="flex items-center gap-2">
          <ConnectButton.Custom>
            {({ account, chain, mounted, openAccountModal, openChainModal, openConnectModal }) => {
              const ready = mounted
              const connected = ready && account && chain
              return (
                <button
                  type="button"
                  onClick={connected ? (chain.unsupported ? openChainModal : openAccountModal) : openConnectModal}
                  className="temple-button nav-connect max-w-[120px] truncate rounded-full px-3 py-2.5 text-xs font-black sm:max-w-none sm:px-4 sm:text-sm"
                >
                  {!ready ? '...' : connected ? (chain.unsupported ? 'Switch' : account.displayName) : 'Connect'}
                </button>
              )
            }}
          </ConnectButton.Custom>

          {/* mobile hamburger */}
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen(value => !value)}
            className={`nav-link flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isTemplePlay ? '' : 'lg:hidden'}`}
            data-game-menu={isTemplePlay ? 'true' : undefined}
            style={{ color: 'var(--temple-text)' }}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* mobile dropdown menu */}
      {open && (
        <div className={`nav-menu-panel mx-auto mt-2 grid max-w-7xl grid-cols-2 gap-1.5 p-2 sm:grid-cols-3 ${isTemplePlay ? 'nav-menu-panel-game' : 'lg:hidden'}`}>
          {NAV.map(item => {
            const active = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path}
                className="nav-link flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black"
                style={{ color: active ? '#06100c' : 'var(--temple-muted)', background: active ? 'var(--temple-gold)' : 'transparent' }}>
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </nav>
  )
}
