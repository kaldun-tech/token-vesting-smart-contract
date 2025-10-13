/**
 * Events Page - Contract Activity Dashboard
 *
 * Displays recent vesting contract events with filtering.
 * Public page - no wallet connection required.
 */

import Link from 'next/link'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import EventsDashboard from '@/components/EventsDashboard'

export default function EventsPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Navigation */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <nav className="flex gap-4 mb-4">
              <Link
                href="/"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                ← My Vesting
              </Link>
              <span className="text-gray-400 dark:text-gray-600">|</span>
              <span className="text-gray-900 dark:text-white font-semibold">
                Activity Dashboard
              </span>
            </nav>
            <h1 className="text-3xl font-bold">Vesting Activity</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Recent vesting schedules, token releases, and revocations
            </p>
          </div>
          <ConnectButton />
        </header>

        {/* Main Content */}
        <main>
          <EventsDashboard />
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
