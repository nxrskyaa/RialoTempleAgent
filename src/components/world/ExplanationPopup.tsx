import { HelpCircle, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

export default function ExplanationPopup({ title, children }: { title: string; children: string }) {
  const [open, setOpen] = useState(false)

  return (
    <span className="world-help-wrap">
      <button type="button" onClick={() => setOpen(true)} className="world-help-button" aria-label={`Explain ${title}`}>
        <HelpCircle className="h-4 w-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            className="world-help-popover"
          >
            <button type="button" onClick={() => setOpen(false)} className="world-help-close" aria-label="Close explanation">
              <X className="h-3.5 w-3.5" />
            </button>
            <strong>{title}</strong>
            <span>{children}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
