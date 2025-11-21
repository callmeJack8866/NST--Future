// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockNST
 * @notice Mock NST token for testing
 */
contract MockNST is ERC20, Ownable {
    constructor() ERC20("NST Finance Token", "NST") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000_000 * 10**18); // 1 billion tokens
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
