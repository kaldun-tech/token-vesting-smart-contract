# Contributing to Token Vesting Smart Contract

Thank you for your interest in contributing! This guide will help you get started with contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Testing Requirements](#testing-requirements)
- [CI/CD Pipeline](#cicd-pipeline)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Getting Help](#getting-help)

---

## Code of Conduct

This project follows a standard code of conduct:

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect differing viewpoints and experiences

---

## How Can I Contribute?

### 🐛 Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/kaldun-tech/token-vesting-smart-contract/issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs. actual behavior
   - Environment details (OS, Node version, etc.)
   - Screenshots if applicable

### 💡 Suggesting Features

1. Check [existing feature requests](https://github.com/kaldun-tech/token-vesting-smart-contract/issues?q=is%3Aissue+label%3Aenhancement)
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Proposed implementation (if you have ideas)
   - Any potential drawbacks

### 🔧 Contributing Code

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## Development Setup

### Prerequisites

- **Node.js**: v18+ (v20+ recommended for frontend)
- **npm**: v9+
- **Go**: 1.24+ (for backend)
- **Python 3**: For Slither static analysis (optional)
- **Git**: Version control

### Initial Setup

```bash
# 1. Clone your fork
git clone https://github.com/YOUR_USERNAME/token-vesting-smart-contract.git
cd token-vesting-smart-contract

# 2. Add upstream remote
git remote add upstream https://github.com/kaldun-tech/token-vesting-smart-contract.git

# 3. Install smart contract dependencies
npm install

# 4. Install backend dependencies (if working on backend)
cd backend
go mod download
cd ..

# 5. Install frontend dependencies (if working on frontend)
cd frontend
npm install --legacy-peer-deps
cd ..

# 6. Setup environment variables
cp .env.example .env
# Edit .env with your values
```

### Verify Setup

```bash
# Test smart contracts
npm test

# Test backend (if applicable)
cd backend && make test && cd ..

# Test frontend (if applicable)
cd frontend && npm run lint && npm run build && cd ..
```

---

## Development Workflow

### 1. Create a Feature Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

**Branch naming conventions**:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding tests

### 2. Make Your Changes

#### Smart Contracts (`contracts/`)

```bash
# Compile contracts
npx hardhat compile

# Run tests frequently
npx hardhat test

# Check coverage
npx hardhat coverage

# Run Slither (optional but recommended)
source venv/bin/activate  # If you have Slither installed
python -m slither .
```

#### Backend (`backend/`)

```bash
cd backend

# Run tests
make test

# Run with verbose output
make test -v

# Check linting
make lint

# Format code
make fmt

# Run integration tests
./test.sh -i
```

#### Frontend (`frontend/`)

```bash
cd frontend

# Run dev server
npm run dev

# Check TypeScript
npx tsc --noEmit

# Lint code
npm run lint

# Build for production
npm run build
```

### 3. Test Your Changes

**IMPORTANT**: All changes must be tested before submitting a PR.

```bash
# Smart contracts
npx hardhat test
npx hardhat coverage

# Backend (if modified)
cd backend && make test && make lint && cd ..

# Frontend (if modified)
cd frontend && npx tsc --noEmit && npm run lint && npm run build && cd ..
```

### 4. Commit Your Changes

Follow conventional commit format:

```bash
git add .
git commit -m "feat: add new vesting curve algorithm"
# or
git commit -m "fix: resolve cliff period calculation bug"
# or
git commit -m "docs: update contributing guide"
```

**Commit message format**:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Adding tests
- `refactor:` - Code refactoring
- `style:` - Code style changes (formatting)
- `chore:` - Build/tooling changes

### 5. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Go to GitHub and create a Pull Request
```

---

## Testing Requirements

### Smart Contracts

**Required**:
- ✅ All tests must pass (`npx hardhat test`)
- ✅ Coverage should not decrease (`npx hardhat coverage`)
- ✅ New features require new tests
- ✅ Slither analysis should not introduce new high/medium issues

**Example test structure**:
```javascript
describe("NewFeature", function() {
  it("should work correctly", async function() {
    // Arrange
    const [owner, beneficiary] = await ethers.getSigners();

    // Act
    await contract.newFeature(beneficiary.address);

    // Assert
    expect(await contract.something()).to.equal(expectedValue);
  });
});
```

### Backend (Go)

**Required**:
- ✅ All tests must pass (`make test`)
- ✅ Linting must pass (`make lint`)
- ✅ Code must be formatted (`make fmt`)
- ✅ Integration tests for API endpoints

**Example test structure**:
```go
func TestNewFeature(t *testing.T) {
    // Setup
    db := setupTestDB(t)
    defer db.Close()

    // Test
    result, err := NewFeature(db, input)

    // Assert
    assert.NoError(t, err)
    assert.Equal(t, expected, result)
}
```

### Frontend

**Required**:
- ✅ TypeScript type checking (`npx tsc --noEmit`)
- ✅ ESLint passes (`npm run lint`)
- ✅ Production build succeeds (`npm run build`)
- ✅ Manual testing in browser

---

## CI/CD Pipeline

### Automated Checks

Every push and pull request automatically runs:

**GitHub Actions Workflow** (`.github/workflows/ci.yml`):
1. **Hardhat Smart Contracts**
   - Compile contracts
   - Run tests
   - Generate coverage
   - Run Slither security analysis

2. **Go Backend**
   - Run unit tests
   - Run integration tests (with PostgreSQL)
   - golangci-lint
   - gofmt check
   - Generate coverage

3. **Next.js Frontend**
   - TypeScript type checking
   - ESLint linting
   - Production build

### Viewing CI/CD Results

1. Go to the **Actions** tab on GitHub
2. Click on your commit or PR
3. View results for each job
4. Fix any failures

### CI/CD Must Pass

**Your PR will not be merged unless**:
- ✅ All tests pass
- ✅ No TypeScript errors
- ✅ Linting passes
- ✅ Builds succeed

**Non-blocking** (warnings are OK):
- ⚠️ Coverage decrease (should be minimal)
- ⚠️ Slither informational/low severity findings
- ⚠️ golangci-lint warnings (not errors)

---

## Coding Standards

### Solidity Style Guide

Follow the [Official Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html):

```solidity
// Good
function createVestingSchedule(
    address beneficiary,
    uint256 amount,
    uint256 cliffDuration,
    uint256 duration,
    bool revocable
) external nonReentrant {
    require(beneficiary != address(0), "Invalid beneficiary");
    // ...
}

// Bad
function createVestingSchedule(address beneficiary,uint256 amount,uint256 cliffDuration,uint256 duration,bool revocable) external nonReentrant{require(beneficiary!=address(0),"Invalid beneficiary");
```

**Key points**:
- 4 spaces indentation
- Descriptive variable names
- Natspec comments for public functions
- Event emission for state changes
- Input validation

### Go Style Guide

Follow [Effective Go](https://go.dev/doc/effective_go) and [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments):

```go
// Good
func GetScheduleByBeneficiary(db *gorm.DB, beneficiary string) (*VestingSchedule, error) {
    var schedule VestingSchedule
    result := db.Where("beneficiary = ? AND revoked = ?", beneficiary, false).First(&schedule)
    if result.Error != nil {
        return nil, result.Error
    }
    return &schedule, nil
}

// Bad
func get_schedule(db *gorm.DB, b string) (*VestingSchedule, error) {
	var s VestingSchedule
	result := db.Where("beneficiary = ? AND revoked = ?", b, false).First(&s)
	return &s, result.Error
}
```

**Key points**:
- gofmt formatting (run `make fmt`)
- Exported names start with capital letter
- Error handling always checked
- Descriptive variable names
- godoc comments for exported functions

### TypeScript/React Style Guide

Follow [Airbnb React Style Guide](https://github.com/airbnb/javascript/tree/master/react):

```typescript
// Good
export default function VestingDashboard() {
  const { address } = useAccount()
  const { data: schedule, isLoading } = useReadContract({
    address: VESTING_CONTRACT,
    abi: VESTING_ABI,
    functionName: 'vestingSchedules',
    args: [address],
  })

  if (isLoading) return <div>Loading...</div>

  return <div>{/* ... */}</div>
}

// Bad
export default function VestingDashboard() {
const {address}=useAccount()
const {data:schedule,isLoading}=useReadContract({address:VESTING_CONTRACT,abi:VESTING_ABI,functionName:'vestingSchedules',args:[address]})
if(isLoading)return <div>Loading...</div>
return <div>{/* ... */}</div>}
```

**Key points**:
- Use TypeScript, avoid `any`
- Functional components
- Descriptive prop names
- ESLint auto-fix (`npm run lint -- --fix`)

---

## Pull Request Process

### Before Submitting

**Checklist**:
- [ ] Code follows style guides
- [ ] Tests added/updated
- [ ] All tests pass locally
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with `main`

```bash
# Update your branch
git fetch upstream
git rebase upstream/main

# Final check
npx hardhat test  # Contracts
cd backend && make test && make lint && cd ..  # Backend
cd frontend && npm run lint && npm run build && cd ..  # Frontend
```

### Creating the PR

1. **Go to GitHub** and click "New Pull Request"

2. **Fill out the template**:
   ```markdown
   ## Description
   Brief description of what this PR does.

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Added tests
   - [ ] All tests pass
   - [ ] Manually tested

   ## Checklist
   - [ ] Code follows style guides
   - [ ] Self-reviewed code
   - [ ] Updated documentation
   - [ ] No new warnings
   ```

3. **Wait for CI/CD** to complete

4. **Address review comments**

### PR Review Process

**What reviewers look for**:
- ✅ Code quality and style
- ✅ Test coverage
- ✅ Documentation updates
- ✅ Security considerations
- ✅ Gas optimization (for contracts)
- ✅ Backwards compatibility

**Timeline**:
- Initial review: Within 1-3 days
- Follow-up reviews: Within 1-2 days
- Merge: After approval and passing CI/CD

---

## Getting Help

### Resources

- **Documentation**: Check [README.md](./README.md)
- **Issues**: Browse [existing issues](https://github.com/kaldun-tech/token-vesting-smart-contract/issues)
- **Discussions**: Ask questions in [GitHub Discussions](https://github.com/kaldun-tech/token-vesting-smart-contract/discussions)

### Common Questions

**Q: How do I run tests locally?**
```bash
# Smart contracts
npx hardhat test

# Backend
cd backend && make test

# Frontend
cd frontend && npm run lint && npm run build
```

**Q: CI/CD is failing, but tests pass locally?**
- Ensure you're using the same Node.js version (check `.github/workflows/ci.yml`)
- Make sure all files are committed
- Check if environment variables are needed

**Q: How do I test smart contract changes?**
```bash
# 1. Compile
npx hardhat compile

# 2. Test locally
npx hardhat test

# 3. Deploy to local network
npx hardhat node  # Terminal 1
npx hardhat run scripts/deploy.js --network localhost  # Terminal 2

# 4. Deploy to testnet
npx hardhat run scripts/deploy.js --network baseSepolia
```

**Q: Do I need to set up a self-hosted runner?**
No! GitHub Actions provides free runners for public repositories. Your tests will run automatically on GitHub's infrastructure.

---

## Project-Specific Notes

### Smart Contracts

- **Gas Optimization**: Consider gas costs for new features
- **Security**: Use OpenZeppelin libraries when possible
- **Events**: Emit events for all state changes
- **Testing**: Aim for 100% coverage

### Backend

- **Database**: Use GORM for database operations
- **Validation**: Validate all inputs (especially Ethereum addresses)
- **Errors**: Return meaningful error messages
- **Testing**: Test both success and error cases

### Frontend

- **Web3**: Use wagmi hooks for blockchain interactions
- **UX**: Keep it simple for end users
- **Loading States**: Always show loading/error states
- **Testing**: Manual testing in browser is required

---

## Recognition

Contributors will be:
- Listed in [CONTRIBUTORS.md](./CONTRIBUTORS.md) (if we create one)
- Credited in release notes
- Acknowledged in project documentation

---

## License

By contributing, you agree that your contributions will be licensed under the GPL-3.0 License.

---

**Thank you for contributing! 🎉**

Questions? Open an [issue](https://github.com/kaldun-tech/token-vesting-smart-contract/issues) or [discussion](https://github.com/kaldun-tech/token-vesting-smart-contract/discussions).
