const hre = require("hardhat");

/**
 * Check vested amount for a beneficiary
 *
 * Usage:
 *   npx hardhat run scripts/check-vested.js --network baseSepolia
 *
 * Set BENEFICIARY environment variable to check a specific address:
 *   BENEFICIARY=0x... npx hardhat run scripts/check-vested.js --network baseSepolia
 */

async function main() {
  console.log("=".repeat(60));
  console.log("CHECK VESTED TOKENS");
  console.log("=".repeat(60));

  // Load deployment info
  const deployment = require(`../deployments/${hre.network.name}.json`);
  const vestingAddress = deployment.contracts.TokenVesting;
  const tokenAddress = deployment.contracts.MockERC20;

  console.log("\nNetwork:", hre.network.name);
  console.log("Vesting Contract:", vestingAddress);

  // Get beneficiary address
  const beneficiary = process.env.BENEFICIARY || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  console.log("Beneficiary:", beneficiary);

  // Connect to contracts
  const vesting = await hre.ethers.getContractAt("TokenVesting", vestingAddress);
  const token = await hre.ethers.getContractAt("MockERC20", tokenAddress);

  // Get vesting schedule
  console.log("\n" + "=".repeat(60));
  console.log("VESTING SCHEDULE");
  console.log("=".repeat(60));

  const schedule = await vesting.vestingSchedules(beneficiary);

  if (schedule.amount === 0n) {
    console.log("\n❌ No vesting schedule found for this beneficiary");
    return;
  }

  const startTime = Number(schedule.start);
  const cliffTime = Number(schedule.cliff);
  const endTime = startTime + Number(schedule.duration);
  const now = Math.floor(Date.now() / 1000);

  console.log("\nSchedule Details:");
  console.log("- Total Amount:", hre.ethers.formatEther(schedule.amount), "tokens");
  console.log("- Released:", hre.ethers.formatEther(schedule.released), "tokens");
  console.log("- Revocable:", schedule.revocable);
  console.log("- Revoked:", schedule.revoked);

  console.log("\nTimeline:");
  console.log("- Start Time:", new Date(startTime * 1000).toLocaleString());
  console.log("- Cliff Time:", new Date(cliffTime * 1000).toLocaleString());
  console.log("- End Time:", new Date(endTime * 1000).toLocaleString());
  console.log("- Current Time:", new Date(now * 1000).toLocaleString());

  // Calculate progress
  console.log("\n" + "=".repeat(60));
  console.log("VESTING PROGRESS");
  console.log("=".repeat(60));

  if (schedule.revoked) {
    console.log("\n⚠️  This schedule has been revoked!");
    console.log("No more tokens will vest.");
    return;
  }

  // Get vested amount
  const vestedAmount = await vesting.vestedAmount(beneficiary);
  const unreleased = vestedAmount - schedule.released;

  console.log("\nCurrent Status:");
  console.log("- Vested Amount:", hre.ethers.formatEther(vestedAmount), "tokens");
  console.log("- Already Released:", hre.ethers.formatEther(schedule.released), "tokens");
  console.log("- Available to Release:", hre.ethers.formatEther(unreleased), "tokens");

  // Calculate percentage
  const vestingProgress = Number(schedule.amount) > 0
    ? (Number(vestedAmount) / Number(schedule.amount) * 100).toFixed(2)
    : "0.00";
  console.log("- Vesting Progress:", vestingProgress + "%");

  // Progress bar
  const barLength = 40;
  const filledLength = Math.floor(barLength * Number(vestedAmount) / Number(schedule.amount));
  const bar = "█".repeat(filledLength) + "░".repeat(barLength - filledLength);
  console.log("- Progress: [" + bar + "]");

  // Time-based status
  console.log("\n" + "=".repeat(60));
  console.log("STATUS");
  console.log("=".repeat(60));

  if (now < cliffTime) {
    const timeUntilCliff = cliffTime - now;
    const days = Math.floor(timeUntilCliff / 86400);
    const hours = Math.floor((timeUntilCliff % 86400) / 3600);
    const minutes = Math.floor((timeUntilCliff % 3600) / 60);

    console.log("\n⏳ CLIFF PERIOD ACTIVE");
    console.log("No tokens are vested yet.");
    console.log(`Time until cliff ends: ${days}d ${hours}h ${minutes}m`);
  } else if (now < endTime) {
    const timeUntilEnd = endTime - now;
    const days = Math.floor(timeUntilEnd / 86400);
    const hours = Math.floor((timeUntilEnd % 86400) / 3600);
    const minutes = Math.floor((timeUntilEnd % 3600) / 60);

    console.log("\n🔄 VESTING IN PROGRESS");
    console.log("Tokens are vesting linearly.");
    console.log(`Time until fully vested: ${days}d ${hours}h ${minutes}m`);

    if (unreleased > 0n) {
      console.log("\n✅ You have", hre.ethers.formatEther(unreleased), "tokens ready to release!");
      console.log("\nTo release tokens, the beneficiary should call:");
      console.log("  vesting.release()");
      console.log("\nOr run the release script:");
      console.log("  npx hardhat run scripts/release-tokens.js --network", hre.network.name);
    } else {
      console.log("\nℹ️  All vested tokens have been released.");
      console.log("More tokens will vest over time.");
    }
  } else {
    console.log("\n✅ FULLY VESTED");
    console.log("All tokens have vested.");

    if (unreleased > 0n) {
      console.log("\n⚠️  You still have", hre.ethers.formatEther(unreleased), "tokens to release!");
      console.log("\nTo release tokens, the beneficiary should call:");
      console.log("  vesting.release()");
      console.log("\nOr run the release script:");
      console.log("  npx hardhat run scripts/release-tokens.js --network", hre.network.name);
    } else {
      console.log("\n✅ All tokens have been released.");
    }
  }

  // Check beneficiary's token balance
  const beneficiaryBalance = await token.balanceOf(beneficiary);
  console.log("\n" + "=".repeat(60));
  console.log("BENEFICIARY TOKEN BALANCE");
  console.log("=".repeat(60));
  console.log("\nCurrent Balance:", hre.ethers.formatEther(beneficiaryBalance), "tokens");

  console.log("\n" + "=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
