/**
 * Main App Component
 *
 * This wraps the entire application with:
 * - Wagmi provider (for blockchain state)
 * - RainbowKit provider (for wallet UI)
 * - Global styles
 *
 * IMPORTANT: The WagmiProvider is wrapped in a dynamic component with ssr: false
 * to prevent WalletConnect initialization during Next.js build time.
 * This avoids the ESM/CommonJS mismatch error with @walletconnect/ethereum-provider.
 */

import '@/styles/globals.css'
import '@rainbow-me/rainbowkit/styles.css'
import type { AppProps } from 'next/app'
import dynamic from 'next/dynamic'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

// Import WagmiProvider wrapper dynamically with ssr: false
// This prevents WalletConnect from initializing during build
const AppProviders = dynamic(() => import('@/components/AppProviders'), {
  ssr: false,
  loading: () => <div>Loading...</div>,
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        <Component {...pageProps} />
      </AppProviders>
    </QueryClientProvider>
  )
}
