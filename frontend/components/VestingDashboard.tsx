/**
 * Vesting Dashboard Component
 *
 * Main component that displays:
 * - Vesting schedule information
 * - Progress visualization
 * - Release button
 *
 * Backend developer notes:
 * - useContractRead: Automatically fetches and caches contract state
 * - useContractWrite: Handles transaction signing and confirmation
 * - Data auto-updates when blockchain state changes
 */

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatEther, parseEther } from 'viem'
import { CONTRACTS, VESTING_ABI, TOKEN_ABI } from '@/lib/contracts'
import { useEffect, useState } from 'react'

export default function VestingDashboard() {
  const { address } = useAccount()
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000))

  // Update current time every second for live progress
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Read vesting schedule from contract
  const { data: schedule, isLoading: scheduleLoading } = useReadContract({
    address: CONTRACTS.VESTING_ADDRESS,
    abi: VESTING_ABI,
    functionName: 'vestingSchedules',
    args: address ? [address] : undefined,
  })

  // Read vested amount from contract
  const { data: vestedAmount, refetch: refetchVested } = useReadContract({
    address: CONTRACTS.VESTING_ADDRESS,
    abi: VESTING_ABI,
    functionName: 'vestedAmount',
    args: address ? [address] : undefined,
  })

  // Read token balance
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.TOKEN_ADDRESS,
    abi: TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Write function to release tokens
  const { writeContract, data: hash, isPending } = useWriteContract()

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Refetch data after successful release
  useEffect(() => {
    if (isSuccess) {
      refetchVested()
      refetchBalance()
    }
  }, [isSuccess, refetchVested, refetchBalance])

  // Loading state
  if (scheduleLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <p className="text-center text-gray-600 dark:text-gray-400">
          Loading vesting schedule...
        </p>
      </div>
    )
  }

  // No schedule found
  if (!schedule || schedule[4] === BigInt(0)) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <h2 className="text-xl font-semibold mb-4">No Vesting Schedule</h2>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have an active vesting schedule on this network.
        </p>
      </div>
    )
  }

  // Parse schedule data
  const [beneficiary, start, cliff, duration, amount, released, revocable, revoked] = schedule
  const startTime = Number(start)
  const cliffTime = Number(cliff)
  const endTime = startTime + Number(duration)
  const vested = vestedAmount || BigInt(0)
  const unreleased = vested - released

  // Calculate progress percentage
  const progressPercent = Number(amount) > 0
    ? Math.min(100, (Number(vested) / Number(amount)) * 100)
    : 0

  // Determine status
  let status = 'Active'
  let statusColor = 'text-blue-600 dark:text-blue-400'

  if (revoked) {
    status = 'Revoked'
    statusColor = 'text-red-600 dark:text-red-400'
  } else if (currentTime < cliffTime) {
    status = 'Cliff Period'
    statusColor = 'text-yellow-600 dark:text-yellow-400'
  } else if (currentTime >= endTime) {
    status = 'Fully Vested'
    statusColor = 'text-green-600 dark:text-green-400'
  } else {
    status = 'Vesting'
    statusColor = 'text-blue-600 dark:text-blue-400'
  }

  // Handle release button click
  const handleRelease = () => {
    writeContract({
      address: CONTRACTS.VESTING_ADDRESS,
      abi: VESTING_ABI,
      functionName: 'release',
    })
  }

  // Format time remaining
  const formatTimeRemaining = (targetTime: number) => {
    const remaining = targetTime - currentTime
    if (remaining <= 0) return 'Complete'

    const days = Math.floor(remaining / 86400)
    const hours = Math.floor((remaining % 86400) / 3600)
    const minutes = Math.floor((remaining % 3600) / 60)

    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Vesting Schedule</h2>
          <span className={`text-sm font-medium ${statusColor}`}>
            {status}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="font-medium">{progressPercent.toFixed(2)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Amount</p>
            <p className="text-xl font-semibold">{formatEther(amount)} TEST</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Vested</p>
            <p className="text-xl font-semibold">{formatEther(vested)} TEST</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Released</p>
            <p className="text-xl font-semibold">{formatEther(released)} TEST</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Available</p>
            <p className="text-xl font-semibold text-green-600 dark:text-green-400">
              {formatEther(unreleased)} TEST
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="border-t dark:border-gray-700 pt-6">
          <h3 className="text-sm font-medium mb-4">Timeline</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Start Date</span>
              <span className="font-medium">{new Date(startTime * 1000).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Cliff Date</span>
              <span className="font-medium">{new Date(cliffTime * 1000).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">End Date</span>
              <span className="font-medium">{new Date(endTime * 1000).toLocaleDateString()}</span>
            </div>
            {currentTime < endTime && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  {currentTime < cliffTime ? 'Time until cliff' : 'Time until fully vested'}
                </span>
                <span className="font-medium">
                  {formatTimeRemaining(currentTime < cliffTime ? cliffTime : endTime)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Release Button */}
        <div className="border-t dark:border-gray-700 pt-6 mt-6">
          <button
            onClick={handleRelease}
            disabled={unreleased === BigInt(0) || isPending || isConfirming || revoked}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              unreleased > BigInt(0) && !isPending && !isConfirming && !revoked
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isPending || isConfirming
              ? 'Processing...'
              : revoked
              ? 'Schedule Revoked'
              : unreleased === BigInt(0)
              ? currentTime < cliffTime
                ? 'No Tokens Vested Yet'
                : 'No Tokens Available'
              : `Release ${formatEther(unreleased)} TEST`}
          </button>

          {isSuccess && (
            <p className="mt-3 text-sm text-green-600 dark:text-green-400 text-center">
              ✓ Tokens released successfully!
            </p>
          )}
        </div>
      </div>

      {/* Token Balance Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Your Token Balance</h3>
        <p className="text-3xl font-bold">
          {tokenBalance ? formatEther(tokenBalance) : '0'} TEST
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Total tokens in your wallet
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          How it works
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• Tokens vest linearly over the vesting period</li>
          <li>• No tokens are available during the cliff period</li>
          <li>• Click "Release" to claim your vested tokens anytime</li>
          <li>• Released tokens are transferred to your wallet</li>
        </ul>
      </div>
    </div>
  )
}
