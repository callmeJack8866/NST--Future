// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title INSTFinance
 * @notice Interface for NST Finance main contract
 */
interface INSTFinance {
    struct UserInfo {
        uint256 totalDonationUSD;
        uint256 nodeCount;
        address referrer;
        uint256 directNodeCount;
        uint256 directDonationUSD;
        uint256 nstReward;
        bool hasAutoNode;
    }

    // Core functions
    function donate(address token, uint256 amount, address referrerHint) external;
    function buyNode(address token, uint256 nodeCount, address referrerHint) external;
    function claimNST() external;

    // View functions
    function getUserInfo(address user) external view returns (
        uint256 totalDonationUSD,
        uint256 nodeCount,
        address referrer,
        uint256 directNodeCount,
        uint256 directDonationUSD,
        uint256 nstReward,
        bool hasAutoNode
    );
    
    function getGlobalStats() external view returns (
        uint256 totalNodesIssued,
        uint256 totalDonationsUSD,
        uint256 totalUsers,
        uint256 nodesRemaining
    );
    
    function isEligibleForAutoNode(address user) external view returns (bool);

    // Admin functions
    function addSupportedToken(address token, uint8 decimals) external;
    function removeSupportedToken(address token) external;
    function setNSTToken(address nstToken) external;
    function setClaimEnabled(bool enabled) external;
    function setTreasury(address treasury) external;
}
