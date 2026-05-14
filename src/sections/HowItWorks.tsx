import { motion } from 'framer-motion'
import { Twitter, Layers, Trophy } from 'lucide-react'

const steps = [
  {
    icon: Twitter,
    title: 'Link Your X',
    description: 'Input your X username, profile pic auto-fetches. One-click verify.',
    badge: '01',
    color: '#2DD4BF',
  },
  {
    icon: Layers,
    title: 'Predict Per Category',
    description: 'Pick vibes for Crypto, Weather, Market, and Trending. 4 categories, 4 vibes each.',
    badge: '02',
    color: '#F97316',
  },
  {
    icon: Trophy,
    title: 'Win & Climb',
    description: 'Get categories right to earn rewards. Build streaks and dominate the real leaderboard.',
    badge: '03',
    color: '#22C55E',
  },
]

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-20">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center text-3xl font-bold tracking-tight sm:text-4xl"
      >
        How It Works
      </motion.h2>

      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ y: -2 }}
            className="rounded-2xl border border-[#2A2A3A] bg-[#12121A] p-6 transition-colors hover:border-[#3A3A50]"
          >
            <span className="mb-4 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: `${step.color}15`, color: step.color }}>
              {step.badge}
            </span>
            <step.icon className="mb-4 h-8 w-8" style={{ color: step.color }} />
            <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
            <p className="text-sm leading-relaxed text-[#8A8A9A]">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
