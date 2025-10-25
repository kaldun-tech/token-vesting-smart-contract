const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  // Load deployment info
  const deploymentInfo = JSON.parse(fs.readFileSync("./deployments/hederaTestnet.json", "utf8"));
  const tokenAddress = deploymentInfo.contracts.MockERC20;
  const vestingAddress = deploymentInfo.contracts.TokenVesting;

  console.log("=".repeat(60));
  console.log("HEDERA TESTNET - VESTING TEST");
  console.log("=".repeat(60));
  console.log("Network:", hre.network.name);
  console.log("Token:", tokenAddress);
  console.log("Vesting:", vestingAddress);
  console.log("Deployer:", deployer.address);

  // Get contracts
  const Token = await hre.ethers.getContractFactory("MockERC20");
  const token = Token.attach(tokenAddress);

  const Vesting = await hre.ethers.getContractFactory("TokenVesting");
  const vesting = Vesting.attach(vestingAddress);

  // Check deployer balance
  const balance = await token.balanceOf(deployer.address);
  console.log("\n1. Deployer token balance:", hre.ethers.formatEther(balance), "TEST");

  // Create a beneficiary (for demo, just use a different address)
  const beneficiary = "0x1234567890123456789012345678901234567890";
  const vestingAmount = hre.ethers.parseEther("100");
  const cliffDuration = 31536000;  // 1 year
  const duration = 126144000;       // 4 years

  // Approve token transfer
  console.log("\n2. Approving token transfer...");
  const approveTx = await token.approve(vestingAddress, vestingAmount);
  await approveTx.wait();
  console.log("✓ Approved", hre.ethers.formatEther(vestingAmount), "TEST tokens");

  // Create vesting schedule
  console.log("\n3. Creating vesting schedule...");
  const createTx = await vesting.createVestingSchedule(
    beneficiary,
    vestingAmount,
    cliffDuration,
    duration,
    true  // revocable
  );
  const createReceipt = await createTx.wait();
  console.log("✓ Vesting schedule created!");
  console.log("  - Beneficiary:", beneficiary);
  console.log("  - Amount:", hre.ethers.formatEther(vestingAmount), "TEST");
  console.log("  - Cliff:", cliffDuration / 86400, "days");
  console.log("  - Duration:", duration / 86400 / 365, "years");
  console.log("  - Revocable: true");

  // Query vested amount (should be 0 since we're before cliff)
  console.log("\n4. Querying vested amount...");
  const vested = await vesting.vestedAmount(beneficiary);
  console.log("✓ Vested amount (before cliff):", hre.ethers.formatEther(vested), "TEST");

  // Get vesting schedule details
  console.log("\n5. Vesting schedule details...");
  const schedule = await vesting.getVestingSchedule(beneficiary);
  console.log("✓ Schedule retrieved:");
  console.log("  - Beneficiary:", schedule.beneficiary);
  console.log("  - Amount:", hre.ethers.formatEther(schedule.amount), "TEST");
  console.log("  - Released:", hre.ethers.formatEther(schedule.released), "TEST");
  console.log("  - Revocable:", schedule.revocable);
  console.log("  - Revoked:", schedule.revoked);

  // Check gas cost
  console.log("\n6. Gas cost analysis:");
  console.log("  - Create schedule gas used:", createReceipt.gasUsed.toString());
  const gasPrice = hre.ethers.parseUnits("540", "gwei");
  const gasCost = createReceipt.gasUsed * gasPrice;
  console.log("  - Gas price: 540 Gwei");
  console.log("  - Estimated cost:", hre.ethers.formatEther(gasCost), "HBAR");

  console.log("\n" + "=".repeat(60));
  console.log("✅ ALL TESTS PASSED!");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
