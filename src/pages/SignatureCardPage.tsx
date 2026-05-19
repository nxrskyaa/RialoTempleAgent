import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'
import { Download, ImagePlus, PenLine, RefreshCcw, Sparkles, WalletCards } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAccount, useChainId, useReadContract, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import CardPreview, { type SignatureCardRecord } from '../components/signature-card/CardPreview'
import GradientPicker, { GRADIENT_PRESETS } from '../components/signature-card/GradientPicker'
import MintedCardGrid from '../components/signature-card/MintedCardGrid'
import SignaturePad from '../components/signature-card/SignaturePad'
import { ARC_CHAIN } from '../config/contracts'
import { GRIALO_SIGNATURE_CARDS_ABI, GRIALO_SIGNATURE_CARDS_ADDRESS } from '../config/signatureCardContract'
import { exportCardAsPng } from '../lib/cardExport'
import { getXAvatarUrl, normalizeXHandle } from '../lib/xAvatar'

const RECENT_LIMIT = 12n

function formatCardNumber(value?: bigint) {
  return `#${String(value ?? 1n).padStart(4, '0')}`
}

function asCards(value: unknown) {
  return (Array.isArray(value) ? value : []) as readonly SignatureCardRecord[]
}

export default function SignatureCardPage() {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { writeContractAsync, data: mintHash, error: mintError, isPending: isMintPromptOpen } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash: mintHash })

  const [xUsername, setXUsername] = useState('')
  const [manualImageUrl, setManualImageUrl] = useState('')
  const [localImageUrl, setLocalImageUrl] = useState('')
  const [signatureLabel, setSignatureLabel] = useState('')
  const [signatureImage, setSignatureImage] = useState('')
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false)
  const [borderGradient, setBorderGradient] = useState(GRADIENT_PRESETS[1].value)
  const [cardTheme, setCardTheme] = useState(GRADIENT_PRESETS[1].name)
  const [customA, setCustomA] = useState('#f7f0dc')
  const [customB, setCustomB] = useState('#8dd9c7')
  const [formError, setFormError] = useState('')
  const [downloadError, setDownloadError] = useState('')

  const cleanHandle = normalizeXHandle(xUsername)
  const unavatarUrl = getXAvatarUrl(xUsername)
  const previewImageUrl = localImageUrl || manualImageUrl.trim() || unavatarUrl
  const contractImageUrl = manualImageUrl.trim() || unavatarUrl || ''
  const isWrongNetwork = isConnected && chainId !== ARC_CHAIN.id
  const isConfirming = receipt.isLoading

  const totalCardsQuery = useReadContract({
    address: GRIALO_SIGNATURE_CARDS_ADDRESS,
    abi: GRIALO_SIGNATURE_CARDS_ABI,
    functionName: 'totalCards',
  })

  const recentCardsQuery = useReadContract({
    address: GRIALO_SIGNATURE_CARDS_ADDRESS,
    abi: GRIALO_SIGNATURE_CARDS_ABI,
    functionName: 'getRecentCards',
    args: [RECENT_LIMIT],
  })

  const myCardsQuery = useReadContract({
    address: GRIALO_SIGNATURE_CARDS_ADDRESS,
    abi: GRIALO_SIGNATURE_CARDS_ABI,
    functionName: 'getCardsByOwner',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
    },
  })

  const previewCardNumber = useMemo(() => {
    const total = typeof totalCardsQuery.data === 'bigint' ? totalCardsQuery.data : 0n
    return formatCardNumber(total + 1n)
  }, [totalCardsQuery.data])

  const recentCards = asCards(recentCardsQuery.data)
  const myCards = asCards(myCardsQuery.data)

  useEffect(() => {
    if (!receipt.isSuccess) return
    void totalCardsQuery.refetch()
    void recentCardsQuery.refetch()
    void myCardsQuery.refetch()
  }, [myCardsQuery, recentCardsQuery, receipt.isSuccess, totalCardsQuery])

  useEffect(() => {
    return () => {
      if (localImageUrl) URL.revokeObjectURL(localImageUrl)
    }
  }, [localImageUrl])

  function handleLocalImage(file?: File) {
    if (!file) return
    if (localImageUrl) URL.revokeObjectURL(localImageUrl)
    setLocalImageUrl(URL.createObjectURL(file))
  }

  async function handleDownload() {
    setDownloadError('')
    if (!cardRef.current) return
    try {
      await exportCardAsPng(cardRef.current, {
        username: cleanHandle,
        cardNumber: previewCardNumber,
      })
    } catch {
      setDownloadError('PNG export failed. Try uploading an image manually if the remote avatar blocks export.')
    }
  }

  function validateMint() {
    if (!isConnected) return 'Connect wallet first.'
    if (isWrongNetwork) return 'Switch to Arc Testnet before minting.'
    if (!cleanHandle) return 'X username is required.'
    if (!borderGradient) return 'Choose a border gradient.'
    if (!signatureLabel.trim() && !hasDrawnSignature) return 'Add a signature label or draw a signature.'
    return ''
  }

  async function handleMint() {
    const nextError = validateMint()
    setFormError(nextError)
    if (nextError) return

    await writeContractAsync({
      address: GRIALO_SIGNATURE_CARDS_ADDRESS,
      abi: GRIALO_SIGNATURE_CARDS_ABI,
      functionName: 'mintCard',
      args: [
        cleanHandle,
        contractImageUrl,
        signatureLabel.trim() || cleanHandle,
        borderGradient,
        cardTheme,
      ],
    })
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-16 pt-28 sm:px-6 lg:px-8">
      <section className="signature-hero temple-card rounded-2xl p-5 sm:p-7 lg:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(255,228,94,0.25)] bg-[rgba(255,228,94,0.08)] px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[var(--temple-gold)]">
              <Sparkles className="h-3.5 w-3.5" />
              Arc Testnet Collectible
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-[0.95] text-[var(--temple-text)] sm:text-6xl">
              Grialo Signature Card
            </h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-[var(--temple-muted)]">
              Create a premium Rialo identity card with your X avatar, hand-drawn signature, gradient border, PNG export, and onchain minting.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="signature-mini-chip">No X API</span>
              <span className="signature-mini-chip">No wallet on card</span>
              <span className="signature-mini-chip">Arc Testnet</span>
            </div>
          </motion.div>

          <div className="mx-auto w-full max-w-[390px]" ref={cardRef}>
            <CardPreview
              cardNumber={previewCardNumber}
              xUsername={cleanHandle}
              profileImageUrl={previewImageUrl}
              signatureLabel={signatureLabel.trim() || cleanHandle}
              signatureImage={signatureImage}
              borderGradient={borderGradient}
              cardTheme={cardTheme}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.7fr)]">
        <div className="temple-card rounded-2xl p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="signature-section-icon">
              <PenLine className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Card Studio</h2>
              <p className="text-sm font-semibold text-[var(--temple-soft)]">Handle, image, signature, and border controls.</p>
            </div>
          </div>

          <div className="grid gap-5">
            <label className="grid gap-2">
              <span className="signature-label">X username</span>
              <input
                value={xUsername}
                onChange={event => setXUsername(event.target.value)}
                placeholder="@nxrskyaa"
                className="temple-input rounded-xl px-4 py-3 text-sm font-bold"
              />
              <span className="text-xs font-semibold text-[var(--temple-soft)]">
                Avatar URL: {unavatarUrl || 'enter a username to generate Unavatar URL'}
              </span>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="signature-label">Fallback image URL</span>
                <input
                  value={manualImageUrl}
                  onChange={event => setManualImageUrl(event.target.value)}
                  placeholder="https://..."
                  className="temple-input rounded-xl px-4 py-3 text-sm font-bold"
                />
              </label>
              <label className="signature-upload-control">
                <ImagePlus className="h-5 w-5" />
                <span>Upload local preview image</span>
                <input type="file" accept="image/*" onChange={event => handleLocalImage(event.target.files?.[0])} />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="signature-label">Signature label</span>
              <input
                value={signatureLabel}
                onChange={event => setSignatureLabel(event.target.value)}
                placeholder="nxrskyaa"
                className="temple-input rounded-xl px-4 py-3 text-sm font-bold"
              />
            </label>

            <SignaturePad
              onChange={(dataUrl, nextHasSignature) => {
                setSignatureImage(dataUrl)
                setHasDrawnSignature(nextHasSignature)
              }}
            />

            <div className="grid gap-3">
              <span className="signature-label">Border gradient</span>
              <GradientPicker
                value={borderGradient}
                onChange={(value, name) => {
                  setBorderGradient(value)
                  setCardTheme(name)
                }}
                customA={customA}
                customB={customB}
                onCustomAChange={setCustomA}
                onCustomBChange={setCustomB}
              />
            </div>
          </div>
        </div>

        <aside className="temple-card h-fit rounded-2xl p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="signature-section-icon">
              <WalletCards className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Mint Card</h2>
              <p className="text-sm font-semibold text-[var(--temple-soft)]">One transaction on Arc Testnet.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="signature-status-row">
              <span>Network</span>
              <strong className={isWrongNetwork ? 'text-[var(--temple-red)]' : 'text-[var(--temple-emerald)]'}>
                {isConnected ? (isWrongNetwork ? 'Wrong network' : 'Arc Testnet') : 'Wallet required'}
              </strong>
            </div>
            <div className="signature-status-row">
              <span>Next card</span>
              <strong>{previewCardNumber}</strong>
            </div>
            <div className="signature-status-row">
              <span>Contract image</span>
              <strong>{contractImageUrl ? 'Remote URL' : 'Empty'}</strong>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {!isConnected ? (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button type="button" onClick={openConnectModal} className="temple-button rounded-full px-5 py-3 text-sm font-black">
                    Connect Wallet
                  </button>
                )}
              </ConnectButton.Custom>
            ) : isWrongNetwork ? (
              <button
                type="button"
                disabled={isSwitching}
                onClick={() => switchChain({ chainId: ARC_CHAIN.id })}
                className="temple-button rounded-full px-5 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSwitching ? 'Switching...' : 'Switch to Arc Testnet'}
              </button>
            ) : (
              <button
                type="button"
                disabled={isMintPromptOpen || isConfirming}
                onClick={handleMint}
                className="temple-button rounded-full px-5 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isMintPromptOpen ? 'Confirm in wallet...' : isConfirming ? 'Minting...' : 'Mint Signature Card'}
              </button>
            )}

            <button type="button" onClick={handleDownload} className="temple-button-secondary rounded-full px-5 py-3 text-sm font-black">
              <Download className="mr-2 inline h-4 w-4" />
              Download PNG
            </button>

            <button
              type="button"
              onClick={() => {
                void totalCardsQuery.refetch()
                void recentCardsQuery.refetch()
                void myCardsQuery.refetch()
              }}
              className="temple-button-secondary rounded-full px-5 py-3 text-sm font-black"
            >
              <RefreshCcw className="mr-2 inline h-4 w-4" />
              Refresh Collection
            </button>
          </div>

          {(formError || mintError || receipt.isSuccess || downloadError) && (
            <div className={`signature-message mt-5 ${receipt.isSuccess ? 'is-success' : ''}`}>
              {formError || downloadError || mintError?.message || 'Mint success. Collection refreshed.'}
            </div>
          )}
        </aside>
      </section>

      <section className="grid gap-8">
        <MintedCardGrid title="Recent Minted Cards" cards={recentCards} emptyText="No recent cards yet. Be the first signature in the temple." />
        {isConnected ? (
          <MintedCardGrid title="My Cards" cards={myCards} emptyText="Your wallet has not minted a Signature Card yet." />
        ) : null}
      </section>
    </main>
  )
}
