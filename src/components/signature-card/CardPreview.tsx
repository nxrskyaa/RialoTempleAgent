import { motion } from 'framer-motion'
import type { CSSProperties } from 'react'

export type SignatureCardRecord = {
  id: bigint
  owner?: string
  xUsername: string
  profileImageUrl: string
  signature: string
  borderGradient: string
  cardTheme: string
  mintedAt?: bigint
}

type CardPreviewProps = {
  cardNumber: string
  xUsername: string
  profileImageUrl: string
  signatureLabel: string
  signatureImage?: string
  borderGradient: string
  cardTheme: string
  compact?: boolean
}

function displayHandle(value: string) {
  const cleanHandle = value.replace('@', '').trim()
  return cleanHandle ? `@${cleanHandle}` : '@username'
}

export default function CardPreview({
  cardNumber,
  xUsername,
  profileImageUrl,
  signatureLabel,
  signatureImage,
  borderGradient,
  cardTheme,
  compact = false,
}: CardPreviewProps) {
  const showImage = Boolean(profileImageUrl)
  const initial = (xUsername.replace('@', '').trim().charAt(0) || 'G').toUpperCase()

  return (
    <motion.article
      className={`signature-card-frame ${compact ? 'is-compact' : ''}`}
      style={{ '--signature-gradient': borderGradient } as CSSProperties}
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.42, ease: [0.2, 0.85, 0.25, 1] }}
    >
      <div className="signature-card-shell">
        <div className="signature-card-glow" />
        <header className="signature-card-top">
          <span>{cardNumber}</span>
          <span>{displayHandle(xUsername)}</span>
        </header>

        <div className="signature-card-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="signature-card-avatar">
          {showImage ? (
            <img
              src={profileImageUrl}
              alt={`${displayHandle(xUsername)} avatar`}
              crossOrigin="anonymous"
              onError={event => {
                event.currentTarget.style.display = 'none'
              }}
            />
          ) : null}
          <div className="signature-card-avatar-fallback" aria-hidden="true">
            {initial}
          </div>
        </div>

        <div className="signature-card-theme">{cardTheme}</div>

        <footer className="signature-card-bottom">
          <div className="signature-card-logo">
            <img src="/logo-mark.svg" alt="Rialo" />
          </div>
          <div className="signature-card-signature">
            {signatureImage ? <img src={signatureImage} alt="" /> : null}
            <span>{signatureLabel || displayHandle(xUsername).replace('@', '') || 'signature'}</span>
          </div>
        </footer>
      </div>
    </motion.article>
  )
}
