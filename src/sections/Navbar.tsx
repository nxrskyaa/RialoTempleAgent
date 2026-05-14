import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Activity } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 h-16 border-b border-[#2A2A3A] bg-[#0A0A0F]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-[#2DD4BF]" />
            <span className="text-lg font-bold text-[#F0F0F5]">VibeCheck</span>
          </div>
          <span className="hidden rounded-full border border-[#2A2A3A] px-2 py-0.5 text-[11px] text-[#5A5A6A] sm:inline-block">
            on ARC
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <span className="hidden rounded-full border border-[#2DD4BF]/30 bg-[#2DD4BF]/10 px-3 py-1 text-xs text-[#2DD4BF] sm:inline-block">
            Early Access
          </span>
          <ConnectButton
            showBalance={false}
            chainStatus="icon"
            accountStatus="address"
          />
        </div>
      </div>
    </nav>
  )
}
