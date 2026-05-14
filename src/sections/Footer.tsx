import { Activity, Github, ExternalLink, Twitter } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-[#2A2A3A] py-12">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-6 px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#2DD4BF]" />
          <span className="text-base font-bold text-[#F0F0F5]">VibeCheck</span>
        </div>

        {/* Tagline */}
        <p className="text-[13px] text-[#5A5A6A]">
          Built for Rialo. Deployed on ARC.
        </p>

        {/* Links */}
        <div className="flex items-center gap-6">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-[#8A8A9A] transition-colors hover:text-[#F0F0F5]"
          >
            <Github className="h-4 w-4" /> GitHub
          </a>
          <a
            href="https://testnet.arcscan.app/address/0x6856D43de2e3Db5F4dA54E6E4cAE74397E52baf5"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-[#8A8A9A] transition-colors hover:text-[#F0F0F5]"
          >
            <ExternalLink className="h-4 w-4" /> Contract
          </a>
          <a
            href="https://x.com/RialoHQ"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-[#8A8A9A] transition-colors hover:text-[#F0F0F5]"
          >
            <Twitter className="h-4 w-4" /> X / Twitter
          </a>
        </div>

        {/* Copyright */}
        <p className="text-xs text-[#5A5A6A]">
          &copy; 2025 VibeCheck. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
