/**
 * Wagmi configuration for wallet connection and blockchain interaction
 *
 * This file sets up:
 * - Base Sepolia network configuration
 * - WalletConnect integration (multiple wallet support)
 * - RainbowKit UI components
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { baseSepolia } from 'wagmi/chains'

// Check for required environment variables
if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set')
}

export const config = getDefaultConfig({
  appName: 'Token Vesting',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  chains: [baseSepolia],
  ssr: true, // Enable server-side rendering
})
