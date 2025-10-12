const hre = require("hardhat");

/**
 * Interactive script to demonstrate vesting contract functionality
 *
 * This script shows how to:
 * 1. Connect to deployed contracts
 * 2. Create a vesting schedule
 * 3. Check vested amounts
 * 4. Release tokens
 * 5. Query events
 */

async function main() {
  console.log("=".repeat(60));
  console.log("TOKEN VESTING CONTRACT - INTERACTIVE DEMO");
  console.log("=".repeat(60));

  // Load deployment info
  const deployment = require(`../deployments/${hre.network.name}.json`);
  const tokenAddress = deployment.contracts.MockERC20;
  const vestingAddress = deployment.contracts.TokenVesting;

  console.log("\nNetwork:", hre.network.name);
  console.log("Token Contract:", tokenAddress);
  console.log("Vesting Contract:", vestingAddress);

  // Get signer
  const [owner] = await hre.ethers.getSigners();
  console.log("\nYour Address:", owner.address);

  // Connect to contracts
  const token = await hre.ethers.getContractAt("MockERC20", tokenAddress);
  const vesting = await hre.ethers.getContractAt("TokenVesting", vestingAddress);

  // Check balances
  const ownerBalance = await token.balanceOf(owner.address);
  console.log("Your Token Balance:", hre.ethers.formatEther(ownerBalance), "TEST");

  // Example beneficiary (you can change this)
  const beneficiary = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Hardhat test account #2

  console.log("\n" + "=".repeat(60));
  console.log("CREATING VESTING SCHEDULE");
  console.log("=".repeat(60));

  // Vesting parameters
  const vestingAmount = hre.ethers.parseEther("1000"); // 1000 tokens
  const cliffDuration = 60; // 60 seconds (1 minute) for demo
  const totalDuration = 300; // 300 seconds (5 minutes) for demo
  const revocable = true;

  console.log("\nVesting Parameters:");
  console.log("- Beneficiary:", beneficiary);
  console.log("- Amount:", hre.ethers.formatEther(vestingAmount), "TEST");
  console.log("- Cliff Period:", cliffDuration, "seconds");
  console.log("- Total Duration:", totalDuration, "seconds");
  console.log("- Revocable:", revocable);

  // Check if beneficiary already has a schedule
  try {
    const existingSchedule = await vesting.vestingSchedules(beneficiary);
    if (existingSchedule.amount > 0) {
      console.log("\n⚠️  Beneficiary already has a vesting schedule!");
      console.log("Existing schedule details:");
      console.log("- Amount:", hre.ethers.formatEther(existingSchedule.amount), "TEST");
      console.log("- Released:", hre.ethers.formatEther(existingSchedule.released), "TEST");
      console.log("- Revoked:", existingSchedule.revoked);

      // Check vested amount
      const vestedAmount = await vesting.vestedAmount(beneficiary);
      console.log("- Currently Vested:", hre.ethers.formatEther(vestedAmount), "TEST");

      return;
    }
  } catch (e) {
    // No existing schedule, continue
  }

  // Check if we have enough tokens
  if (ownerBalance < vestingAmount) {
    console.log("\n❌ Insufficient token balance!");
    console.log("You need", hre.ethers.formatEther(vestingAmount), "TEST but only have", hre.ethers.formatEther(ownerBalance));
    console.log("\nRun the mint script first:");
    console.log("npx hardhat run scripts/mint-tokens.js --network", hre.network.name);
    return;
  }

  // Approve vesting contract
  console.log("\n1. Approving tokens...");
  const approveTx = await token.approve(vestingAddress, vestingAmount);
  await approveTx.wait();
  console.log("✓ Tokens approved");

  // Create vesting schedule
  console.log("\n2. Creating vesting schedule...");
  const createTx = await vesting.createVestingSchedule(
    beneficiary,
    vestingAmount,
    cliffDuration,
    totalDuration,
    revocable
  );
  const receipt = await createTx.wait();
  console.log("✓ Vesting schedule created!");
  console.log("Transaction hash:", receipt.hash);

  // Query the schedule
  console.log("\n" + "=".repeat(60));
  console.log("VESTING SCHEDULE DETAILS");
  console.log("=".repeat(60));

  const schedule = await vesting.vestingSchedules(beneficiary);
  const startTime = Number(schedule.start);
  const cliffTime = Number(schedule.cliff);
  const endTime = startTime + Number(schedule.duration);

  console.log("\nSchedule Info:");
  console.log("- Start Time:", new Date(startTime * 1000).toLocaleString());
  console.log("- Cliff Time:", new Date(cliffTime * 1000).toLocaleString());
  console.log("- End Time:", new Date(endTime * 1000).toLocaleString());
  console.log("- Total Amount:", hre.ethers.formatEther(schedule.amount), "TEST");
  console.log("- Released:", hre.ethers.formatEther(schedule.released), "TEST");
  console.log("- Revocable:", schedule.revocable);
  console.log("- Revoked:", schedule.revoked);

  // Check vested amount (should be 0 during cliff)
  const currentVested = await vesting.vestedAmount(beneficiary);
  console.log("\nCurrently Vested:", hre.ethers.formatEther(currentVested), "TEST");

  if (currentVested === 0n) {
    const now = Math.floor(Date.now() / 1000);
    const timeUntilCliff = cliffTime - now;
    console.log("\n⏳ Still in cliff period!");
    console.log("Wait", timeUntilCliff, "seconds for tokens to start vesting");
  }

  // Query events
  console.log("\n" + "=".repeat(60));
  console.log("RECENT EVENTS");
  console.log("=".repeat(60));

  const filter = vesting.filters.VestingScheduleCreated();
  const events = await vesting.queryFilter(filter, -100); // Last 100 blocks

  console.log("\nFound", events.length, "VestingScheduleCreated events:");
  events.forEach((event, index) => {
    console.log(`\n${index + 1}. Beneficiary: ${event.args.beneficiary}`);
    console.log(`   Amount: ${hre.ethers.formatEther(event.args.amount)} TEST`);
    console.log(`   Block: ${event.blockNumber}`);
  });

  console.log("\n" + "=".repeat(60));
  console.log("NEXT STEPS");
  console.log("=".repeat(60));
  console.log("\nTo test the full lifecycle:");
  console.log("1. Wait for cliff period to pass");
  console.log("2. Run this script to check vested amount:");
  console.log("   npx hardhat run scripts/check-vested.js --network", hre.network.name);
  console.log("3. Release tokens when vested:");
  console.log("   (Beneficiary needs to call vesting.release())");
  console.log("\nView on Basescan:");
  console.log("https://sepolia.basescan.org/address/" + vestingAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
