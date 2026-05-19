import CardPreview, { type SignatureCardRecord } from './CardPreview'

type MintedCardGridProps = {
  title: string
  cards?: readonly SignatureCardRecord[]
  emptyText: string
}

function cardNumber(id: bigint) {
  return `#${String(id).padStart(4, '0')}`
}

export default function MintedCardGrid({ title, cards, emptyText }: MintedCardGridProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-black text-[var(--temple-text)]">{title}</h2>
        <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--temple-soft)]">{cards?.length ?? 0} cards</span>
      </div>

      {cards && cards.length > 0 ? (
        <div className="signature-collection-grid">
          {cards.map(card => (
            <CardPreview
              key={String(card.id)}
              compact
              cardNumber={cardNumber(card.id)}
              xUsername={card.xUsername}
              profileImageUrl={card.profileImageUrl}
              signatureLabel={card.signature}
              borderGradient={card.borderGradient || 'linear-gradient(135deg,#f7f0dc,#8dd9c7)'}
              cardTheme={card.cardTheme || 'Rialo Glow'}
            />
          ))}
        </div>
      ) : (
        <div className="temple-card rounded-xl p-6 text-sm font-bold text-[var(--temple-muted)]">{emptyText}</div>
      )}
    </section>
  )
}
