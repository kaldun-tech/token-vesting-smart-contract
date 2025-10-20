# Security Policy

## Overview

This document outlines the security practices, vulnerability reporting process, and security considerations for the Token Vesting Smart Contract project.

---

## Supported Versions

| Component | Version | Supported | Notes |
|-----------|---------|-----------|-------|
| Smart Contracts | Latest | ✅ Yes | Deployed on Base Sepolia testnet |
| Backend API | Latest | ✅ Yes | Go 1.24+ |
| Frontend | Latest | ✅ Yes | Next.js 14.2.33+ |

**Note**: This is a testnet deployment. Do not use with real funds without a professional security audit.

---

## Security Measures

### Smart Contracts

**Security Features**:
- ✅ **OpenZeppelin Libraries**: Battle-tested, audited security primitives
- ✅ **ReentrancyGuard**: Prevents reentrancy attacks on state-changing functions
- ✅ **SafeMath**: Solidity 0.8+ built-in overflow/underflow protection
- ✅ **Input Validation**: All parameters validated before execution
- ✅ **Access Control**: Ownership patterns for privileged operations
- ✅ **Event Emission**: Full transparency and audit trail

**Static Analysis**:
- ✅ **Slither**: Automated security analysis (runs in CI/CD)
- ✅ **100% Test Coverage**: Comprehensive test suite
- ✅ **Security Tests**: Specific tests for reentrancy protection

**Known Limitations**:
1. **One Schedule Per Beneficiary**: Design constraint (not a security issue)
2. **Revocation Power**: Owner can revoke if `revocable=true` (by design)
3. **Block Timestamp**: ~15 second miner manipulation (minimal impact on multi-day vesting)
4. **No Pause Function**: Cannot pause vesting in emergencies
5. **Immutable**: No upgrade path once deployed

**Audit Status**: ⚠️ **Not Professionally Audited**
- Recommended before mainnet deployment with real funds
- Current: Testnet only, educational/demonstration purposes

### Backend (Go)

**Security Features**:
- ✅ **Input Validation**: Ethereum address validation
- ✅ **Database Prepared Statements**: GORM prevents SQL injection
- ✅ **CORS Configuration**: Restricted cross-origin access
- ✅ **Environment Variables**: Sensitive config not hardcoded
- ✅ **Error Sanitization**: No sensitive data in error messages

**Static Analysis**:
- ✅ **gosec**: Security-focused linter (runs in CI/CD)
- ✅ **golangci-lint**: 15+ linters including security checks

**Dependencies**:
- ✅ **Automated Updates**: Dependabot enabled (recommended)
- ⚠️ **Manual Review**: Check `go list -m -u all` monthly

### Frontend (Next.js)

**Security Features**:
- ✅ **No Private Keys**: Wallet handles all signing
- ✅ **Read-Only by Default**: Writes require explicit user approval
- ✅ **Environment Variables**: Sensitive config in `.env` (not committed)
- ✅ **HTTPS Only**: Production deployments must use SSL

**Dependency Security**:
- ✅ **npm audit**: Automated vulnerability scanning (runs in CI/CD)
- ✅ **Regular Updates**: Keep dependencies current
- ✅ **Critical Vulnerabilities**: CI/CD fails on critical issues

**Known Vulnerabilities** (as of 2025-10-20):
```
Critical: 0 (✅ Fixed)
High: 0 (✅ No high-severity issues)
Medium: 0
Low: 19 (⚠️ WalletConnect/Reown dependencies - prototype pollution in fast-redact)
```

**Low Severity Issues**:
- **fast-redact** prototype pollution in WalletConnect dependencies
- **Impact**: Low - not exploitable in typical usage
- **Status**: Monitoring upstream fix from WalletConnect team
- **Mitigation**: Not directly exploitable in this application

---

## Reporting a Vulnerability

### Where to Report

**For security vulnerabilities**:
1. **DO NOT** open a public GitHub issue
2. **Email**: taras@kalduntech.com (or create a private security advisory)
3. **GitHub**: Use "Security" tab → "Report a vulnerability"

**For non-security bugs**:
- Open a regular GitHub issue: https://github.com/kaldun-tech/token-vesting-smart-contract/issues

### What to Include

Please include:
- **Description**: Clear description of the vulnerability
- **Impact**: Potential impact (data leak, DoS, fund theft, etc.)
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Proof of Concept**: Code or screenshots if applicable
- **Suggested Fix**: If you have ideas for mitigation

### Response Timeline

| Timeframe | Action |
|-----------|--------|
| **24 hours** | Initial acknowledgment |
| **7 days** | Preliminary assessment and severity classification |
| **30 days** | Fix developed and tested (for critical issues) |
| **90 days** | Public disclosure (after fix deployed) |

**Severity Classification**:
- **Critical**: Fund theft, contract takeover, data breach
- **High**: DoS, privilege escalation, significant data exposure
- **Medium**: Moderate impact, requires specific conditions
- **Low**: Minor issues, limited impact

---

## Security Best Practices

### For Developers

**Smart Contracts**:
```solidity
// ✅ Good: Use OpenZeppelin
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// ✅ Good: Validate inputs
require(beneficiary != address(0), "Invalid address");

// ✅ Good: Emit events
emit VestingScheduleCreated(beneficiary, amount, ...);

// ❌ Bad: Unchecked external calls
token.transfer(beneficiary, amount); // Missing return value check
```

**Backend (Go)**:
```go
// ✅ Good: Validate Ethereum addresses
if !common.IsHexAddress(address) {
    return errors.New("Invalid Ethereum address")
}

// ✅ Good: Use environment variables
apiKey := os.Getenv("API_KEY")

// ❌ Bad: Hardcoded secrets
const apiKey = "sk-1234..." // Never do this!
```

**Frontend**:
```typescript
// ✅ Good: User signs transactions
const { writeContract } = useWriteContract()
writeContract({ ... }) // User approves in wallet

// ✅ Good: Environment variables for public config
const contractAddress = process.env.NEXT_PUBLIC_VESTING_ADDRESS

// ❌ Bad: Never expose private keys
const privateKey = process.env.PRIVATE_KEY // Don't do this in frontend!
```

### For Users

**Using the Smart Contracts**:
1. ✅ **Verify Contract**: Check contract on Basescan before interacting
2. ✅ **Test First**: Use small amounts first on testnet
3. ✅ **Review Transactions**: Always review before signing
4. ✅ **Check Network**: Ensure you're on the correct network (Base Sepolia)
5. ❌ **Don't Share Keys**: Never share private keys or seed phrases

**Using the Frontend**:
1. ✅ **Verify URL**: Ensure correct domain (avoid phishing)
2. ✅ **Use Hardware Wallet**: For large amounts, use Ledger/Trezor
3. ✅ **Review Permissions**: Check what the contract requests
4. ✅ **Keep Software Updated**: Update MetaMask and browser regularly

---

## Dependency Security

### Automated Checks

**CI/CD Pipeline**:
- ✅ `npm audit` for frontend dependencies
- ✅ `golangci-lint` with `gosec` for backend
- ✅ `slither` for smart contracts

**Frequency**: Every push and pull request

### Manual Reviews

**Monthly Security Tasks**:
```bash
# Frontend - Check for updates
cd frontend
npm audit
npm outdated

# Backend - Check Go dependencies
cd backend
go list -m -u all

# Smart Contracts - Update OpenZeppelin
npm outdated @openzeppelin/contracts
```

### Critical Dependency Updates

**Process**:
1. **Security Advisory Received** → Review impact
2. **Assess Risk** → Critical? High? Medium?
3. **Update Dependency** → Test thoroughly
4. **Deploy Fix** → Prioritize critical issues
5. **Notify Users** → If public deployment affected

---

## Vulnerability Disclosure

### Fixed Vulnerabilities

None yet (project is new).

### Open Issues

**Low Severity - WalletConnect Dependencies**:
- **Issue**: Prototype pollution in `fast-redact`
- **Severity**: Low
- **Impact**: Not exploitable in typical usage
- **Status**: Monitoring upstream fix
- **Workaround**: Not needed (low risk)

---

## Security Audit History

| Date | Auditor | Scope | Report | Findings |
|------|---------|-------|--------|----------|
| N/A | N/A | N/A | N/A | Not audited yet |

**Recommendation**: Professional audit required before mainnet deployment with real funds.

**Suggested Auditors**:
- [Consensys Diligence](https://consensys.net/diligence/)
- [Trail of Bits](https://www.trailofbits.com/)
- [OpenZeppelin](https://www.openzeppelin.com/security-audits)
- [Certora](https://www.certora.com/)

---

## Security Tools Used

| Tool | Purpose | Frequency |
|------|---------|-----------|
| **Slither** | Solidity static analysis | Every commit (CI/CD) |
| **Hardhat Tests** | Smart contract testing | Every commit (CI/CD) |
| **gosec** | Go security linter | Every commit (CI/CD) |
| **golangci-lint** | Go meta-linter | Every commit (CI/CD) |
| **npm audit** | npm dependency scanning | Every commit (CI/CD) |
| **Manual Review** | Code review | Every PR |

---

## Security Resources

### Smart Contract Security
- [Ethereum Smart Contract Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [OpenZeppelin Security](https://docs.openzeppelin.com/contracts/4.x/security)
- [SWC Registry](https://swcregistry.io/)

### Go Security
- [Go Security Policy](https://go.dev/security/)
- [OWASP Go Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Go_SCP_Cheat_Sheet.html)

### Frontend Security
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)

---

## Contact

- **Security Email**: taras@kalduntech.com
- **GitHub**: https://github.com/kaldun-tech/token-vesting-smart-contract
- **Security Advisories**: https://github.com/kaldun-tech/token-vesting-smart-contract/security/advisories

---

**Last Updated**: 2025-10-20
**Next Review**: 2025-11-20 (monthly)
