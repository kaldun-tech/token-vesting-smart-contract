/**
 * Wagmi configuration for wallet connection and blockchain interaction
 *
 * This file sets up:
 * - Base Sepolia network configuration
 * - WalletConnect integration (multiple wallet support)
 * - RainbowKit UI components
 *
 * Note: Using custom config to exclude problematic connectors (porto)
 * that have compatibility issues with Node 18 and viem versions
 */

import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  rainbowWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { createConfig, http } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'

// Check for required environment variables
if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set')
}

// Configure connectors (excluding porto and other problematic wallets)
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [
        metaMaskWallet,
        coinbaseWallet,
        walletConnectWallet,
        rainbowWallet,
        injectedWallet,
      ],
    },
  ],
  {
    appName: 'Token Vesting',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  }
)

export const config = createConfig({
  connectors,
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
  ssr: true, // Enable server-side rendering
})
