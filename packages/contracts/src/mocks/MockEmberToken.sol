// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

/**
 * @notice Mock EMBER token for testing
 * @dev Actual EMBER: 0x7FfBE850D2d45242efdb914D7d4Dbb682d0C9B07 (Base)
 */
contract MockEmberToken is ERC20 {
    constructor() ERC20("EMBER", "EMBER") {
        _mint(msg.sender, 100_000_000 * 10 ** decimals()); // 100M tokens
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}