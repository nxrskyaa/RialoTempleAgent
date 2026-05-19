export type RialoCityModuleId = 'stream' | 'workflow' | 'privacy' | 'edge' | 'omni' | 'cruise'

export type RialoCityModule = {
  id: RialoCityModuleId
  slug: RialoCityModuleId
  name: string
  buildingName: string
  tagline: string
  shortExplanation: string
  beforeTitle: string
  beforeSteps: string[]
  withRialoTitle: string
  withRialoSteps: string[]
  simulationSteps: string[]
  badge: string
  xp: number
  icon: string
  accent: string
}

export const RIALO_CITY_MODULES: RialoCityModule[] = [
  {
    id: 'stream',
    slug: 'stream',
    name: 'Rialo Stream',
    buildingName: 'Stream Tower',
    tagline: 'Real-world data',
    shortExplanation:
      'Most blockchains cannot see the real world by themselves. Rialo Stream helps apps receive real-world data like price, weather, payment status, and activity signals.',
    beforeTitle: 'Before Rialo',
    beforeSteps: ['API', 'Oracle', 'Keeper bot', 'Contract'],
    withRialoTitle: 'With Rialo',
    withRialoSteps: ['Real-world data', 'Rialo Stream', 'App reacts'],
    simulationSteps: ['Signal detected', 'Stream Tower receives data', 'App reacts', 'Result updated'],
    badge: 'Stream Explorer',
    xp: 100,
    icon: 'RadioTower',
    accent: '#78ecff',
  },
  {
    id: 'workflow',
    slug: 'workflow',
    name: 'Rialo Workflow',
    buildingName: 'Workflow Factory',
    tagline: 'Automation',
    shortExplanation:
      'Many real-world actions need multiple steps. Rialo Workflow helps apps run automated processes like submit, verify, approve, and notify.',
    beforeTitle: 'Before Rialo',
    beforeSteps: ['Manual scripts', 'Backend jobs', 'Bots', 'Cron jobs', 'Fragile handoffs'],
    withRialoTitle: 'With Rialo',
    withRialoSteps: ['One connected workflow', 'Step-by-step rules', 'Automatic updates'],
    simulationSteps: ['Task submitted', 'Data checked', 'Rule matched', 'Score updated', 'Reward unlocked', 'Notification sent'],
    badge: 'Workflow Runner',
    xp: 100,
    icon: 'Factory',
    accent: '#b9ff66',
  },
  {
    id: 'privacy',
    slug: 'privacy',
    name: 'Rialo Privacy',
    buildingName: 'Privacy Vault',
    tagline: 'Private proof',
    shortExplanation:
      'Some apps need private information, but users should not expose everything publicly. Rialo aims to make privacy a first-class capability.',
    beforeTitle: 'Before Rialo',
    beforeSteps: ['Sensitive data', 'Public exposure', 'Trusted server', 'User risk'],
    withRialoTitle: 'With Rialo',
    withRialoSteps: ['Private details stay hidden', 'App learns the result', 'User keeps control'],
    simulationSteps: ['Private data entered', 'Details hidden', 'Proof generated', 'Eligibility shown'],
    badge: 'Privacy Keeper',
    xp: 100,
    icon: 'ShieldCheck',
    accent: '#ff7ad9',
  },
  {
    id: 'edge',
    slug: 'edge',
    name: 'Rialo Edge',
    buildingName: 'Edge Station',
    tagline: 'Web2 connectivity',
    shortExplanation:
      'Real apps need to talk to Web2 systems like email, GitHub, payment apps, weather APIs, and other internet services. Rialo Edge is about native Web2 interactivity.',
    beforeTitle: 'Before Rialo',
    beforeSteps: ['Web2 API', 'Backend server', 'Middleware', 'Contract'],
    withRialoTitle: 'With Rialo',
    withRialoSteps: ['Web2 service', 'Rialo Edge', 'App updates'],
    simulationSteps: ['Web2 signal detected', 'Edge Station connects', 'App state updates'],
    badge: 'Edge Connector',
    xp: 100,
    icon: 'Cable',
    accent: '#ffe45e',
  },
  {
    id: 'omni',
    slug: 'omni',
    name: 'Omni Account',
    buildingName: 'Omni Passport Office',
    tagline: 'One account experience',
    shortExplanation:
      'Web3 users often switch networks, bridge assets, and manage fragmented accounts. Rialo Omni Account imagines one account experience across multiple networks.',
    beforeTitle: 'Before Rialo',
    beforeSteps: ['Many wallets', 'Network switching', 'Bridges', 'Fragmented profiles'],
    withRialoTitle: 'With Rialo',
    withRialoSteps: ['One account experience', 'Portable identity', 'Simpler app access'],
    simulationSteps: ['Name entered', 'Role selected', 'Use case saved', 'Passport created'],
    badge: 'Omni Citizen',
    xp: 100,
    icon: 'IdCard',
    accent: '#c886ff',
  },
  {
    id: 'cruise',
    slug: 'cruise',
    name: 'Rialo Cruise',
    buildingName: 'Cruise Lane',
    tagline: 'Simple UX',
    shortExplanation:
      'Web3 often feels hard because users need to connect wallets, switch networks, approve, sign, pay gas, and wait. Rialo Cruise is about making blockchain actions feel simple.',
    beforeTitle: 'Normal Web3 Road',
    beforeSteps: ['Connect wallet', 'Switch network', 'Approve', 'Sign', 'Pay gas', 'Wait'],
    withRialoTitle: 'Rialo Cruise Lane',
    withRialoSteps: ['Click', 'Done'],
    simulationSteps: ['Normal road starts', 'Many steps continue', 'Cruise lane finishes', 'Action feels simple'],
    badge: 'Cruise Rider',
    xp: 100,
    icon: 'Route',
    accent: '#ffad72',
  },
]

export const RIALO_CITY_TOTAL_MODULES = RIALO_CITY_MODULES.length

export function getRialoCityModule(slug: string | undefined) {
  return RIALO_CITY_MODULES.find((module) => module.slug === slug)
}
