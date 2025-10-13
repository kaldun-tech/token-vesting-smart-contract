/**
 * Home Page - Token Vesting Dashboard
 *
 * Simple, clean interface for beneficiaries to:
 * - View their vesting schedule
 * - See vesting progress
 * - Release vested tokens
 */

import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import VestingDashboard from '@/components/VestingDashboard'

export default function Home() {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Token Vesting</h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage your vesting schedule
            </p>
          </div>
          <ConnectButton />
        </header>

        {/* Main Content */}
        <main>
          {isConnected ? (
            <VestingDashboard />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
              <h2 className="text-2xl font-semibold mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Connect your wallet to view your vesting schedule and claim tokens
              </p>
              <ConnectButton />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>
            Token Vesting Contract •{' '}
            <a
              href="https://sepolia.basescan.org/address/0x5D6709C5b1ED83125134672AFa905cA045978a1D"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-700 dark:hover:text-gray-300"
            >
              View on Basescan
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}
