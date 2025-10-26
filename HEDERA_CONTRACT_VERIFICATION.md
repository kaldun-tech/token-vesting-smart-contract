# Hedera Contract Verification Guide

This guide walks through verifying the TokenVesting and MockERC20 contracts on Hedera Testnet using Sourcify.

## Quick Links

- **TokenVesting Contract**: https://hashscan.io/testnet/contract/0.0.7131961
- **MockERC20 Contract**: https://hashscan.io/testnet/contract/0.0.7131958
- **Verification Method**: Sourcify (Hedera's independent instance)

---

## 🚀 Quick Start (5 Minutes)

### Files Ready to Upload

Metadata files have been pre-extracted and are in the `deployments/` directory:
- ✅ `deployments/metadata-tokenvesting.json` (23 KB)
- ✅ `deployments/metadata-mockerc20.json` (16 KB)

### Verify TokenVesting Contract

**Step 1:** Go to https://hashscan.io/testnet/contract/0.0.7131961

**Step 2:** Click "Verify & Publish"

**Step 3:** Select "Sourcify" method

**Step 4:** Upload these files:
- `contracts/TokenVesting.sol`
- `deployments/metadata-tokenvesting.json`

**Step 5:** Click "Verify" ✅

### Verify MockERC20 Contract

**Step 1:** Go to https://hashscan.io/testnet/contract/0.0.7131958

**Step 2:** Click "Verify & Publish"

**Step 3:** Select "Sourcify" method

**Step 4:** Upload these files:
- `contracts/MockERC20.sol`
- `deployments/metadata-mockerc20.json`

**Step 5:** Click "Verify" ✅

**Expected Result:** ✅ "Full Match" - Source code will be visible on HashScan

---

## 📋 Detailed Verification Process

### Compiler Information
- **Solidity Version**: 0.8.20
- **Optimization**: Enabled (200 runs)
- **License**: GPL-3.0

### Contract 1: TokenVesting

**Contract Address**: `0xdd83934d6e6f0098e799d1614276829fe2f89e6b`
**Hedera ID**: 0.0.7131961

### Contract 2: MockERC20

**Contract Address**: `0x13332Bb167e96d1b68B5021784B06d6C5e6F0F8b`
**Hedera ID**: 0.0.7131958

---

## About Metadata Files

### What is Metadata?
The metadata JSON file contains:
- Compiler version
- Optimization settings
- ABI and other compilation info
- Source file mappings

This information is embedded in your contract bytecode by Hardhat, but Sourcify needs it in a separate JSON file to verify correctly.

### Files Provided
We've pre-extracted and checked in the metadata files:
- ✅ `deployments/metadata-tokenvesting.json` - Ready to use
- ✅ `deployments/metadata-mockerc20.json` - Ready to use

Just upload these along with the source code files during verification.

### Re-extract If Needed

If you redeploy the contracts, regenerate the metadata:

```bash
bash extract-metadata.sh
mv metadata-*.json deployments/
```

---

## Verification Status Tracking

| Contract | Address | Metadata File | Status | HashScan Link |
|----------|---------|---------------|--------|---------------|
| **TokenVesting** | `0xdd83934d6e6f0098e799d1614276829fe2f89e6b` | `deployments/metadata-tokenvesting.json` | ✅ Verified | [View](https://hashscan.io/testnet/contract/0.0.7131961) |
| **MockERC20** | `0x13332Bb167e96d1b68B5021784B06d6C5e6F0F8b` | `deployments/metadata-mockerc20.json` | ✅ Verified | [View](https://hashscan.io/testnet/contract/0.0.7131958) |

---

## Troubleshooting

### Issue: "Bytecode Mismatch"

**Cause**: Compiler settings don't match deployment settings

**Solution**:
- Verify optimizer is enabled with 200 runs
- Verify Solidity version is exactly 0.8.20
- Check that no additional compiler flags were used

### Issue: "Missing Dependencies"

**Cause**: OpenZeppelin contracts not resolved properly

**Solution**:
- Sourcify automatically resolves dependencies from npm
- Ensure you're using standard OpenZeppelin versions
- Check that imports match what was deployed

### Issue: "File Upload Failed"

**Cause**: File format or size issue

**Solution**:
- Verify both files are valid JSON/Solidity
- Check file sizes (metadata ~23KB, source ~25KB)
- Try uploading one file at a time

---

## Resources

- **Hedera Verification Docs**: https://docs.hedera.com/hedera/core-concepts/smart-contracts/verifying-smart-contracts-beta
- **Sourcify Documentation**: https://docs.sourcify.dev/
- **HashScan Explorer**: https://testnet.hedera.hashscan.io/
- **OpenZeppelin Contracts**: https://docs.openzeppelin.com/contracts/

---

**Document Version**: 2.0
**Generated**: October 25, 2025
**Status**: ✅ Ready for verification
