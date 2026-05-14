import { motion } from 'framer-motion'
import { TrendingUp, Cloud, Activity, Hash } from 'lucide-react'

const signals = [
  {
    icon: TrendingUp,
    value: '73',
    label: 'Fear & Greed Index',
    sub: 'Greed',
    color: '#22C55E',
    bar: 73,
  },
  {
    icon: Cloud,
    value: 'Mixed',
    label: 'Global Weather',
    sub: 'NYC 22C / Tokyo 18C / London 15C',
    color: '#3B82F6',
    bar: 50,
  },
  {
    icon: Activity,
    value: 'Medium',
    label: 'BTC 24h Volatility',
    sub: '3.2% price swing',
    color: '#F97316',
    bar: 45,
  },
  {
    icon: Hash,
    value: '#Bitcoin',
    label: 'X Trending',
    sub: '1.2M posts today',
    color: '#A855F7',
    bar: 80,
  },
]

export default function VibeIndicators() {
  return (
    <section className="border-y border-[#2A2A3A] bg-[#1A1A24] py-16">
      <div className="mx-auto max-w-[1200px] px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-3 text-center text-3xl font-bold tracking-tight sm:text-4xl"
        >
          Today's Signals
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-10 text-center text-[#8A8A9A]"
        >
          Real-world data that shapes the vibe
        </motion.p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {signals.map((signal, i) => (
            <motion.div
              key={signal.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-xl border border-[#2A2A3A] bg-[#12121A] p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <signal.icon className="h-5 w-5" style={{ color: signal.color }} />
                <span className="text-xs tracking-wider text-[#5A5A6A] uppercase">
                  {signal.label}
                </span>
              </div>

              <div
                className="mb-1 text-2xl font-bold"
                style={{ color: signal.color }}
              >
                {signal.value}
              </div>
              <div className="mb-3 text-[13px] text-[#8A8A9A]">{signal.sub}</div>

              {/* Mini bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#2A2A3A]">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${signal.bar}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: signal.color }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
