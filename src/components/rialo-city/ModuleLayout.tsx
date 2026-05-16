import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, CheckCircle2, Lock, Sparkles } from 'lucide-react'
import { getRialoCityModule, type RialoCityModule } from '@/data/rialoCityModules'
import { useRialoCityProgress } from '@/hooks/useRialoCityProgress'
import BadgeUnlockModal from './BadgeUnlockModal'
import BeforeAfterPanel from './BeforeAfterPanel'
import { CityIcon } from './CityIcons'
import SimulationStepper from './SimulationStepper'

const STREAM_SIGNALS = ['Weather changed', 'Price moved', 'Payment received', 'Social post verified']
const EDGE_SYSTEMS = ['GitHub', 'Email', 'Weather API', 'Payment App']
const PASSPORT_ROLES = ['Explorer', 'Builder', 'Creator', 'Researcher', 'Agent']

export default function ModuleLayout() {
  const { slug } = useParams()
  const module = getRialoCityModule(slug)
  const { completeModule, progress } = useRialoCityProgress()
  const [showBadge, setShowBadge] = useState(false)

  if (!module) return <Navigate to="/rialo-city" replace />

  const completed = progress.completedModules.includes(module.id)

  const finishModule = () => {
    const alreadyCompleted = progress.completedModules.includes(module.id)
    completeModule(module.id)
    if (!alreadyCompleted) setShowBadge(true)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link to="/rialo-city" className="temple-button-secondary inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-black">
          <ArrowLeft className="h-4 w-4" /> Back to city
        </Link>
        <Link to="/rialo-city/passport" className="inline-flex items-center gap-2 text-sm font-black text-[var(--temple-gold)]">
          <BadgeCheck className="h-4 w-4" /> Passport
        </Link>
      </div>

      <section className="city-module-hero temple-card rounded-lg p-5 sm:p-7" style={{ '--module-accent': module.accent } as CSSProperties & Record<'--module-accent', string>}>
        <div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          <div className="city-module-mark flex min-h-[260px] items-center justify-center rounded-lg">
            <div className="city-module-building">
              <CityIcon name={module.icon} className="h-16 w-16" />
              <span>{module.buildingName}</span>
            </div>
          </div>
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="city-module-pill rounded-full px-3 py-1.5 text-xs font-black" style={{ color: module.accent }}>{module.tagline}</span>
              {completed && <span className="inline-flex items-center gap-1 rounded-full bg-[var(--temple-mint-soft)] px-3 py-1.5 text-xs font-black text-[var(--temple-emerald)]"><CheckCircle2 className="h-3.5 w-3.5" /> Completed</span>}
            </div>
            <h1 className="text-4xl font-black leading-tight sm:text-6xl">{module.buildingName}</h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--temple-muted)]">{module.shortExplanation}</p>
            <div className="mt-5 rounded-lg border border-[var(--temple-border)] bg-black/20 p-4 text-sm leading-6 text-[var(--temple-muted)]">
              <strong className="text-[var(--temple-text)]">Note:</strong> This is a simplified simulator for learning. It does not use a wallet, create real cryptographic proofs, send transactions, or claim that the live Rialo network is already powering this module.
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <div className="space-y-5">
          <BeforeAfterPanel beforeTitle={module.beforeTitle} beforeSteps={module.beforeSteps} withRialoTitle={module.withRialoTitle} withRialoSteps={module.withRialoSteps} />
          <ModuleSimulation module={module} onComplete={finishModule} />
        </div>
        <aside className="city-module-sidebar temple-card rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--temple-mint-soft)] text-[var(--temple-gold)]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-[var(--temple-soft)]">Local badge</p>
              <p className="text-xl font-black">{module.badge}</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-[var(--temple-muted)]">Run the mini simulation to unlock this local learning badge and add {module.xp} XP to your Rialo City Passport.</p>
          <div className="mt-5 rounded-lg border border-[var(--temple-border)] bg-black/20 p-4">
            <div className="flex items-center gap-2 text-sm font-black">
              <Lock className="h-4 w-4 text-[var(--temple-cyan)]" /> No wallet zone
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--temple-muted)]">No Arc Testnet, no gas, no signature, no token reward, and no onchain badge. Everything here stays in this browser.</p>
          </div>
        </aside>
      </section>

      <BadgeUnlockModal badge={module.badge} open={showBadge} onClose={() => setShowBadge(false)} />
    </div>
  )
}

function ModuleSimulation({ module, onComplete }: { module: RialoCityModule; onComplete: () => void }) {
  if (module.id === 'privacy') return <PrivacySimulation onComplete={onComplete} />
  if (module.id === 'omni') return <OmniSimulation onComplete={onComplete} />
  if (module.id === 'cruise') return <CruiseSimulation onComplete={onComplete} />
  if (module.id === 'stream') return <ChoiceSimulation module={module} choices={STREAM_SIGNALS} label="Choose a real-world signal" onComplete={onComplete} />
  if (module.id === 'edge') return <ChoiceSimulation module={module} choices={EDGE_SYSTEMS} label="Choose a Web2 system" onComplete={onComplete} />

  return <SimulationStepper steps={module.simulationSteps} buttonLabel="Run Workflow" onComplete={onComplete} />
}

function ChoiceSimulation({ module, choices, label, onComplete }: { module: RialoCityModule; choices: string[]; label: string; onComplete: () => void }) {
  const [choice, setChoice] = useState(choices[0])
  const steps = useMemo(() => {
    if (module.id === 'stream') return [`${choice} detected`, 'Stream Tower receives data', 'App reacts', 'Result updated']
    return [`${choice} signal detected`, 'Edge Station connects', 'App state updates']
  }, [choice, module.id])

  return (
    <div className="city-sim-panel rounded-lg p-4">
      <p className="text-sm font-black">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {choices.map((item) => (
          <button key={item} type="button" onClick={() => setChoice(item)} className={`city-choice rounded-full px-3 py-2 text-xs font-black ${choice === item ? 'is-active' : ''}`}>
            {item}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <SimulationStepper steps={steps} onComplete={onComplete} />
      </div>
    </div>
  )
}

function PrivacySimulation({ onComplete }: { onComplete: () => void }) {
  const [email, setEmail] = useState('')
  const [country, setCountry] = useState('')
  const [score, setScore] = useState('')
  const [proof, setProof] = useState('')

  const generateProof = () => {
    const seed = `${email}|${country}|${score}|rialo-city`
    let hash = 0
    for (let index = 0; index < seed.length; index += 1) hash = Math.imul(31, hash) + seed.charCodeAt(index) | 0
    setProof(`0x${Math.abs(hash).toString(16).padStart(8, '0')}simulated`)
    onComplete()
  }

  return (
    <div className="city-sim-panel rounded-lg p-4">
      <p className="text-sm font-black">Generate a simplified private proof</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="text-xs font-black text-[var(--temple-muted)]">Email<input value={email} onChange={(event) => setEmail(event.target.value)} className="temple-input mt-2 w-full rounded-lg px-3 py-3 text-sm" placeholder="maya@example.com" /></label>
        <label className="text-xs font-black text-[var(--temple-muted)]">Country<input value={country} onChange={(event) => setCountry(event.target.value)} className="temple-input mt-2 w-full rounded-lg px-3 py-3 text-sm" placeholder="Indonesia" /></label>
        <label className="text-xs font-black text-[var(--temple-muted)]">Score<input value={score} onChange={(event) => setScore(event.target.value)} className="temple-input mt-2 w-full rounded-lg px-3 py-3 text-sm" placeholder="82" /></label>
      </div>
      <button type="button" onClick={generateProof} className="temple-button mt-4 rounded-lg px-4 py-3 text-sm font-black">Generate Private Proof</button>
      {proof && (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <ResultTile label="Eligible" value="Yes" />
          <ResultTile label="Private Data" value="Hidden" />
          <ResultTile label="Proof" value={proof} />
        </div>
      )}
      <p className="mt-4 text-xs leading-5 text-[var(--temple-soft)]">This is a simplified simulation, not real cryptographic privacy.</p>
    </div>
  )
}

function OmniSimulation({ onComplete }: { onComplete: () => void }) {
  const { passport, savePassport } = useRialoCityProgress()
  const [name, setName] = useState(passport?.name ?? '')
  const [role, setRole] = useState(passport?.role ?? PASSPORT_ROLES[0])
  const [favoriteUseCase, setFavoriteUseCase] = useState(passport?.favoriteUseCase ?? '')

  const save = () => {
    savePassport({ name: name.trim() || 'Rialo Explorer', role, favoriteUseCase: favoriteUseCase.trim() || 'Learning Rialo visually' })
    onComplete()
  }

  return (
    <div className="city-sim-panel rounded-lg p-4">
      <p className="text-sm font-black">Create a local Rialo City Passport</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="text-xs font-black text-[var(--temple-muted)]">Name<input value={name} onChange={(event) => setName(event.target.value)} className="temple-input mt-2 w-full rounded-lg px-3 py-3 text-sm" placeholder="Your name" /></label>
        <label className="text-xs font-black text-[var(--temple-muted)]">Role<select value={role} onChange={(event) => setRole(event.target.value)} className="temple-input mt-2 w-full rounded-lg px-3 py-3 text-sm">{PASSPORT_ROLES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-xs font-black text-[var(--temple-muted)]">Favorite use case<input value={favoriteUseCase} onChange={(event) => setFavoriteUseCase(event.target.value)} className="temple-input mt-2 w-full rounded-lg px-3 py-3 text-sm" placeholder="Automation, privacy, games..." /></label>
      </div>
      <button type="button" onClick={save} className="temple-button mt-4 rounded-lg px-4 py-3 text-sm font-black">Save Passport</button>
    </div>
  )
}

function CruiseSimulation({ onComplete }: { onComplete: () => void }) {
  const [runId, setRunId] = useState(0)
  const normalSteps = ['Connect wallet', 'Switch network', 'Approve', 'Sign', 'Pay gas', 'Wait']
  const cruiseSteps = ['Click', 'Done']

  const run = () => {
    setRunId((current) => current + 1)
    window.setTimeout(onComplete, 2200)
  }

  return (
    <div className="city-sim-panel rounded-lg p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-black">Try both lanes</p>
        <button type="button" onClick={run} className="temple-button rounded-lg px-4 py-2 text-xs font-black">Try Both</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Lane key={`normal-${runId}`} title="Normal Web3 Road" steps={normalSteps} slow />
        <Lane key={`cruise-${runId}`} title="Rialo Cruise Lane" steps={cruiseSteps} />
      </div>
    </div>
  )
}

function Lane({ title, steps, slow = false }: { title: string; steps: string[]; slow?: boolean }) {
  return (
    <div className={`city-lane rounded-lg p-4 ${slow ? 'is-slow' : 'is-fast'}`}>
      <p className="text-sm font-black">{title}</p>
      <div className="mt-4 grid gap-2">
        {steps.map((step, index) => (
          <div key={step} className="city-lane-step rounded-full px-3 py-2 text-xs font-black" style={{ animationDelay: `${index * (slow ? 340 : 180)}ms` }}>
            {step}
          </div>
        ))}
      </div>
    </div>
  )
}

function ResultTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="city-mini-stat overflow-hidden rounded-lg p-3">
      <p className="text-xs font-black text-[var(--temple-soft)]">{label}</p>
      <p className="mt-2 truncate text-sm font-black text-[var(--temple-text)]">{value}</p>
    </div>
  )
}
