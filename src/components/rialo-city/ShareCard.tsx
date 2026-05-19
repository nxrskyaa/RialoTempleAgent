import { useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import type { RialoCityPassportData, RialoCityProgressData } from '@/hooks/useRialoCityProgress'

type ShareCardProps = {
  passport: RialoCityPassportData | null
  progress: RialoCityProgressData
  rank: string
  completedCount: number
  totalModules: number
  progressPercentage: number
}

export default function ShareCard({ passport, progress, rank, completedCount, totalModules, progressPercentage }: ShareCardProps) {
  const [copied, setCopied] = useState(false)
  const shareUrl = typeof window === 'undefined' ? 'https://rialo-temple-agent.vercel.app/#/rialo-city' : `${window.location.origin}${window.location.pathname}#/rialo-city`
  const shareText = useMemo(() => (
    `I explored Rialo City 🏙️

I learned how Rialo connects blockchain with:
✅ Real-world data
✅ Workflow automation
✅ Privacy
✅ Web2 connectivity
✅ Omni accounts
✅ Gasless UX

Rank: ${rank}
Progress: ${completedCount}/${totalModules}

Try Rialo City: ${shareUrl}`
  ), [completedCount, rank, shareUrl, totalModules])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = shareText
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <div className="city-share-card temple-card rounded-lg p-5">
      <p className="text-xs font-black uppercase tracking-wider text-[var(--temple-cyan)]">Share card</p>
      <div className="mt-4 rounded-lg border border-[var(--temple-border)] bg-black/20 p-5">
        <p className="text-2xl font-black">I explored Rialo City</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <ShareMetric label="Name" value={passport?.name || 'Rialo Visitor'} />
          <ShareMetric label="Role" value={passport?.role || 'Explorer'} />
          <ShareMetric label="Rank" value={rank} />
          <ShareMetric label="Badges" value={`${progress.badges.length}`} />
          <ShareMetric label="Modules" value={`${completedCount}/${totalModules}`} />
          <ShareMetric label="Progress" value={`${progressPercentage}%`} />
        </div>
      </div>
      <button type="button" onClick={copy} className="temple-button mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-black">
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? 'Copied' : 'Copy share text'}
      </button>
      <p className="mt-3 text-xs leading-5 text-[var(--temple-soft)]">Image download is intentionally skipped for now to avoid extra dependencies. Copy share text is ready.</p>
    </div>
  )
}

function ShareMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="city-mini-stat rounded-lg p-3">
      <p className="text-xs font-black text-[var(--temple-soft)]">{label}</p>
      <p className="mt-2 truncate text-sm font-black">{value}</p>
    </div>
  )
}
