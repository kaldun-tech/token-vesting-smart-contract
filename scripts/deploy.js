const hre = require("hardhat");

async function main() {
  console.log("Starting deployment...");
  console.log("Network:", hre.network.name);

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Deploy MockERC20 token for testing
  console.log("\n1. Deploying MockERC20...");
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const token = await MockERC20.deploy("Test Token", "TEST");
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✓ MockERC20 deployed to:", tokenAddress);

  // Deploy TokenVesting contract
  console.log("\n2. Deploying TokenVesting...");
  const TokenVesting = await hre.ethers.getContractFactory("TokenVesting");
  const vesting = await TokenVesting.deploy(tokenAddress);
  await vesting.waitForDeployment();
  const vestingAddress = await vesting.getAddress();
  console.log("✓ TokenVesting deployed to:", vestingAddress);

  // Mint some test tokens to the deployer
  if (hre.network.name !== "mainnet") {
    console.log("\n3. Minting test tokens...");
    const mintAmount = hre.ethers.parseEther("1000000"); // 1 million tokens
    const mintTx = await token.mint(deployer.address, mintAmount);
    await mintTx.wait();
    console.log("✓ Minted", hre.ethers.formatEther(mintAmount), "TEST tokens to deployer");
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("MockERC20:", tokenAddress);
  console.log("TokenVesting:", vestingAddress);
  console.log("=".repeat(60));

  // Verification instructions
  if (hre.network.name === "baseSepolia") {
    console.log("\nTo verify contracts on Basescan, run:");
    console.log(`npx hardhat verify --network baseSepolia ${tokenAddress} "Test Token" "TEST"`);
    console.log(`npx hardhat verify --network baseSepolia ${vestingAddress} ${tokenAddress}`);
  }

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      MockERC20: tokenAddress,
      TokenVesting: vestingAddress,
    },
  };

  const outputPath = `./deployments/${hre.network.name}.json`;
  fs.mkdirSync("./deployments", { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\nDeployment info saved to:", outputPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
