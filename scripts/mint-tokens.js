const hre = require("hardhat");

async function main() {
  // Use your deployed token address
  const tokenAddress = "0x495D01f0Ec6E7701A6Ecc04045E4bB59F027e1E0";

  const [signer] = await hre.ethers.getSigners();
  console.log("Minting with account:", signer.address);

  const token = await hre.ethers.getContractAt("MockERC20", tokenAddress);

  const mintAmount = hre.ethers.parseEther("1000000"); // 1 million tokens
  console.log("Minting", hre.ethers.formatEther(mintAmount), "tokens...");

  const tx = await token.mint(signer.address, mintAmount);
  await tx.wait();

  console.log("✓ Tokens minted successfully!");

  const balance = await token.balanceOf(signer.address);
  console.log("Your balance:", hre.ethers.formatEther(balance), "TEST");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
