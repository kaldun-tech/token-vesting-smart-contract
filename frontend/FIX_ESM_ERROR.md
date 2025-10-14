# Fix: ESM Module Error with WalletConnect

## Problem

```
Error [ERR_REQUIRE_ESM]: require() of ES Module ... not supported
```

This is a **known compatibility issue** between:
- WalletConnect/Reown SDK (now using ESM modules)
- Node.js 18 (limited ESM support)
- Next.js (mixing CommonJS and ESM)

## Solution Options

### Option 1: Update Node.js (RECOMMENDED)

**Upgrade to Node.js 20+** which has better ESM support:

```bash
# Check current version
node --version

# If < 20, upgrade Node.js:
# - Visit https://nodejs.org/
# - Download and install Node.js 20 LTS or higher
# - Restart terminal

# After upgrading:
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run dev
```

**Why this works**: Node.js 20+ has native ESM support and handles the WalletConnect SDK properly.

---

### Option 2: Use Compatible Package Versions (Current Fix)

I've downgraded to versions that work with Node.js 18:

**Changes made to `package.json`:**
```json
{
  "dependencies": {
    "@rainbow-me/rainbowkit": "^2.0.0",  // Was 2.1.0
    "viem": "2.7.15",                     // Was ^2.7.0
    "wagmi": "^2.5.7"                     // Was ^2.5.0
  }
}
```

**Run these commands:**
```bash
cd frontend

# Delete old dependencies
rm -rf node_modules package-lock.json

# Install compatible versions
npm install --legacy-peer-deps

# Start dev server
npm run dev
```

**Status**: This should work, but you might encounter other ESM issues later. Upgrading to Node 20 is the long-term solution.

---

### Option 3: Alternative - Use Separate RPC Provider

If the above doesn't work, we can simplify by removing WalletConnect and using only injected wallets (MetaMask, Coinbase Wallet):

**Update `lib/wagmi.ts`:**
```typescript
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const config = getDefaultConfig({
  appName: 'Token Vesting',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'dummy',
  chains: [baseSepolia],
  connectors: [
    injected(), // Only use injected wallets (MetaMask, etc.)
  ],
  ssr: true,
});
```

This removes WalletConnect entirely and only supports browser extension wallets.

---

## Verification Steps

After applying a fix:

1. **Stop dev server** (Ctrl+C)

2. **Clear cache:**
   ```bash
   rm -rf .next
   ```

3. **Restart:**
   ```bash
   npm run dev
   ```

4. **Test:**
   - Open http://localhost:3000
   - Click "Connect Wallet"
   - Should work without ESM errors

---

## Why This Happens

**Timeline of the issue:**

1. **WalletConnect v2** (old): Used CommonJS → Worked fine
2. **Reown/WalletConnect v3** (new): Switched to ESM → Breaks on Node 18
3. **Node.js 18**: Limited ESM support in require()
4. **Node.js 20+**: Full ESM support → Works fine

**The problem:**
- Newer WalletConnect SDK uses `export/import` (ESM)
- Node 18 can't use `require()` with ESM modules
- Next.js webpack tries to bundle both CommonJS and ESM → Conflict

**The solutions:**
1. Use Node 20+ (handles ESM properly)
2. Downgrade packages (use older CommonJS versions)
3. Remove WalletConnect (use only injected wallets)

---

## Recommended Path Forward

**For Development (Now):**
```bash
# Use compatible versions (Option 2)
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run dev
```

**For Production (Later):**
```bash
# Upgrade to Node 20
# Then use latest versions
npm install @rainbow-me/rainbowkit@latest wagmi@latest viem@latest
```

---

## Additional Resources

- [Node.js ESM Documentation](https://nodejs.org/api/esm.html)
- [Next.js ESM Support](https://nextjs.org/docs/app/building-your-application/configuring/esm)
- [RainbowKit Migration Guide](https://www.rainbowkit.com/docs/migration-guide)
- [WalletConnect/Reown Changelog](https://docs.reown.com/appkit/react/core/installation)

---

## Quick Reference

| Node Version | RainbowKit | Viem | Wagmi | Status |
|--------------|------------|------|-------|--------|
| **Node 18**  | 2.0.0      | 2.7.15 | 2.5.7 | ⚠️ Works with downgrades |
| **Node 20+** | 2.1.0+     | 2.x   | 2.x   | ✅ Works with latest |

---

**Last Updated**: October 14, 2025
