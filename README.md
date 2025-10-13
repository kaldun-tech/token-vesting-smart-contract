# Token Vesting Smart Contract

A production-ready Solidity smart contract for time-locked token vesting schedules with cliff periods. Commonly used for employee equity, investor lockups, and team allocations in DeFi projects.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-yellow)](https://hardhat.org/)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Usage](#usage)
- [Testing](#testing)
  - [Running Tests](#running-tests)
  - [Static Analysis with Slither](#static-analysis-with-slither)
- [Deployment](#deployment)
- [Security](#security)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

This project implements a trustless, transparent token vesting system on the Ethereum blockchain (deployed to Base Sepolia L2). It enables organizations to:

- Create time-locked token release schedules
- Enforce cliff periods before any tokens vest
- Implement linear vesting over customizable durations
- Revoke unvested tokens when needed
- Provide full transparency to all stakeholders

### Real-World Use Cases

- **Startup Employee Equity**: Vest tokens over 4 years with 1-year cliff
- **Investor Lockups**: Prevent token dumps with graduated release schedules
- **DAO Team Allocations**: Align long-term incentives with project success
- **Advisory Grants**: Structured compensation for advisors and partners

---

## Features

### Core Functionality

- **Linear Vesting**: Tokens vest continuously over time using a linear formula
- **Cliff Periods**: Configurable initial period with zero token release
- **Revocation Rights**: Grantors can revoke unvested tokens if needed
- **ERC20 Compatible**: Works with any standard ERC20 token
- **Event Emission**: Full transparency with comprehensive event logging
- **Gas Optimized**: Uses OpenZeppelin libraries for efficiency

### Technical Highlights

- Solidity 0.8.20 (built-in overflow protection)
- OpenZeppelin security patterns
- ReentrancyGuard protection
- Comprehensive test coverage (100%)
- Verified on Basescan
- Immutable contract design

---

## Quick Start

### Prerequisites

- Node.js v18+ and npm v9+
- MetaMask, Coinbase or other compatible Web3 wallet
- Base Sepolia testnet ETH ([get from faucet](https://portal.cdp.coinbase.com/products/faucet))

### MetaMask Setup for Base Sepolia

If you don't have the Base Sepolia testnet configured in MetaMask:

1. **Open MetaMask** browser extension
2. **Click the network dropdown** (top left, usually says "Ethereum Mainnet")
3. **Click "Add Network"** or "Add a network manually"
4. **Enter these details**:
   ```
   Network Name: Base Sepolia
   RPC URL: https://sepolia.base.org
   Chain ID: 84532
   Currency Symbol: ETH
   Block Explorer: https://sepolia.basescan.org
   ```
5. **Click "Save"**
6. **Switch to Base Sepolia** network from the dropdown

#### Get Testnet ETH

1. **Copy your wallet address** from MetaMask
2. **Go to the faucet**: https://portal.cdp.coinbase.com/products/faucet
3. **Select "Base Sepolia"** network (not Base Mainnet!)
4. **Paste your address** and request testnet ETH
5. **Wait ~30 seconds** - you should receive 0.1 ETH

**⚠️ Important:** Make sure you're on **Base Sepolia** (testnet), NOT Base Mainnet!
- Base Sepolia = Free test ETH, for development
- Base Mainnet = Real ETH, costs real money

You can verify which network you're on by checking:
- MetaMask network dropdown says "Base Sepolia"
- Block explorer URL is https://**sepolia**.basescan.org

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/token-vesting-smart-contract.git
cd token-vesting-smart-contract

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy locally
npx hardhat run scripts/deploy.js

# Deploy to base sepolia
npx hardhat run scripts/deploy.js --network baseSepolia

# Or use the deploy task (same thing)
npx hardhat deploy --network baseSepolia
```

### Environment Setup

Create a `.env` file:

```bash
PRIVATE_KEY=your_wallet_private_key_here
BASE_SEPOLIA_RPC=https://sepolia.base.org
ETHERSCAN_API_KEY=your_ETHERSCAN_api_key_here
```

**Never commit your `.env` file to version control!**
- Private key allows programmatic deployment via Hardhat scripts. Needed for Hardhat to sign transactions automatically.
- Base Sepolia RPC is the URL of the Base Sepolia testnet.
- API key is used to verify the contract on Etherscan or Basescan

---

## Hardhat Tasks

Custom tasks make common operations easier with simple one-line commands:

```bash
# List all available tasks
npx hardhat help

# Mint test tokens
npx hardhat mint --amount 10000 --network baseSepolia

# Create vesting schedule
npx hardhat create-schedule \
  --beneficiary 0x123... \
  --amount 1000 \
  --cliff 30 \
  --duration 365 \
  --revocable \
  --network baseSepolia

# Check vesting status
npx hardhat check-vesting --beneficiary 0x123... --network baseSepolia

# Release vested tokens
npx hardhat release --beneficiary 0x123... --network baseSepolia

# Revoke schedule (requires --confirm)
npx hardhat revoke --beneficiary 0x123... --confirm --network baseSepolia

# List all schedules
npx hardhat list-schedules --network baseSepolia
```

See [Hardhat Tasks](#hardhat-tasks-reference) section below for complete documentation.

---

## Architecture

### System Components

```
┌─────────────────────┐
│   Token Owner       │
│   (Employer/DAO)    │
└──────────┬──────────┘
           │
           │ 1. Create Vesting Schedule
           │
           ▼
┌─────────────────────────────────────┐
│     TokenVesting.sol                │
│  ┌───────────────────────────────┐  │
│  │  Vesting Schedule Storage     │  │
│  │  - Beneficiary address        │  │
│  │  - Start timestamp            │  │
│  │  - Cliff period               │  │
│  │  - Total duration             │  │
│  │  - Token amount               │  │
│  │  - Released amount            │  │
│  └───────────────────────────────┘  │
└────────────┬────────────────────────┘
             │
             │ 2. Lock ERC20 Tokens
             │
             ▼
┌─────────────────────────┐
│   ERC20 Token Contract  │
│   (Any standard token)  │
└─────────────────────────┘
             │
             │ 3. Release Vested Tokens
             │
             ▼
┌─────────────────────┐
│   Beneficiary       │
│   (Employee)        │
└─────────────────────┘
```

### Vesting Timeline

```
Start                Cliff               Duration Complete
  |----cliff period----|----vesting period----|
  0%                   0%                    100%

Example: 4-year vesting with 1-year cliff
Year 0    Year 1         Year 2    Year 3    Year 4
  |---------|-------------|---------|---------|
  0%        25%           50%       75%      100%
           cliff
```

### Vesting Calculation Algorithm

The contract calculates vested amounts using a linear interpolation formula:

```solidity
/**
 * Vesting Calculation Logic:
 * - Before cliff: 0% vested
 * - After duration: 100% vested
 * - During vesting: vestedAmount = totalAmount × (timeElapsed / totalDuration)
 */
function _vestedAmount(address beneficiary) private view returns (uint256) {
    VestingSchedule storage schedule = vestingSchedules[beneficiary];

    if (block.timestamp < schedule.cliff) {
        return 0;  // Cliff period - no tokens vested
    }

    if (block.timestamp >= schedule.start + schedule.duration) {
        return schedule.amount;  // Fully vested
    }

    // Linear vesting during the vesting period
    uint256 timeElapsed = block.timestamp - schedule.start;
    return (schedule.amount * timeElapsed) / schedule.duration;
}
```

### State Machine

The vesting schedule follows these states:

```
NoSchedule → Active → CliffPeriod → Vesting → PartiallyReleased → FullyVested
                ↓           ↓           ↓              ↓
              Revoked     Revoked     Revoked      Revoked
              (if revocable is enabled)
```

---

## Usage

### Creating a Vesting Schedule

```solidity
// 1. Deploy or get reference to ERC20 token
IERC20 token = IERC20(tokenAddress);

// 2. Approve vesting contract to spend tokens
token.approve(vestingContractAddress, amount);

// 3. Create vesting schedule
TokenVesting vesting = TokenVesting(vestingContractAddress);
vesting.createVestingSchedule(
    beneficiaryAddress,    // Who receives the tokens
    amount,                // Total tokens to vest (in wei)
    cliffDuration,         // Cliff in seconds (e.g., 31536000 = 1 year)
    totalDuration,         // Total vesting in seconds (e.g., 126144000 = 4 years)
    revocable              // Can the schedule be revoked?
);
```

### Releasing Vested Tokens

```solidity
// Beneficiary can call this anytime
vesting.release();

// Contract automatically calculates vested amount and transfers
```

### Checking Vested Amount

```solidity
// View function - no gas cost
uint256 vested = vesting.vestedAmount(beneficiaryAddress);
```

### Revoking a Schedule

```solidity
// Only if revocable was set to true
vesting.revoke(beneficiaryAddress);
// Unvested tokens returned to owner
```

### Web3 Integration Example

```javascript
import { ethers } from 'ethers';

// Connect to Base Sepolia
const provider = new ethers.providers.JsonRpcProvider(
  'https://sepolia.base.org'
);

// Connect wallet
const signer = provider.getSigner();

// Load contract
const vesting = new ethers.Contract(
  VESTING_ADDRESS,
  VESTING_ABI,
  signer
);

// Check vested amount
const amount = await vesting.vestedAmount(userAddress);
console.log(`Vested: ${ethers.utils.formatEther(amount)} tokens`);

// Release tokens
const tx = await vesting.release();
await tx.wait();
console.log('Tokens released successfully!');
```

---

## Testing

### Running Tests

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/TokenVesting.test.js

# Run with gas reporting
export REPORT_GAS=true
npx hardhat test

# Run with coverage
npx hardhat coverage
```

### Test Coverage

Our test suite covers:

- ✅ Contract deployment and initialization
- ✅ Vesting schedule creation with validation
- ✅ Cliff period enforcement
- ✅ Linear vesting calculations
- ✅ Token release functionality
- ✅ Revocation scenarios
- ✅ Edge cases (zero amounts, time boundaries)
- ✅ Access control
- ✅ Reentrancy protection

**Current Coverage: 100% statements, branches, functions, and lines**

### Static Analysis with Slither

[Slither](https://github.com/crytic/slither) is a Solidity static analysis framework that detects vulnerabilities and code quality issues.

#### Setup

```bash
# Create Python virtual environment (one-time setup)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Slither
pip install slither-analyzer

# Install solc-select (Slither dependency for Solidity version management)
pip install solc-select
```

#### Running Slither

```bash
# Activate venv first
source venv/bin/activate

# Run basic analysis
python -m slither .

# Run with human-readable summary
python -m slither . --print human-summary

# Check for specific vulnerability classes
python -m slither . --detect reentrancy-eth,reentrancy-no-eth

# Generate detailed report
python -m slither . --json slither-report.json
```

#### Common Slither Commands

```bash
# List all available detectors
python -m slither . --list-detectors

# Exclude specific checks
python -m slither . --exclude naming-convention,solc-version

# Check only high/medium severity issues
python -m slither . --exclude-low --exclude-informational
```

#### Automated Analysis

Slither runs automatically on every push via GitHub Actions (`.github/workflows/slither.yml`). Check the Actions tab in your repository to see results.

#### Troubleshooting

If `slither` command doesn't work directly, use `python -m slither` instead:

```bash
# Instead of:
slither .

# Use:
python -m slither .
```

**Why?** Sometimes the slither executable script isn't created during installation, but the Python module always works.

#### Understanding Results

Slither categorizes findings by severity:
- 🔴 **High**: Critical vulnerabilities (reentrancy, access control issues)
- 🟠 **Medium**: Potential issues that may cause problems
- 🟡 **Low**: Code quality or minor safety concerns
- 🔵 **Informational**: Best practices and optimization suggestions

**Our contracts**: All findings are **Low/Informational** - no critical issues! ✅

Common informational findings you can safely ignore:
- **Timestamp usage**: Expected for vesting contracts (15-second miner manipulation doesn't affect multi-day schedules)
- **Variable shadowing in constructors**: Standard pattern for ERC20 tokens
- **Assembly in OpenZeppelin**: Audited library code
- **Multiple Solidity versions**: Normal when using dependencies
- **Strict equality**: Safe when checking for existence (`amount == 0`)

#### Filtering Results

Use `.slither.config.json` to customize which detectors run:

```json
{
  "detectors_to_exclude": "pragma,solc-version,assembly,shadowing-local,timestamp",
  "exclude_dependencies": true,
  "filter_paths": "node_modules"
}
```

This focuses Slither on your contract code and excludes common false positives.

---

## Deployment

### Local Deployment

```bash
# Start local Hardhat node
npx hardhat node

# In another terminal, deploy
npx hardhat run scripts/deploy.js --network localhost
```

### Base Sepolia Testnet Deployment

```bash
# Deploy to Base Sepolia
npx hardhat run scripts/deploy.js --network baseSepolia

# Verify contract on Basescan
npx hardhat verify --network baseSepolia VESTING_ADDRESS "TOKEN_ADDRESS"
```

### Deployed Contracts

#### Base Sepolia Testnet

- **MockERC20 Token**: `0x495D01f0Ec6E7701A6Ecc04045E4bB59F027e1E0`
- **TokenVesting Contract**: `0x5D6709C5b1ED83125134672AFa905cA045978a1D`
- **Deployer**: `0xF25DA65784D566fFCC60A1f113650afB688A14ED`
- **Deployment Date**: October 11, 2025

View on Basescan:
- Token: [View Verified Contract](https://sepolia.basescan.org/address/0x495D01f0Ec6E7701A6Ecc04045E4bB59F027e1E0#code)
- Vesting: [View Verified Contract](https://sepolia.basescan.org/address/0x5D6709C5b1ED83125134672AFa905cA045978a1D#code)

### Gas Costs

| Operation | Estimated Gas | Cost (Base Sepolia) |
|-----------|---------------|---------------------|
| Deploy TokenVesting | ~1,200,000 | < $0.01 |
| Deploy MockERC20 | ~800,000 | < $0.01 |
| createVestingSchedule() | ~150,000 | < $0.001 |
| release() | ~80,000 | < $0.001 |
| revoke() | ~90,000 | < $0.001 |

---

## Security

### Security Measures

- ✅ **OpenZeppelin Libraries**: Battle-tested, audited code
- ✅ **ReentrancyGuard**: Protection against reentrancy attacks
- ✅ **SafeMath**: Solidity 0.8+ built-in overflow protection
- ✅ **Input Validation**: All parameters validated
- ✅ **Access Control**: Only authorized actions permitted
- ✅ **Event Emission**: Full transparency and auditability

### Known Limitations

1. **Single Schedule Per Beneficiary**: Current design allows one active schedule per address
2. **Revocation Power**: If enabled, grantor can revoke unvested tokens
3. **Block Timestamp**: Uses `block.timestamp` (15-second miner manipulation window)
4. **No Pause Function**: Contract cannot be paused in emergencies
5. **Immutable**: No upgrade path once deployed

### Audit Status

- **Current Status**: Unaudited (testnet deployment)
- **Recommended**: Formal audit before mainnet deployment
- **Tools Used**: Slither static analysis, Hardhat tests

**DO NOT use in production with real funds without a professional audit.**

---

## Documentation

### Contract Specifications

#### TokenVesting.sol

**Key Components**:
- **Solidity Version**: ^0.8.20
- **Dependencies**: OpenZeppelin's IERC20 and ReentrancyGuard

**State Variables**:
```solidity
IERC20 public immutable token;
mapping(address => VestingSchedule) public vestingSchedules;
```

**Struct**:
```solidity
struct VestingSchedule {
    address beneficiary;
    uint256 start;      // Start timestamp
    uint256 cliff;      // Cliff timestamp (start + cliffDuration)
    uint256 duration;   // Total vesting duration in seconds
    uint256 amount;     // Total tokens to vest
    uint256 released;   // Tokens already released
    bool revocable;     // Can schedule be revoked?
    bool revoked;       // Has it been revoked?
}
```

**Events**:
```solidity
event VestingScheduleCreated(
    address indexed beneficiary,
    uint256 amount,
    uint256 start,
    uint256 cliff,
    uint256 duration
);
event TokensReleased(address indexed beneficiary, uint256 amount);
event VestingRevoked(address indexed beneficiary, uint256 refunded);
```

### Additional Documentation

- **[contracts/](./contracts/)**: Solidity source code with inline comments
- **[test/](./test/)**: Test specifications and examples
- **[scripts/](./scripts/)**: Deployment and interaction scripts

### Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Base Network Docs](https://docs.base.org/)
- [Solidity Documentation](https://docs.soliditylang.org/)

---

## Frontend

### Web Interface

A simple Next.js frontend is provided for beneficiaries to view and interact with their vesting schedules.

**Location**: [`frontend/`](./frontend/)

**Features**:
- 🔌 Connect wallet (MetaMask, Coinbase Wallet, 100+ others)
- 📊 View vesting schedule and progress
- ⏰ Real-time countdown to cliff and vesting completion
- 🎯 One-click token release
- 📱 Responsive design (mobile-friendly)
- 🌙 Dark mode support

#### Quick Start

```bash
cd frontend

# Install dependencies
npm install

# Setup environment (get WalletConnect ID from https://cloud.walletconnect.com/)
cp .env.example .env
nano .env  # Add your WalletConnect Project ID

# Run development server
npm run dev
```

Open http://localhost:3000

#### Technology Stack

- **Next.js 14**: React framework with zero-config setup
- **wagmi**: React hooks for Ethereum - makes contract calls trivial
- **RainbowKit**: Beautiful wallet connection UI
- **Tailwind CSS**: Utility-first styling
- **TypeScript**: Type safety

#### For Backend Developers

The frontend uses **wagmi hooks** which work like API calls:

```typescript
// Read contract state (like a GET request)
const { data: schedule } = useReadContract({
  address: VESTING_CONTRACT,
  abi: VESTING_ABI,
  functionName: 'vestingSchedules',
  args: [userAddress],
})
// schedule auto-updates when blockchain changes!

// Write to contract (like a POST request)
const { writeContract } = useWriteContract()
writeContract({
  address: VESTING_CONTRACT,
  abi: VESTING_ABI,
  functionName: 'release',
})
```

wagmi automatically handles:
- Loading states
- Error handling
- Transaction signing
- Real-time updates
- Caching

See [`frontend/README.md`](./frontend/README.md) for complete documentation.

---

## Project Structure

```
token-vesting-smart-contract/
├── contracts/
│   ├── TokenVesting.sol         # Main vesting contract
│   └── MockERC20.sol            # Test token
├── test/
│   └── TokenVesting.test.js     # Comprehensive test suite
├── scripts/
│   ├── deploy.js                # Deployment script
│   ├── interact.js              # Create vesting schedules
│   ├── check-vested.js          # Check vesting status
│   ├── release-tokens.js        # Release vested tokens
│   ├── revoke.js                # Revoke schedules
│   ├── demo.js                  # Full lifecycle demo
│   └── README.md                # Scripts documentation
├── frontend/                    # Next.js web interface
│   ├── components/
│   │   └── VestingDashboard.tsx # Main dashboard component
│   ├── lib/
│   │   ├── contracts.ts         # Contract ABIs and addresses
│   │   └── wagmi.ts             # Blockchain configuration
│   ├── pages/
│   │   ├── _app.tsx             # App wrapper with providers
│   │   └── index.tsx            # Home page
│   ├── package.json             # Frontend dependencies
│   └── README.md                # Frontend documentation
├── hardhat.config.js            # Hardhat configuration
├── package.json                 # Smart contract dependencies
├── .env.example                 # Environment template
├── README.md                    # This file
└── LICENSE                      # GPL-3.0 license
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for all new features
- Follow Solidity style guide
- Add inline documentation
- Update README as needed
- Run `npx hardhat test` before submitting PR

---

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

**Key points:**
- Free to use, modify, and distribute
- Must remain open source
- No warranty provided

---

## Roadmap

### Phase 1: MVP (Current)
- ✅ Core vesting contract
- ✅ Linear vesting with cliff
- ✅ Comprehensive tests
- ✅ Testnet deployment

### Phase 2: Enhancement
- 📋 Multiple schedules per beneficiary
- 📋 Custom vesting curves
- ✅ Frontend dashboard
- 📋 Advanced analytics
- 📋 Owner dashboard (create/revoke schedules)

### Phase 3: Integration
- 📋 Go backend service
- 📋 PostgreSQL caching
- 📋 REST API
- 📋 Mobile app support

### Phase 4: Production
- 📋 Professional security audit
- 📋 Mainnet deployment
- 📋 Documentation site
- 📋 Community launch

---

## Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for secure contract libraries
- [Hardhat](https://hardhat.org/) for development framework
- [Base](https://base.org/) for L2 infrastructure
- The Ethereum community for standards and best practices

---

## Contact

- **GitHub**: [@yourusername](https://github.com/yourusername)
- **Issues**: [GitHub Issues](https://github.com/yourusername/token-vesting-smart-contract/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/token-vesting-smart-contract/discussions)

---

## Hardhat Tasks Reference

### mint

Mint test tokens (MockERC20 only - for testing).

```bash
npx hardhat mint --amount 10000 --network baseSepolia

# Mint to specific address
npx hardhat mint --amount 5000 --to 0x123... --network baseSepolia
```

**Parameters**:
- `--amount`: Amount of tokens to mint (default: 10000)
- `--to`: Address to mint to (default: your address)

---

### create-schedule

Create a new vesting schedule for a beneficiary.

```bash
npx hardhat create-schedule \
  --beneficiary 0x123... \
  --amount 1000 \
  --cliff 30 \
  --duration 365 \
  --revocable \
  --network baseSepolia
```

**Parameters**:
- `--beneficiary`: Beneficiary address (required)
- `--amount`: Amount of tokens in whole tokens, e.g., 1000 (required)
- `--cliff`: Cliff duration in days (default: 30)
- `--duration`: Total vesting duration in days (default: 365)
- `--revocable`: Make schedule revocable (flag, optional)

**Example - 4 year vesting with 1 year cliff**:
```bash
npx hardhat create-schedule \
  --beneficiary 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
  --amount 10000 \
  --cliff 365 \
  --duration 1460 \
  --revocable \
  --network baseSepolia
```

---

### check-vesting

Check vesting status for a beneficiary with detailed information.

```bash
npx hardhat check-vesting --beneficiary 0x123... --network baseSepolia
```

**Parameters**:
- `--beneficiary`: Beneficiary address (required)

**Output includes**:
- Total amount, released, vested, available
- Timeline (start, cliff, end dates)
- Progress percentage
- Status (cliff period, vesting, fully vested, revoked)
- Time until milestones

---

### release

Release vested tokens for a beneficiary.

```bash
# Release for yourself
npx hardhat release --network baseSepolia

# Release for specific beneficiary
npx hardhat release --beneficiary 0x123... --network baseSepolia
```

**Parameters**:
- `--beneficiary`: Beneficiary address (default: your address)

**Note**: The signer must be the beneficiary (or have permission).

---

### revoke

Revoke a vesting schedule (if revocable).

```bash
# Preview revocation (safe, shows what will happen)
npx hardhat revoke --beneficiary 0x123... --network baseSepolia

# Confirm and execute revocation
npx hardhat revoke --beneficiary 0x123... --confirm --network baseSepolia
```

**Parameters**:
- `--beneficiary`: Beneficiary address (required)
- `--confirm`: Confirm revocation (required for execution)

**Safety**:
- Without `--confirm`, only shows what will happen
- Shows unvested amount that will be refunded
- Shows vested but unreleased amount (stays with beneficiary)
- Irreversible once executed

---

### list-schedules

List all vesting schedules by querying blockchain events.

```bash
# List all schedules
npx hardhat list-schedules --network baseSepolia

# Limit results
npx hardhat list-schedules --limit 10 --network baseSepolia
```

**Parameters**:
- `--limit`: Maximum number of schedules to show (default: 20)

**Output**:
- Beneficiary addresses
- Total amount, vested, released for each
- Status (Active/Revoked)

---

## Task vs Script Comparison

| Operation | Task (Simple) | Script (Flexible) |
|-----------|---------------|-------------------|
| **Create Schedule** | `npx hardhat create-schedule --beneficiary 0x... --amount 1000 --cliff 30 --duration 365 --network baseSepolia` | `npx hardhat run scripts/interact.js --network baseSepolia` (edit script first) |
| **Check Status** | `npx hardhat check-vesting --beneficiary 0x... --network baseSepolia` | `BENEFICIARY=0x... npx hardhat run scripts/check-vested.js --network baseSepolia` |
| **Release Tokens** | `npx hardhat release --network baseSepolia` | `npx hardhat run scripts/release-tokens.js --network baseSepolia` |
| **Mint Tokens** | `npx hardhat mint --amount 5000 --network baseSepolia` | `MINT_AMOUNT=5000 npx hardhat run scripts/mint-tokens.js --network baseSepolia` |

**When to use tasks**: Quick one-off operations, CLI-friendly
**When to use scripts**: Complex workflows, automation, custom logic

---

**Built with ❤️ for the DeFi community**
