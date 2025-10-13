const hre = require("hardhat");

/**
 * Comprehensive Vesting Demo Script
 *
 * This script demonstrates the complete lifecycle of a token vesting schedule:
 * 1. Deploy contracts (if on localhost)
 * 2. Mint tokens
 * 3. Create vesting schedule
 * 4. Check vesting during cliff period
 * 5. Fast-forward time past cliff (localhost only)
 * 6. Check vesting during vesting period
 * 7. Release partial tokens
 * 8. Fast-forward to end (localhost only)
 * 9. Release remaining tokens
 * 10. Display final summary
 *
 * Usage:
 *   npx hardhat run scripts/demo.js --network localhost
 *   npx hardhat run scripts/demo.js --network baseSepolia
 *
 * Note: Time manipulation only works on local Hardhat network
 */

async function main() {
  console.log("\n" + "█".repeat(60));
  console.log("█" + " ".repeat(58) + "█");
  console.log("█" + "  TOKEN VESTING CONTRACT - COMPREHENSIVE DEMO".padEnd(58) + "█");
  console.log("█" + " ".repeat(58) + "█");
  console.log("█".repeat(60) + "\n");

  const isLocalhost = hre.network.name === "localhost" || hre.network.name === "hardhat";
  console.log("Network:", hre.network.name);
  console.log("Time Manipulation:", isLocalhost ? "Enabled ✓" : "Disabled (use real time)");
  console.log("");

  // Get signers
  const [owner, beneficiary] = await hre.ethers.getSigners();
  console.log("Owner:", owner.address);
  console.log("Beneficiary:", beneficiary.address);

  let token, vesting;

  // Step 1: Deploy or connect to contracts
  console.log("\n" + "=".repeat(60));
  console.log("STEP 1: CONTRACT SETUP");
  console.log("=".repeat(60));

  if (isLocalhost) {
    console.log("\nDeploying contracts to local network...");

    // Deploy MockERC20
    const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
    token = await MockERC20.deploy();
    await token.waitForDeployment();
    console.log("✓ MockERC20 deployed:", await token.getAddress());

    // Deploy TokenVesting
    const TokenVesting = await hre.ethers.getContractFactory("TokenVesting");
    vesting = await TokenVesting.deploy(await token.getAddress());
    await vesting.waitForDeployment();
    console.log("✓ TokenVesting deployed:", await vesting.getAddress());
  } else {
    console.log("\nConnecting to deployed contracts...");
    try {
      const deployment = require(`../deployments/${hre.network.name}.json`);
      token = await hre.ethers.getContractAt("MockERC20", deployment.contracts.MockERC20);
      vesting = await hre.ethers.getContractAt("TokenVesting", deployment.contracts.TokenVesting);
      console.log("✓ Connected to MockERC20:", deployment.contracts.MockERC20);
      console.log("✓ Connected to TokenVesting:", deployment.contracts.TokenVesting);
    } catch (error) {
      console.log("❌ Error: Deployment file not found");
      console.log("\nPlease deploy contracts first:");
      console.log("  npx hardhat run scripts/deploy.js --network", hre.network.name);
      return;
    }
  }

  // Step 2: Mint tokens
  console.log("\n" + "=".repeat(60));
  console.log("STEP 2: MINT TOKENS");
  console.log("=".repeat(60));

  const mintAmount = hre.ethers.parseEther("10000");
  console.log("\nMinting", hre.ethers.formatEther(mintAmount), "tokens to owner...");

  const mintTx = await token.mint(owner.address, mintAmount);
  await mintTx.wait();

  const ownerBalance = await token.balanceOf(owner.address);
  console.log("✓ Owner balance:", hre.ethers.formatEther(ownerBalance), "TEST");

  // Step 3: Create vesting schedule
  console.log("\n" + "=".repeat(60));
  console.log("STEP 3: CREATE VESTING SCHEDULE");
  console.log("=".repeat(60));

  const vestingAmount = hre.ethers.parseEther("1000");
  const cliffDuration = isLocalhost ? 60 : 86400; // 1 minute local, 1 day testnet
  const totalDuration = isLocalhost ? 300 : 31536000; // 5 minutes local, 1 year testnet
  const revocable = true;

  console.log("\nVesting Parameters:");
  console.log("- Beneficiary:", beneficiary.address);
  console.log("- Amount:", hre.ethers.formatEther(vestingAmount), "TEST");
  console.log("- Cliff Duration:", formatDuration(cliffDuration));
  console.log("- Total Duration:", formatDuration(totalDuration));
  console.log("- Revocable:", revocable);

  // Approve tokens
  console.log("\nApproving tokens...");
  const approveTx = await token.approve(await vesting.getAddress(), vestingAmount);
  await approveTx.wait();
  console.log("✓ Tokens approved");

  // Create schedule
  console.log("\nCreating vesting schedule...");
  const createTx = await vesting.createVestingSchedule(
    beneficiary.address,
    vestingAmount,
    cliffDuration,
    totalDuration,
    revocable
  );
  const createReceipt = await createTx.wait();
  console.log("✓ Vesting schedule created!");
  console.log("  Transaction:", createReceipt.hash);

  // Get schedule details
  const schedule = await vesting.vestingSchedules(beneficiary.address);
  const startTime = Number(schedule.start);
  const cliffTime = Number(schedule.cliff);
  const endTime = startTime + Number(schedule.duration);

  console.log("\nSchedule Timeline:");
  console.log("- Start:", new Date(startTime * 1000).toLocaleString());
  console.log("- Cliff:", new Date(cliffTime * 1000).toLocaleString());
  console.log("- End:", new Date(endTime * 1000).toLocaleString());

  // Step 4: Check during cliff period
  console.log("\n" + "=".repeat(60));
  console.log("STEP 4: CHECK VESTING (DURING CLIFF)");
  console.log("=".repeat(60));

  await displayVestingStatus(vesting, beneficiary.address);

  // Step 5: Advance past cliff
  if (isLocalhost) {
    console.log("\n" + "=".repeat(60));
    console.log("STEP 5: ADVANCE TIME PAST CLIFF");
    console.log("=".repeat(60));

    console.log("\nAdvancing time by", cliffDuration + 30, "seconds...");
    await hre.network.provider.send("evm_increaseTime", [cliffDuration + 30]);
    await hre.network.provider.send("evm_mine");
    console.log("✓ Time advanced");

    const newTime = await getCurrentTime();
    console.log("Current time:", new Date(newTime * 1000).toLocaleString());
  } else {
    console.log("\n" + "=".repeat(60));
    console.log("STEP 5: WAITING FOR CLIFF TO PASS");
    console.log("=".repeat(60));
    console.log("\n⏳ On testnet, you'll need to wait for the cliff period to pass.");
    console.log("Come back after:", new Date(cliffTime * 1000).toLocaleString());
    console.log("\nSkipping to summary...");
    await displaySummary(vesting, token, owner, beneficiary);
    return;
  }

  // Step 6: Check after cliff
  console.log("\n" + "=".repeat(60));
  console.log("STEP 6: CHECK VESTING (AFTER CLIFF)");
  console.log("=".repeat(60));

  await displayVestingStatus(vesting, beneficiary.address);

  // Step 7: Release partial tokens
  console.log("\n" + "=".repeat(60));
  console.log("STEP 7: RELEASE PARTIAL TOKENS");
  console.log("=".repeat(60));

  const vestedBefore = await vesting.vestedAmount(beneficiary.address);
  const beneficiaryBalanceBefore = await token.balanceOf(beneficiary.address);

  console.log("\nBeneficiary releasing tokens...");
  const releaseTx = await vesting.connect(beneficiary).release();
  const releaseReceipt = await releaseTx.wait();
  console.log("✓ Tokens released!");
  console.log("  Transaction:", releaseReceipt.hash);

  const beneficiaryBalanceAfter = await token.balanceOf(beneficiary.address);
  const released = beneficiaryBalanceAfter - beneficiaryBalanceBefore;

  console.log("\nRelease Details:");
  console.log("- Tokens Released:", hre.ethers.formatEther(released), "TEST");
  console.log("- New Balance:", hre.ethers.formatEther(beneficiaryBalanceAfter), "TEST");

  // Step 8: Advance to end
  if (isLocalhost) {
    console.log("\n" + "=".repeat(60));
    console.log("STEP 8: ADVANCE TIME TO END OF VESTING");
    console.log("=".repeat(60));

    const remainingTime = totalDuration - cliffDuration - 30 + 60; // Extra minute
    console.log("\nAdvancing time by", remainingTime, "seconds...");
    await hre.network.provider.send("evm_increaseTime", [remainingTime]);
    await hre.network.provider.send("evm_mine");
    console.log("✓ Time advanced");

    const finalTime = await getCurrentTime();
    console.log("Current time:", new Date(finalTime * 1000).toLocaleString());
  }

  // Step 9: Final release
  console.log("\n" + "=".repeat(60));
  console.log("STEP 9: RELEASE REMAINING TOKENS");
  console.log("=".repeat(60));

  await displayVestingStatus(vesting, beneficiary.address);

  console.log("\nReleasing remaining tokens...");
  const finalReleaseTx = await vesting.connect(beneficiary).release();
  const finalReleaseReceipt = await finalReleaseTx.wait();
  console.log("✓ All tokens released!");
  console.log("  Transaction:", finalReleaseReceipt.hash);

  const finalBalance = await token.balanceOf(beneficiary.address);
  console.log("\nFinal Balance:", hre.ethers.formatEther(finalBalance), "TEST");

  // Step 10: Summary
  await displaySummary(vesting, token, owner, beneficiary);

  console.log("\n" + "█".repeat(60));
  console.log("█" + " ".repeat(58) + "█");
  console.log("█" + "  DEMO COMPLETE!".padEnd(58) + "█");
  console.log("█" + " ".repeat(58) + "█");
  console.log("█".repeat(60) + "\n");

  if (!isLocalhost && hre.network.name === "baseSepolia") {
    console.log("View contracts on Basescan:");
    console.log("- Token:", "https://sepolia.basescan.org/address/" + await token.getAddress());
    console.log("- Vesting:", "https://sepolia.basescan.org/address/" + await vesting.getAddress());
  }
}

// Helper functions
async function getCurrentTime() {
  const block = await hre.ethers.provider.getBlock("latest");
  return block.timestamp;
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
  if (seconds < 31536000) return `${Math.floor(seconds / 86400)} days`;
  return `${Math.floor(seconds / 31536000)} years`;
}

async function displayVestingStatus(vesting, beneficiaryAddress) {
  const schedule = await vesting.vestingSchedules(beneficiaryAddress);
  const vestedAmount = await vesting.vestedAmount(beneficiaryAddress);
  const unreleased = vestedAmount - schedule.released;

  const currentTime = await getCurrentTime();
  const progress = Number(schedule.amount) > 0
    ? (Number(vestedAmount) / Number(schedule.amount) * 100).toFixed(2)
    : "0.00";

  console.log("\nCurrent Status:");
  console.log("- Time:", new Date(currentTime * 1000).toLocaleString());
  console.log("- Total Amount:", hre.ethers.formatEther(schedule.amount), "TEST");
  console.log("- Vested:", hre.ethers.formatEther(vestedAmount), "TEST", `(${progress}%)`);
  console.log("- Released:", hre.ethers.formatEther(schedule.released), "TEST");
  console.log("- Available:", hre.ethers.formatEther(unreleased), "TEST");

  // Progress bar
  const barLength = 40;
  const filledLength = Math.floor(barLength * Number(vestedAmount) / Number(schedule.amount));
  const bar = "█".repeat(filledLength) + "░".repeat(barLength - filledLength);
  console.log("- Progress: [" + bar + "] " + progress + "%");
}

async function displaySummary(vesting, token, owner, beneficiary) {
  console.log("\n" + "=".repeat(60));
  console.log("FINAL SUMMARY");
  console.log("=".repeat(60));

  const schedule = await vesting.vestingSchedules(beneficiary.address);
  const ownerBalance = await token.balanceOf(owner.address);
  const beneficiaryBalance = await token.balanceOf(beneficiary.address);
  const vestingBalance = await token.balanceOf(await vesting.getAddress());

  console.log("\nVesting Schedule:");
  console.log("- Total Amount:", hre.ethers.formatEther(schedule.amount), "TEST");
  console.log("- Released:", hre.ethers.formatEther(schedule.released), "TEST");
  console.log("- Revoked:", schedule.revoked ? "Yes" : "No");

  console.log("\nToken Balances:");
  console.log("- Owner:", hre.ethers.formatEther(ownerBalance), "TEST");
  console.log("- Beneficiary:", hre.ethers.formatEther(beneficiaryBalance), "TEST");
  console.log("- Vesting Contract:", hre.ethers.formatEther(vestingBalance), "TEST");

  console.log("\nKey Metrics:");
  const completionRate = Number(schedule.amount) > 0
    ? (Number(schedule.released) / Number(schedule.amount) * 100).toFixed(2)
    : "0.00";
  console.log("- Completion Rate:", completionRate + "%");
  console.log("- Tokens in Flight:", hre.ethers.formatEther(schedule.amount - schedule.released), "TEST");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
