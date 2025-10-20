# Token Vesting Frontend

A simple, clean Next.js frontend for the Token Vesting smart contract. Built for backend developers who want a functional UI without complexity.

## Features

- 🔌 **Wallet Connection**: Connect with MetaMask, Coinbase Wallet, or 100+ other wallets via RainbowKit
- 📊 **Real-time Updates**: Vesting progress updates automatically as time passes
- 🎯 **Simple Interface**: One-click token release for beneficiaries
- 📋 **Activity Dashboard**: View recent vesting events with filtering (no wallet required)
- 📱 **Responsive Design**: Works on desktop and mobile
- 🌙 **Dark Mode**: Automatic dark/light theme support

## Quick Start

### 1. Get a WalletConnect Project ID

1. Go to https://dashboard.reown.com/
2. Sign up for a free account
3. Create a new project
4. Copy your Project ID

### 2. Setup Environment

```bash
cd frontend

# Copy environment template
cp .env.example .env

# Edit .env and add your WalletConnect Project ID
nano .env
```

Your `.env` file should look like:
```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id_here
NEXT_PUBLIC_TOKEN_ADDRESS=0x495D01f0Ec6E7701A6Ecc04045E4bB59F027e1E0
NEXT_PUBLIC_VESTING_ADDRESS=0x5D6709C5b1ED83125134672AFa905cA045978a1D
NEXT_PUBLIC_CHAIN_ID=84532
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 5. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── components/
│   ├── VestingDashboard.tsx    # Beneficiary vesting dashboard
│   └── EventsDashboard.tsx     # Activity/events dashboard
├── lib/
│   ├── contracts.ts             # Contract ABIs and addresses
│   └── wagmi.ts                 # Blockchain configuration
├── pages/
│   ├── _app.tsx                 # App wrapper with providers
│   ├── _document.tsx            # HTML document structure
│   └── index.tsx                # Home page
├── styles/
│   └── globals.css              # Global styles (Tailwind)
├── .env                         # Environment variables (DO NOT COMMIT)
├── .env.example                 # Environment template
├── next.config.js               # Next.js configuration
├── package.json                 # Dependencies
└── README.md                    # This file
```

## How It Works (For Backend Developers)

### Wagmi Hooks (React Hooks for Blockchain)

The magic of this frontend is wagmi's React hooks that make blockchain interaction as easy as API calls:

#### 1. Reading Contract State

```typescript
// Automatically fetches and caches contract data
const { data: schedule } = useReadContract({
  address: VESTING_CONTRACT,
  abi: VESTING_ABI,
  functionName: 'vestingSchedules',
  args: [userAddress],
})

// schedule automatically updates when blockchain state changes!
```

This is like:
```javascript
// Traditional API call
const schedule = await fetch('/api/vesting/schedule?address=' + userAddress)
  .then(res => res.json())
```

But wagmi handles:
- Automatic caching
- Automatic re-fetching on block changes
- Loading states
- Error handling

#### 2. Writing to Contract (Transactions)

```typescript
const { writeContract, isPending } = useWriteContract()

// Call contract function
writeContract({
  address: VESTING_CONTRACT,
  abi: VESTING_ABI,
  functionName: 'release',
})
```

This is like:
```javascript
// Traditional API call
await fetch('/api/vesting/release', { method: 'POST' })
```

But wagmi handles:
- Wallet signature prompts
- Transaction submission
- Gas estimation
- Transaction status tracking

#### 3. Waiting for Confirmation

```typescript
const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash })

useEffect(() => {
  if (isSuccess) {
    // Transaction confirmed! Refetch data
    refetchVested()
  }
}, [isSuccess])
```

### Component Data Flow

```
User connects wallet
       ↓
useAccount() hook provides address
       ↓
useReadContract() fetches vesting schedule
       ↓
Component displays data
       ↓
User clicks "Release"
       ↓
useWriteContract() sends transaction
       ↓
useWaitForTransactionReceipt() waits for confirmation
       ↓
useReadContract() automatically refetches updated data
       ↓
Component updates with new balance
```

## Customization

### Change Network

Edit `lib/wagmi.ts`:

```typescript
import { baseSepolia, baseMainnet } from 'wagmi/chains'

export const config = getDefaultConfig({
  // ...
  chains: [baseMainnet], // Change to mainnet
})
```

### Change Contract Addresses

Edit `.env`:

```bash
NEXT_PUBLIC_TOKEN_ADDRESS=0xYourTokenAddress
NEXT_PUBLIC_VESTING_ADDRESS=0xYourVestingAddress
```

### Add More Features

Want to add owner features (create schedules, revoke)? Create new components:

```typescript
// components/OwnerDashboard.tsx
export default function OwnerDashboard() {
  const { writeContract } = useWriteContract()

  const createSchedule = () => {
    writeContract({
      address: VESTING_CONTRACT,
      abi: VESTING_ABI,
      functionName: 'createVestingSchedule',
      args: [beneficiary, amount, cliffDuration, duration, revocable],
    })
  }

  return (
    <form onSubmit={createSchedule}>
      {/* Form fields */}
    </form>
  )
}
```

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to https://vercel.com
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy!

Vercel automatically:
- Builds your Next.js app
- Sets up SSL
- Provides a custom domain
- Auto-deploys on git push

### Deploy to Netlify

```bash
npm run build

# Upload the 'out' folder to Netlify
```

### Deploy to Your Own Server

```bash
npm run build
npm start

# Or use PM2 for production
pm2 start npm --name "vesting-frontend" -- start
```

## Troubleshooting

### Error: "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set"

**Problem**: Missing `.env` file or missing environment variable.

**Solution**:
```bash
# 1. Create .env file from template
cp .env.example .env

# 2. Edit .env and add your WalletConnect Project ID
nano .env

# 3. Get a free Project ID from https://cloud.walletconnect.com/

# 4. Your .env should look like:
# NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=abc123def456...
# NEXT_PUBLIC_TOKEN_ADDRESS=0x751f3c0aF0Ed18d9F70108CD0c4d878Aa0De59A8
# NEXT_PUBLIC_VESTING_ADDRESS=0xb682eb7BA41859Ed9f21EC95f44385a8967A16b5

# 5. Restart dev server
npm run dev
```

**Quick Fix (Testing Only)**: I've added a demo WalletConnect ID to your `.env` file. You should get your own for production from https://cloud.walletconnect.com/

### Error: "ERR_REQUIRE_ESM: require() of ES Module ... not supported"

**Problem**: WalletConnect/Reown SDK uses ESM modules that don't work well with Node.js 18.

**This is a CRITICAL error** that prevents wallet connection from working.

**Solution 1: Upgrade Node.js (RECOMMENDED)**
```bash
# Check your Node version
node --version

# If version < 20, upgrade Node.js:
# Download from: https://nodejs.org/
# Install Node.js 20 LTS or higher
# Restart terminal

# Then reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run dev
```

**Solution 2: Use Compatible Versions (Already Applied)**

I've updated `package.json` to use versions compatible with Node 18:
- `@rainbow-me/rainbowkit`: `^2.0.0` (downgraded from 2.1.0)
- `viem`: `2.7.15` (pinned version)
- `wagmi`: `^2.5.7`

Run the fix script:
```bash
cd frontend
./fix-esm.sh
```

Or manually:
```bash
cd frontend
rm -rf node_modules package-lock.json .next
npm install --legacy-peer-deps
npm run dev
```

**Why this happens**:
- WalletConnect v3 (Reown) switched to ESM modules
- Node.js 18 has limited ESM support in `require()` statements
- Node.js 20+ has full ESM support and handles this properly

**See also**: `FIX_ESM_ERROR.md` for detailed troubleshooting.

---

### Warning: "Module not found: @react-native-async-storage/async-storage"

**Problem**: MetaMask SDK includes React Native dependencies that aren't needed for web.

**Status**: ⚠️ This is a warning, not an error. Your app will work fine!

**What I did**: Updated `next.config.js` to suppress these warnings:
```javascript
config.resolve.fallback = {
  '@react-native-async-storage/async-storage': false,
};
config.ignoreWarnings = [
  { module: /node_modules\/@metamask\/sdk/ },
];
```

**Why this happens**: MetaMask SDK is designed for both React Native (mobile) and web. Next.js sees the React Native imports and warns about missing dependencies, but they're not actually used in web browsers.

**If warnings persist**: Restart your dev server (`npm run dev`).

### Wallet won't connect

**Solution**: Make sure you're on Base Sepolia network in your wallet:
- Network: Base Sepolia
- RPC: https://sepolia.base.org
- Chain ID: 84532

**Steps to add Base Sepolia to MetaMask**:
1. Open MetaMask
2. Click network dropdown → "Add Network"
3. Enter the details above
4. Save and switch to Base Sepolia

### Contract data not showing

**Solution**:
1. Check contract addresses in `.env` are correct
2. Make sure you're connected to the right network (Base Sepolia)
3. Verify your wallet address has a vesting schedule

**Debug checklist**:
```bash
# 1. Check .env file exists and has correct addresses
cat .env

# 2. Verify contract exists on Base Sepolia
# Visit: https://sepolia.basescan.org/address/0xb682eb7BA41859Ed9f21EC95f44385a8967A16b5

# 3. Check browser console for errors (F12 → Console tab)
```

### Build errors / Dependency issues

**Solution**: Delete cache and reinstall:
```bash
rm -rf node_modules .next package-lock.json
npm install --legacy-peer-deps
npm run dev
```

**Why `--legacy-peer-deps`?**: RainbowKit and wagmi have peer dependency version conflicts. This flag tells npm to install anyway (it's safe for this project).

### Port 3000 already in use

**Solution**:
```bash
# Option 1: Stop the process using port 3000
lsof -ti:3000 | xargs kill -9

# Option 2: Use a different port
PORT=3001 npm run dev
```

### "Ready in 42s" - Slow startup

**Why**: First run compiles all dependencies. Subsequent runs are much faster (~5s).

**To speed up**:
1. Ensure you have Node.js 20+ (`node --version`)
2. Use SSD storage (not HDD)
3. Close other heavy applications

### Changes not reflecting in browser

**Solution**:
```bash
# 1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

# 2. Clear Next.js cache
rm -rf .next
npm run dev

# 3. Check you're editing the right file
# If in VSCode, right-click file → "Reveal in File Explorer"
```

## Technology Stack

| Technology | Purpose | Why? |
|-----------|---------|------|
| **Next.js** | React framework | Zero-config, great DX, optimal for Web3 |
| **wagmi** | Blockchain hooks | Industry standard, makes contract calls trivial |
| **RainbowKit** | Wallet UI | Beautiful, supports 100+ wallets |
| **Tailwind CSS** | Styling | Utility-first, fast prototyping |
| **TypeScript** | Type safety | Catches errors early, better IDE support |

## Learning Resources

- **Wagmi Docs**: https://wagmi.sh/
- **RainbowKit Docs**: https://www.rainbowkit.com/docs/introduction
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

## Common Patterns for Backend Developers

### Pattern 1: Polling vs. WebSockets

Traditional backend:
```javascript
// Poll every 5 seconds
setInterval(() => {
  fetch('/api/status').then(updateUI)
}, 5000)
```

Wagmi:
```typescript
// Automatically polls on each new block (~2 seconds on Base)
useReadContract({
  // ...
  watch: true  // Enable polling
})
```

### Pattern 2: Loading States

Traditional backend:
```javascript
const [loading, setLoading] = useState(false)
const [data, setData] = useState(null)

async function fetchData() {
  setLoading(true)
  const result = await fetch('/api/data')
  setData(await result.json())
  setLoading(false)
}
```

Wagmi:
```typescript
// Loading state built-in!
const { data, isLoading } = useReadContract({
  // ...
})
```

### Pattern 3: Error Handling

Traditional backend:
```javascript
try {
  await fetch('/api/action', { method: 'POST' })
} catch (error) {
  showError(error)
}
```

Wagmi:
```typescript
const { writeContract, error } = useWriteContract()

// Error automatically captured
if (error) {
  console.error(error)
}
```

## Pages

### / (Home) - Beneficiary Dashboard
- Connect wallet to view your vesting schedule
- See real-time progress with countdown timers
- Release vested tokens with one click
- View your token balance

### /events - Activity Dashboard
- View recent vesting activity (last 50 events)
- Filter by event type (Created, Released, Revoked)
- See statistics (total schedules, tokens released, etc.)
- Transaction links to Basescan
- No wallet connection required (public view)

## Next Steps

1. **Add owner features**: Create/revoke schedules from UI
2. **Add analytics**: Charts for vesting progress over time
3. **Add notifications**: Email alerts when tokens vest
4. **Add multi-schedule support**: View multiple schedules per beneficiary
5. **Real-time updates**: WebSocket support for live event streaming

See the main [README.md](../README.md) for the smart contract documentation.

---

**Built with ❤️ for backend developers learning Web3**
