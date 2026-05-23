import {
  Bot,
  DatabaseZap,
  Fingerprint,
  Gauge,
  KeyRound,
  Link2,
  Scale,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import type { WorldCharacterAccessory, WorldCharacterMood, WorldCharacterRole, WorldCharacterTone } from './WorldCharacter'

export type WorldZoneId =
  | 'data-spring'
  | 'bridge-gate'
  | 'privacy-chamber'
  | 'identity-passport'
  | 'speed-engine'
  | 'rwa-vault'
  | 'agent-camp'
  | 'scale-lab'

export type WorldStep = {
  label: string
  detail: string
}

export type WorldZone = {
  id: WorldZoneId
  title: string
  concept: string
  summary: string
  scene: string
  points: string[]
  example: string
  why: string
  steps: WorldStep[]
  tone: WorldCharacterTone
  icon: LucideIcon
  mascot: {
    name: string
    role: WorldCharacterRole
    accessory: WorldCharacterAccessory
    mood: WorldCharacterMood
  }
}

export const worldZones: WorldZone[] = [
  {
    id: 'data-spring',
    title: 'Data Spring',
    concept: 'Real World Data',
    summary: 'Apps can use live information from the real world, not just old data already stored onchain.',
    scene: 'A temple spring pulls data bubbles from weather, markets, banks, shipments, and ratings into an onchain pool.',
    points: ['Live data enters the app', 'Data can be checked before use', 'Smart contracts can react to current information'],
    example: 'A lending app can update risk when real-world credit or market data changes.',
    why: 'Apps become aware of what is happening outside crypto.',
    steps: [
      { label: 'Outside source', detail: 'A real-world source produces fresh information.' },
      { label: 'Check data', detail: 'The Data Keeper filters it before the app trusts it.' },
      { label: 'Onchain pool', detail: 'The checked value becomes usable by contracts and agents.' },
    ],
    tone: 'sapphire',
    icon: DatabaseZap,
    mascot: { name: 'Data Keeper', role: 'data', accessory: 'drop', mood: 'focus' },
  },
  {
    id: 'bridge-gate',
    title: 'Bridge Gate',
    concept: 'Real World Connectivity',
    summary: 'Rialo helps apps talk to internet services and real-world systems directly.',
    scene: 'A message scroll travels from a smart contract through API portals, receives a response, then returns to the temple.',
    points: ['Apps can call external services', 'Results can return back to the app', 'Less middleware is needed'],
    example: 'A contract can check if an invoice was paid or if a delivery was completed.',
    why: 'Blockchain apps can interact with real apps people already use.',
    steps: [
      { label: 'Send request', detail: 'The contract asks an external service for a status.' },
      { label: 'Portal call', detail: 'The Bridge Messenger carries the scroll through an API gate.' },
      { label: 'Return result', detail: 'The response comes back and updates the app.' },
    ],
    tone: 'emerald',
    icon: Link2,
    mascot: { name: 'Bridge Messenger', role: 'bridge', accessory: 'scroll', mood: 'walk' },
  },
  {
    id: 'privacy-chamber',
    title: 'Privacy Chamber',
    concept: 'Real World Privacy',
    summary: 'Some real-world actions need privacy, especially identity, finance, and personal data.',
    scene: 'A public scroll enters a quiet chamber, folds into an encrypted scroll, and leaves behind a shielded path.',
    points: ['Sensitive data should not be exposed publicly', 'Apps can use private communication', 'Users can interact more safely'],
    example: 'A finance app can notify a user privately without exposing personal details to everyone.',
    why: 'Real-world apps need privacy; not everything should be public.',
    steps: [
      { label: 'Plain message', detail: 'The app has information that should not be exposed.' },
      { label: 'Encrypt', detail: 'The Privacy Guardian seals it in a protected scroll.' },
      { label: 'Private delivery', detail: 'Only the right person or system can read it.' },
    ],
    tone: 'violet',
    icon: ShieldCheck,
    mascot: { name: 'Privacy Guardian', role: 'privacy', accessory: 'shield', mood: 'think' },
  },
  {
    id: 'identity-passport',
    title: 'Identity Passport',
    concept: 'Real World Identity',
    summary: 'Users should not need confusing crypto setup for every real-world app.',
    scene: 'A passport desk stamps email, SMS, social, and wallet credentials so a new user can enter the temple.',
    points: ['Familiar accounts can help onboard users', 'Identity can connect Web2 and Web3', 'Apps can feel less confusing'],
    example: 'A user could verify with email or phone instead of only using a wallet.',
    why: 'Normal users can access Web3 without feeling lost.',
    steps: [
      { label: 'Familiar login', detail: 'The user starts with email, phone, or social identity.' },
      { label: 'Passport stamp', detail: 'The Passport Clerk links that proof to the app experience.' },
      { label: 'Enter Web3', detail: 'The user gets a smoother path into onchain activity.' },
    ],
    tone: 'gold',
    icon: Fingerprint,
    mascot: { name: 'Passport Clerk', role: 'identity', accessory: 'stamp', mood: 'wave' },
  },
  {
    id: 'speed-engine',
    title: 'Speed Engine',
    concept: 'Real World Speed / Reactivity',
    summary: 'Real-world apps need fast reactions, not slow waiting screens.',
    scene: 'A temple engine listens for events, fires a lightning rail, and activates an onchain action.',
    points: ['Apps can react quickly', 'Automations can run when conditions happen', 'Less waiting for users'],
    example: 'A payment, check-in, price update, or deadline can trigger an action automatically.',
    why: 'Real-world apps need instant response.',
    steps: [
      { label: 'Event happens', detail: 'A payment, deadline, price, or status changes outside the app.' },
      { label: 'Trigger fires', detail: 'The Speed Runner activates the temple engine.' },
      { label: 'Action updates', detail: 'The onchain app reacts without making users wait.' },
    ],
    tone: 'coral',
    icon: Gauge,
    mascot: { name: 'Speed Runner', role: 'speed', accessory: 'bolt', mood: 'walk' },
  },
  {
    id: 'rwa-vault',
    title: 'RWA Vault',
    concept: 'Real World Assets',
    summary: 'Real-world assets should be more than static tokens. They should react to live data and real events.',
    scene: 'Houses, invoices, bonds, gold, tickets, and documents become onchain asset cards that can update.',
    points: ['Assets can come from the real world', 'Assets can update with live conditions', 'Apps and agents can use those assets'],
    example: 'An invoice can update when payment status changes.',
    why: 'Tokenized assets become useful, not just decorative tokens.',
    steps: [
      { label: 'Real asset', detail: 'A real object or document starts outside crypto.' },
      { label: 'Tokenize', detail: 'The Vault Keeper turns it into an onchain asset card.' },
      { label: 'Update status', detail: 'Live data changes the asset when real events happen.' },
    ],
    tone: 'cream',
    icon: KeyRound,
    mascot: { name: 'Vault Keeper', role: 'vault', accessory: 'key', mood: 'focus' },
  },
  {
    id: 'agent-camp',
    title: 'Agent Camp',
    concept: 'Agent Economy',
    summary: 'AI agents are useful when they can safely do tasks, coordinate, and get paid.',
    scene: 'Agent characters move a task scroll through request, work, verify, and pay stations.',
    points: ['Agents can coordinate work', 'Tasks need rules and deadlines', 'Payment should happen after verification'],
    example: 'An image agent completes a task, a judge agent checks it, then payment is released.',
    why: 'Agents need safe rails before they handle real value.',
    steps: [
      { label: 'Request', detail: 'A user gives an agent a clear job.' },
      { label: 'Work', detail: 'The agent does the task and submits output.' },
      { label: 'Verify and pay', detail: 'A judge checks the result before payment releases.' },
    ],
    tone: 'emerald',
    icon: Bot,
    mascot: { name: 'Agent Scout', role: 'agent', accessory: 'orb', mood: 'think' },
  },
  {
    id: 'scale-lab',
    title: 'SCALE Lab',
    concept: 'Simple Contracts for Agent Labor Execution',
    summary: 'SCALE helps define task terms for agents so work can be checked before payment.',
    scene: 'A lab machine passes a task through task terms, deadline, quality check, and payment release stations.',
    points: ['Define the task clearly', 'Enforce deadline and terms', 'Verify quality before payment'],
    example: 'A user requests an output from an agent, and a judge checks whether it meets the terms before release.',
    why: 'It reduces risk when paying agents to do work.',
    steps: [
      { label: 'Task terms', detail: 'The work and success conditions are written clearly.' },
      { label: 'Deadline and check', detail: 'The lab checks time limits and quality rules.' },
      { label: 'Release payment', detail: 'Payment moves only after the task passes verification.' },
    ],
    tone: 'sapphire',
    icon: Scale,
    mascot: { name: 'SCALE Engineer', role: 'scale', accessory: 'gear', mood: 'focus' },
  },
]

export const worldZoneById = Object.fromEntries(worldZones.map((zone) => [zone.id, zone])) as Record<WorldZoneId, WorldZone>
