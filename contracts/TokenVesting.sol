// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TokenVesting
 * @dev Time-locked token vesting contract with cliff periods
 *
 * @notice This contract enables organizations to create vesting schedules for tokens
 * with configurable cliff periods and linear vesting over time.
 *
 * Key Features:
 * - Linear vesting with cliff periods
 * - Single vesting schedule per beneficiary
 * - Revocable schedules (optional)
 * - ERC20 compatible (works with any standard token)
 * - Gas optimized with OpenZeppelin libraries
 *
 * Use Cases:
 * - Employee equity compensation
 * - Investor token lockups
 * - Team token allocations
 * - Advisor grants
 *
 * Security:
 * - ReentrancyGuard protection
 * - SafeERC20 for token transfers
 * - Comprehensive input validation
 * - Event emission for transparency
 *
 * @author Token Vesting Team
 * @custom:security-contact security@example.com
 */
contract TokenVesting is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ State Variables ============

    /// @notice The ERC20 token being vested
    /// @dev Immutable after deployment for gas optimization
    IERC20 public immutable token;

    /// @notice Vesting schedule structure
    /// @dev Stores all vesting parameters for a beneficiary
    struct VestingSchedule {
        address beneficiary;    // Address of token recipient
        uint256 start;          // Start timestamp (Unix time)
        uint256 cliff;          // Cliff timestamp (Unix time)
        uint256 duration;       // Total vesting duration in seconds
        uint256 amount;         // Total tokens to vest
        uint256 released;       // Tokens already released
        bool revocable;         // Can the schedule be revoked?
        bool revoked;           // Has it been revoked?
    }

    /// @notice Mapping of beneficiary address to their vesting schedule
    /// @dev One schedule per beneficiary in MVP version
    mapping(address => VestingSchedule) public vestingSchedules;

    // ============ Events ============

    /**
     * @notice Emitted when a new vesting schedule is created
     * @param beneficiary Address receiving vested tokens
     * @param amount Total tokens to vest
     * @param start Start timestamp
     * @param cliff Cliff timestamp
     * @param duration Total vesting duration
     */
    event VestingScheduleCreated(
        address indexed beneficiary,
        uint256 amount,
        uint256 start,
        uint256 cliff,
        uint256 duration
    );

    /**
     * @notice Emitted when vested tokens are released to beneficiary
     * @param beneficiary Address receiving tokens
     * @param amount Number of tokens released
     */
    event TokensReleased(address indexed beneficiary, uint256 amount);

    /**
     * @notice Emitted when a vesting schedule is revoked
     * @param beneficiary Address whose schedule was revoked
     * @param refunded Amount of unvested tokens returned to owner
     */
    event VestingRevoked(address indexed beneficiary, uint256 refunded);

    // ============ Constructor ============

    /**
     * @dev Constructor sets the ERC20 token address
     * @param _token Address of the ERC20 token to be vested
     *
     * @notice Token address is immutable after deployment
     * Make sure to use the correct token contract!
     *
     * Requirements:
     * - Token address cannot be zero address
     */
    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "Token address cannot be zero");
        token = IERC20(_token);
    }

    // ============ External Functions ============

    /**
     * @notice Create a vesting schedule for a beneficiary
     * @dev Transfers tokens from caller to this contract
     *
     * @param beneficiary Address to receive vested tokens
     * @param amount Total tokens to vest (in wei, 18 decimals)
     * @param cliffDuration Cliff period in seconds (e.g., 31536000 = 1 year)
     * @param duration Total vesting duration in seconds (e.g., 126144000 = 4 years)
     * @param revocable Whether the schedule can be revoked
     *
     * Requirements:
     * - Beneficiary cannot be zero address
     * - Amount must be greater than zero
     * - Duration must be greater than zero
     * - Cliff must be less than or equal to duration
     * - Beneficiary must not have an existing schedule
     * - Caller must have approved this contract to spend tokens
     * - Caller must have sufficient token balance
     *
     * Effects:
     * - Creates vesting schedule in storage
     * - Transfers tokens from caller to contract
     * - Emits VestingScheduleCreated event
     *
     * Example:
     * createVestingSchedule(
     *     0x123...,                    // beneficiary
     *     1000000000000000000000,      // 1,000 tokens
     *     31536000,                    // 1 year cliff
     *     126144000,                   // 4 year total
     *     true                         // revocable
     * )
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 amount,
        uint256 cliffDuration,
        uint256 duration,
        bool revocable
    ) external nonReentrant {
        // FR-2.2: Validate beneficiary is not zero address
        require(beneficiary != address(0), "Beneficiary cannot be zero address");

        // FR-2.3: Validate amount is greater than zero
        require(amount > 0, "Amount must be greater than zero");

        // FR-2.4: Validate duration is greater than zero
        require(duration > 0, "Duration must be greater than zero");

        // FR-2.5: Validate cliff is less than or equal to duration
        require(
            cliffDuration <= duration,
            "Cliff duration cannot exceed total duration"
        );

        // FR-2.6: Prevent duplicate schedules for same beneficiary
        require(
            vestingSchedules[beneficiary].amount == 0,
            "Beneficiary already has a vesting schedule"
        );

        // FR-2.10: Set start time to current block timestamp
        uint256 start = block.timestamp;
        uint256 cliff = start + cliffDuration;

        // FR-2.8: Store schedule in mapping
        vestingSchedules[beneficiary] = VestingSchedule({
            beneficiary: beneficiary,
            start: start,
            cliff: cliff,
            duration: duration,
            amount: amount,
            released: 0,
            revocable: revocable,
            revoked: false
        });

        // FR-2.7: Transfer tokens from caller to contract
        token.safeTransferFrom(msg.sender, address(this), amount);

        // FR-2.9: Emit event
        emit VestingScheduleCreated(beneficiary, amount, start, cliff, duration);
    }

    /**
     * @notice Release vested tokens to beneficiary
     * @dev Can only be called by the beneficiary
     *
     * Requirements:
     * - Caller must be the beneficiary
     * - Must have a vesting schedule
     * - Must have unreleased vested tokens available
     *
     * Effects:
     * - Calculates vested amount
     * - Updates released amount in storage
     * - Transfers tokens to beneficiary
     * - Emits TokensReleased event
     *
     * Gas Cost: ~80,000 gas
     */
    function release() external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];

        // Verify schedule exists
        require(schedule.amount > 0, "No vesting schedule found");

        // FR-4.2: Calculate unreleased vested amount
        uint256 vested = _vestedAmount(msg.sender);
        uint256 unreleased = vested - schedule.released;

        // FR-4.3: Revert if no tokens available
        require(unreleased > 0, "No tokens available for release");

        // FR-4.4: Update released amount (checks-effects-interactions pattern)
        schedule.released += unreleased;

        // FR-4.5: Transfer tokens to beneficiary
        token.safeTransfer(msg.sender, unreleased);

        // FR-4.6: Emit event
        emit TokensReleased(msg.sender, unreleased);
    }

    /**
     * @notice Revoke a vesting schedule and return unvested tokens
     * @dev Can only be called by contract owner
     *
     * @param beneficiary Address whose schedule to revoke
     *
     * Requirements:
     * - Only owner can call
     * - Schedule must exist
     * - Schedule must be revocable
     * - Schedule must not already be revoked
     *
     * Effects:
     * - Calculates vested amount at revocation time
     * - Transfers vested amount to beneficiary
     * - Returns unvested amount to owner
     * - Marks schedule as revoked
     * - Emits VestingRevoked event
     *
     * Example Use Case:
     * Employee leaves company after 2 years of 4-year vesting
     * - Vested tokens (50%) go to employee
     * - Unvested tokens (50%) return to company
     */
    function revoke(address beneficiary) external onlyOwner nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[beneficiary];

        // Verify schedule exists
        require(schedule.amount > 0, "No vesting schedule found");

        // FR-5.2: Check schedule is revocable
        require(schedule.revocable, "Schedule is not revocable");

        // FR-5.3: Check not already revoked
        require(!schedule.revoked, "Schedule already revoked");

        // FR-5.4: Calculate vested amount at this moment
        uint256 vested = _vestedAmount(beneficiary);
        uint256 unvested = schedule.amount - vested;

        // FR-5.5: Transfer any unreleased vested tokens to beneficiary
        uint256 unreleasedVested = vested - schedule.released;
        if (unreleasedVested > 0) {
            schedule.released = vested;
            token.safeTransfer(beneficiary, unreleasedVested);
        }

        // FR-5.6: Transfer unvested tokens to owner
        if (unvested > 0) {
            token.safeTransfer(owner(), unvested);
        }

        // FR-5.7: Mark as revoked
        schedule.revoked = true;

        // FR-5.8: Emit event
        emit VestingRevoked(beneficiary, unvested);
    }

    // ============ View Functions ============

    /**
     * @notice Calculate vested amount for a beneficiary
     * @dev Public view function - no gas cost when called externally
     *
     * @param beneficiary Address to check
     * @return uint256 Amount of tokens vested (not necessarily released)
     *
     * Vesting Formula:
     * - Before cliff: 0% vested
     * - After cliff, before end: Linear vesting
     * - After end: 100% vested
     *
     * Linear calculation:
     * vestedAmount = totalAmount * (timeElapsed / totalDuration)
     *
     * Example:
     * - Total: 1,000 tokens
     * - Duration: 4 years
     * - After 2 years: 500 tokens vested
     * - After 4 years: 1,000 tokens vested
     */
    function vestedAmount(address beneficiary) public view returns (uint256) {
        return _vestedAmount(beneficiary);
    }

    /**
     * @notice Get complete vesting schedule for a beneficiary
     * @dev Convenience function to get all schedule details
     *
     * @param beneficiary Address to query
     * @return schedule Complete VestingSchedule struct
     */
    function getVestingSchedule(address beneficiary)
        external
        view
        returns (VestingSchedule memory)
    {
        return vestingSchedules[beneficiary];
    }

    /**
     * @notice Check if address has a vesting schedule
     * @param beneficiary Address to check
     * @return bool True if schedule exists
     */
    function hasVestingSchedule(address beneficiary) external view returns (bool) {
        return vestingSchedules[beneficiary].amount > 0;
    }

    /**
     * @notice Calculate unreleased vested amount
     * @dev Tokens that are vested but not yet claimed
     *
     * @param beneficiary Address to check
     * @return uint256 Amount available to release
     */
    function releasableAmount(address beneficiary) external view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[beneficiary];
        uint256 vested = _vestedAmount(beneficiary);
        return vested - schedule.released;
    }

    // ============ Internal Functions ============

    /**
     * @dev Internal function to calculate vested amount
     * @param beneficiary Address to calculate for
     * @return uint256 Vested amount
     *
     * Implementation of linear vesting formula:
     * - Returns 0 if no schedule exists
     * - Returns 0 if current time < cliff
     * - Returns full amount if current time >= start + duration
     * - Returns proportional amount based on time elapsed
     */
    function _vestedAmount(address beneficiary) private view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[beneficiary];

        // FR-3.7: Return 0 if no schedule
        if (schedule.amount == 0) {
            return 0;
        }

        // FR-3.2: Return 0 if before cliff
        if (block.timestamp < schedule.cliff) {
            return 0;
        }

        // FR-3.3: Return full amount if vesting complete
        if (block.timestamp >= schedule.start + schedule.duration) {
            return schedule.amount;
        }

        // FR-3.4 & FR-3.5: Calculate linear vested amount
        // vestedAmount = totalAmount * (timeElapsed / totalDuration)
        uint256 timeElapsed = block.timestamp - schedule.start;
        return (schedule.amount * timeElapsed) / schedule.duration;
    }
}
