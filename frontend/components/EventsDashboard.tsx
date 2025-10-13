/**
 * Events Dashboard Component
 *
 * Displays recent vesting contract events with filtering by type.
 * Shows the last 50 events with transaction details.
 *
 * Simple, clean interface that integrates with existing design.
 */

import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { formatEther } from 'viem'
import { CONTRACTS, VESTING_ABI } from '@/lib/contracts'

type EventType = 'VestingScheduleCreated' | 'TokensReleased' | 'VestingRevoked' | 'All'

interface VestingEvent {
  eventName: string
  blockNumber: bigint
  transactionHash: string
  args: any
  timestamp?: number
}

export default function EventsDashboard() {
  const publicClient = usePublicClient()
  const [events, setEvents] = useState<VestingEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<EventType>('All')
  const [stats, setStats] = useState({
    schedulesCreated: 0,
    tokensReleased: 0,
    schedulesRevoked: 0,
  })

  // Load events on mount
  useEffect(() => {
    loadEvents()
  }, [])

  // Update stats when events change
  useEffect(() => {
    const newStats = {
      schedulesCreated: 0,
      tokensReleased: 0,
      schedulesRevoked: 0,
    }

    events.forEach(event => {
      if (event.eventName === 'VestingScheduleCreated') newStats.schedulesCreated++
      if (event.eventName === 'TokensReleased') newStats.tokensReleased++
      if (event.eventName === 'VestingRevoked') newStats.schedulesRevoked++
    })

    setStats(newStats)
  }, [events])

  async function loadEvents() {
    if (!publicClient) return

    setIsLoading(true)
    try {
      // Get current block
      const currentBlock = await publicClient.getBlockNumber()
      const fromBlock = currentBlock - BigInt(10000) // Last ~10k blocks (~5 hours on Base)

      // Query all three event types
      const [createdEvents, releasedEvents, revokedEvents] = await Promise.all([
        publicClient.getLogs({
          address: CONTRACTS.VESTING_ADDRESS,
          event: VESTING_ABI.find(item => item.name === 'VestingScheduleCreated'),
          fromBlock,
          toBlock: currentBlock,
        }),
        publicClient.getLogs({
          address: CONTRACTS.VESTING_ADDRESS,
          event: VESTING_ABI.find(item => item.name === 'TokensReleased'),
          fromBlock,
          toBlock: currentBlock,
        }),
        publicClient.getLogs({
          address: CONTRACTS.VESTING_ADDRESS,
          event: VESTING_ABI.find(item => item.name === 'VestingRevoked'),
          fromBlock,
          toBlock: currentBlock,
        }),
      ])

      // Combine and format events
      const allEvents: VestingEvent[] = [
        ...createdEvents.map(e => ({ ...e, eventName: 'VestingScheduleCreated' })),
        ...releasedEvents.map(e => ({ ...e, eventName: 'TokensReleased' })),
        ...revokedEvents.map(e => ({ ...e, eventName: 'VestingRevoked' })),
      ]

      // Sort by block number (newest first)
      allEvents.sort((a, b) => Number(b.blockNumber - a.blockNumber))

      // Limit to 50 most recent
      const recentEvents = allEvents.slice(0, 50)

      // Get timestamps for recent events
      const eventsWithTimestamps = await Promise.all(
        recentEvents.map(async (event) => {
          try {
            const block = await publicClient.getBlock({ blockNumber: event.blockNumber })
            return { ...event, timestamp: Number(block.timestamp) }
          } catch {
            return event
          }
        })
      )

      setEvents(eventsWithTimestamps)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter events based on selected type
  const filteredEvents = filter === 'All'
    ? events
    : events.filter(e => e.eventName === filter)

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Format timestamp
  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return 'Unknown'
    const date = new Date(timestamp * 1000)
    const now = Date.now()
    const diff = now - date.getTime()

    // Show relative time if less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      const minutes = Math.floor((diff % 3600000) / 60000)
      if (hours > 0) return `${hours}h ${minutes}m ago`
      if (minutes > 0) return `${minutes}m ago`
      return 'Just now'
    }

    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  // Get event icon and color
  const getEventStyle = (eventName: string) => {
    switch (eventName) {
      case 'VestingScheduleCreated':
        return { icon: '🆕', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' }
      case 'TokensReleased':
        return { icon: '💰', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' }
      case 'VestingRevoked':
        return { icon: '❌', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' }
      default:
        return { icon: '📋', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/20' }
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">Loading events...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Schedules Created</p>
          <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
            {stats.schedulesCreated}
          </p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tokens Released</p>
          <p className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">
            {stats.tokensReleased}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Schedules Revoked</p>
          <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
            {stats.schedulesRevoked}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('All')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === 'All'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('VestingScheduleCreated')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === 'VestingScheduleCreated'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Created
            </button>
            <button
              onClick={() => setFilter('TokensReleased')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === 'TokensReleased'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Released
            </button>
            <button
              onClick={() => setFilter('VestingRevoked')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === 'VestingRevoked'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Revoked
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">
            No events found. Try selecting a different filter or check back later.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredEvents.map((event, index) => {
              const style = getEventStyle(event.eventName)
              return (
                <div key={`${event.transactionHash}-${index}`} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${style.bg}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{style.icon}</span>
                        <h3 className={`font-semibold ${style.color}`}>
                          {event.eventName.replace(/([A-Z])/g, ' $1').trim()}
                        </h3>
                      </div>

                      <div className="space-y-1 text-sm">
                        {event.args.beneficiary && (
                          <p>
                            <span className="text-gray-600 dark:text-gray-400">Beneficiary:</span>{' '}
                            <span className="font-mono">{formatAddress(event.args.beneficiary)}</span>
                          </p>
                        )}

                        {event.args.amount && (
                          <p>
                            <span className="text-gray-600 dark:text-gray-400">Amount:</span>{' '}
                            <span className="font-semibold">{formatEther(event.args.amount)} TEST</span>
                          </p>
                        )}

                        {event.args.refunded && (
                          <p>
                            <span className="text-gray-600 dark:text-gray-400">Refunded:</span>{' '}
                            <span className="font-semibold">{formatEther(event.args.refunded)} TEST</span>
                          </p>
                        )}

                        <p className="text-gray-500 dark:text-gray-500 text-xs">
                          Block #{event.blockNumber.toString()} • {formatTimestamp(event.timestamp)}
                        </p>
                      </div>
                    </div>

                    <a
                      href={`https://sepolia.basescan.org/tx/${event.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
                    >
                      View Tx
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={loadEvents}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          {isLoading ? 'Loading...' : 'Refresh Events'}
        </button>
      </div>
    </div>
  )
}
