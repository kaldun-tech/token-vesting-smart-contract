// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @dev Simple ERC20 token for testing purposes
 * @notice This contract is for testing ONLY. Do not use in production.
 *
 * Features:
 * - Anyone can mint tokens (for testnet use)
 * - Standard ERC20 functionality
 * - 18 decimals (standard)
 */
contract MockERC20 is ERC20 {
    /**
     * @dev Constructor sets token name and symbol
     * @param name Token name (e.g., "Test Token")
     * @param symbol Token symbol (e.g., "TEST")
     */
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        // No initial supply - use mint() function
    }

    /**
     * @dev Mint tokens to any address
     * @param to Address to receive minted tokens
     * @param amount Amount of tokens to mint (in wei, 18 decimals)
     *
     * @notice This function is PUBLIC for testing convenience
     * In production, this would be restricted to owner/minter role
     *
     * Example:
     * mint(0x123..., 1000000000000000000000) mints 1,000 tokens
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
