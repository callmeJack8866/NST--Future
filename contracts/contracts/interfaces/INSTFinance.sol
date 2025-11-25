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
        uint256 teamNodeCount;        
        address referrer;
        uint256 directNodeCount;
        uint256 directDonationUSD;
        uint256 nstReward;
        bool hasAutoNode;
        uint256 points;
        uint256 lastSnapshotPoints;
    }
    
    struct TeamNodeInfo {              
        uint256 count;
        uint256 unlockTime;
        bool isTeamMember;
    }
    
    struct AirdropRound {
        uint256 roundNumber;
        uint256 timestamp;
        uint256 airdropAmount;
        uint256 totalEligible;
        bool isActive;
    }

    // Core functions
    function donate(address token, uint256 amount, address referrerHint) external;
    function buyNode(address token, uint256 nodeCount, address referrerHint) external;
    function claimNST() external;

    // v1.1 Airdrop functions
    function takeSnapshot() external;
    function updateSnapshotPoints(address[] calldata userAddresses) external;
    function createAirdropRound(uint256 round, address[] calldata eligibleUsers, uint256 airdropAmount) external;
    function claimAirdrop(uint256 round) external;
    function closeAirdropRound(uint256 round) external;
    
    // Team Node functions 
    function allocateTeamNodes(address teamMember, uint256 nodeCount) external;
    function areTeamNodesUnlocked(address teamMember) external view returns (bool);
    function getTotalNodeCount(address user) external view returns (uint256);

    // View functions
    function getUserInfo(address user) external view returns (
        uint256 totalDonationUSD,
        uint256 nodeCount,
        address referrer,
        uint256 directNodeCount,
        uint256 directDonationUSD,
        uint256 nstReward,
        bool hasAutoNode,
        uint256 points,
        uint256 lastSnapshotPoints
    );
    
    function getGlobalStats() external view returns (
        uint256 totalNodesIssued,
        uint256 totalDonationsUSD,
        uint256 totalUsers,
        uint256 nodesRemaining,
        uint256 totalPointsDistributed
    );
    
    function getNodeStats() external view returns (      
        uint256 publicNodesIssued,
        uint256 teamNodesIssued,
        uint256 publicNodesRemaining,
        uint256 teamNodesRemaining
    );
    
    function checkAirdropEligibility(address user, uint256 round) external view returns (
        bool eligible,
        bool claimed,
        uint256 amount
    );
    
    function getAirdropRound(uint256 round) external view returns (
        uint256 roundNumber,
        uint256 timestamp,
        uint256 airdropAmount,
        uint256 totalEligible,
        bool isActive
    );
    
    function getUserPointsGrowth(address user) external view returns (uint256 growthBasisPoints);
    function isEligibleForAutoNode(address user) external view returns (bool);

    // Admin functions
    function addSupportedToken(address token, uint8 decimals) external;
    function removeSupportedToken(address token) external;
    function setNSTToken(address nstToken) external;
    function setClaimEnabled(bool enabled) external;
    function setTreasury(address treasury) external;
}