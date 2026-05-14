import { motion } from 'framer-motion'

interface HeroProps {
  onStartPredicting: () => void
}

export default function Hero({ onStartPredicting }: HeroProps) {
  return (
    <section className="relative flex flex-col items-center px-4 pt-28 pb-20 text-center">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 h-[500px] w-[600px] -translate-x-1/2 rounded-full opacity-50"
        style={{ background: 'radial-gradient(circle, rgba(45,212,191,0.05) 0%, transparent 70%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Eyebrow */}
        <div className="mb-6 inline-flex items-center rounded-full border border-[#2A2A3A] px-4 py-1.5 text-xs tracking-widest text-[#5A5A6A] uppercase">
          Built for Rialo &middot; Live on ARC Testnet
        </div>

        {/* Headline */}
        <h1 className="max-w-[700px] text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl md:text-[56px]">
          Predict the World's{' '}
          <span
            className="bg-linear-to-r from-[#2DD4BF] to-[#3B82F6] bg-clip-text text-transparent"
          >
            Vibe
          </span>
        </h1>

        {/* Subhead */}
        <p className="mt-5 max-w-[480px] text-lg text-[#8A8A9A]">
          Daily predictions powered by real-world data. Stake USDC, pick your vibe, and win.
        </p>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartPredicting}
          className="mt-8 cursor-pointer rounded-full bg-[#2DD4BF] px-8 py-3.5 text-base font-semibold text-[#0A0A0F] shadow-[0_0_20px_rgba(45,212,191,0.2)] transition-all hover:brightness-110"
        >
          Start Predicting
        </motion.button>

        {/* Stats */}
        <div className="mt-12 flex items-center gap-8 sm:gap-12">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-semibold text-[#2DD4BF]">1 USDC</span>
            <span className="text-xs text-[#5A5A6A]">per prediction</span>
          </div>
          <div className="h-8 w-px bg-[#2A2A3A]" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-semibold text-[#2DD4BF]">&lt; 1s</span>
            <span className="text-xs text-[#5A5A6A]">finality on ARC</span>
          </div>
          <div className="h-8 w-px bg-[#2A2A3A]" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-semibold text-[#2DD4BF]">24h</span>
            <span className="text-xs text-[#5A5A6A]">daily rounds</span>
          </div>
        </div>

        {/* Chain badges */}
        <div className="mt-8 flex items-center gap-3">
          <span className="rounded-full border border-[#2A2A3A] bg-[#12121A] px-3 py-1 text-xs text-[#8A8A9A]">
            ARC Testnet
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-[#2A2A3A] bg-[#12121A] px-3 py-1 text-xs text-[#8A8A9A]">
            <span className="h-2 w-2 rounded-full bg-[#2775CA]" />
            USDC Gas
          </span>
        </div>
      </motion.div>
    </section>
  )
}
