import { http } from 'wagmi'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { ARC_CHAIN } from './contracts'

export const config = getDefaultConfig({
  appName: 'Rialo Temple',
  projectId: 'rialo_temple_v2',
  chains: [ARC_CHAIN],
  transports: {
    [ARC_CHAIN.id]: http(ARC_CHAIN.rpcUrls.default.http[0]),
  },
  ssr: false,
})
