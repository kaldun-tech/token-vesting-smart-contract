const hre = require("hardhat");

/**
 * Revoke a vesting schedule
 *
 * This script allows the contract owner to revoke a vesting schedule
 * if it was created as revocable.
 *
 * Usage:
 *   BENEFICIARY=0x... npx hardhat run scripts/revoke.js --network baseSepolia
 *
 * Note: The signer must be the address that created the vesting schedule.
 */

async function main() {
  console.log("=".repeat(60));
  console.log("REVOKE VESTING SCHEDULE");
  console.log("=".repeat(60));

  // Load deployment info
  const deployment = require(`../deployments/${hre.network.name}.json`);
  const vestingAddress = deployment.contracts.TokenVesting;
  const tokenAddress = deployment.contracts.MockERC20;

  console.log("\nNetwork:", hre.network.name);
  console.log("Vesting Contract:", vestingAddress);

  // Get signer (owner)
  const [owner] = await hre.ethers.getSigners();
  console.log("Your Address:", owner.address);

  // Get beneficiary address
  const beneficiary = process.env.BENEFICIARY;

  if (!beneficiary) {
    console.log("\n❌ Error: BENEFICIARY environment variable not set");
    console.log("\nUsage:");
    console.log("  BENEFICIARY=0x... npx hardhat run scripts/revoke.js --network", hre.network.name);
    return;
  }

  // Validate address
  if (!hre.ethers.isAddress(beneficiary)) {
    console.log("\n❌ Error: Invalid beneficiary address");
    return;
  }

  console.log("Beneficiary:", beneficiary);

  // Connect to contracts
  const vesting = await hre.ethers.getContractAt("TokenVesting", vestingAddress);
  const token = await hre.ethers.getContractAt("MockERC20", tokenAddress);

  // Check vesting schedule
  console.log("\n" + "=".repeat(60));
  console.log("CHECKING VESTING SCHEDULE");
  console.log("=".repeat(60));

  const schedule = await vesting.vestingSchedules(beneficiary);

  if (schedule.amount === 0n) {
    console.log("\n❌ No vesting schedule found for this beneficiary");
    return;
  }

  if (schedule.revoked) {
    console.log("\n⚠️  This schedule has already been revoked");
    return;
  }

  if (!schedule.revocable) {
    console.log("\n❌ This schedule is not revocable");
    console.log("\nThe schedule was created with revocable=false.");
    console.log("It cannot be revoked once created.");
    return;
  }

  console.log("\nSchedule Details:");
  console.log("- Total Amount:", hre.ethers.formatEther(schedule.amount), "tokens");
  console.log("- Already Released:", hre.ethers.formatEther(schedule.released), "tokens");
  console.log("- Revocable:", schedule.revocable);

  const vestedAmount = await vesting.vestedAmount(beneficiary);
  const unvested = schedule.amount - vestedAmount;
  const unreleased = vestedAmount - schedule.released;

  console.log("- Currently Vested:", hre.ethers.formatEther(vestedAmount), "tokens");
  console.log("- Unreleased (vested):", hre.ethers.formatEther(unreleased), "tokens");
  console.log("- Unvested:", hre.ethers.formatEther(unvested), "tokens");

  console.log("\n" + "=".repeat(60));
  console.log("REVOCATION IMPACT");
  console.log("=".repeat(60));

  console.log("\n⚠️  WARNING: You are about to revoke this vesting schedule!");
  console.log("\nWhat will happen:");
  console.log("1. Unvested tokens will be returned to you:", hre.ethers.formatEther(unvested), "tokens");
  console.log("2. Vested but unreleased tokens remain with beneficiary:", hre.ethers.formatEther(unreleased), "tokens");
  console.log("3. No more tokens will vest after revocation");
  console.log("4. This action cannot be undone");

  // In a real interactive script, you'd want to prompt for confirmation
  // For now, we'll add a safety check
  const confirmRevoke = process.env.CONFIRM_REVOKE;

  if (confirmRevoke !== "yes") {
    console.log("\n" + "=".repeat(60));
    console.log("CONFIRMATION REQUIRED");
    console.log("=".repeat(60));
    console.log("\nTo confirm revocation, run:");
    console.log("  CONFIRM_REVOKE=yes BENEFICIARY=" + beneficiary + " \\");
    console.log("  npx hardhat run scripts/revoke.js --network", hre.network.name);
    console.log("\nRevocation cancelled.");
    return;
  }

  // Get balance before revocation
  const balanceBefore = await token.balanceOf(owner.address);

  console.log("\n" + "=".repeat(60));
  console.log("REVOKING SCHEDULE");
  console.log("=".repeat(60));

  try {
    console.log("\nSubmitting revocation transaction...");
    const tx = await vesting.revoke(beneficiary);
    console.log("Transaction submitted:", tx.hash);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log("Block number:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());

    // Get balance after revocation
    const balanceAfter = await token.balanceOf(owner.address);
    const refunded = balanceAfter - balanceBefore;

    console.log("\n" + "=".repeat(60));
    console.log("REVOCATION COMPLETE");
    console.log("=".repeat(60));

    console.log("\nTokens Refunded:", hre.ethers.formatEther(refunded), "tokens");
    console.log("Your New Balance:", hre.ethers.formatEther(balanceAfter), "tokens");

    // Verify schedule is revoked
    const updatedSchedule = await vesting.vestingSchedules(beneficiary);
    console.log("\nSchedule Status:");
    console.log("- Revoked:", updatedSchedule.revoked ? "Yes ✓" : "No ✗");

    // Check events
    const filter = vesting.filters.VestingRevoked(beneficiary);
    const events = await vesting.queryFilter(filter, receipt.blockNumber, receipt.blockNumber);

    if (events.length > 0) {
      const event = events[0];
      console.log("\nRevocation Event:");
      console.log("- Beneficiary:", event.args.beneficiary);
      console.log("- Refunded:", hre.ethers.formatEther(event.args.refunded), "tokens");
    }

    // View on explorer
    if (hre.network.name === "baseSepolia") {
      console.log("\nView transaction on Basescan:");
      console.log("https://sepolia.basescan.org/tx/" + tx.hash);
    }

  } catch (error) {
    console.error("\n❌ Error revoking schedule:", error.message);

    if (error.message.includes("not the original owner")) {
      console.log("\nOnly the address that created the vesting schedule can revoke it.");
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
