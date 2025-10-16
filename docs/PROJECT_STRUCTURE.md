# Project Structure Guide

## Overview

This project uses a **monorepo pattern** with separate directories for smart contracts and frontend. This is a standard approach used by major DeFi projects like Uniswap, Aave, and Compound.

## Directory Structure

```
token-vesting-smart-contract/
├── contracts/             # Solidity smart contracts
│   ├── TokenVesting.sol   # Main vesting contract
│   └── MockERC20.sol      # Test token
│
├── scripts/               # Hardhat deployment and utility scripts
│   ├── deploy.js          # Deploy contracts
│   ├── interact.js        # Create vesting schedules
│   ├── check-vested.js    # Check vested amount for address
│   ├── demo.js            # Full demo workflow
│   ├── mint-tokens.js     # Mint test tokens
│   ├── monitor-events.js  # Real-time event monitoring
│   ├── query-events.js    # Query historical events
│   ├── release-tokens.js  # Release vested tokens
│   ├── revoke.js          # Revoke vesting schedule
│   └── README.md          # Script documentation
│
├── test/                  # Hardhat test suite
│   └── TokenVesting.test.js
│
├── tasks/                 # Custom Hardhat tasks
│   └── vesting-tasks.js   # All Hardhat CLI tasks (mint, create, release, etc.)
│
├── frontend/              # Next.js web application
│   ├── components/        # React components
│   ├── lib/               # Contract ABIs and config
│   ├── pages/             # Next.js pages
│   ├── styles/            # CSS and Tailwind styles
│   ├── package.json       # Frontend dependencies (separate)
│   ├── next.config.js     # Next.js configuration
│   ├── tsconfig.json      # TypeScript configuration
│   ├── setup.sh           # Frontend setup script
│   ├── fix-esm.sh         # ESM compatibility fix
│   └── README.md          # Frontend documentation
│
├── docs/                  # Documentation
│   ├── images/            # Screenshots
│   └── project_structure.md # This file
│
├── .github/               # GitHub configuration
│   └── workflows/         # CI/CD workflows
│
├── package.json           # Root package (Hardhat dependencies)
├── hardhat.config.js      # Hardhat configuration
├── .env                   # Environment variables (not committed)
├── .env.example           # Example environment variables
├── CLAUDE.md              # Comprehensive technical documentation
├── README.md              # Main project documentation
├── PROJECT_SUMMARY.md     # Project overview
└── ENHANCEMENT_GUIDE.md   # Guide for future enhancements
```

## Why This Structure?

### ✅ Advantages

1. **Separation of Concerns**
   - Smart contract tooling (Hardhat) separate from frontend (Next.js)
   - Different dependency trees don't conflict
   - Clear boundaries between blockchain and UI code

2. **Independent Deployment**
   - Deploy contracts to blockchain
   - Deploy frontend to Vercel/Netlify separately
   - Update frontend without redeploying contracts

3. **Different Technology Stacks**
   - Contracts: Solidity, Hardhat, OpenZeppelin
   - Frontend: TypeScript, React, Next.js, wagmi
   - Each can evolve independently

4. **Better Build Performance**
   - Frontend builds don't include Hardhat dependencies
   - Smaller docker images
   - Faster CI/CD pipelines

### Industry Examples

| Project | Structure |
|---------|-----------|
| **Uniswap** | `contracts/` + `interface/` |
| **Aave** | `protocol/` + `frontend/` |
| **Compound** | Separate repos: `compound-protocol/` + `compound-finance/` |
| **Sushiswap** | `contracts/` + `app/` |
| **Curve** | `curve-contract/` + `curve-ui/` |

## Working with This Structure

### Running Commands from Root

We've added convenience scripts to make running frontend commands easier:

```bash
# Smart contract commands (work from root)
npm test                  # Run Hardhat tests
npm run compile          # Compile contracts
npm run deploy:sepolia   # Deploy to testnet

# Frontend commands (work from root)
npm run frontend:install # Install frontend deps
npm run frontend:dev     # Start dev server
npm run frontend:build   # Build for production
npm run frontend:start   # Start production server
```

### Running Commands from Subdirectories

You can also work directly in subdirectories:

```bash
# Work with contracts
cd .                      # Stay in root
npx hardhat test
npx hardhat compile

# Work with frontend
cd frontend
npm install
npm run dev
cd ..                     # Back to root
```

### Environment Variables

Two separate `.env` files:

```
/.env                     # Smart contract config (Hardhat)
  ├── PRIVATE_KEY         # Deployment wallet
  ├── BASE_SEPOLIA_RPC    # RPC endpoint
  └── ETHERSCAN_API_KEY   # Contract verification

/frontend/.env            # Frontend config (Next.js)
  ├── NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
  ├── NEXT_PUBLIC_TOKEN_ADDRESS
  └── NEXT_PUBLIC_VESTING_ADDRESS
```

**Important**: Never commit `.env` files to git!

## Development Workflow

### 1. Smart Contract Development

```bash
# Make changes to contracts/TokenVesting.sol
npm run compile
npm test
npm run deploy:local  # Test locally first
npm run deploy:sepolia  # Deploy to testnet
```

### 2. Frontend Development

```bash
# Update contract addresses in frontend/lib/contracts.ts
npm run frontend:dev  # Start dev server
# Make changes to frontend/components/
# Frontend hot-reloads automatically
```

### 3. Full Stack Testing

```bash
# Terminal 1: Run local Hardhat node
npx hardhat node

# Terminal 2: Deploy contracts to local node
npm run deploy:local

# Terminal 3: Update frontend config and start dev server
npm run frontend:dev

# Test full integration
```

## Alternative Structures (Not Recommended for This Project)

### ❌ Everything in Root

```
my-project/
├── src/              # Frontend code
├── contracts/        # Smart contracts
├── package.json      # Conflicts between Hardhat and Next.js
└── next.config.js    # Both in same directory
```

**Problems:**
- Dependency conflicts
- Harder to deploy separately
- Confusing package.json
- Larger build artifacts

### ❌ Separate Repositories

```
token-vesting-contracts/    # Repo 1
token-vesting-frontend/     # Repo 2
```

**When to use:**
- Very large teams with separate responsibilities
- When frontend and contracts need independent versioning
- When contracts are used by multiple frontends

**For our project:** Monorepo is better because frontend and contracts are tightly coupled.

## Common Questions

### Q: Why not use npm workspaces?

**A:** We could, but for a simple project like this, basic scripts are easier:
- No need for complex workspace configuration
- Easier for new developers to understand
- Both approaches work fine

**If you want workspaces**, add to root `package.json`:
```json
{
  "workspaces": ["frontend"]
}
```

Then run: `npm install` in root to install both.

### Q: Should frontend import contract ABIs directly from artifacts/?

**A:** No. Better to copy needed ABIs to `frontend/lib/contracts.ts`:
- Smaller bundle size (only include functions you use)
- Better TypeScript inference
- Frontend doesn't need full artifact structure
- Easier to version control

### Q: Can I run both contract and frontend in one command?

**A:** Yes! Add to root `package.json`:
```json
{
  "scripts": {
    "dev:all": "concurrently \"npx hardhat node\" \"npm run frontend:dev\""
  }
}
```

Requires: `npm install --save-dev concurrently`

## Best Practices

1. **Keep contracts and frontend separate**
   - Don't import Hardhat in frontend
   - Don't import frontend code in contracts

2. **Use environment variables**
   - Never hardcode addresses
   - Use different configs for local/testnet/mainnet

3. **Version control**
   - Commit `frontend/package.json` and `package.json` separately
   - Ignore `node_modules/` in both directories
   - Ignore `frontend/.next` build directory

4. **Documentation**
   - Keep contract docs in `contracts/`
   - Keep frontend docs in `frontend/README.md`
   - Use this file for overall structure

## Summary

**Your current structure is industry-standard and well-organized.** The frontend in a subdirectory is normal and recommended. We've added convenience scripts (`npm run frontend:dev`) to make it easier to work with, but the separation remains important for maintainability and deployment.

---

**Last Updated**: October 16, 2025
