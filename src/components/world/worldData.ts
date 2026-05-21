import { Gem, Home, Landmark, RadioTower, Scale, Store, Vault, Zap, type LucideIcon } from 'lucide-react'

export type WorldBuildingId = 'hub' | 'spire' | 'bazaar' | 'treasury' | 'oracle' | 'homes'

export type WorldBuilding = {
  id: WorldBuildingId
  name: string
  shortName: string
  role: string
  simple: string
  analogy: string
  without: string
  with: string
  accent: string
  accent2: string
  icon: LucideIcon
  exterior: string
  interior: string
  position: { x: number; y: number; size: 'lg' | 'md' | 'sm' }
}

export type WorkflowStep = {
  key: string
  title: string
  what: string
  why: string
  item: string
}

const asset = (path: string) => new URL(`../../assets/world/${path}`, import.meta.url).href

export const characterAssets = {
  agent: asset('characters/agent.svg'),
  judge: asset('characters/judge.svg'),
  guardian: asset('characters/guardian.svg'),
  citizen: asset('characters/citizen.svg'),
  merchant: asset('characters/merchant.svg'),
  scribe: asset('characters/scribe.svg'),
}

export const itemAssets = {
  scroll: asset('items/scroll.svg'),
  crystal: asset('items/crystal.svg'),
  mask: asset('items/judge-mask.svg'),
  coin: asset('items/coin.svg'),
  token: asset('items/token.svg'),
  key: asset('items/vault-key.svg'),
  ledger: asset('items/ledger-stone.svg'),
  proposal: asset('items/proposal.svg'),
  yes: asset('items/yes-token.svg'),
  no: asset('items/no-token.svg'),
  price: asset('items/price-card.svg'),
  trade: asset('items/trade-light.svg'),
  identity: asset('items/identity-card.svg'),
  home: asset('items/wallet-home.svg'),
  memory: asset('items/memory-orb.svg'),
  block: asset('items/block-crystal.svg'),
  spark: asset('items/mempool-spark.svg'),
  deed: asset('items/rwa-deed.svg'),
  proof: asset('items/proof-tablet.svg'),
  hourglass: asset('items/hourglass.svg'),
}

export const effectAssets = {
  rune: asset('effects/rune-circle.svg'),
  aura: asset('effects/aura-burst.svg'),
  beam: asset('effects/light-beam.svg'),
  smoke: asset('effects/smoke-ring.svg'),
  trail: asset('effects/sparkle-trail.svg'),
  shockwave: asset('effects/shockwave.svg'),
}

export const buildings: WorldBuilding[] = [
  {
    id: 'hub',
    name: 'HUB',
    shortName: 'Governance',
    role: 'Community decisions',
    simple: 'Instead of one boss making all decisions, everyone with tokens can vote like a town hall.',
    analogy: 'Like a school council where every class gets a say, except the result is written on-chain.',
    without: 'One team decides, votes are hard to audit, and people must trust screenshots.',
    with: 'Proposals, votes, and results are visible, automatic, and recorded for everyone.',
    accent: '#f2c866',
    accent2: '#57e39f',
    icon: Landmark,
    exterior: asset('buildings/hub.svg'),
    interior: asset('interiors/hub.svg'),
    position: { x: 36, y: 12, size: 'lg' },
  },
  {
    id: 'spire',
    name: 'SPIRE',
    shortName: 'Transactions',
    role: 'Secure movement',
    simple: 'Every time money, tokens, or data moves on blockchain, the Spire confirms it safely.',
    analogy: 'Like a post office that stamps many letters into a batch called a block.',
    without: 'Transfers wait in opaque systems and receipts can be confusing.',
    with: 'Movements are public, ordered, confirmed, and easy to verify.',
    accent: '#78ecff',
    accent2: '#57e39f',
    icon: RadioTower,
    exterior: asset('buildings/spire.svg'),
    interior: asset('interiors/spire.svg'),
    position: { x: 63, y: 13, size: 'md' },
  },
  {
    id: 'bazaar',
    name: 'BAZAAR',
    shortName: 'Marketplace',
    role: 'Digital market',
    simple: 'A market for digital tokens where buyers and sellers meet instantly from anywhere.',
    analogy: 'Like a food market, but the goods are tokens and prices update globally.',
    without: 'Markets need many middlemen, paperwork, and delayed settlement.',
    with: 'Listings, trades, prices, and settlement can happen automatically.',
    accent: '#ff8066',
    accent2: '#f2c866',
    icon: Store,
    exterior: asset('buildings/bazaar.svg'),
    interior: asset('interiors/bazaar.svg'),
    position: { x: 26, y: 43, size: 'md' },
  },
  {
    id: 'treasury',
    name: 'TREASURY',
    shortName: 'Assets / RWA',
    role: 'Physical to digital',
    simple: 'Real-world things like invoices, houses, or gold become digital tokens people can verify.',
    analogy: 'Like turning a paper certificate into a magical token that moves instantly.',
    without: 'Documents sit in banks, emails, or filing cabinets and take days to prove.',
    with: 'Ownership can be verified and used digitally with less friction.',
    accent: '#f2c866',
    accent2: '#ffad72',
    icon: Vault,
    exterior: asset('buildings/treasury.svg'),
    interior: asset('interiors/treasury.svg'),
    position: { x: 58, y: 43, size: 'md' },
  },
  {
    id: 'oracle',
    name: 'ORACLE',
    shortName: 'Agents / SCALE',
    role: 'AI work ritual',
    simple: 'SCALE makes smart contract work easier by using agents to do a task, judges to check it, and proof to settle it.',
    analogy: 'Like a magical assistant writing a spell, another assistant checking it, then a stone tablet recording proof.',
    without: 'Smart contract work is hard, manual, and payment trust is messy.',
    with: 'Tasks, escrow, judging, settlement, and proof become a clear workflow.',
    accent: '#c886ff',
    accent2: '#78ecff',
    icon: Scale,
    exterior: asset('buildings/oracle.svg'),
    interior: asset('interiors/oracle.svg'),
    position: { x: 34, y: 72, size: 'md' },
  },
  {
    id: 'homes',
    name: 'HOMES',
    shortName: 'Identity',
    role: 'Wallet identity',
    simple: 'Your wallet is your home: it holds assets, history, reputation, and permissions.',
    analogy: 'Like your home, bank account, and ID card combined, secured by cryptography.',
    without: 'Accounts are scattered across apps and can be copied or faked.',
    with: 'One wallet connects actions, proof, and reputation across Rialo.',
    accent: '#57e39f',
    accent2: '#f2c866',
    icon: Home,
    exterior: asset('buildings/homes.svg'),
    interior: asset('interiors/homes.svg'),
    position: { x: 66, y: 72, size: 'sm' },
  },
]

export const glossary = [
  { term: 'Smart contract', icon: Zap, simple: 'A vending machine on the internet: put the right input in, get the promised result out, no human needed.' },
  { term: 'Blockchain', icon: Gem, simple: 'A public notebook everyone can inspect, but nobody can secretly erase.' },
  { term: 'Token', icon: Gem, simple: 'A digital certificate that says who owns something.' },
  { term: 'Wallet', icon: Home, simple: 'Your home and bank account combined for the blockchain world.' },
  { term: 'Gas fee', icon: Zap, simple: 'A postage stamp for sending an action to the blockchain.' },
]

export const workflows: Record<WorldBuildingId, WorkflowStep[]> = {
  oracle: [
    { key: 'task', title: 'Task', what: 'A scroll unrolls and the Agent reads your request.', why: 'The work starts from a clear instruction.', item: itemAssets.scroll },
    { key: 'escrow', title: 'Escrow', what: 'Gold locks inside a sealed chest.', why: 'Payment is held safely until the work passes.', item: itemAssets.coin },
    { key: 'work', title: 'Work', what: 'The Agent walks through the chamber and thinks.', why: 'AI processes the task and creates an output.', item: itemAssets.crystal },
    { key: 'output', title: 'Output', what: 'A completed scroll floats from the altar.', why: 'The result is submitted for checking.', item: itemAssets.scroll },
    { key: 'judge', title: 'Judge', what: 'The mask scans the result and gives a score.', why: 'Another AI checks quality before payment.', item: itemAssets.mask },
    { key: 'settle', title: 'Settlement', what: 'Coins release and a proof tablet appears.', why: 'Approved work gets paid; bad work can refund.', item: itemAssets.proof },
  ],
  treasury: [
    { key: 'deposit', title: 'Deposit', what: 'A real-world asset enters the vault slot.', why: 'The physical claim starts its digital journey.', item: itemAssets.deed },
    { key: 'verify', title: 'Verify', what: 'Rune locks spin around the vault.', why: 'The asset is checked before becoming usable.', item: itemAssets.key },
    { key: 'tokenize', title: 'Tokenize', what: 'The asset becomes a glowing token.', why: 'Ownership becomes digital and transferable.', item: itemAssets.token },
    { key: 'ledger', title: 'Ledger', what: 'The token connects to a blockchain stone.', why: 'Anyone can verify the record later.', item: itemAssets.ledger },
    { key: 'market', title: 'Market', what: 'A portal sends the token to the Bazaar.', why: 'Verified assets can trade more easily.', item: itemAssets.price },
  ],
  hub: [
    { key: 'proposal', title: 'Proposal', what: 'Citizens send scrolls into the hall.', why: 'Ideas become clear choices.', item: itemAssets.proposal },
    { key: 'vote', title: 'Vote', what: 'Vote tokens fly to yes and no sides.', why: 'The community decides together.', item: itemAssets.yes },
    { key: 'record', title: 'Record', what: 'The spire changes color and stores the result.', why: 'The decision cannot be quietly rewritten.', item: itemAssets.proof },
  ],
  bazaar: [
    { key: 'list', title: 'List', what: 'Sellers place token cards on floating stalls.', why: 'Everyone can see what is available.', item: itemAssets.price },
    { key: 'match', title: 'Match', what: 'Buyer and seller lights connect.', why: 'Prices find balance through trades.', item: itemAssets.trade },
    { key: 'settle', title: 'Settle', what: 'Tokens and payment swap paths.', why: 'The trade completes automatically.', item: itemAssets.token },
  ],
  spire: [
    { key: 'mempool', title: 'Waiting', what: 'Transactions swirl in the mempool.', why: 'Actions wait their turn before confirmation.', item: itemAssets.spark },
    { key: 'block', title: 'Block', what: 'Light beams fuse into a crystal block.', why: 'Many actions are confirmed as a batch.', item: itemAssets.block },
    { key: 'proof', title: 'Proof', what: 'The block joins the tower forever.', why: 'Everyone can verify what happened.', item: itemAssets.proof },
  ],
  homes: [
    { key: 'wallet', title: 'Wallet', what: 'Your home glows when you connect.', why: 'Your wallet is your identity anchor.', item: itemAssets.home },
    { key: 'history', title: 'History', what: 'Memory orbs float around your home.', why: 'Actions become reputation and context.', item: itemAssets.memory },
    { key: 'threads', title: 'Threads', what: 'Light paths connect to every building.', why: 'One identity ties together the Rialo world.', item: itemAssets.identity },
  ],
}
