import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  Bot,
  Brain,
  ChartNoAxesCombined,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  FlaskConical,
  Gem,
  Gavel,
  Hourglass,
  Landmark,
  Lock,
  Palette,
  Play,
  RefreshCw,
  RotateCcw,
  Scale,
  ScrollText,
  ShieldCheck,
  Sparkles,
  VenetianMask,
  Workflow,
  XCircle,
  Zap,
  type LucideIcon,
} from 'lucide-react'

type AgentId = 'research' | 'rwa' | 'market' | 'compliance' | 'automation' | 'creative'
type JudgeId = 'strict' | 'balanced' | 'fast' | 'quality'
type Fit = 'Strong' | 'Good' | 'Weak'
type Pressure = 'High' | 'Medium' | 'Low' | 'Very Low'
type Outcome = 'Approved' | 'Rejected' | 'Needs Revision' | 'Expired'
type StepState = 'pending' | 'active' | 'complete' | 'failed'

type Agent = {
  id: AgentId
  name: string
  icon: LucideIcon
  description: string
  strengths: string[]
  output: string
}

type Judge = {
  id: JudgeId
  name: string
  icon: LucideIcon
  behavior: string
  threshold: number
  difficulty: string
}

type RitualStep = {
  id: string
  label: string
  icon: LucideIcon
  state: StepState
}

type Result = {
  taskScroll: string
  taskType: string
  agent: Agent
  judge: Judge
  reward: number
  deadline: number
  output: string
  score: number | null
  reasoning: string
  outcome: Outcome
  rewardStatus: string
}

type Proof = {
  proofId: string
  taskType: string
  agent: string
  judge: string
  score: string
  outcome: Outcome
  rewardStatus: string
  timestamp: string
  hash: string
}

const TASK_TEMPLATES = [
  'Summarize Rialo for beginners',
  'Analyze mock RWA price movement',
  'Create automation rule for weather insurance',
  'Check if invoice should be settled',
  'Generate a simple RWA use case',
  'Compare two agent outputs',
  'Detect risk in a mock credit event',
] as const

const IDEAL_AGENTS: Record<string, AgentId[]> = {
  'Summarize Rialo for beginners': ['research'],
  'Analyze mock RWA price movement': ['rwa', 'market'],
  'Create automation rule for weather insurance': ['automation'],
  'Check if invoice should be settled': ['rwa', 'compliance'],
  'Generate a simple RWA use case': ['rwa', 'creative'],
  'Compare two agent outputs': ['research'],
  'Detect risk in a mock credit event': ['compliance', 'rwa'],
}

const AGENTS: Agent[] = [
  {
    id: 'research',
    name: 'Research Agent',
    icon: Brain,
    description: 'Best for summaries, explainers, and documentation tasks.',
    strengths: ['documentation', 'beginner explanation', 'concept simplification'],
    output: 'Rialo is designed to make blockchain interact with real-world systems through automation, data access, and agent workflows.',
  },
  {
    id: 'rwa',
    name: 'RWA Agent',
    icon: Landmark,
    description: 'Best for asset repricing, invoices, private credit, and real-world asset simulations.',
    strengths: ['RWA logic', 'asset events', 'settlement reasoning'],
    output: 'The mock asset should be repriced because the external signal indicates increased payment risk.',
  },
  {
    id: 'market',
    name: 'Market Data Agent',
    icon: ChartNoAxesCombined,
    description: 'Best for mock price movement and external data interpretation.',
    strengths: ['price signals', 'trend analysis', 'market events'],
    output: 'The simulated price movement suggests short-term volatility, so the workflow should wait for confirmation before settlement.',
  },
  {
    id: 'compliance',
    name: 'Compliance Agent',
    icon: ShieldCheck,
    description: 'Best for eligibility, risk, and rule-based checks.',
    strengths: ['eligibility', 'risk checks', 'policy rules'],
    output: 'The task passes basic eligibility checks, but risk tier requires judge validation.',
  },
  {
    id: 'automation',
    name: 'Automation Agent',
    icon: Workflow,
    description: 'Best for IF/THEN workflows and trigger design.',
    strengths: ['workflow logic', 'automation', 'trigger design'],
    output: 'IF rainfall exceeds 50mm THEN trigger claim review and execute payout simulation.',
  },
  {
    id: 'creative',
    name: 'Creative Agent',
    icon: Palette,
    description: 'Best for content, campaign ideas, and visual concepts.',
    strengths: ['creative direction', 'content', 'storytelling'],
    output: 'A simple RWA use case: a tokenized invoice that updates automatically when a mock payment signal is confirmed.',
  },
]

const JUDGES: Judge[] = [
  {
    id: 'strict',
    name: 'Strict Judge',
    icon: Gavel,
    behavior: 'Higher pass threshold and harder approval.',
    threshold: 85,
    difficulty: 'Hard',
  },
  {
    id: 'balanced',
    name: 'Balanced Judge',
    icon: Scale,
    behavior: 'Normal threshold and fair scoring.',
    threshold: 70,
    difficulty: 'Medium',
  },
  {
    id: 'fast',
    name: 'Fast Judge',
    icon: Zap,
    behavior: 'Quick review with simpler feedback.',
    threshold: 60,
    difficulty: 'Easy',
  },
  {
    id: 'quality',
    name: 'Quality Judge',
    icon: FileCheck2,
    behavior: 'Focuses on completeness, usefulness, and clarity.',
    threshold: 75,
    difficulty: 'Medium-Hard',
  },
]

const DEADLINES = [15, 30, 60, 120] as const

const BASE_STEPS: RitualStep[] = [
  { id: 'task', label: 'Task Created', icon: ScrollText, state: 'pending' },
  { id: 'escrow', label: 'Escrow Locked', icon: Lock, state: 'pending' },
  { id: 'agent', label: 'Agent Summoned', icon: Bot, state: 'pending' },
  { id: 'output', label: 'Output Submitted', icon: FileText, state: 'pending' },
  { id: 'judge', label: 'Judge Review', icon: VenetianMask, state: 'pending' },
  { id: 'settlement', label: 'Settlement', icon: Gem, state: 'pending' },
]

const STATUS_ITEMS = [
  ['Simulation Mode', 'Offchain'],
  ['Network', 'Rialo Concept Mode'],
  ['Payment', 'Mock Reward'],
  ['Judge', 'Simulated Agent'],
  ['Storage', 'None'],
]

function wait(ms: number) {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getDeadlinePressure(deadline: number | null): Pressure {
  if (deadline === 15) return 'High'
  if (deadline === 30) return 'Medium'
  if (deadline === 60) return 'Low'
  return 'Very Low'
}

function getFitScore(fit: Fit) {
  if (fit === 'Strong') return 24
  if (fit === 'Good') return 10
  return -16
}

function getPressurePenalty(pressure: Pressure) {
  if (pressure === 'High') return -14
  if (pressure === 'Medium') return -6
  if (pressure === 'Low') return 2
  return 7
}

function getExpirationChance(pressure: Pressure) {
  if (pressure === 'High') return 0.26
  if (pressure === 'Medium') return 0.13
  if (pressure === 'Low') return 0.06
  return 0.02
}

function identifyTaskType(task: string, selectedTemplate: string) {
  if (selectedTemplate) return selectedTemplate
  const lower = task.toLowerCase()
  if (lower.includes('price') || lower.includes('market')) return 'Analyze mock RWA price movement'
  if (lower.includes('weather') || lower.includes('automation') || lower.includes('if')) return 'Create automation rule for weather insurance'
  if (lower.includes('invoice') || lower.includes('settle')) return 'Check if invoice should be settled'
  if (lower.includes('risk') || lower.includes('credit')) return 'Detect risk in a mock credit event'
  if (lower.includes('use case') || lower.includes('creative')) return 'Generate a simple RWA use case'
  if (lower.includes('compare')) return 'Compare two agent outputs'
  return 'Custom Task Scroll'
}

function getAgentFit(task: string, selectedTemplate: string, agentId: AgentId | null): Fit {
  if (!agentId || !task.trim()) return 'Weak'
  const taskType = identifyTaskType(task, selectedTemplate)
  const ideal = IDEAL_AGENTS[taskType]
  if (ideal?.includes(agentId)) return 'Strong'
  if (ideal) {
    if (agentId === 'research' || agentId === 'rwa') return 'Good'
    return 'Weak'
  }

  const lower = task.toLowerCase()
  const keywordMatch =
    (agentId === 'research' && /summar|explain|document|beginner|compare/.test(lower)) ||
    (agentId === 'rwa' && /rwa|asset|invoice|credit|settle|payment/.test(lower)) ||
    (agentId === 'market' && /price|market|trend|signal|volatility/.test(lower)) ||
    (agentId === 'compliance' && /risk|eligible|rule|policy|check/.test(lower)) ||
    (agentId === 'automation' && /autom|trigger|if|then|workflow|weather/.test(lower)) ||
    (agentId === 'creative' && /creative|campaign|story|use case|content/.test(lower))

  if (keywordMatch) return 'Strong'
  if (lower.length > 28) return 'Good'
  return 'Weak'
}

function estimateChance(fit: Fit, judge: Judge | null, pressure: Pressure) {
  if (!judge) return 0
  const base = 62 + getFitScore(fit) + getPressurePenalty(pressure) - Math.round((judge.threshold - 70) * 0.55)
  return clamp(base + Math.round((Math.random() - 0.5) * 8), 10, 96)
}

function buildOutput(agent: Agent, taskType: string) {
  if (agent.id === 'research' && taskType.includes('Compare')) {
    return 'The stronger output is the one that explains the settlement condition, the agent responsibility, and the judge criteria in plain language.'
  }
  if (agent.id === 'rwa' && taskType.includes('invoice')) {
    return 'The invoice should settle only after the mock payer signal confirms lower counterparty risk and the judge validates the event.'
  }
  return agent.output
}

function buildReasoning(outcome: Outcome) {
  if (outcome === 'Approved') return 'Output was relevant, complete, and submitted before the deadline.'
  if (outcome === 'Rejected') return 'Output did not match the task requirements strongly enough.'
  if (outcome === 'Needs Revision') return 'Output is close, but the judge requires clearer reasoning before settlement.'
  return 'Agent missed the deadline, so the mock escrow was auto-refunded.'
}

function pseudoHash(input: string) {
  let hash = 0x811c9dc5
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  const left = (hash >>> 0).toString(16).padStart(8, '0')
  const right = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0')
  return `0x${left}${right}${left.slice(0, 4)}${right.slice(-4)}`
}

function makeProof(result: Result): Proof {
  const timestamp = new Date().toLocaleString()
  const nonce = Math.random().toString(16).slice(2, 10)
  const proofId = `SCALE-SIM-${nonce.slice(0, 5).toUpperCase()}`
  const score = result.score === null ? 'N/A' : String(result.score)
  const seed = `${result.taskType}${result.agent.name}${result.judge.name}${score}${result.outcome}${timestamp}${nonce}`

  return {
    proofId,
    taskType: result.taskType,
    agent: result.agent.name,
    judge: result.judge.name,
    score,
    outcome: result.outcome,
    rewardStatus: result.rewardStatus,
    timestamp,
    hash: pseudoHash(seed),
  }
}

function createSettlement(
  task: string,
  selectedTemplate: string,
  agent: Agent,
  judge: Judge,
  reward: number,
  deadline: number,
): Result {
  const pressure = getDeadlinePressure(deadline)
  const fit = getAgentFit(task, selectedTemplate, agent.id)
  const expired = Math.random() < getExpirationChance(pressure)
  const taskType = identifyTaskType(task, selectedTemplate)
  const output = expired ? 'No valid output was submitted before the simulated deadline.' : buildOutput(agent, taskType)

  if (expired) {
    return {
      taskScroll: task.trim(),
      taskType,
      agent,
      judge,
      reward,
      deadline,
      output,
      score: null,
      reasoning: buildReasoning('Expired'),
      outcome: 'Expired',
      rewardStatus: 'Auto-refunded',
    }
  }

  const score = clamp(
    Math.round(66 + getFitScore(fit) + getPressurePenalty(pressure) - (judge.threshold - 70) * 0.35 + (Math.random() * 20 - 9)),
    0,
    100,
  )
  const outcome: Outcome = score >= judge.threshold ? 'Approved' : score >= judge.threshold - 12 ? 'Needs Revision' : 'Rejected'
  const rewardStatus = outcome === 'Approved' ? 'Released to Agent' : outcome === 'Needs Revision' ? 'Held in Escrow' : 'Refunded to User'

  return {
    taskScroll: task.trim(),
    taskType,
    agent,
    judge,
    reward,
    deadline,
    output,
    score,
    reasoning: buildReasoning(outcome),
    outcome,
    rewardStatus,
  }
}

export default function ScalePlaygroundPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [task, setTask] = useState('')
  const [agentId, setAgentId] = useState<AgentId | null>(null)
  const [reward, setReward] = useState(25)
  const [deadline, setDeadline] = useState<number | null>(30)
  const [judgeId, setJudgeId] = useState<JudgeId | null>(null)
  const [steps, setSteps] = useState<RitualStep[]>(BASE_STEPS)
  const [isRunning, setIsRunning] = useState(false)
  const [activeCountdown, setActiveCountdown] = useState<number | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [proof, setProof] = useState<Proof | null>(null)

  const selectedAgent = AGENTS.find(agent => agent.id === agentId) ?? null
  const selectedJudge = JUDGES.find(judge => judge.id === judgeId) ?? null
  const pressure = getDeadlinePressure(deadline)
  const fit = getAgentFit(task, selectedTemplate, agentId)
  const chance = useMemo(() => estimateChance(fit, selectedJudge, pressure), [fit, selectedJudge, pressure])
  const canRun = Boolean(task.trim() && selectedAgent && selectedJudge && deadline && reward >= 1 && reward <= 100 && !isRunning)

  function updateStep(index: number, state: StepState) {
    setSteps(current => current.map((step, stepIndex) => (stepIndex === index ? { ...step, state } : step)))
  }

  function resetSteps() {
    setSteps(BASE_STEPS.map(step => ({ ...step, state: 'pending' })))
  }

  function chooseTemplate(template: string) {
    if (isRunning) return
    setSelectedTemplate(template)
    setTask(template)
  }

  function resetChamber() {
    if (isRunning) return
    setSelectedTemplate('')
    setTask('')
    setAgentId(null)
    setReward(25)
    setDeadline(30)
    setJudgeId(null)
    setResult(null)
    setProof(null)
    setActiveCountdown(null)
    resetSteps()
  }

  async function runSimulation() {
    if (!canRun || !selectedAgent || !selectedJudge || !deadline) return
    setIsRunning(true)
    setResult(null)
    setProof(null)
    resetSteps()
    setActiveCountdown(deadline)

    const settlement = createSettlement(task, selectedTemplate, selectedAgent, selectedJudge, reward, deadline)

    for (let index = 0; index < BASE_STEPS.length; index += 1) {
      updateStep(index, 'active')
      if (index === 3) {
        const slices = 8
        for (let slice = 0; slice < slices; slice += 1) {
          await wait(105)
          setActiveCountdown(Math.max(0, Math.round(deadline - ((deadline / slices) * (slice + 1)))))
        }
      } else {
        await wait(520)
      }

      if (settlement.outcome === 'Expired' && (index === 3 || index === 4)) {
        updateStep(index, 'failed')
      } else if ((settlement.outcome === 'Rejected' || settlement.outcome === 'Needs Revision') && index === 5) {
        updateStep(index, settlement.outcome === 'Rejected' ? 'failed' : 'complete')
      } else {
        updateStep(index, 'complete')
      }
      await wait(170)
    }

    setActiveCountdown(null)
    setResult(settlement)
    setProof(makeProof(settlement))
    setIsRunning(false)
  }

  return (
    <div className="relative mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[8%] top-16 h-64 w-64 rounded-full bg-[var(--temple-emerald)]/10 blur-3xl" />
        <div className="absolute right-[12%] top-36 h-80 w-80 rounded-full bg-[var(--temple-sky)]/10 blur-3xl" />
        <div className="absolute bottom-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[var(--temple-gold)]/10 blur-3xl" />
      </div>

      <Hero />
      <StatusPanel />

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.25fr_0.9fr]">
        <ContractSetup
          selectedTemplate={selectedTemplate}
          task={task}
          agentId={agentId}
          reward={reward}
          deadline={deadline}
          judgeId={judgeId}
          isRunning={isRunning}
          onChooseTemplate={chooseTemplate}
          onTaskChange={(value) => {
            setTask(value)
            if (TASK_TEMPLATES.every(template => template !== value)) setSelectedTemplate('')
          }}
          onAgentChange={setAgentId}
          onRewardChange={setReward}
          onDeadlineChange={setDeadline}
          onJudgeChange={setJudgeId}
        />

        <RitualChamber
          steps={steps}
          agent={selectedAgent}
          judge={selectedJudge}
          reward={reward}
          deadline={deadline}
          countdown={activeCountdown}
          isRunning={isRunning}
          canRun={canRun}
          result={result}
          onRun={runSimulation}
          onReset={resetChamber}
          onTryAgain={runSimulation}
        />

        <aside className="space-y-5">
          <ExecutionPreview fit={fit} judge={selectedJudge} pressure={pressure} chance={chance} />
          <SettlementResult result={result} />
          <TemporaryProofScroll proof={proof} />
        </aside>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="temple-rune-panel temple-card overflow-hidden rounded-lg p-5 sm:p-7">
      <div className="relative z-10 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <h1 className="text-4xl font-black tracking-normal sm:text-6xl">SCALE Ritual Playground</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--temple-muted)]">
            Summon agents, lock mock rewards, assign judges, and watch SCALE-style settlement happen.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--temple-soft)]">
            Simulate how Rialo SCALE can coordinate AI agent work with clear tasks, rewards, deadlines, judge review, and settlement logic.
          </p>
        </div>
        <div className="rounded-lg border border-[var(--temple-border)] bg-black/25 p-4 text-sm leading-6 text-[var(--temple-muted)] lg:max-w-sm">
          This is an offchain concept simulator. No wallet, payment, storage, or contract interaction is involved.
        </div>
      </div>
    </section>
  )
}

function StatusPanel() {
  return (
    <section className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {STATUS_ITEMS.map(([label, value]) => (
        <div key={label} className="temple-sticker rounded-lg p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--temple-soft)]">{label}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--temple-text)]">{value}</p>
        </div>
      ))}
    </section>
  )
}

function ContractSetup({
  selectedTemplate,
  task,
  agentId,
  reward,
  deadline,
  judgeId,
  isRunning,
  onChooseTemplate,
  onTaskChange,
  onAgentChange,
  onRewardChange,
  onDeadlineChange,
  onJudgeChange,
}: {
  selectedTemplate: string
  task: string
  agentId: AgentId | null
  reward: number
  deadline: number | null
  judgeId: JudgeId | null
  isRunning: boolean
  onChooseTemplate: (template: string) => void
  onTaskChange: (value: string) => void
  onAgentChange: (agent: AgentId) => void
  onRewardChange: (reward: number) => void
  onDeadlineChange: (deadline: number) => void
  onJudgeChange: (judge: JudgeId) => void
}) {
  return (
    <section className="space-y-5">
      <Panel title="Contract Setup" icon={FlaskConical}>
        <FieldTitle icon={ScrollText} title="Task Scroll" />
        <div className="grid gap-2">
          {TASK_TEMPLATES.map(template => (
            <button
              key={template}
              type="button"
              disabled={isRunning}
              onClick={() => onChooseTemplate(template)}
              aria-pressed={selectedTemplate === template}
              className={cx(
                'rounded-lg border px-3 py-2 text-left text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
                selectedTemplate === template
                  ? 'border-[var(--temple-emerald)] bg-[var(--temple-emerald)]/12 text-[var(--temple-text)] shadow-[0_0_24px_rgba(87,227,159,0.12)]'
                  : 'border-[var(--temple-border)] bg-black/20 text-[var(--temple-muted)] hover:bg-white/[0.045]',
              )}
            >
              {template}
            </button>
          ))}
        </div>
        <textarea
          className="temple-input mt-3 h-28 w-full resize-none rounded-lg px-3 py-3 text-sm leading-6 disabled:opacity-50"
          disabled={isRunning}
          value={task}
          onChange={(event) => onTaskChange(event.target.value)}
          placeholder="Write a custom SCALE task scroll..."
        />
      </Panel>

      <Panel title="Summon Agent" icon={Bot}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          {AGENTS.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              selected={agentId === agent.id}
              disabled={isRunning}
              onSelect={() => onAgentChange(agent.id)}
            />
          ))}
        </div>
      </Panel>

      <Panel title="Mock Escrow Reward" icon={Gem}>
        <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <RewardCrystal reward={reward} />
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--temple-muted)]">Mock Escrow Reward</span>
              <span className="text-xl font-black text-[var(--temple-gold)]">{reward} mock USDC</span>
            </div>
            <input
              aria-label="Mock Escrow Reward"
              disabled={isRunning}
              className="w-full accent-[var(--temple-gold)] disabled:opacity-50"
              type="range"
              min={1}
              max={100}
              value={reward}
              onChange={(event) => onRewardChange(Number(event.target.value))}
            />
            <p className="mt-3 text-xs leading-5 text-[var(--temple-soft)]">
              Mock reward is only used to explain SCALE settlement logic. No real payment is made.
            </p>
          </div>
        </div>
      </Panel>

      <Panel title="Deadline Relic" icon={Hourglass}>
        <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
          <DeadlineRelic deadline={deadline} active={isRunning} countdown={null} />
          <div className="grid grid-cols-2 gap-2">
            {DEADLINES.map(value => (
              <button
                key={value}
                type="button"
                disabled={isRunning}
                onClick={() => onDeadlineChange(value)}
                aria-pressed={deadline === value}
                className={cx(
                  'rounded-lg border px-3 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50',
                  deadline === value
                    ? 'border-[var(--temple-sky)] bg-[var(--temple-sky)]/12 text-[var(--temple-text)]'
                    : 'border-[var(--temple-border)] bg-black/20 text-[var(--temple-muted)]',
                )}
              >
                {value} seconds
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <Panel title="Judge Tribunal" icon={VenetianMask}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          {JUDGES.map(judge => (
            <JudgeCard
              key={judge.id}
              judge={judge}
              selected={judgeId === judge.id}
              disabled={isRunning}
              onSelect={() => onJudgeChange(judge.id)}
            />
          ))}
        </div>
      </Panel>
    </section>
  )
}

function RitualChamber({
  steps,
  agent,
  judge,
  reward,
  deadline,
  countdown,
  isRunning,
  canRun,
  result,
  onRun,
  onReset,
  onTryAgain,
}: {
  steps: RitualStep[]
  agent: Agent | null
  judge: Judge | null
  reward: number
  deadline: number | null
  countdown: number | null
  isRunning: boolean
  canRun: boolean
  result: Result | null
  onRun: () => void
  onReset: () => void
  onTryAgain: () => void
}) {
  const ActiveAgentIcon = agent?.icon ?? Bot
  const JudgeIcon = judge?.icon ?? VenetianMask

  return (
    <section className="temple-card temple-rune-panel overflow-hidden rounded-lg p-5 sm:p-6">
      <div className="relative z-10">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--temple-gold)]">Center Chamber</p>
            <h2 className="mt-2 text-3xl font-black tracking-normal">SCALE Ritual Chamber</h2>
          </div>
          <div className="rounded-lg border border-[var(--temple-border)] bg-black/25 px-3 py-2 text-xs text-[var(--temple-muted)]">
            React state only
          </div>
        </div>

        <div className="relative min-h-[520px] overflow-hidden rounded-lg border border-[var(--temple-border)] bg-[#050807]/70 p-4 sm:min-h-[620px] sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(87,227,159,0.13),transparent_22rem)]" />
          <div className="pointer-events-none absolute inset-0 opacity-70" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(139,211,255,0.18) 1px, transparent 0)', backgroundSize: '38px 38px' }} />

          <div className="relative mx-auto flex min-h-[390px] max-w-[620px] items-center justify-center sm:min-h-[470px]">
            <motion.div
              className="absolute h-[280px] w-[280px] rounded-full p-[1px] sm:h-[390px] sm:w-[390px]"
              animate={{ rotate: isRunning ? 360 : 0 }}
              transition={{ duration: 16, repeat: isRunning ? Infinity : 0, ease: 'linear' }}
              style={{
                background: 'conic-gradient(from 180deg, rgba(87,227,159,0.05), rgba(139,211,255,0.92), rgba(242,200,102,0.82), rgba(87,227,159,0.62), rgba(87,227,159,0.05))',
                boxShadow: '0 0 70px rgba(87,227,159,0.18)',
              }}
            >
              <div className="h-full w-full rounded-full bg-[#070a08]" />
            </motion.div>
            <div className="absolute h-[210px] w-[210px] rounded-full border border-[var(--temple-border)] bg-black/45 sm:h-[290px] sm:w-[290px]" />
            <div className="absolute h-[132px] w-[132px] rounded-full border border-[var(--temple-emerald)]/30 bg-[var(--temple-emerald)]/8 shadow-[0_0_60px_rgba(87,227,159,0.16)] sm:h-[170px] sm:w-[170px]" />

            <div className="relative z-10 text-center">
              <motion.div
                animate={{ scale: isRunning ? [1, 1.08, 1] : 1 }}
                transition={{ duration: 1.2, repeat: isRunning ? Infinity : 0 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-lg border border-[var(--temple-border)] bg-black/40 shadow-[0_0_34px_rgba(139,211,255,0.18)]"
              >
                <Scale className="h-9 w-9 text-[var(--temple-sky)]" />
              </motion.div>
              <p className="mt-4 text-sm font-semibold text-[var(--temple-text)]">Ritual Core</p>
              <p className="mt-1 text-xs text-[var(--temple-muted)]">mock labor contract</p>
            </div>

            {steps.map((step, index) => {
              const angle = -90 + index * 60
              const radius = 42
              const x = 50 + Math.cos((angle * Math.PI) / 180) * radius
              const y = 50 + Math.sin((angle * Math.PI) / 180) * radius
              return (
                <RitualNode key={step.id} step={step} style={{ left: `${x}%`, top: `${y}%` }} />
              )
            })}
          </div>

          <div className="relative z-10 mt-2 grid gap-3 sm:grid-cols-3">
            <MiniRelic label="Summoned Entity" value={agent?.name ?? 'No agent'} icon={ActiveAgentIcon} active={isRunning && Boolean(agent)} />
            <MiniRelic label="Escrow Crystal" value={`${reward} mock USDC`} icon={Gem} active={isRunning} />
            <MiniRelic label="Tribunal Mask" value={judge?.name ?? 'No judge'} icon={JudgeIcon} active={isRunning && Boolean(judge)} />
          </div>

          <div className="relative z-10 mt-4 grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
            <DeadlineRelic deadline={deadline} active={isRunning} countdown={countdown} />
            <div className="grid gap-2 sm:grid-cols-3">
              {steps.map(step => (
                <div key={step.id} className="rounded-lg border border-[var(--temple-border)] bg-black/25 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold">{step.label}</p>
                    <StepStatus state={step.state} />
                  </div>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--temple-soft)]">{step.state}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            disabled={!canRun}
            onClick={onRun}
            className="temple-button inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-45 sm:col-span-1"
          >
            <Play className="h-4 w-4" /> Run SCALE Ritual
          </button>
          <button
            type="button"
            disabled={isRunning}
            onClick={onReset}
            className="temple-button-secondary inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
          >
            <RotateCcw className="h-4 w-4 text-[var(--temple-gold)]" /> Reset Chamber
          </button>
          <button
            type="button"
            disabled={isRunning || !result}
            onClick={onTryAgain}
            className="temple-button-secondary inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
          >
            <RefreshCw className="h-4 w-4 text-[var(--temple-emerald)]" /> Try Another Run
          </button>
        </div>
      </div>
    </section>
  )
}

function ExecutionPreview({ fit, judge, pressure, chance }: { fit: Fit; judge: Judge | null; pressure: Pressure; chance: number }) {
  return (
    <Panel title="Execution Preview" icon={Sparkles}>
      <div className="space-y-3">
        <PreviewRow label="Agent Fit" value={fit} tone={fit === 'Strong' ? 'good' : fit === 'Good' ? 'warn' : 'bad'} />
        <PreviewRow label="Judge Difficulty" value={judge?.difficulty ?? 'Select tribunal'} tone={judge ? 'warn' : 'muted'} />
        <PreviewRow label="Deadline Pressure" value={pressure} tone={pressure === 'High' ? 'bad' : pressure === 'Medium' ? 'warn' : 'good'} />
        <div className="rounded-lg border border-[var(--temple-border)] bg-black/20 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--temple-soft)]">Estimated Settlement Chance</p>
            <p className="text-xl font-black text-[var(--temple-emerald)]">{chance}%</p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
            <motion.div className="h-full rounded-full bg-[linear-gradient(90deg,var(--temple-emerald),var(--temple-gold))]" animate={{ width: `${chance}%` }} />
          </div>
        </div>
      </div>
    </Panel>
  )
}

function SettlementResult({ result }: { result: Result | null }) {
  if (!result) {
    return (
      <Panel title="Settlement Verdict" icon={Gavel}>
        <div className="rounded-lg border border-dashed border-[var(--temple-border)] bg-black/20 p-5 text-center">
          <Clock className="mx-auto h-8 w-8 text-[var(--temple-soft)]" />
          <p className="mt-3 text-sm font-semibold">Awaiting ritual execution</p>
          <p className="mt-2 text-xs leading-5 text-[var(--temple-muted)]">The verdict, mock reward status, agent output, and judge reasoning will appear here.</p>
        </div>
      </Panel>
    )
  }

  return (
    <Panel title="Settlement Verdict" icon={Gavel}>
      <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-[var(--temple-border)] bg-black/25 p-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--temple-soft)]">Final Verdict Stamp</p>
          <p className={cx('mt-1 text-2xl font-black', outcomeColor(result.outcome))}>{result.outcome}</p>
        </div>
        <OutcomeIcon outcome={result.outcome} />
      </div>
      <div className="space-y-3 text-sm">
        <ResultLine label="Task Scroll" value={result.taskScroll} />
        <ResultLine label="Selected Agent" value={result.agent.name} />
        <ResultLine label="Selected Judge" value={result.judge.name} />
        <ResultLine label="Mock Reward" value={`${result.reward} mock USDC`} />
        <ResultLine label="Deadline" value={`${result.deadline} seconds`} />
        <ResultBlock label="Generated Agent Output">{result.output}</ResultBlock>
        <ResultLine label="Judge Score" value={result.score === null ? 'N/A' : `${result.score}/100`} />
        <ResultBlock label="Judge Reasoning">{result.reasoning}</ResultBlock>
        <ResultLine label="Reward Status" value={result.rewardStatus} />
      </div>
    </Panel>
  )
}

function TemporaryProofScroll({ proof }: { proof: Proof | null }) {
  return (
    <Panel title="Temporary Execution Proof" icon={FileCheck2}>
      <AnimatePresence mode="wait">
        {!proof ? (
          <motion.div key="empty-proof" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-lg border border-dashed border-[var(--temple-border)] bg-black/20 p-5 text-center">
            <FileText className="mx-auto h-8 w-8 text-[var(--temple-soft)]" />
            <p className="mt-3 text-sm font-semibold">No temporary proof yet</p>
            <p className="mt-2 text-xs leading-5 text-[var(--temple-muted)]">Proof appears after settlement and disappears on reset or refresh.</p>
          </motion.div>
        ) : (
          <motion.div key={proof.proofId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-lg border border-[var(--temple-gold)]/35 bg-[linear-gradient(180deg,rgba(242,200,102,0.10),rgba(0,0,0,0.20))] p-4 shadow-[0_0_34px_rgba(242,200,102,0.10)]">
            <ProofLine label="Proof ID" value={proof.proofId} />
            <ProofLine label="Task" value={proof.taskType} />
            <ProofLine label="Agent" value={proof.agent} />
            <ProofLine label="Judge" value={proof.judge} />
            <ProofLine label="Score" value={proof.score} />
            <ProofLine label="Outcome" value={proof.outcome} />
            <ProofLine label="Reward Status" value={proof.rewardStatus} />
            <ProofLine label="Timestamp" value={proof.timestamp} />
            <div className="mt-3 rounded-md bg-black/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--temple-soft)]">Hash</p>
              <p className="mt-1 break-all font-mono text-xs text-[var(--temple-sky)]">{proof.hash}</p>
            </div>
            <p className="mt-4 text-xs leading-5 text-[var(--temple-muted)]">
              This is a local offchain SCALE simulation. Nothing is stored, paid, or submitted onchain.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Panel>
  )
}

function Panel({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="temple-card rounded-lg p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--temple-gold)]" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--temple-text)]">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function FieldTitle({ title, icon: Icon }: { title: string; icon: LucideIcon }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-4 w-4 text-[var(--temple-emerald)]" />
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--temple-soft)]">{title}</p>
    </div>
  )
}

function AgentCard({ agent, selected, disabled, onSelect }: { agent: Agent; selected: boolean; disabled: boolean; onSelect: () => void }) {
  const Icon = agent.icon
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
      className={cx(
        'group rounded-lg border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50',
        selected
          ? 'border-[var(--temple-emerald)] bg-[var(--temple-emerald)]/10 shadow-[0_0_30px_rgba(87,227,159,0.13)]'
          : 'border-[var(--temple-border)] bg-black/20 hover:-translate-y-0.5 hover:bg-white/[0.045]',
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--temple-border)] bg-black/30">
          <Icon className={cx('h-5 w-5', selected ? 'text-[var(--temple-emerald)]' : 'text-[var(--temple-muted)]')} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold">{agent.name}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--temple-muted)]">{agent.description}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {agent.strengths.map(strength => (
          <span key={strength} className="rounded-md bg-white/[0.055] px-2 py-1 text-[10px] font-semibold text-[var(--temple-soft)]">
            {strength}
          </span>
        ))}
      </div>
    </button>
  )
}

function JudgeCard({ judge, selected, disabled, onSelect }: { judge: Judge; selected: boolean; disabled: boolean; onSelect: () => void }) {
  const Icon = judge.icon
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
      className={cx(
        'rounded-lg border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50',
        selected
          ? 'border-[var(--temple-gold)] bg-[var(--temple-gold)]/10 shadow-[0_0_30px_rgba(242,200,102,0.12)]'
          : 'border-[var(--temple-border)] bg-black/20 hover:-translate-y-0.5 hover:bg-white/[0.045]',
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--temple-border)] bg-black/30">
          <Icon className={cx('h-5 w-5', selected ? 'text-[var(--temple-gold)]' : 'text-[var(--temple-muted)]')} />
        </span>
        <div>
          <p className="text-sm font-bold">{judge.name}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--temple-muted)]">{judge.behavior}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <span className="text-[var(--temple-soft)]">{judge.difficulty}</span>
        <span className="font-black text-[var(--temple-gold)]">Threshold {judge.threshold}</span>
      </div>
    </button>
  )
}

function RewardCrystal({ reward }: { reward: number }) {
  const brightness = 0.45 + reward / 120
  return (
    <div className="flex items-center justify-center">
      <div className="relative h-24 w-24">
        <div className="absolute inset-0 rounded-full bg-[var(--temple-gold)]/20 blur-xl" style={{ opacity: brightness }} />
        <motion.div
          className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 rotate-45 items-center justify-center border border-[var(--temple-gold)]/70 bg-[linear-gradient(135deg,rgba(242,200,102,0.28),rgba(139,211,255,0.12))] shadow-[0_0_30px_rgba(242,200,102,0.20)]"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2.4, repeat: Infinity }}
          style={{ filter: `brightness(${brightness})` }}
        >
          <Gem className="-rotate-45 text-[var(--temple-gold)]" />
        </motion.div>
      </div>
    </div>
  )
}

function DeadlineRelic({ deadline, active, countdown }: { deadline: number | null; active: boolean; countdown: number | null }) {
  return (
    <div className="flex min-h-24 min-w-24 flex-col items-center justify-center rounded-lg border border-[var(--temple-border)] bg-black/25 p-3 text-center">
      <Hourglass className={cx('h-8 w-8 text-[var(--temple-sky)]', active && 'animate-pulse')} />
      <p className="mt-2 text-lg font-black">{countdown !== null ? countdown : deadline ?? '--'}s</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--temple-soft)]">Deadline Relic</p>
    </div>
  )
}

function RitualNode({ step, style }: { step: RitualStep; style: React.CSSProperties }) {
  const Icon = step.icon
  const active = step.state === 'active'
  const complete = step.state === 'complete'
  const failed = step.state === 'failed'
  return (
    <motion.div
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2 text-center"
      style={style}
      animate={{ scale: active ? [1, 1.12, 1] : 1 }}
      transition={{ duration: 0.9, repeat: active ? Infinity : 0 }}
    >
      <div
        className={cx(
          'mx-auto flex h-14 w-14 items-center justify-center rounded-lg border bg-black/55 shadow-lg sm:h-16 sm:w-16',
          active && 'border-[var(--temple-sky)] text-[var(--temple-sky)] shadow-[0_0_28px_rgba(139,211,255,0.22)]',
          complete && 'border-[var(--temple-emerald)] text-[var(--temple-emerald)]',
          failed && 'border-[var(--temple-red)] text-[var(--temple-red)]',
          step.state === 'pending' && 'border-[var(--temple-border)] text-[var(--temple-muted)]',
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-2 hidden max-w-24 text-[10px] font-semibold leading-4 text-[var(--temple-muted)] sm:block">{step.label}</p>
    </motion.div>
  )
}

function MiniRelic({ label, value, icon: Icon, active }: { label: string; value: string; icon: LucideIcon; active: boolean }) {
  return (
    <div className={cx('rounded-lg border bg-black/25 p-3', active ? 'border-[var(--temple-emerald)]/40' : 'border-[var(--temple-border)]')}>
      <Icon className={cx('h-4 w-4', active ? 'text-[var(--temple-emerald)]' : 'text-[var(--temple-soft)]')} />
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--temple-soft)]">{label}</p>
      <p className="mt-1 truncate text-sm font-bold">{value}</p>
    </div>
  )
}

function StepStatus({ state }: { state: StepState }) {
  if (state === 'complete') return <CheckCircle2 className="h-4 w-4 text-[var(--temple-emerald)]" />
  if (state === 'failed') return <XCircle className="h-4 w-4 text-[var(--temple-red)]" />
  if (state === 'active') return <Sparkles className="h-4 w-4 text-[var(--temple-sky)]" />
  return <Clock className="h-4 w-4 text-[var(--temple-soft)]" />
}

function PreviewRow({ label, value, tone }: { label: string; value: string; tone: 'good' | 'warn' | 'bad' | 'muted' }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--temple-border)] bg-black/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--temple-soft)]">{label}</p>
      <p className={cx('text-sm font-black', toneColor(tone))}>{value}</p>
    </div>
  )
}

function ResultLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--temple-border)]/70 pb-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--temple-soft)]">{label}</p>
      <p className="max-w-[58%] text-right font-semibold text-[var(--temple-text)]">{value}</p>
    </div>
  )
}

function ResultBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--temple-border)] bg-black/20 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--temple-soft)]">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--temple-muted)]">{children}</p>
    </div>
  )
}

function ProofLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--temple-border)]/60 py-2 text-xs">
      <span className="font-semibold uppercase tracking-wider text-[var(--temple-soft)]">{label}</span>
      <span className="max-w-[58%] text-right font-bold text-[var(--temple-text)]">{value}</span>
    </div>
  )
}

function OutcomeIcon({ outcome }: { outcome: Outcome }) {
  if (outcome === 'Approved') return <CheckCircle2 className="h-10 w-10 text-[var(--temple-emerald)]" />
  if (outcome === 'Expired') return <Clock className="h-10 w-10 text-[var(--temple-sky)]" />
  if (outcome === 'Needs Revision') return <AlertTriangle className="h-10 w-10 text-[var(--temple-gold)]" />
  return <XCircle className="h-10 w-10 text-[var(--temple-red)]" />
}

function outcomeColor(outcome: Outcome) {
  if (outcome === 'Approved') return 'text-[var(--temple-emerald)]'
  if (outcome === 'Expired') return 'text-[var(--temple-sky)]'
  if (outcome === 'Needs Revision') return 'text-[var(--temple-gold)]'
  return 'text-[var(--temple-red)]'
}

function toneColor(tone: 'good' | 'warn' | 'bad' | 'muted') {
  if (tone === 'good') return 'text-[var(--temple-emerald)]'
  if (tone === 'warn') return 'text-[var(--temple-gold)]'
  if (tone === 'bad') return 'text-[var(--temple-red)]'
  return 'text-[var(--temple-muted)]'
}
