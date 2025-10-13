const hre = require("hardhat");

/**
 * Real-time Event Monitor for Token Vesting Contract
 *
 * Monitors and displays vesting contract events in real-time as they occur.
 * Useful for development, debugging, and operational monitoring.
 *
 * Usage:
 *   npx hardhat run scripts/monitor-events.js --network baseSepolia
 *
 * Environment Variables:
 *   MONITOR_POLL_INTERVAL - Polling interval in ms (default: 2000)
 *   MONITOR_VERBOSE       - Show verbose output (default: false)
 *
 * Features:
 *   - Real-time event streaming
 *   - Color-coded output
 *   - Transaction links
 *   - Event statistics
 *   - Graceful shutdown (Ctrl+C)
 */

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
};

// Event statistics
const stats = {
  schedulesCreated: 0,
  tokensReleased: 0,
  schedulesRevoked: 0,
  totalTokensReleased: BigInt(0),
  startTime: Date.now(),
};

let lastProcessedBlock = 0;
let isRunning = true;

function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

function formatDuration(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 60)}m`;
}

function formatAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function printHeader() {
  console.clear();
  log("═".repeat(60), colors.cyan);
  log("  📊 TOKEN VESTING EVENT MONITOR", colors.bright + colors.cyan);
  log("═".repeat(60), colors.cyan);
  log("");
  log(`Network: ${colors.bright}${hre.network.name}${colors.reset}`);
  log(`Started: ${colors.dim}${new Date().toLocaleString()}${colors.reset}`);
  log(`Press ${colors.bright}Ctrl+C${colors.reset} to stop`);
  log("");
  log("─".repeat(60), colors.dim);
  log("");
}

function printStats() {
  const uptime = Math.floor((Date.now() - stats.startTime) / 1000);

  log("\n" + "─".repeat(60), colors.dim);
  log("📈 Statistics", colors.bright);
  log("─".repeat(60), colors.dim);
  log(`  Schedules Created:    ${colors.green}${stats.schedulesCreated}${colors.reset}`);
  log(`  Tokens Released:      ${colors.yellow}${hre.ethers.formatEther(stats.totalTokensReleased)} TEST${colors.reset}`);
  log(`  Schedules Revoked:    ${colors.red}${stats.schedulesRevoked}${colors.reset}`);
  log(`  Uptime:               ${colors.dim}${formatDuration(uptime)}${colors.reset}`);
  log("─".repeat(60), colors.dim);
}

function printEvent(eventName, args, txHash, blockNumber) {
  const timestamp = new Date().toLocaleTimeString();

  log(`\n[${colors.dim}${timestamp}${colors.reset}] ${colors.bright}${eventName}${colors.reset}`);

  switch (eventName) {
    case "VestingScheduleCreated":
      log(`  ${colors.cyan}Beneficiary:${colors.reset} ${formatAddress(args.beneficiary)}`);
      log(`  ${colors.cyan}Amount:${colors.reset}      ${hre.ethers.formatEther(args.amount)} TEST`);
      log(`  ${colors.cyan}Start:${colors.reset}       ${formatTimestamp(args.start)}`);
      log(`  ${colors.cyan}Cliff:${colors.reset}       ${formatTimestamp(args.cliff)} (${formatDuration(Number(args.cliff) - Number(args.start))} from start)`);
      log(`  ${colors.cyan}Duration:${colors.reset}    ${formatDuration(args.duration)}`);
      stats.schedulesCreated++;
      break;

    case "TokensReleased":
      log(`  ${colors.yellow}Beneficiary:${colors.reset} ${formatAddress(args.beneficiary)}`);
      log(`  ${colors.yellow}Amount:${colors.reset}      ${hre.ethers.formatEther(args.amount)} TEST`);
      stats.tokensReleased++;
      stats.totalTokensReleased += args.amount;
      break;

    case "VestingRevoked":
      log(`  ${colors.red}Beneficiary:${colors.reset} ${formatAddress(args.beneficiary)}`);
      log(`  ${colors.red}Refunded:${colors.reset}    ${hre.ethers.formatEther(args.refunded)} TEST`);
      stats.schedulesRevoked++;
      break;
  }

  log(`  ${colors.dim}Block:${colors.reset}       ${blockNumber}`);
  log(`  ${colors.dim}Tx:${colors.reset}          ${txHash.slice(0, 10)}...${txHash.slice(-8)}`);

  if (hre.network.name === "baseSepolia") {
    log(`  ${colors.dim}View:${colors.reset}        https://sepolia.basescan.org/tx/${txHash}`);
  }
}

async function monitorEvents(vesting, startBlock) {
  const verbose = process.env.MONITOR_VERBOSE === 'true';

  try {
    const currentBlock = await hre.ethers.provider.getBlockNumber();

    if (verbose) {
      log(`Checking blocks ${lastProcessedBlock} to ${currentBlock}...`, colors.dim);
    }

    if (currentBlock <= lastProcessedBlock) {
      return; // No new blocks
    }

    // Query all three event types
    const filters = [
      vesting.filters.VestingScheduleCreated(),
      vesting.filters.TokensReleased(),
      vesting.filters.VestingRevoked(),
    ];

    for (const filter of filters) {
      const events = await vesting.queryFilter(
        filter,
        lastProcessedBlock + 1,
        currentBlock
      );

      for (const event of events) {
        const eventName = event.eventName || event.fragment?.name;
        if (eventName) {
          printEvent(eventName, event.args, event.transactionHash, event.blockNumber);
        }
      }
    }

    lastProcessedBlock = currentBlock;

  } catch (error) {
    if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
      log(`\n⚠️  Network error - retrying...`, colors.yellow);
    } else {
      log(`\n❌ Error: ${error.message}`, colors.red);
    }
  }
}

async function main() {
  // Load deployment info
  let deployment;
  try {
    deployment = require(`../deployments/${hre.network.name}.json`);
  } catch (error) {
    log("❌ Error: Deployment file not found", colors.red);
    log("\nPlease deploy contracts first:", colors.yellow);
    log(`  npx hardhat run scripts/deploy.js --network ${hre.network.name}`);
    return;
  }

  const vestingAddress = deployment.contracts.TokenVesting;

  // Connect to contract
  const vesting = await hre.ethers.getContractAt("TokenVesting", vestingAddress);

  // Get starting block
  const currentBlock = await hre.ethers.provider.getBlockNumber();
  lastProcessedBlock = currentBlock - 1;

  // Print header
  printHeader();
  log(`Contract: ${colors.bright}${vestingAddress}${colors.reset}`);
  log(`Starting from block: ${colors.dim}${currentBlock}${colors.reset}`);
  log("");
  log("Listening for events...", colors.green);

  // Setup graceful shutdown
  process.on('SIGINT', () => {
    isRunning = false;
    log("\n\n" + "═".repeat(60), colors.cyan);
    log("  🛑 Stopping monitor...", colors.bright + colors.cyan);
    printStats();
    log("\n" + "═".repeat(60), colors.cyan);
    process.exit(0);
  });

  // Polling interval (default 2 seconds)
  const pollInterval = parseInt(process.env.MONITOR_POLL_INTERVAL) || 2000;

  // Monitor loop
  while (isRunning) {
    await monitorEvents(vesting, lastProcessedBlock);
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
}

main()
  .catch((error) => {
    log("\n❌ Fatal Error:", colors.red);
    console.error(error);
    process.exit(1);
  });
