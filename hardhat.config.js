require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-network-helpers");
require("dotenv/config");

// Import custom tasks
require("./tasks/vesting-tasks");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
    },
    hederaTestnet: {
      url: "https://testnet.hashio.io/api",
      accounts: process.env.HEDERA_PRIVATE_KEY ? [process.env.HEDERA_PRIVATE_KEY] : [],
      chainId: 296,
      gasPrice: 540_000_000_000,  // 540 Gwei (Hedera's minimum gas price in wei)
      gas: 3_000_000,  // Default gas limit
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || process.env.BASESCAN_API_KEY || "",
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      },
      {
        network: "hederaTestnet",
        chainId: 296,
        urls: {
          apiURL: "https://testnet.hashio.io/api",
          browserURL: "https://testnet.hedera.hashscan.io"
        }
      }
    ]
  },
  sourcify: {
    enabled: false
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },
  mocha: {
    timeout: 60000, // 60 seconds - allows time for contract deployment in first test
  },
};
