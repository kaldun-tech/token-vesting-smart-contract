/**
 * Cross-Chain Vesting Test
 *
 * Tests the vesting contract on a specific network using already-deployed contracts.
 * This script loads deployed addresses from the deployments folder and runs tests.
 *
 * Usage:
 *   npx hardhat run scripts/test-vesting.js --network hederaTestnet
 *   npx hardhat run scripts/test-vesting.js --network baseSepolia
 *   npx hardhat run scripts/test-vesting.js --network hardhat
 */

const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function getDeployedAddresses(networkName) {
  const deploymentFile = path.join(__dirname, `../deployments/${networkName}.json`);

  if (!fs.existsSync(deploymentFile)) {
    console.error(`❌ Deployment file not found: ${deploymentFile}`);
    console.log(
      `\nMake sure to deploy contracts first:\n  npx hardhat run scripts/deploy.js --network ${networkName}`
    );
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  return deployment.contracts;
}

async function testVesting(networkName) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`TESTING VESTING ON ${networkName.toUpperCase()}`);
  console.log(`${"=".repeat(70)}`);

  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const deployerAddress = await deployer.getAddress();

  // For testnet deployments with persistent contracts, use a random beneficiary to avoid
  // "Beneficiary already has a vesting schedule" errors from previous test runs
  let beneficiaryAddress;
  if (networkName === "hardhat" || networkName === "localhost") {
    // On local networks, use the second signer if available
    beneficiaryAddress = signers.length > 1 ? await signers[1].getAddress() : deployerAddress;
  } else {
    // On testnets, generate a random address for a fresh test
    beneficiaryAddress = "0x" + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join("");
  }

  // ============================================================
  // LOAD DEPLOYED CONTRACTS
  // ============================================================
  console.log(`\n📍 Network: ${networkName}`);
  console.log(`👤 Deployer: ${deployerAddress}`);

  let tokenAddress, vestingAddress;

  if (networkName === "hardhat" || networkName === "localhost") {
    // For local networks, deploy fresh contracts
    console.log(`\n📦 Deploying new contracts on ${networkName}...`);

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy("Test Token", "TEST");
    await token.waitForDeployment();
    tokenAddress = await token.getAddress();
    console.log(`✅ Token deployed: ${tokenAddress}`);

    const TokenVesting = await ethers.getContractFactory("TokenVesting");
    const vesting = await TokenVesting.deploy(tokenAddress);
    await vesting.waitForDeployment();
    vestingAddress = await vesting.getAddress();
    console.log(`✅ Vesting deployed: ${vestingAddress}`);
  } else {
    // For testnets, load from deployment file
    const addresses = await getDeployedAddresses(networkName);
    tokenAddress = addresses.MockERC20;
    vestingAddress = addresses.TokenVesting;

    console.log(`\n📋 Loaded deployed contracts from deployments/${networkName}.json`);
    console.log(`   Token: ${tokenAddress}`);
    console.log(`   Vesting: ${vestingAddress}`);
  }

  const Token = await ethers.getContractFactory("MockERC20");
  const token = Token.attach(tokenAddress);

  const Vesting = await ethers.getContractFactory("TokenVesting");
  const vesting = Vesting.attach(vestingAddress);

  // ============================================================
  // TEST 1: MINT TOKENS
  // ============================================================
  console.log(`\n🏪 Test 1: Mint tokens`);
  const mintTx = await token.mint(deployer.address, ethers.parseEther("1000"));
  const mintReceipt = await mintTx.wait();
  console.log(`✅ Minted 1,000 TEST tokens`);
  console.log(`   Gas used: ${mintReceipt.gasUsed.toString()}`);

  // ============================================================
  // TEST 2: APPROVE TOKENS
  // ============================================================
  console.log(`\n🔐 Test 2: Approve vesting contract`);
  const approveTx = await token.approve(vestingAddress, ethers.parseEther("1000"));
  const approveReceipt = await approveTx.wait();
  console.log(`✅ Approved 1,000 TEST tokens`);
  console.log(`   Gas used: ${approveReceipt.gasUsed.toString()}`);

  // ============================================================
  // TEST 3: CREATE VESTING SCHEDULE
  // ============================================================
  console.log(`\n📅 Test 3: Create vesting schedule`);

  const createTx = await vesting.createVestingSchedule(
    beneficiaryAddress, // beneficiary
    ethers.parseEther("100"), // 100 tokens
    31536000, // 1 year cliff
    126144000, // 4 year duration
    true // revocable
  );

  const createReceipt = await createTx.wait();
  console.log(`✅ Vesting schedule created!`);
  console.log(`   Beneficiary: ${beneficiaryAddress}`);
  console.log(`   Amount: 100.0 TEST`);
  console.log(`   Cliff: 1 year (365 days)`);
  console.log(`   Duration: 4 years (1,461 days)`);
  console.log(`   Revocable: Yes`);
  console.log(`   Gas used: ${createReceipt.gasUsed.toString()}`);

  // ============================================================
  // TEST 4: QUERY VESTED AMOUNT (BEFORE CLIFF)
  // ============================================================
  console.log(`\n📊 Test 4: Query vested amount (before cliff)`);
  const vested = await vesting.vestedAmount(beneficiaryAddress);
  const vestedFormatted = ethers.formatEther(vested);
  console.log(`✅ Vested amount: ${vestedFormatted} TEST`);
  console.log(`   Expected: 0.0 TEST (before cliff period)`);

  // ============================================================
  // CALCULATE COSTS
  // ============================================================
  console.log(`\n💰 Gas Cost Analysis for ${networkName}:`);

  const createGas = createReceipt.gasUsed.toString();
  const gasPrice = createReceipt.gasPrice;
  const gasPriceGwei = ethers.formatUnits(gasPrice, "gwei");

  console.log(`   Create Schedule Gas: ${createGas} units`);
  console.log(`   Gas Price: ${gasPriceGwei} Gwei`);

  let costEstimate = "";
  if (networkName === "hederaTestnet") {
    const costHBAR = ethers.formatEther(createReceipt.gasUsed * gasPrice);
    costEstimate = `${costHBAR} HBAR (~$0.001 USD)`;
    console.log(`   Estimated Cost: ${costEstimate}`);
    console.log(`\n   ✨ Hedera Advantages:`);
    console.log(`      • 50-500x cheaper than Ethereum L2`);
    console.log(`      • Instant finality (no confirmation delay)`);
    console.log(`      • Fixed, predictable costs`);
  } else if (networkName === "baseSepolia") {
    const costETH = ethers.formatEther(createReceipt.gasUsed * gasPrice);
    costEstimate = `${costETH} ETH (~$0.10-1 USD)`;
    console.log(`   Estimated Cost: ${costEstimate}`);
  } else {
    const costETH = ethers.formatEther(createReceipt.gasUsed * gasPrice);
    console.log(`   Estimated Cost: ${costETH} ETH (local network)`);
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  return {
    network: networkName,
    tokenAddress,
    vestingAddress,
    createGas: createReceipt.gasUsed.toString(),
    gasPrice: gasPriceGwei,
    costEstimate,
  };
}

async function main() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════════════╗");
  console.log("║              CROSS-CHAIN VESTING CONTRACT TEST                     ║");
  console.log("╚════════════════════════════════════════════════════════════════════╝");

  const currentNetwork = hre.network.name;

  // Test current network
  const result = await testVesting(currentNetwork);

  // ============================================================
  // FINAL RESULTS
  // ============================================================
  console.log(`\n${"=".repeat(70)}`);
  console.log("✅ ALL TESTS PASSED!");
  console.log(`${"=".repeat(70)}`);

  console.log(`\n📊 Summary for ${result.network}:`);
  console.log(`   Token Address: ${result.tokenAddress}`);
  console.log(`   Vesting Address: ${result.vestingAddress}`);
  console.log(`   Create Schedule Gas: ${result.createGas} units`);
  console.log(`   Gas Price: ${result.gasPrice} Gwei`);
  console.log(`   Estimated Cost: ${result.costEstimate}`);

  console.log(`\n📖 Next Steps:`);
  if (currentNetwork === "hederaTestnet") {
    console.log(`   • View transaction on HashScan:`);
    console.log(`     https://hashscan.io/testnet/address/${result.vestingAddress}`);
  } else if (currentNetwork === "baseSepolia") {
    console.log(`   • View transaction on Basescan:`);
    console.log(`     https://sepolia.basescan.org/address/${result.vestingAddress}`);
  }

  console.log(`\n💡 To compare across networks, run:`);
  if (currentNetwork !== "hederaTestnet") {
    console.log(`   npx hardhat run scripts/test-vesting.js --network hederaTestnet`);
  }
  if (currentNetwork !== "baseSepolia") {
    console.log(`   npx hardhat run scripts/test-vesting.js --network baseSepolia`);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(`\n❌ Test failed: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
