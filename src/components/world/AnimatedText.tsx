import { motion } from 'framer-motion'

type AnimatedTextProps = {
  eyebrow?: string
  title: string
  children: string
}

export default function AnimatedText({ eyebrow, title, children }: AnimatedTextProps) {
  return (
    <div className="world-animated-text">
      {eyebrow ? (
        <motion.span
          className="world-eyebrow"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {eyebrow}
        </motion.span>
      ) : null}
      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, delay: 0.05, ease: 'easeOut' }}
      >
        {title}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, delay: 0.12, ease: 'easeOut' }}
      >
        {children}
      </motion.p>
    </div>
  )
}
