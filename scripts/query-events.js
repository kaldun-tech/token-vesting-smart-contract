const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Query Historical Events from Token Vesting Contract
 *
 * Powerful tool for analyzing historical vesting activity with filtering,
 * sorting, and export capabilities.
 *
 * Usage:
 *   # Query all events
 *   npx hardhat run scripts/query-events.js --network baseSepolia
 *
 *   # Query specific event type
 *   EVENT_TYPE=VestingScheduleCreated npx hardhat run scripts/query-events.js --network baseSepolia
 *
 *   # Query specific beneficiary
 *   BENEFICIARY=0x123... npx hardhat run scripts/query-events.js --network baseSepolia
 *
 *   # Query date range
 *   FROM_BLOCK=12345 TO_BLOCK=12400 npx hardhat run scripts/query-events.js --network baseSepolia
 *
 *   # Export to CSV
 *   EXPORT_CSV=true npx hardhat run scripts/query-events.js --network baseSepolia
 *
 *   # Export to JSON
 *   EXPORT_JSON=true npx hardhat run scripts/query-events.js --network baseSepolia
 *
 * Environment Variables:
 *   EVENT_TYPE    - Filter by event type (VestingScheduleCreated, TokensReleased, VestingRevoked)
 *   BENEFICIARY   - Filter by beneficiary address
 *   FROM_BLOCK    - Start block number (default: deployment block)
 *   TO_BLOCK      - End block number (default: latest)
 *   LIMIT         - Max events to return (default: 100)
 *   EXPORT_CSV    - Export results to CSV file
 *   EXPORT_JSON   - Export results to JSON file
 *   OUTPUT_DIR    - Output directory for exports (default: ./events-export)
 */

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

function formatTimestamp(timestamp) {
  return new Date(timestamp * 1000).toLocaleString();
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

async function getBlockTimestamp(blockNumber) {
  try {
    const block = await hre.ethers.provider.getBlock(blockNumber);
    return block.timestamp;
  } catch (error) {
    return null;
  }
}

function printHeader() {
  log("═".repeat(70), colors.cyan);
  log("  🔍 TOKEN VESTING EVENT QUERY TOOL", colors.bright + colors.cyan);
  log("═".repeat(70), colors.cyan);
  log("");
}

function printFilters(filters) {
  log("Query Filters:", colors.bright);
  log("─".repeat(70), colors.dim);
  Object.entries(filters).forEach(([key, value]) => {
    log(`  ${key}: ${colors.bright}${value}${colors.reset}`);
  });
  log("─".repeat(70), colors.dim);
  log("");
}

function printEvent(event, index, blockTimestamp) {
  const eventName = event.eventName || event.fragment?.name;

  log(`\n${colors.bright}[${index + 1}] ${eventName}${colors.reset}`);
  log(`  ${colors.dim}Block:${colors.reset}     ${event.blockNumber}${blockTimestamp ? ` (${formatTimestamp(blockTimestamp)})` : ''}`);
  log(`  ${colors.dim}Tx Hash:${colors.reset}   ${event.transactionHash}`);

  switch (eventName) {
    case "VestingScheduleCreated":
      log(`  ${colors.cyan}Beneficiary:${colors.reset} ${event.args.beneficiary}`);
      log(`  ${colors.cyan}Amount:${colors.reset}      ${hre.ethers.formatEther(event.args.amount)} TEST`);
      log(`  ${colors.cyan}Start:${colors.reset}       ${formatTimestamp(event.args.start)}`);
      log(`  ${colors.cyan}Cliff:${colors.reset}       ${formatTimestamp(event.args.cliff)} (${formatDuration(Number(event.args.cliff) - Number(event.args.start))} from start)`);
      log(`  ${colors.cyan}Duration:${colors.reset}    ${formatDuration(event.args.duration)}`);
      break;

    case "TokensReleased":
      log(`  ${colors.yellow}Beneficiary:${colors.reset} ${event.args.beneficiary}`);
      log(`  ${colors.yellow}Amount:${colors.reset}      ${hre.ethers.formatEther(event.args.amount)} TEST`);
      break;

    case "VestingRevoked":
      log(`  ${colors.red}Beneficiary:${colors.reset} ${event.args.beneficiary}`);
      log(`  ${colors.red}Refunded:${colors.reset}    ${hre.ethers.formatEther(event.args.refunded)} TEST`);
      break;
  }

  if (hre.network.name === "baseSepolia") {
    log(`  ${colors.dim}View:${colors.reset}        https://sepolia.basescan.org/tx/${event.transactionHash}`);
  }
}

function printSummary(events) {
  const summary = {
    VestingScheduleCreated: 0,
    TokensReleased: 0,
    VestingRevoked: 0,
    totalTokensVested: BigInt(0),
    totalTokensReleased: BigInt(0),
    totalRefunded: BigInt(0),
    uniqueBeneficiaries: new Set(),
  };

  events.forEach(event => {
    const eventName = event.eventName || event.fragment?.name;
    summary[eventName]++;

    switch (eventName) {
      case "VestingScheduleCreated":
        summary.totalTokensVested += event.args.amount;
        summary.uniqueBeneficiaries.add(event.args.beneficiary);
        break;
      case "TokensReleased":
        summary.totalTokensReleased += event.args.amount;
        summary.uniqueBeneficiaries.add(event.args.beneficiary);
        break;
      case "VestingRevoked":
        summary.totalRefunded += event.args.refunded;
        summary.uniqueBeneficiaries.add(event.args.beneficiary);
        break;
    }
  });

  log("\n" + "═".repeat(70), colors.cyan);
  log("  📊 SUMMARY", colors.bright + colors.cyan);
  log("═".repeat(70), colors.cyan);
  log("");
  log(`Total Events:            ${colors.bright}${events.length}${colors.reset}`);
  log(`  Schedules Created:     ${colors.green}${summary.VestingScheduleCreated}${colors.reset}`);
  log(`  Tokens Released:       ${colors.yellow}${summary.TokensReleased}${colors.reset}`);
  log(`  Schedules Revoked:     ${colors.red}${summary.VestingRevoked}${colors.reset}`);
  log("");
  log(`Unique Beneficiaries:    ${colors.bright}${summary.uniqueBeneficiaries.size}${colors.reset}`);
  log(`Total Tokens Vested:     ${colors.green}${hre.ethers.formatEther(summary.totalTokensVested)} TEST${colors.reset}`);
  log(`Total Tokens Released:   ${colors.yellow}${hre.ethers.formatEther(summary.totalTokensReleased)} TEST${colors.reset}`);
  log(`Total Refunded:          ${colors.red}${hre.ethers.formatEther(summary.totalRefunded)} TEST${colors.reset}`);
  log("");
  log("═".repeat(70), colors.cyan);
}

async function exportToCSV(events, outputPath) {
  const rows = [
    ['Event Type', 'Block Number', 'Timestamp', 'Transaction Hash', 'Beneficiary', 'Amount (TEST)', 'Additional Data']
  ];

  for (const event of events) {
    const eventName = event.eventName || event.fragment?.name;
    const blockTimestamp = await getBlockTimestamp(event.blockNumber);

    let additionalData = '';
    let amount = '';

    switch (eventName) {
      case 'VestingScheduleCreated':
        amount = hre.ethers.formatEther(event.args.amount);
        additionalData = `Cliff: ${formatTimestamp(event.args.cliff)}, Duration: ${formatDuration(event.args.duration)}`;
        break;
      case 'TokensReleased':
        amount = hre.ethers.formatEther(event.args.amount);
        break;
      case 'VestingRevoked':
        amount = hre.ethers.formatEther(event.args.refunded);
        additionalData = 'Refunded';
        break;
    }

    rows.push([
      eventName,
      event.blockNumber.toString(),
      blockTimestamp ? formatTimestamp(blockTimestamp) : '',
      event.transactionHash,
      event.args.beneficiary || '',
      amount,
      additionalData
    ]);
  }

  const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  fs.writeFileSync(outputPath, csv);
  log(`\n✅ CSV exported to: ${colors.green}${outputPath}${colors.reset}`);
}

async function exportToJSON(events, outputPath) {
  const jsonData = await Promise.all(events.map(async event => {
    const eventName = event.eventName || event.fragment?.name;
    const blockTimestamp = await getBlockTimestamp(event.blockNumber);

    return {
      eventType: eventName,
      blockNumber: event.blockNumber,
      blockTimestamp: blockTimestamp,
      transactionHash: event.transactionHash,
      args: {
        beneficiary: event.args.beneficiary,
        amount: event.args.amount?.toString(),
        amountFormatted: event.args.amount ? hre.ethers.formatEther(event.args.amount) : undefined,
        start: event.args.start?.toString(),
        cliff: event.args.cliff?.toString(),
        duration: event.args.duration?.toString(),
        refunded: event.args.refunded?.toString(),
        refundedFormatted: event.args.refunded ? hre.ethers.formatEther(event.args.refunded) : undefined,
      }
    };
  }));

  fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
  log(`\n✅ JSON exported to: ${colors.green}${outputPath}${colors.reset}`);
}

async function main() {
  printHeader();

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
  const vesting = await hre.ethers.getContractAt("TokenVesting", vestingAddress);

  // Parse query parameters
  const eventType = process.env.EVENT_TYPE;
  const beneficiary = process.env.BENEFICIARY;
  const fromBlock = parseInt(process.env.FROM_BLOCK) || deployment.blockNumber || 0;
  const toBlock = parseInt(process.env.TO_BLOCK) || 'latest';
  const limit = parseInt(process.env.LIMIT) || 100;
  const exportCsv = process.env.EXPORT_CSV === 'true';
  const exportJson = process.env.EXPORT_JSON === 'true';
  const outputDir = process.env.OUTPUT_DIR || './events-export';

  log(`Network: ${colors.bright}${hre.network.name}${colors.reset}`);
  log(`Contract: ${colors.bright}${vestingAddress}${colors.reset}`);
  log("");

  // Print filters
  const filters = {
    'Event Type': eventType || 'All',
    'Beneficiary': beneficiary ? formatAddress(beneficiary) : 'All',
    'From Block': fromBlock,
    'To Block': toBlock,
    'Limit': limit,
  };
  printFilters(filters);

  log("Querying events...", colors.yellow);

  // Determine which events to query
  let eventFilters = [];

  if (!eventType || eventType === 'VestingScheduleCreated') {
    const filter = beneficiary
      ? vesting.filters.VestingScheduleCreated(beneficiary)
      : vesting.filters.VestingScheduleCreated();
    eventFilters.push({ name: 'VestingScheduleCreated', filter });
  }

  if (!eventType || eventType === 'TokensReleased') {
    const filter = beneficiary
      ? vesting.filters.TokensReleased(beneficiary)
      : vesting.filters.TokensReleased();
    eventFilters.push({ name: 'TokensReleased', filter });
  }

  if (!eventType || eventType === 'VestingRevoked') {
    const filter = beneficiary
      ? vesting.filters.VestingRevoked(beneficiary)
      : vesting.filters.VestingRevoked();
    eventFilters.push({ name: 'VestingRevoked', filter });
  }

  // Query all events
  const allEvents = [];

  for (const { name, filter } of eventFilters) {
    try {
      const events = await vesting.queryFilter(filter, fromBlock, toBlock);
      allEvents.push(...events);
    } catch (error) {
      log(`⚠️  Warning: Could not query ${name}: ${error.message}`, colors.yellow);
    }
  }

  // Sort by block number
  allEvents.sort((a, b) => a.blockNumber - b.blockNumber);

  // Apply limit
  const limitedEvents = allEvents.slice(0, limit);

  if (limitedEvents.length === 0) {
    log("\n❌ No events found matching criteria", colors.red);
    return;
  }

  log(`\n✅ Found ${colors.bright}${allEvents.length}${colors.reset} events${allEvents.length > limit ? ` (showing first ${limit})` : ''}`, colors.green);

  // Print events
  log("\n" + "═".repeat(70), colors.cyan);
  log("  📋 EVENTS", colors.bright + colors.cyan);
  log("═".repeat(70), colors.cyan);

  for (let i = 0; i < limitedEvents.length; i++) {
    const blockTimestamp = await getBlockTimestamp(limitedEvents[i].blockNumber);
    printEvent(limitedEvents[i], i, blockTimestamp);
  }

  // Print summary
  printSummary(limitedEvents);

  // Export if requested
  if (exportCsv || exportJson) {
    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const baseFilename = `vesting-events-${hre.network.name}-${timestamp}`;

    if (exportCsv) {
      const csvPath = path.join(outputDir, `${baseFilename}.csv`);
      await exportToCSV(limitedEvents, csvPath);
    }

    if (exportJson) {
      const jsonPath = path.join(outputDir, `${baseFilename}.json`);
      await exportToJSON(limitedEvents, jsonPath);
    }
  }

  log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    log("\n❌ Fatal Error:", colors.red);
    console.error(error);
    process.exit(1);
  });
