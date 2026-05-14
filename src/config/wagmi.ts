import { http } from 'wagmi'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { ARC_TESTNET } from './contract'

export const config = getDefaultConfig({
  appName: 'VibeCheck',
  projectId: 'vibecheck_arc_rialo_2025',
  chains: [ARC_TESTNET as any],
  transports: {
    [ARC_TESTNET.id]: http('https://rpc.testnet.arc.network'),
  },
  ssr: false,
})
