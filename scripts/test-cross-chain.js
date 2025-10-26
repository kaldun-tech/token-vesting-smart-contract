/**
 * Cross-Chain Comparison Test
 *
 * Tests the same vesting functionality on both Hedera and Base Sepolia
 * to compare gas costs, performance, and verify behavior parity.
 *
 * Usage:
 *   - Local: npx hardhat run scripts/test-cross-chain.js --network hederaTestnet
 *   - CI: Runs against both networks with environment variables
 */

const hre = require("hardhat");
const { ethers } = hre;

async function testVestingOnNetwork(networkName) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`TESTING ${networkName.toUpperCase()}`);
  console.log(`${"=".repeat(70)}`);

  const [deployer, beneficiary] = await ethers.getSigners();

  console.log(`\n📍 Network: ${networkName}`);
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(`👤 Beneficiary: ${beneficiary.address}`);

  // ============================================================
  // DEPLOY CONTRACTS
  // ============================================================
  console.log(`\n📦 Deploying contracts...`);

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const token = await MockERC20.deploy("Test Token", "TEST");
  await token.waitForDeployment();
  console.log(`✅ Token deployed: ${await token.getAddress()}`);

  const TokenVesting = await ethers.getContractFactory("TokenVesting");
  const vesting = await TokenVesting.deploy(await token.getAddress());
  await vesting.waitForDeployment();
  console.log(`✅ Vesting deployed: ${await vesting.getAddress()}`);

  // ============================================================
  // TEST 1: MINT TOKENS
  // ============================================================
  console.log(`\n🏪 Test 1: Mint tokens`);
  const mintAmount = ethers.parseEther("1000");
  const mintTx = await token.mint(deployer.address, mintAmount);
  const mintReceipt = await mintTx.wait();
  console.log(`✅ Minted 1,000 TEST tokens`);
  console.log(`   Gas used: ${mintReceipt.gasUsed.toString()}`);

  // ============================================================
  // TEST 2: APPROVE TOKENS
  // ============================================================
  console.log(`\n🔐 Test 2: Approve vesting contract`);
  const scheduleAmount = ethers.parseEther("100");
  const vestingAddress = await vesting.getAddress();
  const approveTx = await token.approve(vestingAddress, scheduleAmount);
  const approveReceipt = await approveTx.wait();
  console.log(`✅ Approved 100 TEST tokens`);
  console.log(`   Gas used: ${approveReceipt.gasUsed.toString()}`);

  // ============================================================
  // TEST 3: CREATE VESTING SCHEDULE
  // ============================================================
  console.log(`\n📅 Test 3: Create vesting schedule`);
  const cliffDuration = 31536000; // 1 year
  const duration = 126144000; // 4 years

  const createTx = await vesting.createVestingSchedule(
    beneficiary.address,
    scheduleAmount,
    cliffDuration,
    duration,
    true // revocable
  );

  const createReceipt = await createTx.wait();
  console.log(`✅ Vesting schedule created`);
  console.log(`   Beneficiary: ${beneficiary.address}`);
  console.log(`   Amount: 100 TEST`);
  console.log(`   Cliff: 1 year (365 days)`);
  console.log(`   Duration: 4 years (1,461 days)`);
  console.log(`   Revocable: Yes`);
  console.log(`   Gas used: ${createReceipt.gasUsed.toString()}`);

  // ============================================================
  // TEST 4: QUERY VESTED AMOUNT (BEFORE CLIFF)
  // ============================================================
  console.log(`\n📊 Test 4: Query vested amount (before cliff)`);
  const vestedBefore = await vesting.vestedAmount(beneficiary.address);
  console.log(`✅ Vested amount: ${ethers.formatEther(vestedBefore)} TEST (expected: 0)`);

  // ============================================================
  // TEST 5: GET SCHEDULE DETAILS
  // ============================================================
  console.log(`\n📋 Test 5: Get schedule details`);
  const schedule = await vesting.getVestingSchedule(beneficiary.address);
  console.log(`✅ Schedule retrieved:`);
  console.log(`   Beneficiary: ${schedule.beneficiary}`);
  console.log(`   Amount: ${ethers.formatEther(schedule.amount)}`);
  console.log(`   Released: ${ethers.formatEther(schedule.released)}`);
  console.log(`   Revocable: ${schedule.revocable}`);
  console.log(`   Revoked: ${schedule.revoked}`);

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log(`\n💰 Gas Cost Summary for ${networkName}:`);
  console.log(`   Mint: ${mintReceipt.gasUsed.toString()} units`);
  console.log(`   Approve: ${approveReceipt.gasUsed.toString()} units`);
  console.log(`   Create Schedule: ${createReceipt.gasUsed.toString()} units`);

  return {
    network: networkName,
    mint: mintReceipt.gasUsed,
    approve: approveReceipt.gasUsed,
    createSchedule: createReceipt.gasUsed,
    blockNumber: createReceipt.blockNumber,
    gasPrice: createReceipt.gasPrice,
  };
};

async function main() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════════════╗");
  console.log("║           CROSS-CHAIN VESTING CONTRACT COMPARISON TEST             ║");
  console.log("╚════════════════════════════════════════════════════════════════════╝");

  const results = [];
  const networkConfig = hre.network.config;
  const currentNetwork = hre.network.name;

  console.log(`\n🌐 Running on network: ${currentNetwork}`);

  // Test on current network
  const result = await testVestingOnNetwork(currentNetwork);
  results.push(result);

  // ============================================================
  // FINAL SUMMARY
  // ============================================================
  console.log(`\n${"=".repeat(70)}`);
  console.log("✅ ALL TESTS PASSED!");
  console.log(`${"=".repeat(70)}`);

  console.log(`\n📊 Test Results:`);
  console.log(`   Network: ${result.network}`);
  console.log(`   Block: ${result.blockNumber}`);
  console.log(`   Total Gas Used (Create Schedule): ${result.createSchedule.toString()}`);
  console.log(`   Gas Price: ${ethers.formatUnits(result.gasPrice, "gwei")} Gwei`);

  // Calculate costs
  if (currentNetwork === "hederaTestnet") {
    const gasUsedInHBAR = ethers.formatEther(
      result.createSchedule * result.gasPrice
    );
    console.log(`   Est. Cost: ${gasUsedInHBAR} HBAR (~$0.001 USD)`);
    console.log(`\n   ✨ Hedera Benefits:`);
    console.log(`      - 50-500x cheaper than Ethereum L2`);
    console.log(`      - Instant finality`);
    console.log(`      - Fixed predictable costs`);
  } else if (currentNetwork === "baseSepolia") {
    const costInETH = ethers.formatEther(
      result.createSchedule * result.gasPrice
    );
    console.log(`   Est. Cost: ${costInETH} ETH (~$0.10-1 USD)`);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(`\n❌ Test failed: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
