import { toPng } from 'html-to-image'

type ExportCardOptions = {
  username: string
  cardNumber: string
}

export async function exportCardAsPng(node: HTMLElement, options: ExportCardOptions) {
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: 'transparent',
  })

  const safeUsername = (options.username || 'username').replace(/[^a-z0-9_-]/gi, '').toLowerCase() || 'username'
  const safeNumber = options.cardNumber.replace('#', '') || '0001'
  const link = document.createElement('a')
  link.download = `grialo-signature-card-${safeUsername}-${safeNumber}.png`
  link.href = dataUrl
  link.click()
}
