import { http } from 'wagmi'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { ARC_CHAIN } from './contracts'

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '00000000000000000000000000000000'

export const config = getDefaultConfig({
  appName: 'Rialo Temple',
  projectId: walletConnectProjectId,
  chains: [ARC_CHAIN],
  transports: {
    [ARC_CHAIN.id]: http(ARC_CHAIN.rpcUrls.default.http[0]),
  },
  ssr: false,
})
