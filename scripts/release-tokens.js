const hre = require("hardhat");

/**
 * Release vested tokens for a beneficiary
 *
 * This script allows the beneficiary to claim their vested tokens.
 *
 * Usage:
 *   npx hardhat run scripts/release-tokens.js --network baseSepolia
 *
 * Note: The signer must be the beneficiary of the vesting schedule.
 */

async function main() {
  console.log("=".repeat(60));
  console.log("RELEASE VESTED TOKENS");
  console.log("=".repeat(60));

  // Load deployment info
  const deployment = require(`../deployments/${hre.network.name}.json`);
  const vestingAddress = deployment.contracts.TokenVesting;
  const tokenAddress = deployment.contracts.MockERC20;

  console.log("\nNetwork:", hre.network.name);
  console.log("Vesting Contract:", vestingAddress);

  // Get signer (beneficiary)
  const [beneficiary] = await hre.ethers.getSigners();
  console.log("Beneficiary:", beneficiary.address);

  // Connect to contracts
  const vesting = await hre.ethers.getContractAt("TokenVesting", vestingAddress);
  const token = await hre.ethers.getContractAt("MockERC20", tokenAddress);

  // Check vesting schedule
  console.log("\n" + "=".repeat(60));
  console.log("CHECKING VESTING SCHEDULE");
  console.log("=".repeat(60));

  const schedule = await vesting.vestingSchedules(beneficiary.address);

  if (schedule.amount === 0n) {
    console.log("\n❌ No vesting schedule found for your address");
    console.log("\nMake sure you're using the correct wallet and network.");
    return;
  }

  if (schedule.revoked) {
    console.log("\n⚠️  Your vesting schedule has been revoked");
    console.log("No more tokens can be released.");
    return;
  }

  console.log("\nSchedule Details:");
  console.log("- Total Amount:", hre.ethers.formatEther(schedule.amount), "tokens");
  console.log("- Already Released:", hre.ethers.formatEther(schedule.released), "tokens");

  // Check vested amount
  const vestedAmount = await vesting.vestedAmount(beneficiary.address);
  const unreleased = vestedAmount - schedule.released;

  console.log("- Currently Vested:", hre.ethers.formatEther(vestedAmount), "tokens");
  console.log("- Available to Release:", hre.ethers.formatEther(unreleased), "tokens");

  if (unreleased === 0n) {
    const now = Math.floor(Date.now() / 1000);
    const cliffTime = Number(schedule.cliff);

    if (now < cliffTime) {
      const timeUntilCliff = cliffTime - now;
      const days = Math.floor(timeUntilCliff / 86400);
      const hours = Math.floor((timeUntilCliff % 86400) / 3600);
      const minutes = Math.floor((timeUntilCliff % 3600) / 60);

      console.log("\n⏳ Still in cliff period!");
      console.log(`Time until cliff ends: ${days}d ${hours}h ${minutes}m`);
      console.log("\nNo tokens can be released yet. Please wait.");
    } else {
      console.log("\nℹ️  All vested tokens have already been released.");
      console.log("More tokens will vest over time.");
    }
    return;
  }

  // Get balance before release
  const balanceBefore = await token.balanceOf(beneficiary.address);

  console.log("\n" + "=".repeat(60));
  console.log("RELEASING TOKENS");
  console.log("=".repeat(60));

  console.log("\nReleasing", hre.ethers.formatEther(unreleased), "tokens...");

  try {
    const tx = await vesting.release();
    console.log("\nTransaction submitted:", tx.hash);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log("Block number:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());

    // Get balance after release
    const balanceAfter = await token.balanceOf(beneficiary.address);
    const received = balanceAfter - balanceBefore;

    console.log("\n" + "=".repeat(60));
    console.log("SUCCESS!");
    console.log("=".repeat(60));

    console.log("\nTokens Released:", hre.ethers.formatEther(received), "tokens");
    console.log("New Balance:", hre.ethers.formatEther(balanceAfter), "tokens");

    // Get updated schedule
    const updatedSchedule = await vesting.vestingSchedules(beneficiary.address);
    const remaining = updatedSchedule.amount - updatedSchedule.released;

    console.log("\nRemaining to Vest:", hre.ethers.formatEther(remaining), "tokens");

    // Check if fully vested
    if (remaining === 0n) {
      console.log("\n🎉 All tokens have been released! Vesting complete.");
    } else {
      const progress = (Number(updatedSchedule.released) / Number(updatedSchedule.amount) * 100).toFixed(2);
      console.log("Progress:", progress + "%");
    }

    // View on explorer
    if (hre.network.name === "baseSepolia") {
      console.log("\nView transaction on Basescan:");
      console.log("https://sepolia.basescan.org/tx/" + tx.hash);
    }

  } catch (error) {
    console.error("\n❌ Error releasing tokens:", error.message);

    if (error.message.includes("No tokens available")) {
      console.log("\nNo tokens are available to release right now.");
      console.log("This could mean:");
      console.log("- You're still in the cliff period");
      console.log("- All vested tokens have already been released");
    }
  }

  console.log("\n" + "=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
