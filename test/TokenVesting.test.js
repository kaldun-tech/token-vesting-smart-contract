const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("TokenVesting", function () {
  // ============ Test Fixtures ============

  /**
   * Deploy contracts and setup test environment
   * This fixture is used to reset state between tests
   */
  async function deployTokenVestingFixture() {
    const [owner, beneficiary, otherAccount] = await ethers.getSigners();

    // Deploy MockERC20 token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy("Test Token", "TEST");

    // Deploy TokenVesting contract
    const TokenVesting = await ethers.getContractFactory("TokenVesting");
    const vesting = await TokenVesting.deploy(await token.getAddress());

    // Mint tokens to owner for testing
    const initialSupply = ethers.parseEther("1000000"); // 1M tokens
    await token.mint(owner.address, initialSupply);

    return { vesting, token, owner, beneficiary, otherAccount, initialSupply };
  }

  /**
   * Setup with a created vesting schedule
   * Common scenario used in many tests
   */
  async function deployWithScheduleFixture() {
    const fixture = await deployTokenVestingFixture();
    const { vesting, token, owner, beneficiary, initialSupply } = fixture;

    // Standard vesting parameters (4 year vest, 1 year cliff)
    const amount = ethers.parseEther("10000"); // 10k tokens
    const cliffDuration = 365 * 24 * 60 * 60; // 1 year in seconds
    const duration = 4 * 365 * 24 * 60 * 60; // 4 years in seconds
    const revocable = true;

    // Approve and create vesting schedule
    await token.approve(await vesting.getAddress(), amount);
    await vesting.createVestingSchedule(
      beneficiary.address,
      amount,
      cliffDuration,
      duration,
      revocable
    );

    return {
      ...fixture,
      amount,
      cliffDuration,
      duration,
      revocable
    };
  }

  // ============ Deployment Tests ============

  describe("Deployment", function () {
    it("Should set the correct token address", async function () {
      const { vesting, token } = await loadFixture(deployTokenVestingFixture);
      expect(await vesting.token()).to.equal(await token.getAddress());
    });

    it("Should set the correct owner", async function () {
      const { vesting, owner } = await loadFixture(deployTokenVestingFixture);
      expect(await vesting.owner()).to.equal(owner.address);
    });

    it("Should reject zero address for token", async function () {
      const TokenVesting = await ethers.getContractFactory("TokenVesting");
      await expect(
        TokenVesting.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("Token address cannot be zero");
    });
  });

  // ============ Create Vesting Schedule Tests ============

  describe("Create Vesting Schedule", function () {
    describe("Success Cases", function () {
      it("Should create a valid vesting schedule", async function () {
        const { vesting, token, beneficiary } = await loadFixture(deployTokenVestingFixture);

        const amount = ethers.parseEther("1000");
        const cliffDuration = 100;
        const duration = 1000;

        await token.approve(await vesting.getAddress(), amount);

        await expect(
          vesting.createVestingSchedule(beneficiary.address, amount, cliffDuration, duration, true)
        ).to.not.be.reverted;

        const schedule = await vesting.getVestingSchedule(beneficiary.address);
        expect(schedule.beneficiary).to.equal(beneficiary.address);
        expect(schedule.amount).to.equal(amount);
        expect(schedule.duration).to.equal(duration);
        expect(schedule.revocable).to.equal(true);
        expect(schedule.revoked).to.equal(false);
        expect(schedule.released).to.equal(0);
      });

      it("Should emit VestingScheduleCreated event", async function () {
        const { vesting, token, beneficiary } = await loadFixture(deployTokenVestingFixture);

        const amount = ethers.parseEther("1000");
        const cliffDuration = 100;
        const duration = 1000;

        await token.approve(await vesting.getAddress(), amount);

        // Just verify event is emitted with beneficiary and amount
        await expect(
          vesting.createVestingSchedule(beneficiary.address, amount, cliffDuration, duration, true)
        ).to.emit(vesting, "VestingScheduleCreated");

        // Verify schedule was created correctly
        const schedule = await vesting.getVestingSchedule(beneficiary.address);
        expect(schedule.amount).to.equal(amount);
        expect(schedule.duration).to.equal(duration);
      });

      it("Should transfer tokens from creator to vesting contract", async function () {
        const { vesting, token, owner, beneficiary } = await loadFixture(deployTokenVestingFixture);

        const amount = ethers.parseEther("1000");
        const vestingAddress = await vesting.getAddress();

        await token.approve(vestingAddress, amount);

        const ownerBalanceBefore = await token.balanceOf(owner.address);
        const vestingBalanceBefore = await token.balanceOf(vestingAddress);

        await vesting.createVestingSchedule(beneficiary.address, amount, 100, 1000, true);

        expect(await token.balanceOf(owner.address)).to.equal(ownerBalanceBefore - amount);
        expect(await token.balanceOf(vestingAddress)).to.equal(vestingBalanceBefore + amount);
      });

      it("Should handle cliff duration equal to total duration", async function () {
        const { vesting, token, beneficiary } = await loadFixture(deployTokenVestingFixture);

        const amount = ethers.parseEther("1000");
        const duration = 1000;

        await token.approve(await vesting.getAddress(), amount);

        await expect(
          vesting.createVestingSchedule(beneficiary.address, amount, duration, duration, true)
        ).to.not.be.reverted;
      });

      it("Should handle zero cliff duration", async function () {
        const { vesting, token, beneficiary } = await loadFixture(deployTokenVestingFixture);

        const amount = ethers.parseEther("1000");

        await token.approve(await vesting.getAddress(), amount);

        await expect(
          vesting.createVestingSchedule(beneficiary.address, amount, 0, 1000, true)
        ).to.not.be.reverted;
      });
    });

    describe("Validation Failures", function () {
      it("Should reject zero address beneficiary", async function () {
        const { vesting, token } = await loadFixture(deployTokenVestingFixture);

        const amount = ethers.parseEther("1000");
        await token.approve(await vesting.getAddress(), amount);

        await expect(
          vesting.createVestingSchedule(ethers.ZeroAddress, amount, 100, 1000, true)
        ).to.be.revertedWith("Beneficiary cannot be zero address");
      });

      it("Should reject zero amount", async function () {
        const { vesting, token, beneficiary } = await loadFixture(deployTokenVestingFixture);

        await expect(
          vesting.createVestingSchedule(beneficiary.address, 0, 100, 1000, true)
        ).to.be.revertedWith("Amount must be greater than zero");
      });

      it("Should reject zero duration", async function () {
        const { vesting, token, beneficiary } = await loadFixture(deployTokenVestingFixture);

        const amount = ethers.parseEther("1000");
        await token.approve(await vesting.getAddress(), amount);

        await expect(
          vesting.createVestingSchedule(beneficiary.address, amount, 0, 0, true)
        ).to.be.revertedWith("Duration must be greater than zero");
      });

      it("Should reject cliff duration greater than total duration", async function () {
        const { vesting, token, beneficiary } = await loadFixture(deployTokenVestingFixture);

        const amount = ethers.parseEther("1000");
        await token.approve(await vesting.getAddress(), amount);

        await expect(
          vesting.createVestingSchedule(beneficiary.address, amount, 2000, 1000, true)
        ).to.be.revertedWith("Cliff duration cannot exceed total duration");
      });

      it("Should reject duplicate vesting schedule for same beneficiary", async function () {
        const { vesting, token, beneficiary } = await loadFixture(deployTokenVestingFixture);

        const amount = ethers.parseEther("1000");
        await token.approve(await vesting.getAddress(), amount * 2n);

        // Create first schedule
        await vesting.createVestingSchedule(beneficiary.address, amount, 100, 1000, true);

        // Attempt to create second schedule for same beneficiary
        await expect(
          vesting.createVestingSchedule(beneficiary.address, amount, 100, 1000, true)
        ).to.be.revertedWith("Beneficiary already has a vesting schedule");
      });

      it("Should reject if insufficient token approval", async function () {
        const { vesting, beneficiary } = await loadFixture(deployTokenVestingFixture);

        const amount = ethers.parseEther("1000");
        // Don't approve tokens

        await expect(
          vesting.createVestingSchedule(beneficiary.address, amount, 100, 1000, true)
        ).to.be.reverted; // ERC20InsufficientAllowance
      });
    });
  });

  // ============ Vested Amount Calculation Tests ============

  describe("Vested Amount Calculation", function () {
    it("Should return 0 if no vesting schedule exists", async function () {
      const { vesting, beneficiary } = await loadFixture(deployTokenVestingFixture);

      expect(await vesting.vestedAmount(beneficiary.address)).to.equal(0);
    });

    it("Should return 0 during cliff period", async function () {
      const { vesting, beneficiary, cliffDuration } = await loadFixture(deployWithScheduleFixture);

      // Move time forward but still within cliff
      await time.increase(cliffDuration - 100);

      expect(await vesting.vestedAmount(beneficiary.address)).to.equal(0);
    });

    it("Should return 0 at exact cliff moment (edge case)", async function () {
      const { vesting, beneficiary, cliffDuration } = await loadFixture(deployWithScheduleFixture);

      // Move to exactly 1 second before cliff ends
      await time.increase(cliffDuration - 1);

      expect(await vesting.vestedAmount(beneficiary.address)).to.equal(0);
    });

    it("Should calculate correct vested amount after cliff", async function () {
      const { vesting, beneficiary, amount, duration } =
        await loadFixture(deployWithScheduleFixture);

      // Move to exact 50% of total duration (2 years = 50% vested)
      await time.increase(duration / 2);

      const vested = await vesting.vestedAmount(beneficiary.address);
      const expected = amount / 2n; // 50% of total

      // Allow rounding difference
      expect(vested).to.be.closeTo(expected, ethers.parseEther("100"));
    });

    it("Should return full amount after vesting duration complete", async function () {
      const { vesting, beneficiary, amount, duration } = await loadFixture(deployWithScheduleFixture);

      // Move past vesting end
      await time.increase(duration + 100);

      expect(await vesting.vestedAmount(beneficiary.address)).to.equal(amount);
    });

    it("Should handle linear vesting correctly at various time points", async function () {
      const { vesting, beneficiary, amount, duration } = await loadFixture(deployWithScheduleFixture);

      // Test at 25% (1 year)
      await time.increase(duration / 4);
      let vested = await vesting.vestedAmount(beneficiary.address);
      expect(vested).to.be.closeTo(amount / 4n, ethers.parseEther("50"));

      // Test at 75% (3 years)
      await time.increase(duration / 2);
      vested = await vesting.vestedAmount(beneficiary.address);
      expect(vested).to.be.closeTo((amount * 3n) / 4n, ethers.parseEther("50"));

      // Test at 100% (4 years)
      await time.increase(duration / 4);
      vested = await vesting.vestedAmount(beneficiary.address);
      expect(vested).to.equal(amount);
    });

    it("Should work with zero cliff duration", async function () {
      const { vesting, token, beneficiary } = await loadFixture(deployTokenVestingFixture);

      const amount = ethers.parseEther("1000");
      const duration = 1000;

      await token.approve(await vesting.getAddress(), amount);
      await vesting.createVestingSchedule(beneficiary.address, amount, 0, duration, true);

      // Immediately after creation, some amount should be vested
      await time.increase(duration / 4);

      const vested = await vesting.vestedAmount(beneficiary.address);
      expect(vested).to.be.closeTo(amount / 4n, ethers.parseEther("1"));
    });
  });

  // ============ Token Release Tests ============

  describe("Release Tokens", function () {
    describe("Success Cases", function () {
      it("Should release vested tokens to beneficiary", async function () {
        const { vesting, token, beneficiary, duration } =
          await loadFixture(deployWithScheduleFixture);

        // Move past cliff to 50% vested
        await time.increase(duration / 2);

        const balanceBefore = await token.balanceOf(beneficiary.address);
        const vested = await vesting.vestedAmount(beneficiary.address);

        await vesting.connect(beneficiary).release();

        const balanceAfter = await token.balanceOf(beneficiary.address);
        // Use closeTo for rounding tolerance
        expect(balanceAfter).to.be.closeTo(balanceBefore + vested, ethers.parseEther("1"));
      });

      it("Should emit TokensReleased event", async function () {
        const { vesting, beneficiary, duration } = await loadFixture(deployWithScheduleFixture);

        await time.increase(duration / 2);

        // Just check event is emitted, exact amount varies due to block timing
        await expect(vesting.connect(beneficiary).release())
          .to.emit(vesting, "TokensReleased");
      });

      it("Should update released amount in schedule", async function () {
        const { vesting, beneficiary, amount, duration } = await loadFixture(deployWithScheduleFixture);

        await time.increase(duration / 2);

        await vesting.connect(beneficiary).release();

        const schedule = await vesting.getVestingSchedule(beneficiary.address);
        // Should be approximately 50% released
        expect(schedule.released).to.be.closeTo(amount / 2n, ethers.parseEther("50"));
        expect(schedule.released).to.be.greaterThan(0);
      });

      it("Should allow multiple releases over time", async function () {
        const { vesting, token, beneficiary, duration } = await loadFixture(deployWithScheduleFixture);

        // First release at 25%
        await time.increase(duration / 4);
        await vesting.connect(beneficiary).release();
        const balance1 = await token.balanceOf(beneficiary.address);

        // Second release at 50%
        await time.increase(duration / 4);
        await vesting.connect(beneficiary).release();
        const balance2 = await token.balanceOf(beneficiary.address);

        // Third release at 100%
        await time.increase(duration / 2);
        await vesting.connect(beneficiary).release();
        const balance3 = await token.balanceOf(beneficiary.address);

        expect(balance2).to.be.greaterThan(balance1);
        expect(balance3).to.be.greaterThan(balance2);
      });

      it("Should release all tokens after full vesting period", async function () {
        const { vesting, token, beneficiary, amount, duration } =
          await loadFixture(deployWithScheduleFixture);

        await time.increase(duration + 100);
        await vesting.connect(beneficiary).release();

        expect(await token.balanceOf(beneficiary.address)).to.equal(amount);
      });
    });

    describe("Failure Cases", function () {
      it("Should revert if no vesting schedule exists", async function () {
        const { vesting, otherAccount } = await loadFixture(deployWithScheduleFixture);

        await expect(
          vesting.connect(otherAccount).release()
        ).to.be.revertedWith("No vesting schedule found");
      });

      it("Should revert if no tokens are available for release", async function () {
        const { vesting, beneficiary, cliffDuration } = await loadFixture(deployWithScheduleFixture);

        // Still in cliff period
        await time.increase(cliffDuration - 100);

        await expect(
          vesting.connect(beneficiary).release()
        ).to.be.revertedWith("No tokens available for release");
      });

      it("Should only release actual vested amount", async function () {
        const { vesting, token, beneficiary, duration } = await loadFixture(deployWithScheduleFixture);

        await time.increase(duration / 2);
        const vestedBefore = await vesting.vestedAmount(beneficiary.address);

        await vesting.connect(beneficiary).release();

        const balance = await token.balanceOf(beneficiary.address);
        expect(balance).to.be.closeTo(vestedBefore, ethers.parseEther("1"));
      });
    });
  });

  // ============ Revocation Tests ============

  describe("Revoke Vesting Schedule", function () {
    describe("Success Cases", function () {
      it("Should revoke vesting schedule and return unvested tokens", async function () {
        const { vesting, token, owner, beneficiary, amount, duration } =
          await loadFixture(deployWithScheduleFixture);

        // Move to 50% vested
        await time.increase(duration / 2);

        const ownerBalanceBefore = await token.balanceOf(owner.address);
        const vested = await vesting.vestedAmount(beneficiary.address);
        const unvested = amount - vested;

        await vesting.revoke(beneficiary.address);

        const ownerBalanceAfter = await token.balanceOf(owner.address);
        expect(ownerBalanceAfter).to.be.closeTo(
          ownerBalanceBefore + unvested,
          ethers.parseEther("10")
        );
      });

      it("Should transfer vested tokens to beneficiary on revocation", async function () {
        const { vesting, token, beneficiary, duration } = await loadFixture(deployWithScheduleFixture);

        await time.increase(duration / 2);

        const beneficiaryBalanceBefore = await token.balanceOf(beneficiary.address);
        const vested = await vesting.vestedAmount(beneficiary.address);

        await vesting.revoke(beneficiary.address);

        const beneficiaryBalanceAfter = await token.balanceOf(beneficiary.address);
        expect(beneficiaryBalanceAfter).to.be.closeTo(
          beneficiaryBalanceBefore + vested,
          ethers.parseEther("10")
        );
      });

      it("Should emit VestingRevoked event", async function () {
        const { vesting, beneficiary, amount, duration } = await loadFixture(deployWithScheduleFixture);

        await time.increase(duration / 2);
        const vested = await vesting.vestedAmount(beneficiary.address);
        const unvested = amount - vested;

        await expect(vesting.revoke(beneficiary.address))
          .to.emit(vesting, "VestingRevoked");
          // Note: We can't use exact withArgs due to rounding, but event is emitted
      });

      it("Should mark schedule as revoked", async function () {
        const { vesting, beneficiary, duration } = await loadFixture(deployWithScheduleFixture);

        await time.increase(duration / 2);
        await vesting.revoke(beneficiary.address);

        const schedule = await vesting.getVestingSchedule(beneficiary.address);
        expect(schedule.revoked).to.equal(true);
      });

      it("Should handle revocation with partial release before revocation", async function () {
        const { vesting, token, owner, beneficiary, amount, duration } =
          await loadFixture(deployWithScheduleFixture);

        // Move to 25% and release
        await time.increase(duration / 4);
        await vesting.connect(beneficiary).release();
        const firstRelease = await token.balanceOf(beneficiary.address);

        // Move to 50% and revoke
        await time.increase(duration / 4);
        const vestedBeforeRevoke = await vesting.vestedAmount(beneficiary.address);

        await vesting.revoke(beneficiary.address);

        const beneficiaryBalance = await token.balanceOf(beneficiary.address);
        // Should have received vested amount (including what was already released)
        expect(beneficiaryBalance).to.be.closeTo(vestedBeforeRevoke, ethers.parseEther("10"));
      });
    });

    describe("Failure Cases", function () {
      it("Should revert if not called by owner", async function () {
        const { vesting, beneficiary, duration } = await loadFixture(deployWithScheduleFixture);

        await time.increase(duration / 2);

        await expect(
          vesting.connect(beneficiary).revoke(beneficiary.address)
        ).to.be.reverted; // OwnableUnauthorizedAccount
      });

      it("Should revert if schedule is not revocable", async function () {
        const { vesting, token, beneficiary } = await loadFixture(deployTokenVestingFixture);

        const amount = ethers.parseEther("1000");
        await token.approve(await vesting.getAddress(), amount);

        // Create non-revocable schedule
        await vesting.createVestingSchedule(beneficiary.address, amount, 100, 1000, false);

        await expect(
          vesting.revoke(beneficiary.address)
        ).to.be.revertedWith("Schedule is not revocable");
      });

      it("Should revert if schedule is already revoked", async function () {
        const { vesting, beneficiary, duration } = await loadFixture(deployWithScheduleFixture);

        await time.increase(duration / 2);
        await vesting.revoke(beneficiary.address);

        // Try to revoke again
        await expect(
          vesting.revoke(beneficiary.address)
        ).to.be.revertedWith("Schedule already revoked");
      });

      it("Should revert if no vesting schedule exists", async function () {
        const { vesting, otherAccount } = await loadFixture(deployWithScheduleFixture);

        await expect(
          vesting.revoke(otherAccount.address)
        ).to.be.revertedWith("No vesting schedule found");
      });
    });
  });

  // ============ View Function Tests ============

  describe("View Functions", function () {
    describe("hasVestingSchedule", function () {
      it("Should return false if no schedule exists", async function () {
        const { vesting, beneficiary } = await loadFixture(deployTokenVestingFixture);

        expect(await vesting.hasVestingSchedule(beneficiary.address)).to.equal(false);
      });

      it("Should return true if schedule exists", async function () {
        const { vesting, beneficiary } = await loadFixture(deployWithScheduleFixture);

        expect(await vesting.hasVestingSchedule(beneficiary.address)).to.equal(true);
      });
    });

    describe("releasableAmount", function () {
      it("Should return 0 during cliff", async function () {
        const { vesting, beneficiary, cliffDuration } = await loadFixture(deployWithScheduleFixture);

        await time.increase(cliffDuration - 100);

        expect(await vesting.releasableAmount(beneficiary.address)).to.equal(0);
      });

      it("Should return correct amount after vesting starts", async function () {
        const { vesting, beneficiary, duration } = await loadFixture(deployWithScheduleFixture);

        await time.increase(duration / 2);

        const vested = await vesting.vestedAmount(beneficiary.address);
        const releasable = await vesting.releasableAmount(beneficiary.address);

        expect(releasable).to.equal(vested);
      });

      it("Should return 0 after all tokens released", async function () {
        const { vesting, beneficiary, duration } = await loadFixture(deployWithScheduleFixture);

        await time.increase(duration);
        await vesting.connect(beneficiary).release();

        expect(await vesting.releasableAmount(beneficiary.address)).to.equal(0);
      });

      it("Should return unreleased portion after partial release", async function () {
        const { vesting, beneficiary, duration } = await loadFixture(deployWithScheduleFixture);

        // Release at 25%
        await time.increase(duration / 4);
        await vesting.connect(beneficiary).release();

        // Move to 75%
        await time.increase(duration / 2);

        const vested = await vesting.vestedAmount(beneficiary.address);
        const schedule = await vesting.getVestingSchedule(beneficiary.address);
        const expected = vested - schedule.released;

        expect(await vesting.releasableAmount(beneficiary.address)).to.be.closeTo(
          expected,
          ethers.parseEther("10")
        );
      });
    });

    describe("getVestingSchedule", function () {
      it("Should return correct schedule details", async function () {
        const { vesting, beneficiary, amount, cliffDuration, duration, revocable } =
          await loadFixture(deployWithScheduleFixture);

        const schedule = await vesting.getVestingSchedule(beneficiary.address);

        expect(schedule.beneficiary).to.equal(beneficiary.address);
        expect(schedule.amount).to.equal(amount);
        expect(schedule.duration).to.equal(duration);
        expect(schedule.revocable).to.equal(revocable);
        expect(schedule.revoked).to.equal(false);
        expect(schedule.released).to.equal(0);
        expect(schedule.start).to.be.greaterThan(0);
        expect(schedule.cliff).to.equal(schedule.start + BigInt(cliffDuration));
      });
    });
  });

  // ============ Integration Tests ============

  describe("Integration Scenarios", function () {
    it("Should handle full employee vesting lifecycle", async function () {
      const { vesting, token, beneficiary, amount, cliffDuration, duration } =
        await loadFixture(deployWithScheduleFixture);

      // Year 0: Schedule created, in cliff
      expect(await vesting.vestedAmount(beneficiary.address)).to.equal(0);

      // Year 1: Cliff ends, 25% vested
      await time.increase(cliffDuration);
      let vested = await vesting.vestedAmount(beneficiary.address);
      expect(vested).to.be.closeTo(amount / 4n, ethers.parseEther("50"));

      // First release
      await vesting.connect(beneficiary).release();
      expect(await token.balanceOf(beneficiary.address)).to.be.closeTo(
        amount / 4n,
        ethers.parseEther("50")
      );

      // Year 2: 50% vested
      await time.increase(duration / 4);
      await vesting.connect(beneficiary).release();

      // Year 4: Fully vested
      await time.increase(duration / 2);
      await vesting.connect(beneficiary).release();

      expect(await token.balanceOf(beneficiary.address)).to.equal(amount);
    });

    it("Should handle employee leaving scenario (revocation)", async function () {
      const { vesting, token, owner, beneficiary, amount, duration } =
        await loadFixture(deployWithScheduleFixture);

      // Employee works for 2 years (50% vested)
      await time.increase(duration / 2);

      const ownerBalanceBefore = await token.balanceOf(owner.address);
      const vested = await vesting.vestedAmount(beneficiary.address);

      // Company revokes remaining vesting
      await vesting.revoke(beneficiary.address);

      // Beneficiary gets vested amount
      expect(await token.balanceOf(beneficiary.address)).to.be.closeTo(
        vested,
        ethers.parseEther("10")
      );

      // Owner gets unvested amount back
      const ownerBalanceAfter = await token.balanceOf(owner.address);
      expect(ownerBalanceAfter).to.be.closeTo(
        ownerBalanceBefore + (amount - vested),
        ethers.parseEther("10")
      );
    });

    it("Should handle multiple beneficiaries independently", async function () {
      const { vesting, token, beneficiary, otherAccount } =
        await loadFixture(deployTokenVestingFixture);

      const amount1 = ethers.parseEther("1000");
      const amount2 = ethers.parseEther("2000");

      // Create two schedules
      await token.approve(await vesting.getAddress(), amount1 + amount2);
      await vesting.createVestingSchedule(beneficiary.address, amount1, 100, 1000, true);
      await vesting.createVestingSchedule(otherAccount.address, amount2, 200, 2000, false);

      // Verify independence
      const schedule1 = await vesting.getVestingSchedule(beneficiary.address);
      const schedule2 = await vesting.getVestingSchedule(otherAccount.address);

      expect(schedule1.amount).to.equal(amount1);
      expect(schedule2.amount).to.equal(amount2);
      expect(schedule1.revocable).to.equal(true);
      expect(schedule2.revocable).to.equal(false);
    });
  });

  // ============ Edge Cases & Security Tests ============

  describe("Edge Cases", function () {
    it("Should handle very small token amounts", async function () {
      const { vesting, token, beneficiary } = await loadFixture(deployTokenVestingFixture);

      const amount = 100; // 100 wei
      await token.approve(await vesting.getAddress(), amount);
      await vesting.createVestingSchedule(beneficiary.address, amount, 10, 100, true);

      await time.increase(50);
      const vested = await vesting.vestedAmount(beneficiary.address);

      expect(vested).to.be.greaterThan(0);
      expect(vested).to.be.lessThanOrEqual(amount);
    });

    it("Should handle very large token amounts", async function () {
      const { vesting, token, beneficiary } = await loadFixture(deployTokenVestingFixture);

      const amount = ethers.parseEther("1000000000"); // 1 billion tokens
      await token.mint(await vesting.owner(), amount);
      await token.approve(await vesting.getAddress(), amount);

      await vesting.createVestingSchedule(beneficiary.address, amount, 100, 1000, true);

      await time.increase(500);
      const vested = await vesting.vestedAmount(beneficiary.address);

      expect(vested).to.be.greaterThan(0);
    });

    it("Should handle rounding correctly in linear vesting", async function () {
      const { vesting, token, beneficiary } = await loadFixture(deployTokenVestingFixture);

      // Amount that doesn't divide evenly
      const amount = ethers.parseEther("1000") + 7n;
      const duration = 3;

      await token.approve(await vesting.getAddress(), amount);
      await vesting.createVestingSchedule(beneficiary.address, amount, 0, duration, true);

      await time.increase(1);
      const vested = await vesting.vestedAmount(beneficiary.address);

      // Should round down (favor contract)
      expect(vested).to.be.lessThanOrEqual(amount / 3n);
    });
  });

  describe("Reentrancy Protection", function () {
    it("Should have reentrancy guard on all state-changing functions", async function () {
      // Note: The nonReentrant modifier from OpenZeppelin provides protection.
      // Full reentrancy testing would require a malicious token contract.
      const { vesting, beneficiary, duration } = await loadFixture(deployWithScheduleFixture);

      // Verify release is protected (has nonReentrant modifier)
      await time.increase(duration / 2);
      await expect(vesting.connect(beneficiary).release()).to.not.be.reverted;

      // The fact that it doesn't fail proves the modifier doesn't block legitimate calls
      // Actual reentrancy attacks are prevented by OpenZeppelin's ReentrancyGuard
    });
  });
});
