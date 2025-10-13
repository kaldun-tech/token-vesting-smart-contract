# Token Vesting Scripts

This directory contains scripts for deploying, interacting with, and demonstrating the Token Vesting smart contracts.

## Quick Reference

| Script | Purpose | Network | Who Runs It |
|--------|---------|---------|-------------|
| `deploy.js` | Deploy contracts | Any | Contract Owner |
| `mint-tokens.js` | Mint test tokens | Any | Token Owner |
| `interact.js` | Create vesting schedule | Any | Contract Owner |
| `check-vested.js` | Check vesting status | Any | Anyone |
| `release-tokens.js` | Claim vested tokens | Any | Beneficiary |
| `revoke.js` | Revoke vesting schedule | Any | Contract Owner |
| `demo.js` | Full lifecycle demo | Localhost/Testnet | Anyone |
| `monitor-events.js` | Real-time event monitoring | Any | Anyone |
| `query-events.js` | Historical event queries | Any | Anyone |

---

## Scripts Overview

### 1. deploy.js

**Purpose**: Deploy MockERC20 and TokenVesting contracts to any network.

**Usage**:
```bash
# Deploy to local Hardhat network
npx hardhat run scripts/deploy.js

# Deploy to Base Sepolia testnet
npx hardhat run scripts/deploy.js --network baseSepolia
```

**What it does**:
- Deploys MockERC20 token contract
- Deploys TokenVesting contract
- Saves deployment addresses to `deployments/{network}.json`
- Displays contract addresses and verification instructions

**Output**: Creates `deployments/{network}.json` with contract addresses

---

### 2. mint-tokens.js

**Purpose**: Mint test tokens to your address (useful for testing).

**Usage**:
```bash
# Mint to your default account
npx hardhat run scripts/mint-tokens.js --network baseSepolia

# Mint specific amount
MINT_AMOUNT=5000 npx hardhat run scripts/mint-tokens.js --network baseSepolia
```

**Environment Variables**:
- `MINT_AMOUNT`: Amount of tokens to mint (default: 10000)

**What it does**:
- Mints tokens to the signer's address
- Displays new balance

---

### 3. interact.js

**Purpose**: Interactive script to create a vesting schedule and explore the contract.

**Usage**:
```bash
npx hardhat run scripts/interact.js --network baseSepolia
```

**What it does**:
- Connects to deployed contracts
- Creates a vesting schedule with demo parameters
- Displays schedule details
- Shows recent events
- Provides next steps

**Default Parameters**:
- Beneficiary: Hardhat test account #2 (you can modify in script)
- Amount: 1000 tokens
- Cliff: 60 seconds (1 minute) for quick testing
- Duration: 300 seconds (5 minutes) for quick testing
- Revocable: true

**Notes**:
- Checks for existing schedules
- Validates token balance
- Will fail if beneficiary already has a schedule

---

### 4. check-vested.js

**Purpose**: Check the vesting status for a specific beneficiary.

**Usage**:
```bash
# Check default beneficiary
npx hardhat run scripts/check-vested.js --network baseSepolia

# Check specific beneficiary
BENEFICIARY=0x1234... npx hardhat run scripts/check-vested.js --network baseSepolia
```

**Environment Variables**:
- `BENEFICIARY`: Address to check (default: Hardhat test account #2)

**What it displays**:
- Complete vesting schedule details
- Current vesting progress with progress bar
- Time until cliff ends (if in cliff period)
- Time until fully vested
- Available tokens to release
- Beneficiary's current token balance
- Status messages and next steps

**Example Output**:
```
VESTING PROGRESS
============================================================

Current Status:
- Vested Amount: 250.0 tokens
- Already Released: 0.0 tokens
- Available to Release: 250.0 tokens
- Vesting Progress: 25.00%
- Progress: [██████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 25.00%

STATUS
============================================================

🔄 VESTING IN PROGRESS
Tokens are vesting linearly.
Time until fully vested: 45d 12h 30m

✅ You have 250.0 tokens ready to release!
```

---

### 5. release-tokens.js

**Purpose**: Release vested tokens to the beneficiary (run by beneficiary).

**Usage**:
```bash
# Beneficiary releases their vested tokens
npx hardhat run scripts/release-tokens.js --network baseSepolia
```

**Important**:
- The signer must be the beneficiary of the vesting schedule
- Make sure your wallet is configured correctly in `.env`

**What it does**:
- Checks beneficiary's vesting schedule
- Calculates available tokens to release
- Executes the `release()` transaction
- Displays tokens received
- Shows updated balances and remaining tokens

**Handles Edge Cases**:
- Still in cliff period → Shows time remaining
- No tokens available → Explains why
- Schedule revoked → Notifies user
- Already fully released → Confirms completion

---

### 6. revoke.js

**Purpose**: Revoke a vesting schedule (run by contract owner).

**Usage**:
```bash
# Preview revocation (without confirming)
BENEFICIARY=0x1234... npx hardhat run scripts/revoke.js --network baseSepolia

# Confirm and execute revocation
CONFIRM_REVOKE=yes BENEFICIARY=0x1234... npx hardhat run scripts/revoke.js --network baseSepolia
```

**Environment Variables**:
- `BENEFICIARY`: Address of beneficiary to revoke (required)
- `CONFIRM_REVOKE`: Set to "yes" to confirm revocation (required for execution)

**Safety Features**:
- Requires explicit confirmation
- Shows what will happen before revocation
- Validates schedule is revocable
- Checks if already revoked

**What it does**:
- Validates the schedule exists and is revocable
- Shows revocation impact:
  - Unvested tokens returned to owner
  - Vested but unreleased tokens remain with beneficiary
  - No more tokens will vest
- Requires confirmation before executing
- Executes revocation and displays results

**Example**:
```bash
# Step 1: Preview
BENEFICIARY=0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
  npx hardhat run scripts/revoke.js --network baseSepolia

# Step 2: Confirm and execute
CONFIRM_REVOKE=yes BENEFICIARY=0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
  npx hardhat run scripts/revoke.js --network baseSepolia
```

---

### 7. demo.js

**Purpose**: Comprehensive demonstration of the entire vesting lifecycle.

**Usage**:
```bash
# Run on local network (with time manipulation)
npx hardhat node  # In terminal 1
npx hardhat run scripts/demo.js --network localhost  # In terminal 2

# Run on testnet (uses real time)
npx hardhat run scripts/demo.js --network baseSepolia
```

**What it demonstrates**:

1. **Contract Setup** - Deploy or connect to contracts
2. **Mint Tokens** - Mint test tokens for demo
3. **Create Vesting Schedule** - Set up a vesting schedule
4. **Check During Cliff** - Show 0 tokens vested during cliff
5. **Advance Time** (localhost only) - Fast-forward past cliff
6. **Check After Cliff** - Show tokens starting to vest
7. **Release Partial** - Beneficiary claims some tokens
8. **Advance to End** (localhost only) - Fast-forward to full vesting
9. **Release Remaining** - Beneficiary claims all remaining tokens
10. **Summary** - Display final results

**Features**:
- Works on both localhost (with time manipulation) and testnet (with real time)
- Beautiful formatted output with progress bars
- Comprehensive status displays
- Complete transaction tracking
- Final summary with all balances

**Perfect for**:
- Understanding the vesting flow
- Testing the contracts
- Demonstrating to stakeholders
- Learning how vesting works

### 8. monitor-events.js

**Purpose**: Real-time monitoring of vesting contract events as they occur.

**Usage**:
```bash
# Monitor events in real-time
npx hardhat run scripts/monitor-events.js --network baseSepolia

# With verbose output
MONITOR_VERBOSE=true npx hardhat run scripts/monitor-events.js --network baseSepolia

# Custom poll interval (default 2000ms)
MONITOR_POLL_INTERVAL=5000 npx hardhat run scripts/monitor-events.js --network baseSepolia
```

**Environment Variables**:
- `MONITOR_POLL_INTERVAL`: Polling interval in milliseconds (default: 2000)
- `MONITOR_VERBOSE`: Show verbose output including block checks (default: false)

**What it displays**:
- Real-time event stream with color-coded output
- VestingScheduleCreated events (green)
- TokensReleased events (yellow)
- VestingRevoked events (red)
- Event statistics (schedules created, tokens released, uptime)
- Transaction links to Basescan
- Graceful shutdown with Ctrl+C

**Perfect for**:
- Development and debugging
- Operational monitoring
- Integration testing
- Watching for specific events

**Example Output**:
```
════════════════════════════════════════════════════════════
  📊 TOKEN VESTING EVENT MONITOR
════════════════════════════════════════════════════════════

Network: baseSepolia
Started: 2025-10-12 19:30:00
Press Ctrl+C to stop

────────────────────────────────────────────────────────────

Listening for events...

[19:31:15] VestingScheduleCreated
  Beneficiary: 0x7099...79C8
  Amount:      1,000 TEST
  Start:       2025-10-12 19:31:00
  Cliff:       2025-11-12 19:31:00 (30d from start)
  Duration:    1y
  Block:       12345678
  Tx:          0xabc123...def456
  View:        https://sepolia.basescan.org/tx/0xabc123...

[19:45:22] TokensReleased
  Beneficiary: 0x7099...79C8
  Amount:      25.5 TEST
  Block:       12345690
  Tx:          0xghi789...jkl012

────────────────────────────────────────────────────────────
📈 Statistics
────────────────────────────────────────────────────────────
  Schedules Created:    2
  Tokens Released:      25.5 TEST
  Schedules Revoked:    0
  Uptime:               15m
────────────────────────────────────────────────────────────
```

---

### 9. query-events.js

**Purpose**: Query and analyze historical vesting events with powerful filtering and export capabilities.

**Usage**:
```bash
# Query all events
npx hardhat run scripts/query-events.js --network baseSepolia

# Query specific event type
EVENT_TYPE=VestingScheduleCreated npx hardhat run scripts/query-events.js --network baseSepolia

# Query specific beneficiary
BENEFICIARY=0x7099...79C8 npx hardhat run scripts/query-events.js --network baseSepolia

# Query date range by block numbers
FROM_BLOCK=12345000 TO_BLOCK=12346000 npx hardhat run scripts/query-events.js --network baseSepolia

# Limit results
LIMIT=50 npx hardhat run scripts/query-events.js --network baseSepolia

# Export to CSV
EXPORT_CSV=true npx hardhat run scripts/query-events.js --network baseSepolia

# Export to JSON
EXPORT_JSON=true npx hardhat run scripts/query-events.js --network baseSepolia

# Custom output directory
OUTPUT_DIR=./my-exports EXPORT_CSV=true npx hardhat run scripts/query-events.js --network baseSepolia

# Combine filters
EVENT_TYPE=TokensReleased BENEFICIARY=0x7099...79C8 LIMIT=10 EXPORT_CSV=true \
  npx hardhat run scripts/query-events.js --network baseSepolia
```

**Environment Variables**:
- `EVENT_TYPE`: Filter by event type (VestingScheduleCreated, TokensReleased, VestingRevoked)
- `BENEFICIARY`: Filter by beneficiary address
- `FROM_BLOCK`: Start block number (default: deployment block)
- `TO_BLOCK`: End block number (default: latest)
- `LIMIT`: Maximum events to display (default: 100)
- `EXPORT_CSV`: Export results to CSV file (true/false)
- `EXPORT_JSON`: Export results to JSON file (true/false)
- `OUTPUT_DIR`: Output directory for exports (default: ./events-export)

**What it displays**:
- Filtered event list with full details
- Block numbers and timestamps
- Transaction hashes with Basescan links
- Summary statistics:
  - Total events by type
  - Unique beneficiaries
  - Total tokens vested/released/refunded
- Color-coded output for readability

**Export Formats**:

**CSV Export** - Great for Excel/spreadsheets:
```csv
Event Type,Block Number,Timestamp,Transaction Hash,Beneficiary,Amount (TEST),Additional Data
VestingScheduleCreated,12345678,2025-10-12 19:31:00,0xabc123...,0x7099...79C8,1000,"Cliff: 2025-11-12, Duration: 1y"
TokensReleased,12345690,2025-10-12 19:45:00,0xdef456...,0x7099...79C8,25.5,""
```

**JSON Export** - Great for programmatic analysis:
```json
[
  {
    "eventType": "VestingScheduleCreated",
    "blockNumber": 12345678,
    "blockTimestamp": 1728759060,
    "transactionHash": "0xabc123...",
    "args": {
      "beneficiary": "0x7099...79C8",
      "amount": "1000000000000000000000",
      "amountFormatted": "1000",
      "start": "1728759060",
      "cliff": "1731351060",
      "duration": "31536000"
    }
  }
]
```

**Perfect for**:
- Historical data analysis
- Compliance and auditing
- Generating reports
- Data export for external systems
- Investigating specific events
- Beneficiary activity tracking

**Example Output**:
```
══════════════════════════════════════════════════════════════════════
  🔍 TOKEN VESTING EVENT QUERY TOOL
══════════════════════════════════════════════════════════════════════

Network: baseSepolia
Contract: 0x5D6709C5b1ED83125134672AFa905cA045978a1D

Query Filters:
──────────────────────────────────────────────────────────────────────
  Event Type: VestingScheduleCreated
  Beneficiary: All
  From Block: 12345000
  To Block: latest
  Limit: 100
──────────────────────────────────────────────────────────────────────

Querying events...

✅ Found 15 events

══════════════════════════════════════════════════════════════════════
  📋 EVENTS
══════════════════════════════════════════════════════════════════════

[1] VestingScheduleCreated
  Block:       12345678 (2025-10-12 19:31:00)
  Tx Hash:     0xabc123...def456
  Beneficiary: 0x7099797...79C8
  Amount:      1,000 TEST
  Start:       2025-10-12 19:31:00
  Cliff:       2025-11-12 19:31:00 (30d from start)
  Duration:    1y
  View:        https://sepolia.basescan.org/tx/0xabc123...

[2] VestingScheduleCreated
  Block:       12345890 (2025-10-12 20:15:00)
  Tx Hash:     0xghi789...jkl012
  Beneficiary: 0x8ABC123...DEF456
  Amount:      5,000 TEST
  Start:       2025-10-12 20:15:00
  Cliff:       2025-11-12 20:15:00 (30d from start)
  Duration:    2y
  View:        https://sepolia.basescan.org/tx/0xghi789...

══════════════════════════════════════════════════════════════════════
  📊 SUMMARY
══════════════════════════════════════════════════════════════════════

Total Events:            15
  Schedules Created:     15
  Tokens Released:       0
  Schedules Revoked:     0

Unique Beneficiaries:    12
Total Tokens Vested:     125,000 TEST
Total Tokens Released:   0 TEST
Total Refunded:          0 TEST

══════════════════════════════════════════════════════════════════════

✅ CSV exported to: ./events-export/vesting-events-baseSepolia-2025-10-12T19-30-00.csv
```

---

## Common Workflows

### Initial Setup

```bash
# 1. Deploy contracts
npx hardhat run scripts/deploy.js --network baseSepolia

# 2. Mint tokens for testing
npx hardhat run scripts/mint-tokens.js --network baseSepolia

# 3. Create a vesting schedule
npx hardhat run scripts/interact.js --network baseSepolia
```

### Beneficiary Workflow

```bash
# 1. Check vesting status
BENEFICIARY=0xYourAddress npx hardhat run scripts/check-vested.js --network baseSepolia

# 2. Wait for tokens to vest...

# 3. Release vested tokens (as beneficiary)
npx hardhat run scripts/release-tokens.js --network baseSepolia

# 4. Check status again
BENEFICIARY=0xYourAddress npx hardhat run scripts/check-vested.js --network baseSepolia
```

### Owner Workflow (Revocation)

```bash
# 1. Check beneficiary's schedule
BENEFICIARY=0xBeneficiaryAddress npx hardhat run scripts/check-vested.js --network baseSepolia

# 2. Preview revocation
BENEFICIARY=0xBeneficiaryAddress npx hardhat run scripts/revoke.js --network baseSepolia

# 3. Confirm and execute revocation
CONFIRM_REVOKE=yes BENEFICIARY=0xBeneficiaryAddress npx hardhat run scripts/revoke.js --network baseSepolia
```

### Complete Testing Workflow (Localhost)

```bash
# Terminal 1: Start local node
npx hardhat node

# Terminal 2: Run comprehensive demo
npx hardhat run scripts/demo.js --network localhost
```

### Event Monitoring Workflow

```bash
# Terminal 1: Monitor events in real-time
npx hardhat run scripts/monitor-events.js --network baseSepolia

# Terminal 2: Perform actions (create schedules, release tokens, etc.)
npx hardhat run scripts/interact.js --network baseSepolia

# Events appear immediately in Terminal 1!
```

### Event Analysis Workflow

```bash
# 1. Query all recent events
npx hardhat run scripts/query-events.js --network baseSepolia

# 2. Query specific beneficiary activity
BENEFICIARY=0xYourAddress npx hardhat run scripts/query-events.js --network baseSepolia

# 3. Export for analysis
EXPORT_CSV=true EXPORT_JSON=true npx hardhat run scripts/query-events.js --network baseSepolia

# 4. Analyze in Excel or custom tools
open events-export/vesting-events-baseSepolia-*.csv
```

### Compliance/Audit Workflow

```bash
# 1. Export all historical events
FROM_BLOCK=0 EXPORT_CSV=true EXPORT_JSON=true \
  npx hardhat run scripts/query-events.js --network baseSepolia

# 2. Generate beneficiary-specific reports
for addr in "${beneficiaries[@]}"; do
  BENEFICIARY=$addr EXPORT_CSV=true \
    npx hardhat run scripts/query-events.js --network baseSepolia
done

# 3. Archive exports
mkdir -p audit-reports/$(date +%Y-%m-%d)
mv events-export/* audit-reports/$(date +%Y-%m-%d)/
```

---

## Tips & Best Practices

### Testing on Localhost

1. **Start a local node**: `npx hardhat node`
2. **Use demo.js**: It automatically handles time manipulation
3. **Fast iteration**: No waiting for real time or gas costs

### Testing on Base Sepolia

1. **Get testnet ETH**: Use the [Coinbase faucet](https://portal.cdp.coinbase.com/products/faucet)
2. **Use short durations**: Set cliff and duration to minutes/hours for faster testing
3. **Monitor on Basescan**: All scripts provide Basescan links
4. **Check gas costs**: Transactions are nearly free on Base Sepolia

### Environment Variables

All scripts respect these environment variables:
- `BENEFICIARY`: Address of the beneficiary
- `MINT_AMOUNT`: Amount to mint
- `CONFIRM_REVOKE`: Confirmation for revocation

Example:
```bash
BENEFICIARY=0x1234... npx hardhat run scripts/check-vested.js --network baseSepolia
```

### Multiple Beneficiaries

To create schedules for multiple beneficiaries:

```bash
# Beneficiary 1
# Modify interact.js to use address 1
npx hardhat run scripts/interact.js --network baseSepolia

# Beneficiary 2
# Modify interact.js to use address 2
npx hardhat run scripts/interact.js --network baseSepolia
```

Or create a custom script that loops through beneficiaries.

### Viewing Events

All major actions emit events. To view them:

```solidity
// VestingScheduleCreated
filter = vesting.filters.VestingScheduleCreated()
events = await vesting.queryFilter(filter)

// TokensReleased
filter = vesting.filters.TokensReleased()
events = await vesting.queryFilter(filter)

// VestingRevoked
filter = vesting.filters.VestingRevoked()
events = await vesting.queryFilter(filter)
```

---

## Troubleshooting

### "No deployment file found"

**Problem**: Script can't find deployed contract addresses.

**Solution**: Run `deploy.js` first:
```bash
npx hardhat run scripts/deploy.js --network baseSepolia
```

### "Insufficient token balance"

**Problem**: Owner doesn't have enough tokens to create vesting schedule.

**Solution**: Run `mint-tokens.js`:
```bash
npx hardhat run scripts/mint-tokens.js --network baseSepolia
```

### "Beneficiary already has a vesting schedule"

**Problem**: Current design allows one schedule per beneficiary.

**Solution**: Use a different beneficiary address or deploy a new vesting contract.

### "Not the original owner"

**Problem**: Only the address that created the schedule can revoke it.

**Solution**: Make sure you're using the correct wallet (owner's wallet).

### "No tokens available to release"

**Problem**: Either in cliff period or already released all vested tokens.

**Solution**: Run `check-vested.js` to see status:
```bash
BENEFICIARY=0xYourAddress npx hardhat run scripts/check-vested.js --network baseSepolia
```

---

## Script Development

Want to create your own scripts? Here's a template:

```javascript
const hre = require("hardhat");

async function main() {
  // Load deployment
  const deployment = require(`../deployments/${hre.network.name}.json`);

  // Connect to contracts
  const token = await hre.ethers.getContractAt(
    "MockERC20",
    deployment.contracts.MockERC20
  );
  const vesting = await hre.ethers.getContractAt(
    "TokenVesting",
    deployment.contracts.TokenVesting
  );

  // Get signers
  const [signer] = await hre.ethers.getSigners();

  // Your logic here
  console.log("Signer:", signer.address);

  // Example: Check vesting schedule
  const schedule = await vesting.vestingSchedules(signer.address);
  console.log("Amount:", hre.ethers.formatEther(schedule.amount));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

---

## Additional Resources

- **Hardhat Documentation**: https://hardhat.org/docs
- **Ethers.js Documentation**: https://docs.ethers.org/v6/
- **Base Network**: https://docs.base.org/
- **Basescan**: https://sepolia.basescan.org/

---

**Need Help?**

- Check the main [README.md](../README.md) for project overview
- Review the [test suite](../test/) for usage examples
- Open an issue on GitHub for bugs or questions
