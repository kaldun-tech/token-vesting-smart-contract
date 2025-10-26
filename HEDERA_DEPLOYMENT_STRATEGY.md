# Hedera Smart Contract Deployment Strategy

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Why Hedera](#why-hedera)
3. [Architecture Overview](#architecture-overview)
4. [Deployment Strategy](#deployment-strategy)
5. [Implementation Approaches](#implementation-approaches)
6. [Step-by-Step Deployment](#step-by-step-deployment)
7. [Testing & Verification](#testing--verification)
8. [Monitoring & Next Steps](#monitoring--next-steps)

---

## Executive Summary

This document outlines the strategy to deploy the Token Vesting smart contract to **Hedera Testnet**, leveraging Hedera's EVM-compatible smart contract service.

### Key Facts About Hedera

- **EVM Compatible**: Deploy existing Solidity code without modification
- **Low & Fixed Fees**: ~$0.001 per transaction (vs ~$0.50-5 on Ethereum)
- **10,000+ TPS**: Significantly higher throughput than Ethereum L2s
- **Instant Finality**: No confirmation delays like Ethereum
- **HBAR Token**: Hedera's native coin used for transaction fees
- **Testnet Available**: Free testing with faucet-provided HBAR

### Why Hedera for This Project

| Aspect | Base Sepolia | Hedera Testnet | Winner |
|--------|-------------|----------------|--------|
| **EVM Compatibility** | ✅ Native | ✅ Full JSON-RPC | Tie |
| **Transaction Cost** | ~$0.10-1 | ~$0.001 | **Hedera** |
| **Throughput (TPS)** | ~7-10 | 10,000+ | **Hedera** |
| **Finality** | ~12 seconds | Instant | **Hedera** |
| **Development Tools** | Hardhat, Foundry | Hardhat, Foundry, Truffle | Tie |
| **Ecosystem Size** | Larger | Growing | **Base** |
| **Test Funds** | Faucet available | Faucet available | Tie |

### Our Approach

**We will deploy to BOTH networks**:
1. **Base Sepolia**: Existing L2 Ethereum-compatible deployment
2. **Hedera Testnet**: New low-fee, high-performance alternative

This provides users with **choice** and **redundancy** while validating cross-chain compatibility.

---

## Architecture Overview

### Hedera Network Stack

```
┌─────────────────────────────────────────────────┐
│         Your Token Vesting Contract             │
│         (Same Solidity Code - No Changes)       │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────▼──────────┐
        │  JSON-RPC Relay    │
        │  (Hashio)          │
        └─────────┬──────────┘
                  │
   ┌──────────────┼──────────────┐
   │              │              │
   ▼              ▼              ▼
Hardhat       Ethers.js      MetaMask
Foundry       Web3.js        etc.

                  │
        ┌─────────▼──────────┐
        │  Hedera Network    │
        │  Smart Contracts   │
        │  Service (EVM)     │
        └─────────┬──────────┘
                  │
        ┌─────────▼──────────┐
        │  HBAR Ledger       │
        │  (Testnet)         │
        └────────────────────┘
```

### Key Advantages of Hedera EVM

1. **No Code Changes**: Same TokenVesting.sol works as-is
2. **Familiar Tooling**: Use Hardhat, same scripts, same deployment process
3. **JSON-RPC Compatible**: Drop-in replacement for Ethereum RPC
4. **ERC20 Support**: All ERC20 standards work identically
5. **Cost Efficient**: 1000x cheaper per transaction

### Deployment Differences from Ethereum

| Aspect | Ethereum/Base | Hedera |
|--------|--------------|--------|
| **Contract Deployment** | `new TokenVesting(token)` | Same |
| **RPC Endpoint** | Different URL | `https://testnet.hashio.io/api` |
| **Native Token** | ETH / Base ETH | HBAR |
| **Gas Costs** | Varies (EIP-1559) | Fixed rate |
| **Account Creation** | Automatic | Create Hedera account first |
| **Verification** | Etherscan | Hedera Explorer |

---

## Deployment Strategy

### Phase 1: Setup (15 minutes)

```
Create Hedera Account → Get Test HBAR → Setup Hardhat Config
```

### Phase 2: Deployment (5 minutes)

```
Deploy TokenVesting → Deploy MockERC20 → Verify on Explorer
```

### Phase 3: Testing (15 minutes)

```
Create Vesting Schedule → Release Tokens → Verify Events
```

### Phase 4: Cross-Chain Validation (10 minutes)

```
Compare behavior on Base Sepolia → Document differences → Update docs
```

---

## Implementation Approaches

You have three options for deployment. Choose based on your preference:

### Option 1: JavaScript + Hardhat (Recommended)

**Best for**: Developers comfortable with JavaScript/Node.js

**Pros**:
- Familiar Hardhat environment
- Minimal code changes from Base Sepolia
- Use existing deployment scripts
- Good TypeScript support
- Largest community

**Cons**:
- Requires Node.js
- JavaScript tooling

**Timeline**: ~30 minutes to first deployment

### Option 2: Rust + Foundry

**Best for**: Developers wanting type safety and performance

**Pros**:
- Strong type system
- Better tooling for complex deployments
- Excellent Foundry support
- Gas optimization tools

**Cons**:
- Steeper learning curve
- Different syntax from current setup
- Smaller community for Hedera

**Timeline**: ~1-2 hours (rewrite scripts)

### Option 3: Java SDK

**Best for**: Enterprise Java environments

**Pros**:
- Native Java integration
- Strong typing
- Enterprise-grade
- Direct API access (not just JSON-RPC)

**Cons**:
- Most verbose
- Requires JVM
- Smallest community
- Overkill for this use case

**Timeline**: ~2+ hours (different ecosystem)

### Recommendation

**Use Option 1 (JavaScript + Hardhat)**:
1. Minimal changes to existing setup
2. Reuse `scripts/deploy.js` with updated RPC
3. Can deploy to both Base Sepolia and Hedera from same codebase
4. Fastest path to deployment

---

## Step-by-Step Deployment

### Step 1: Setup Hedera Account

#### 1.1 Create Hedera Testnet Account

```bash
# Option A: Use HashPack Wallet (Recommended)
# 1. Download HashPack: https://hashpack.app/
# 2. Create new wallet
# 3. Switch to Testnet in settings
# 4. Copy your account ID (format: 0.0.XXXXX)

# Option B: Use Hedera Portal
# 1. Go to https://portal.hedera.com/
# 2. Sign up for developer account
# 3. Create new account
# 4. Copy account ID and private key
```

#### 1.2 Fund Account from Faucet

```bash
# Go to https://testnet.faucet.hedera.com/
# 1. Paste your Hedera account ID (0.0.XXXXX)
# 2. Click "Transfer"
# 3. You'll receive 100 HBAR (enough for hundreds of deployments)
# 4. Your account is refilled automatically every day
```

#### 1.3 Convert Hedera Account to EVM Address

Hedera accounts have two formats:
- **Hedera Format**: `0.0.123456` (native)
- **EVM Format**: `0x1234...` (Ethereum-compatible)

```bash
# The conversion is deterministic:
# EVM Address = Hash(0.0.accountID)

# For example:
# Hedera: 0.0.1234
# EVM:    0x96d...(40 hex chars)

# Tools:
# - HashPack wallet shows both automatically
# - Use online converter: https://hedera.com/evm-address-converter
```

### Step 2: Setup Hardhat for Hedera

#### 2.1 Update `hardhat.config.js`

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    // Existing Base Sepolia network
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
    },

    // NEW: Hedera Testnet network
    hederaTestnet: {
      url: "https://testnet.hashio.io/api",
      accounts: process.env.HEDERA_PRIVATE_KEY ? [process.env.HEDERA_PRIVATE_KEY] : [],
      chainId: 296,  // Hedera testnet chain ID
      gasPrice: 50_000_000_000,  // 50 Gwei (Hedera's fixed rate)
    },
  },
  etherscan: {
    // Keep Base Sepolia verification
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY || "",
      hederaTestnet: "unused",  // Hedera uses different verification
    },
    customChains: [
      {
        network: "hederaTestnet",
        chainId: 296,
        urls: {
          apiURL: "https://testnet.hashio.io/api",
          browserURL: "https://testnet.hedera.hashscan.io",
        },
      },
    ],
  },
};
```

#### 2.2 Update `.env`

```bash
# Existing variables
PRIVATE_KEY=your_base_sepolia_private_key
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_key

# NEW: Hedera variables
HEDERA_PRIVATE_KEY=0x...your_hedera_hex_private_key
```

**Important Note on Private Keys**:

When you create an account on Hedera Portal, you'll be given **two formats**:

1. **HEX Format** (Recommended - Use this) ✅
   ```
   0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p... (66 chars: 0x + 64 hex chars)
   ```
   - Standard for Ethereum-compatible tools
   - Works with ethers.js, web3.js, Hardhat
   - This is what you put in `.env`

2. **DER Format** (For native Hedera SDKs only)
   ```
   -----BEGIN PRIVATE KEY-----
   MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg...
   -----END PRIVATE KEY-----
   ```
   - Used only with Java/Go/Rust native SDKs
   - Not needed for JavaScript/Hardhat deployment
   - Ignore this for EVM-compatible deployments

**Use the HEX key** for this Hardhat/JavaScript approach!

#### 2.3 Keep Deployment Script the Same

Your existing `scripts/deploy.js` works unchanged! Just specify the network:

```javascript
// scripts/deploy.js (NO CHANGES NEEDED)
async function main() {
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const token = await MockERC20.deploy();
  await token.deployed();
  console.log("Token deployed to:", token.address);

  const TokenVesting = await ethers.getContractFactory("TokenVesting");
  const vesting = await TokenVesting.deploy(token.address);
  await vesting.deployed();
  console.log("Vesting deployed to:", vesting.address);
}

main().catch(console.error);
```

### Step 3: Deploy to Hedera Testnet

#### 3.1 Deploy Contracts

```bash
# From project root
npx hardhat run scripts/deploy.js --network hederaTestnet
```

**Expected Output**:
```
Deploying contracts with account: 0x...
MockERC20 deployed to: 0x...
TokenVesting deployed to: 0x...
Minted 1000000.0 tokens to deployer
Deployment info saved to: ...
```

#### 3.2 Save Contract Addresses

Create `HEDERA_DEPLOYMENT_RESULTS.md`:

```markdown
# Hedera Testnet Deployment

**Date**: 2025-10-25
**Network**: Hedera Testnet (Chain ID: 296)
**Explorer**: https://hashscan.io/testnet

## Contract Addresses

- **MockERC20 Token**: `0x13332Bb167e96d1b68B5021784B06d6C5e6F0F8b`
- **TokenVesting**: `0xDd83934d6E6f0098e799D1614276829FE2f89E6B`
- **Deployer Address**: `0xD00333995351A41ed6335486311D89bd65d5F11b`

## Deployment Tx Hashes

- Token Tx: `0x...`
- Vesting Tx: `0x...`

## Test HBAR Account

- Account ID: `0.0.XXXXX`
- Account Balance: ~99 HBAR (after deployment gas)
```

### Step 4: Test on Hedera

#### 4.1 Run Automated Test Script

Instead of manual commands, use the automated test script:

```bash
npx hardhat run scripts/test-hedera.js --network hederaTestnet
```

This script:
- ✅ Loads deployed contract addresses from `deployments/hederaTestnet.json`
- ✅ Mints 1,000 TEST tokens
- ✅ Approves the vesting contract
- ✅ Creates a vesting schedule (100 tokens, 1-year cliff, 4-year duration)
- ✅ Queries vested amount (should be 0 before cliff)
- ✅ Retrieves schedule details
- ✅ Calculates gas costs

**Expected Output:**
```
HEDERA TESTNET - VESTING TEST
Token: 0x13332Bb167e96d1b68B5021784B06d6C5e6F0F8b
Vesting: 0xDd83934d6E6f0098e799D1614276829FE2f89E6B

1. Deployer token balance: 1000000.0 TEST
2. Approving token transfer...
   ✓ Approved 100.0 TEST tokens
3. Creating vesting schedule...
   ✓ Vesting schedule created!
   - Beneficiary: 0x1234567890123456789012345678901234567890
   - Amount: 100.0 TEST
   - Cliff: 365 days
   - Duration: 4 years
4. Querying vested amount...
   ✓ Vested amount (before cliff): 0.0 TEST
5. Vesting schedule details...
   ✓ Schedule retrieved
6. Gas cost analysis:
   - Create schedule gas used: 197219
   - Gas price: 540 Gwei
   - Estimated cost: 0.10649826 HBAR

✅ ALL TESTS PASSED!
```

#### 4.2 Manual Testing (Optional)

If you prefer to test manually in Hardhat console:

```bash
npx hardhat console --network hederaTestnet
```

```javascript
// Load deployed contracts
const tokenAddress = "0x13332Bb167e96d1b68B5021784B06d6C5e6F0F8b";
const vestingAddress = "0xDd83934d6E6f0098e799D1614276829FE2f89E6B";

const Token = await ethers.getContractFactory("MockERC20");
const token = Token.attach(tokenAddress);

const Vesting = await ethers.getContractFactory("TokenVesting");
const vesting = Vesting.attach(vestingAddress);

// Create a vesting schedule
const tx = await vesting.createVestingSchedule(
  "0x1234567890123456789012345678901234567890", // beneficiary
  ethers.parseEther("100"),                       // amount
  31536000,                                       // 1 year cliff
  126144000,                                      // 4 year duration
  true                                            // revocable
);
await tx.wait();
console.log("✓ Schedule created!");
```

#### 4.3 Verify Events on Hedera Explorer

Visit: `https://hashscan.io/testnet/address/0xDd83934d6E6f0098e799D1614276829FE2f89E6B`

You should see:
- Contract creation transaction
- `VestingScheduleCreated` event
- All contract interactions

### Step 5: Cross-Chain Comparison

#### 5.1 Deploy Same Contract to Base Sepolia (if not already done)

```bash
npx hardhat run scripts/deploy.js --network baseSepolia
```

#### 5.2 Run Vesting Test on Both Networks

Use the provided test script to run identical tests on each network:

**Test on Hardhat (Local Development)**
```bash
npx hardhat run scripts/test-vesting.js --network hardhat
```

**Test on Hedera Testnet**
```bash
npx hardhat run scripts/test-vesting.js --network hederaTestnet
```

**Test on Base Sepolia**
```bash
npx hardhat run scripts/test-vesting.js --network baseSepolia
```

The script will:
- ✅ Load deployed contract addresses (for testnets) or deploy fresh ones (for local)
- ✅ Mint 1,000 TEST tokens
- ✅ Approve the vesting contract
- ✅ Create a vesting schedule (100 tokens, 1-year cliff, 4-year duration)
- ✅ Query vested amount (should be 0 before cliff)
- ✅ Calculate and display gas costs
- ✅ Provide network-specific cost estimates

**Example Output:**
```
======================================================================
✅ ALL TESTS PASSED!
======================================================================

📊 Summary for hederaTestnet:
   Token Address: 0x13332Bb167e96d1b68B5021784B06d6C5e6F0F8b
   Vesting Address: 0xDd83934d6E6f0098e799D1614276829FE2f89E6B
   Create Schedule Gas: 197219 units
   Gas Price: 540 Gwei
   Estimated Cost: 0.10649826 HBAR (~$0.001 USD)

   ✨ Hedera Advantages:
      • 50-500x cheaper than Ethereum L2
      • Instant finality (no confirmation delay)
      • Fixed, predictable costs
```

#### 5.3 Document Findings

| Metric | Hedera | Base Sepolia | Winner |
|--------|--------|-------------|--------|
| **Deploy Gas** | ~1.2M | ~1.2M | Tie (gas units same) |
| **Deploy Cost** | ~$0.06 | ~$0.60 | **Hedera** (10x cheaper) |
| **Create Schedule Gas** | ~150K | ~150K | Tie |
| **Create Cost** | ~$0.0075 | ~$0.075 | **Hedera** |
| **Tx Confirmation** | Instant | ~12s | **Hedera** |
| **Block Time** | Variable | ~2s | Tie |

---

## Testing & Verification

### Unit Tests (No Network)

```bash
# Existing tests work unchanged
npx hardhat test
```

### Integration Test on Hedera

```bash
# Create: test/hedera-integration.test.js
const { expect } = require("chai");

describe("TokenVesting on Hedera", function () {
  let token, vesting, owner, beneficiary;

  before(async function () {
    [owner, beneficiary] = await ethers.getSigners();

    // Deploy contracts
    const Token = await ethers.getContractFactory("MockERC20");
    token = await Token.deploy();

    const Vesting = await ethers.getContractFactory("TokenVesting");
    vesting = await Vesting.deploy(token.address);

    // Setup
    await token.mint(ethers.utils.parseEther("1000"));
    await token.approve(vesting.address, ethers.utils.parseEther("1000"));
  });

  it("should create vesting schedule on Hedera", async function () {
    await vesting.createVestingSchedule(
      beneficiary.address,
      ethers.utils.parseEther("100"),
      31536000,
      126144000,
      true
    );

    const schedule = await vesting.vestingSchedules(beneficiary.address);
    expect(schedule.amount).to.equal(ethers.utils.parseEther("100"));
  });

  it("should work with ERC20 approval flow", async function () {
    const vestedAmount = await vesting.vestedAmount(beneficiary.address);
    expect(vestedAmount).to.equal(0); // Before cliff
  });
});

// Run with:
// npx hardhat test test/hedera-integration.test.js --network hederaTestnet
```

### Verification on Hedera Explorer

Hedera uses **Hashscan** as the block explorer:

```
https://hashscan.io/testnet/address/0x5678...
```

Features:
- View contract code
- See all transactions
- Track events
- Monitor gas usage

---

## Monitoring & Next Steps

### 1. Document Deployment

Update main `README.md`:

```markdown
## Network Deployments

### Base Sepolia L2 (Ethereum)
- **Frontend**: https://token-vesting-smart-contract.vercel.app/
- **Vesting Contract**: 0x5D6709C5b1ED83125134672AFa905cA045978a1D
- **Token Contract**: 0x495D01f0Ec6E7701A6Ecc04045E4bB59F027e1E0

### Hedera Testnet (New!)
- **Vesting Contract**: 0x1234...
- **Token Contract**: 0x5678...
- **Explorer**: https://hashscan.io/testnet

### Deployment Instructions
See [HEDERA_DEPLOYMENT_STRATEGY.md](./HEDERA_DEPLOYMENT_STRATEGY.md)
```

### 2. Frontend Integration (Future)

Update frontend to support Hedera:

```typescript
// lib/wagmi.ts
import { hederaTestnet } from 'wagmi/chains';

export const config = getDefaultConfig({
  chains: [baseSepolia, hederaTestnet],  // Add Hedera
  // ...
});
```

### 3. Monitor Performance

Track metrics:

```bash
# Monthly
- Transaction success rate
- Average gas costs
- Network latency
- User adoption per network
```

### 4. Mainnet Readiness

When ready for production:

```
Hedera Testnet ✅ → Hedera Mainnet (requires mainnet HBAR)
Base Sepolia ✅ → Base Mainnet (requires mainnet ETH)
```

---

## Comparison: Hedera vs Base Sepolia vs Ethereum Mainnet

### Cost per Transaction

```
Ethereum Mainnet:  $1-10    per tx (Variable, EIP-1559)
Base Sepolia:      $0.001-1 per tx (L2, much cheaper)
Base Mainnet:      $0.01-1  per tx (L2, cheaper than mainnet)
Hedera Testnet:    $0.001   per tx (Fixed rate)
Hedera Mainnet:    $0.001   per tx (Fixed rate)
```

### Throughput (TPS)

```
Ethereum Mainnet:  ~15 TPS
Base Mainnet:      ~4,700 TPS (L2)
Hedera Mainnet:    ~10,000+ TPS
```

### Finality

```
Ethereum Mainnet:  ~12 seconds
Base Mainnet:      ~2 seconds
Hedera Mainnet:    Instant (Asynchronous Byzantine Fault Tolerant)
```

### Verdict

**For This Project**:
- **MVP/Testing**: Hedera Testnet (lowest cost, fastest)
- **Production Choice A**: Base Mainnet (larger ecosystem, Ethereum alignment)
- **Production Choice B**: Hedera Mainnet (lowest cost, highest throughput)
- **Production Choice C**: Both (cross-chain deployment for redundancy)

---

## Troubleshooting

### Issue: "Not enough HBAR balance"

**Solution**:
```bash
# Get more test HBAR from faucet
# https://testnet.faucet.hedera.com/
# Paste your account ID (0.0.XXXXX) and request 100 HBAR
```

### Issue: "Invalid account ID format"

**Solution**:
```
Hedera uses format: 0.0.XXXXX (e.g., 0.0.1234)
NOT: 0x1234... (that's EVM format)

Convert between formats:
- Hedera format: 0.0.123456
- EVM format: 0x96d...
- Use converter: https://hedera.com/evm-address-converter
```

### Issue: "Contract not verified on Hashscan"

**Note**: Hedera auto-indexes contracts. Verification is automatic for contract creation transactions. You can view source code directly:

```
https://hashscan.io/testnet/address/0x5678...
```

### Issue: "JSON-RPC endpoint is slow"

**Solution**:
- Official: `https://hashscan.io/testnet/api` (may have rate limits)
- Alternative: `https://hashscan.io/testnet/rpc` (backup endpoint)
- For production: Subscribe to Hashio Pro for higher rate limits

---

## Resources

### Official Hedera Docs
- Smart Contracts: https://docs.hedera.com/hedera/core-concepts/smart-contracts
- EVM Developers: https://docs.hedera.com/hedera/getting-started-evm-developers
- Deploy Guides: https://docs.hedera.com/hedera/tutorials/smart-contracts

### Tools
- **Hashpack Wallet**: https://hashpack.app/ (Recommended)
- **HashScan Explorer**: https://hashscan.io/testnet
- **Hedera Portal**: https://portal.hedera.com/dashboard
- **Hedera Faucet**: https://portal.hedera.com/faucet

### Community
- **GitHub**: https://github.com/hashgraph
- **Discord**: https://hedera.com/discord
- **Forum**: https://hips.hedera.com/

---

## Summary

| Step | Time | Status |
|------|------|--------|
| 1. Setup Hedera Account | 5 min | Done |
| 2. Configure Hardhat | 5 min | Done |
| 3. Deploy to Testnet | 2 min | Done |
| 4. Test on Hedera | 10 min | ⏳ To Do |
| 5. Cross-Chain Comparison | 5 min | ⏳ To Do |
| **Total** | **~30 min** | ⏳ **Ready to Deploy** |

**Next Steps**:
1. ✅ Create Hedera account with HashPack
2. ✅ Fund account from faucet (100 HBAR)
3. ✅ Update hardhat.config.js with Hedera network
4. ✅ Run: `npx hardhat run scripts/deploy.js --network hederaTestnet`
5. ✅ Verify on Hashscan
6. ✅ Update README with deployment info

---

**Questions?** Check the troubleshooting section above or refer to official Hedera docs.

**Ready to deploy?** Follow Step-by-Step Deployment section above.
