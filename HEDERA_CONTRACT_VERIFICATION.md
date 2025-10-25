# Hedera Contract Verification Guide

This guide walks through verifying the TokenVesting and MockERC20 contracts on Hedera Testnet using Sourcify.

## Quick Links

- **TokenVesting Contract**: https://hashscan.io/testnet/contract/0.0.7131959
- **MockERC20 Contract**: https://hashscan.io/testnet/contract/0.0.7131958
- **Verification Method**: Sourcify (Hedera's independent instance) https://docs.hedera.com/hedera/sdks-and-apis/smart-contract-verification-api

## Verification Details

### Compiler Information
- **Solidity Version**: 0.8.20
- **Optimization**: Enabled (200 runs)
- **License**: GPL-3.0

### Contract 1: TokenVesting

**Contract Address**: `0xDd83934d6E6f0098e799D1614276829FE2f89E6B`
**Hedera ID**: 0.0.7131959

#### Step 1: Prepare Source Code

The complete source code is in `/contracts/TokenVesting.sol`

**Important**: Sourcify needs all imported dependencies. Since we use OpenZeppelin contracts, make sure you're using the standard versions.

#### Step 2: Get Metadata File

The metadata file is generated during compilation and stored at:
```
./artifacts/contracts/TokenVesting.sol/TokenVesting.json
```

Extract the `metadata` field from this file (it's a JSON string that needs to be decoded).

#### Step 3: Verify on HashScan

1. Navigate to: https://hashscan.io/testnet/contract/0.0.7131959
2. Look for the "Verify & Publish" button or similar verification option
3. Select "Sourcify" as the verification method
4. Upload or paste:
   - **File**: `TokenVesting.sol`
   - **Compiler Version**: 0.8.20
   - **Optimizations**: Yes (200 runs)
   - **License**: GPL-3.0

#### Step 4: Sourcify Verification

Sourcify will:
1. Recompile your source code with the exact settings
2. Compare the resulting bytecode with the deployed bytecode
3. Show "Full Match" if verified successfully

### Contract 2: MockERC20

**Contract Address**: `0x13332Bb167e96d1b68B5021784B06d6C5e6F0F8b`
**Hedera ID**: 0.0.7131958

#### Step 1: Prepare Source Code

```solidity
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        // No initial supply - use mint() function
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

#### Step 2: Verify on HashScan

1. Navigate to: https://hashscan.io/testnet/contract/0.0.7131958
2. Select "Sourcify" verification
3. Upload or paste:
   - **File**: `MockERC20.sol`
   - **Compiler Version**: 0.8.20
   - **Optimizations**: Yes (200 runs)
   - **License**: GPL-3.0
   - **Constructor Args**: None (empty for this contract)

## Alternative: Batch Verification with Sourcify

If HashScan's UI verification fails, you can verify directly with Hedera's Sourcify instance:

### Using Sourcify API

```bash
# Get the contract metadata
cat artifacts/contracts/TokenVesting.sol/TokenVesting.json | jq .metadata > tokenVesting.metadata.json

# Submit to Hedera Sourcify
curl -X POST https://sourcify.hedera.com/api/verify \
  -F "files=@contracts/TokenVesting.sol" \
  -F "files=@tokenVesting.metadata.json" \
  -F "contractAddress=0xDd83934d6E6f0098e799D1614276829FE2f89E6B" \
  -F "chainId=296"
```

## Verification Status Tracking

### TokenVesting

- **Status**: ⏳ Pending Verification
- **Address**: 0xDd83934d6E6f0098e799D1614276829FE2f89E6B
- **Expected**: Full Match
- **Last Updated**: 2025-10-25

#### Verification Checklist:
- [ ] Navigate to HashScan contract page
- [ ] Click "Verify & Publish" or verification button
- [ ] Select "Sourcify" method
- [ ] Upload TokenVesting.sol source
- [ ] Confirm compiler version 0.8.20
- [ ] Enable optimizations (200 runs)
- [ ] Submit for verification
- [ ] Wait for "Full Match" confirmation
- [ ] Update this document with timestamp

### MockERC20

- **Status**: ⏳ Pending Verification
- **Address**: 0x13332Bb167e96d1b68B5021784B06d6C5e6F0F8b
- **Expected**: Full Match
- **Last Updated**: 2025-10-25

#### Verification Checklist:
- [ ] Navigate to HashScan contract page
- [ ] Click "Verify & Publish" or verification button
- [ ] Select "Sourcify" method
- [ ] Upload MockERC20.sol source
- [ ] Confirm compiler version 0.8.20
- [ ] Enable optimizations (200 runs)
- [ ] Submit for verification
- [ ] Wait for "Full Match" confirmation
- [ ] Update this document with timestamp

## Troubleshooting

### Issue: "Bytecode Mismatch"

**Cause**: Compiler settings don't match deployment settings

**Solution**:
- Verify optimizer is enabled with 200 runs
- Verify Solidity version is exactly 0.8.20
- Check that no additional compiler flags were used

### Issue: "Missing Dependencies"

**Cause**: OpenZeppelin contracts not included in verification

**Solution**:
- Sourcify automatically resolves dependencies from npm
- Ensure you're using standard OpenZeppelin versions
- Check that imports match what was deployed

### Issue: "Timeout or Service Error"

**Cause**: Sourcify service temporarily unavailable

**Solution**:
- Wait a few minutes and retry
- Try again during off-peak hours
- Contact Hedera support if issue persists

## After Verification

Once verified, the contracts will:
1. ✅ Show source code on HashScan
2. ✅ Display ABI and function signatures
3. ✅ Enable contract interaction through HashScan UI
4. ✅ Show up in Sourcify database (cross-chain)

## Resources

- **Sourcify Documentation**: https://docs.sourcify.dev/
- **Hedera Verification Guide**: https://docs.hedera.com/hedera/core-concepts/smart-contracts/verifying-smart-contracts-beta
- **HashScan Explorer**: https://testnet.hedera.hashscan.io/
- **OpenZeppelin Contracts**: https://docs.openzeppelin.com/contracts/

## Next Steps

1. **Verify TokenVesting** (highest priority - manages vesting logic)
2. **Verify MockERC20** (lower priority - test token only)
3. **Update this document** with verification timestamps
4. **Update HEDERA_DEPLOYMENT_RESULTS.md** with verification status
5. **Consider Mainnet Deployment** once testnet is verified

---

**Document Created**: 2025-10-25
**Contracts to Verify**: 2 (TokenVesting, MockERC20)
**Expected Result**: Full source code visibility on HashScan
