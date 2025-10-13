/**
 * Hardhat Tasks for Token Vesting Operations
 *
 * Custom tasks for common vesting operations:
 * - create-schedule: Create a new vesting schedule
 * - check-vesting: Check vesting status for a beneficiary
 * - release: Release vested tokens
 * - revoke: Revoke a vesting schedule
 * - list-schedules: List all vesting schedules
 * - mint: Mint test tokens
 *
 * Usage:
 *   npx hardhat <task-name> --network baseSepolia [options]
 */

const { task } = require("hardhat/config");

// Helper function to load deployment
function getDeployment(network) {
  try {
    return require(`../deployments/${network}.json`);
  } catch (error) {
    throw new Error(`Deployment file not found for network: ${network}. Run deploy script first.`);
  }
}

// Helper function to format duration
function formatDuration(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 60)}m`;
}

// Helper function to format timestamp
function formatTimestamp(timestamp) {
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Task: create-schedule
 * Create a new vesting schedule for a beneficiary
 */
task("create-schedule", "Create a new vesting schedule")
  .addParam("beneficiary", "The beneficiary address")
  .addParam("amount", "Amount of tokens (in whole tokens, e.g., 1000)")
  .addParam("cliff", "Cliff duration in days", "30")
  .addParam("duration", "Total vesting duration in days", "365")
  .addFlag("revocable", "Make the schedule revocable")
  .setAction(async (taskArgs, hre) => {
    const deployment = getDeployment(hre.network.name);

    const [signer] = await hre.ethers.getSigners();
    const token = await hre.ethers.getContractAt("MockERC20", deployment.contracts.MockERC20);
    const vesting = await hre.ethers.getContractAt("TokenVesting", deployment.contracts.TokenVesting);

    // Parse parameters
    const beneficiary = taskArgs.beneficiary;
    const amount = hre.ethers.parseEther(taskArgs.amount);
    const cliffDuration = parseInt(taskArgs.cliff) * 86400; // Convert days to seconds
    const totalDuration = parseInt(taskArgs.duration) * 86400;
    const revocable = taskArgs.revocable;

    console.log("\n" + "=".repeat(60));
    console.log("CREATE VESTING SCHEDULE");
    console.log("=".repeat(60));
    console.log("\nParameters:");
    console.log("  Beneficiary:", beneficiary);
    console.log("  Amount:", hre.ethers.formatEther(amount), "tokens");
    console.log("  Cliff:", taskArgs.cliff, "days");
    console.log("  Duration:", taskArgs.duration, "days");
    console.log("  Revocable:", revocable);
    console.log("  Your address:", signer.address);

    // Check balance
    const balance = await token.balanceOf(signer.address);
    console.log("\nYour token balance:", hre.ethers.formatEther(balance), "tokens");

    if (balance < amount) {
      console.log("\n❌ Insufficient balance! Need to mint tokens first:");
      console.log(`  npx hardhat mint --amount ${taskArgs.amount} --network ${hre.network.name}`);
      return;
    }

    // Check existing schedule
    const existingSchedule = await vesting.vestingSchedules(beneficiary);
    if (existingSchedule.amount > 0) {
      console.log("\n⚠️  Warning: Beneficiary already has a vesting schedule!");
      console.log("  Amount:", hre.ethers.formatEther(existingSchedule.amount), "tokens");
      console.log("\nCannot create a new schedule for this beneficiary.");
      return;
    }

    // Approve tokens
    console.log("\n1. Approving tokens...");
    const approveTx = await token.approve(deployment.contracts.TokenVesting, amount);
    await approveTx.wait();
    console.log("   ✓ Approved");

    // Create schedule
    console.log("\n2. Creating vesting schedule...");
    const createTx = await vesting.createVestingSchedule(
      beneficiary,
      amount,
      cliffDuration,
      totalDuration,
      revocable
    );
    const receipt = await createTx.wait();
    console.log("   ✓ Schedule created!");

    console.log("\n" + "=".repeat(60));
    console.log("SUCCESS!");
    console.log("=".repeat(60));
    console.log("\nTransaction:", receipt.hash);

    if (hre.network.name === "baseSepolia") {
      console.log("View on Basescan:");
      console.log(`https://sepolia.basescan.org/tx/${receipt.hash}`);
    }

    console.log("\nNext steps:");
    console.log(`  Check status: npx hardhat check-vesting --beneficiary ${beneficiary} --network ${hre.network.name}`);
    console.log("");
  });

/**
 * Task: check-vesting
 * Check vesting status for a beneficiary
 */
task("check-vesting", "Check vesting status for a beneficiary")
  .addParam("beneficiary", "The beneficiary address")
  .setAction(async (taskArgs, hre) => {
    const deployment = getDeployment(hre.network.name);
    const vesting = await hre.ethers.getContractAt("TokenVesting", deployment.contracts.TokenVesting);

    const beneficiary = taskArgs.beneficiary;

    console.log("\n" + "=".repeat(60));
    console.log("VESTING STATUS");
    console.log("=".repeat(60));
    console.log("\nBeneficiary:", beneficiary);

    // Get schedule
    const schedule = await vesting.vestingSchedules(beneficiary);

    if (schedule.amount === 0) {
      console.log("\n❌ No vesting schedule found for this beneficiary");
      return;
    }

    // Get vested amount
    const vestedAmount = await vesting.vestedAmount(beneficiary);
    const unreleased = vestedAmount - schedule.released;

    const startTime = Number(schedule.start);
    const cliffTime = Number(schedule.cliff);
    const endTime = startTime + Number(schedule.duration);
    const now = Math.floor(Date.now() / 1000);

    console.log("\n" + "=".repeat(60));
    console.log("SCHEDULE DETAILS");
    console.log("=".repeat(60));
    console.log("\nTotal Amount:", hre.ethers.formatEther(schedule.amount), "tokens");
    console.log("Released:", hre.ethers.formatEther(schedule.released), "tokens");
    console.log("Vested:", hre.ethers.formatEther(vestedAmount), "tokens");
    console.log("Available:", hre.ethers.formatEther(unreleased), "tokens");
    console.log("\nRevocable:", schedule.revocable);
    console.log("Revoked:", schedule.revoked);

    console.log("\n" + "=".repeat(60));
    console.log("TIMELINE");
    console.log("=".repeat(60));
    console.log("\nStart:", formatTimestamp(startTime));
    console.log("Cliff:", formatTimestamp(cliffTime));
    console.log("End:", formatTimestamp(endTime));
    console.log("Current:", formatTimestamp(now));

    // Calculate progress
    const progress = Number(schedule.amount) > 0
      ? (Number(vestedAmount) / Number(schedule.amount) * 100).toFixed(2)
      : "0.00";

    console.log("\n" + "=".repeat(60));
    console.log("PROGRESS");
    console.log("=".repeat(60));
    console.log(`\nVesting Progress: ${progress}%`);

    // Status
    if (schedule.revoked) {
      console.log("Status: ⚠️  REVOKED");
    } else if (now < cliffTime) {
      const timeUntilCliff = cliffTime - now;
      console.log("Status: ⏳ CLIFF PERIOD");
      console.log(`Time until cliff: ${formatDuration(timeUntilCliff)}`);
    } else if (now >= endTime) {
      console.log("Status: ✅ FULLY VESTED");
    } else {
      const timeUntilEnd = endTime - now;
      console.log("Status: 🔄 VESTING");
      console.log(`Time until fully vested: ${formatDuration(timeUntilEnd)}`);
    }

    if (unreleased > 0 && !schedule.revoked) {
      console.log("\n✨ Available to release:", hre.ethers.formatEther(unreleased), "tokens");
      console.log(`\nRelease: npx hardhat release --beneficiary ${beneficiary} --network ${hre.network.name}`);
    }

    console.log("");
  });

/**
 * Task: release
 * Release vested tokens for a beneficiary
 */
task("release", "Release vested tokens")
  .addOptionalParam("beneficiary", "The beneficiary address (defaults to your address)")
  .setAction(async (taskArgs, hre) => {
    const deployment = getDeployment(hre.network.name);
    const vesting = await hre.ethers.getContractAt("TokenVesting", deployment.contracts.TokenVesting);

    const [signer] = await hre.ethers.getSigners();
    const beneficiary = taskArgs.beneficiary || signer.address;

    console.log("\n" + "=".repeat(60));
    console.log("RELEASE VESTED TOKENS");
    console.log("=".repeat(60));
    console.log("\nBeneficiary:", beneficiary);
    console.log("Your address:", signer.address);

    // Get schedule
    const schedule = await vesting.vestingSchedules(beneficiary);

    if (schedule.amount === 0) {
      console.log("\n❌ No vesting schedule found");
      return;
    }

    if (schedule.revoked) {
      console.log("\n⚠️  Schedule has been revoked");
      return;
    }

    // Get vested amount
    const vestedAmount = await vesting.vestedAmount(beneficiary);
    const unreleased = vestedAmount - schedule.released;

    console.log("\nAvailable to release:", hre.ethers.formatEther(unreleased), "tokens");

    if (unreleased === 0n) {
      console.log("\n❌ No tokens available to release");
      return;
    }

    // Release tokens
    console.log("\nReleasing tokens...");

    // Connect as beneficiary if needed
    const vestingAsBeneficiary = beneficiary === signer.address
      ? vesting
      : vesting.connect(await hre.ethers.getSigner(beneficiary));

    const tx = await vestingAsBeneficiary.release();
    const receipt = await tx.wait();

    console.log("\n" + "=".repeat(60));
    console.log("SUCCESS!");
    console.log("=".repeat(60));
    console.log("\nReleased:", hre.ethers.formatEther(unreleased), "tokens");
    console.log("Transaction:", receipt.hash);

    if (hre.network.name === "baseSepolia") {
      console.log("\nView on Basescan:");
      console.log(`https://sepolia.basescan.org/tx/${receipt.hash}`);
    }

    console.log("");
  });

/**
 * Task: revoke
 * Revoke a vesting schedule
 */
task("revoke", "Revoke a vesting schedule")
  .addParam("beneficiary", "The beneficiary address")
  .addFlag("confirm", "Confirm revocation (required)")
  .setAction(async (taskArgs, hre) => {
    const deployment = getDeployment(hre.network.name);
    const vesting = await hre.ethers.getContractAt("TokenVesting", deployment.contracts.TokenVesting);

    const beneficiary = taskArgs.beneficiary;

    console.log("\n" + "=".repeat(60));
    console.log("REVOKE VESTING SCHEDULE");
    console.log("=".repeat(60));
    console.log("\nBeneficiary:", beneficiary);

    // Get schedule
    const schedule = await vesting.vestingSchedules(beneficiary);

    if (schedule.amount === 0) {
      console.log("\n❌ No vesting schedule found");
      return;
    }

    if (schedule.revoked) {
      console.log("\n⚠️  Schedule already revoked");
      return;
    }

    if (!schedule.revocable) {
      console.log("\n❌ This schedule is not revocable");
      return;
    }

    // Get vested amount
    const vestedAmount = await vesting.vestedAmount(beneficiary);
    const unvested = schedule.amount - vestedAmount;
    const unreleased = vestedAmount - schedule.released;

    console.log("\n" + "=".repeat(60));
    console.log("REVOCATION IMPACT");
    console.log("=".repeat(60));
    console.log("\nUnvested tokens (will be returned):", hre.ethers.formatEther(unvested), "tokens");
    console.log("Vested but unreleased (stays with beneficiary):", hre.ethers.formatEther(unreleased), "tokens");

    if (!taskArgs.confirm) {
      console.log("\n⚠️  WARNING: This action cannot be undone!");
      console.log("\nTo confirm, add --confirm flag:");
      console.log(`  npx hardhat revoke --beneficiary ${beneficiary} --confirm --network ${hre.network.name}`);
      return;
    }

    console.log("\n⚠️  Revoking schedule...");
    const tx = await vesting.revoke(beneficiary);
    const receipt = await tx.wait();

    console.log("\n" + "=".repeat(60));
    console.log("SCHEDULE REVOKED");
    console.log("=".repeat(60));
    console.log("\nRefunded:", hre.ethers.formatEther(unvested), "tokens");
    console.log("Transaction:", receipt.hash);

    if (hre.network.name === "baseSepolia") {
      console.log("\nView on Basescan:");
      console.log(`https://sepolia.basescan.org/tx/${receipt.hash}`);
    }

    console.log("");
  });

/**
 * Task: mint
 * Mint test tokens (for testing)
 */
task("mint", "Mint test tokens")
  .addParam("amount", "Amount of tokens to mint", "10000")
  .addOptionalParam("to", "Address to mint to (defaults to your address)")
  .setAction(async (taskArgs, hre) => {
    const deployment = getDeployment(hre.network.name);
    const token = await hre.ethers.getContractAt("MockERC20", deployment.contracts.MockERC20);

    const [signer] = await hre.ethers.getSigners();
    const to = taskArgs.to || signer.address;
    const amount = hre.ethers.parseEther(taskArgs.amount);

    console.log("\n" + "=".repeat(60));
    console.log("MINT TOKENS");
    console.log("=".repeat(60));
    console.log("\nTo:", to);
    console.log("Amount:", hre.ethers.formatEther(amount), "tokens");

    const tx = await token.mint(to, amount);
    const receipt = await tx.wait();

    const newBalance = await token.balanceOf(to);

    console.log("\n✅ Tokens minted!");
    console.log("New balance:", hre.ethers.formatEther(newBalance), "tokens");
    console.log("Transaction:", receipt.hash);

    if (hre.network.name === "baseSepolia") {
      console.log("\nView on Basescan:");
      console.log(`https://sepolia.basescan.org/tx/${receipt.hash}`);
    }

    console.log("");
  });

/**
 * Task: list-schedules
 * List all vesting schedules by querying events
 */
task("list-schedules", "List all vesting schedules")
  .addOptionalParam("limit", "Limit number of results", "20")
  .setAction(async (taskArgs, hre) => {
    const deployment = getDeployment(hre.network.name);
    const vesting = await hre.ethers.getContractAt("TokenVesting", deployment.contracts.TokenVesting);

    const limit = parseInt(taskArgs.limit);

    console.log("\n" + "=".repeat(60));
    console.log("ALL VESTING SCHEDULES");
    console.log("=".repeat(60));

    // Query VestingScheduleCreated events
    const currentBlock = await hre.ethers.provider.getBlockNumber();
    const fromBlock = deployment.blockNumber || currentBlock - 10000;

    console.log(`\nQuerying events from block ${fromBlock} to ${currentBlock}...`);

    const filter = vesting.filters.VestingScheduleCreated();
    const events = await vesting.queryFilter(filter, fromBlock, currentBlock);

    if (events.length === 0) {
      console.log("\nNo vesting schedules found.");
      return;
    }

    console.log(`\nFound ${events.length} schedules (showing first ${Math.min(limit, events.length)}):\n`);

    const limitedEvents = events.slice(0, limit);

    for (const event of limitedEvents) {
      const beneficiary = event.args.beneficiary;
      const schedule = await vesting.vestingSchedules(beneficiary);
      const vestedAmount = await vesting.vestedAmount(beneficiary);

      console.log("─".repeat(60));
      console.log("Beneficiary:", beneficiary);
      console.log("  Total:", hre.ethers.formatEther(schedule.amount), "tokens");
      console.log("  Vested:", hre.ethers.formatEther(vestedAmount), "tokens");
      console.log("  Released:", hre.ethers.formatEther(schedule.released), "tokens");
      console.log("  Status:", schedule.revoked ? "Revoked" : "Active");
    }

    console.log("─".repeat(60));
    console.log("");
  });

module.exports = {};
