/**
 * App Providers Component
 *
 * This component wraps the app with Wagmi and RainbowKit providers.
 * It's imported dynamically with ssr: false to prevent WalletConnect
 * initialization during Next.js build time.
 */

import { ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { config } from '@/lib/wagmi'

interface AppProvidersProps {
  children: ReactNode
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider>
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  )
}
