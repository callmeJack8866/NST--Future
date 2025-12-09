// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NSTFinance
 * @notice Main contract for NST Finance - Simplified Airdrop System
 * @dev Phase 1 deployment on BSC
 */
contract NSTFinance is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Constants ============
    
    uint256 public constant MINIMUM_DONATION = 100 * 10**18; // 100 USD
    uint256 public constant NODE_PRICE = 2000 * 10**18; // 2000 USD
    uint256 public constant MAX_NODES_PER_USER = 5;
    uint256 public constant MAX_TOTAL_NODES = 120;
    uint256 public constant MAX_PUBLIC_NODES = 100;
    uint256 public constant TEAM_RESERVED_NODES = 20;
    uint256 public constant TEAM_LOCK_DURATION = 730 days; // 2 years
    uint256 public constant AUTO_NODE_THRESHOLD = 2000 * 10**18;
    
    // Referral rewards
    uint256 public constant NODE_REFERRAL_REWARD = 500 * 10**18;
    uint256 public constant DONATION_REFERRAL_REWARD_PER_1000 = 100 * 10**18;
    uint256 public constant FREE_NODE_REFERRAL_THRESHOLD = 10;
    
    // Points system
    uint256 public constant POINTS_PER_USD = 1 * 10**18;
    uint256 public constant NODE_HOLDER_MULTIPLIER = 2;
    
    // Ranking system
    uint256 public constant TOP_RANKERS_COUNT = 20;

    // ============ State Variables ============
    
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
    
    /**
     * @notice Simplified Airdrop Round - Monthly Top 20 Rankings
     * @dev Combines growth and cumulative rankings into one clean structure
     */
    struct AirdropRound {
        uint256 roundNumber;
        uint256 timestamp;
        uint256 growthRewardPerUser;      // NST per user for growth Top 20
        uint256 pointsRewardPerUser;      // NST per user for cumulative Top 20
        uint256 totalDistributed;          // Track total claimed
        bool isActive;
    }
    
    mapping(address => UserInfo) public users;
    mapping(address => bool) public isUser;
    mapping(address => TeamNodeInfo) public teamNodes;
    
    // Airdrop System (Simplified)
    mapping(uint256 => AirdropRound) public airdropRounds;
    mapping(uint256 => address[20]) public topGrowthUsers;      // Top 20 by growth %
    mapping(uint256 => address[20]) public topPointsUsers;       // Top 20 by total points
    mapping(address => mapping(uint256 => bool)) public hasClaimedGrowth;
    mapping(address => mapping(uint256 => bool)) public hasClaimedPoints;
    uint256 public currentRound;
    
    // Supported stablecoins
    mapping(address => bool) public supportedTokens;
    mapping(address => uint8) public tokenDecimals;
    
    // Treasury and NST token
    address public treasury;
    IERC20 public nstToken;
    bool public claimEnabled;
    
    // Global stats
    uint256 public totalNodesIssued;
    uint256 public publicNodesIssued;
    uint256 public teamNodesIssued;
    uint256 public totalDonationsUSD;
    uint256 public totalUsers;
    uint256 public totalPointsDistributed;
    uint256 public deploymentTime;

    // ============ Events ============
    
    event UserRegistered(address indexed user, address indexed referrer);
    event DonationReceived(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 usdValue,
        address indexed referrer
    );
    event NodePurchased(
        address indexed user,
        uint256 count,
        uint256 totalCost,
        address indexed referrer
    );
    event TeamNodeAllocated(address indexed teamMember, uint256 count, uint256 unlockTime);
    event AutoNodeGranted(address indexed user, uint256 nodeNumber);
    event NodeReferralReward(address indexed referrer, address indexed referee, uint256 reward);
    event DonationReferralReward(address indexed referrer, uint256 reward, uint256 donationAmount);
    event FreeNodeGranted(address indexed referrer, uint256 nodeNumber);
    event NSTClaimed(address indexed user, uint256 amount);
    event TokenAdded(address indexed token, uint8 decimals);
    event TokenRemoved(address indexed token);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event NSTTokenSet(address indexed nstToken);
    event ClaimEnabled(bool enabled);
    event PointsEarned(address indexed user, uint256 points, string source);
    
    // Airdrop Events
    event AirdropRoundCreated(
        uint256 indexed round,
        uint256 growthRewardPerUser,
        uint256 pointsRewardPerUser,
        uint256 timestamp
    );
    event AirdropClaimed(
        address indexed user,
        uint256 indexed round,
        uint256 growthAmount,
        uint256 pointsAmount
    );
    event AirdropRoundClosed(uint256 indexed round);
    event SnapshotPointsUpdated(uint256 usersUpdated);

    // ============ Errors ============
    
    error InvalidAmount();
    error InvalidToken();
    error NodeLimitReached();
    error PublicNodeLimitReached();
    error TeamNodeLimitReached();
    error InvalidReferrer();
    error ClaimNotEnabled();
    error NoRewardsToClaim();
    error ZeroAddress();
    error InsufficientBalance();
    error InvalidRound();
    error RoundNotActive();
    error NotEligible();
    error AlreadyClaimed();

    // ============ Constructor ============
    
    constructor(address _treasury) Ownable(msg.sender) {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
        deploymentTime = block.timestamp;
    }

    // ============ Donation Functions ============
    
    function donate(
        address token,
        uint256 amount,
        address referrerHint
    ) external nonReentrant {
        if (!supportedTokens[token]) revert InvalidToken();
        
        uint256 usdValue = _normalizeAmount(amount, tokenDecimals[token]);
        if (usdValue < MINIMUM_DONATION) revert InvalidAmount();
        
        _registerUser(msg.sender, referrerHint);
        
        IERC20(token).safeTransferFrom(msg.sender, treasury, amount);
        
        UserInfo storage user = users[msg.sender];
        user.totalDonationUSD += usdValue;
        totalDonationsUSD += usdValue;
        
        _awardDonationPoints(msg.sender, usdValue);
        
        if (user.referrer != address(0)) {
            UserInfo storage referrer = users[user.referrer];
            uint256 oldDonations = referrer.directDonationUSD;
            referrer.directDonationUSD += usdValue;
            
            _awardReferralPoints(user.referrer, usdValue);
            
            uint256 newThousands = referrer.directDonationUSD / (1000 * 10**18);
            uint256 oldThousands = oldDonations / (1000 * 10**18);
            
            if (newThousands > oldThousands) {
                uint256 rewardAmount = (newThousands - oldThousands) * DONATION_REFERRAL_REWARD_PER_1000;
                referrer.nstReward += rewardAmount;
                emit DonationReferralReward(user.referrer, rewardAmount, usdValue);
            }
        }
        
        _checkAndGrantAutoNode(msg.sender);
        
        emit DonationReceived(msg.sender, token, amount, usdValue, user.referrer);
    }

    // ============ Node Functions ============
    
    function buyNode(
        address token,
        uint256 nodeCount,
        address referrerHint
    ) external nonReentrant {
        if (!supportedTokens[token]) revert InvalidToken();
        if (nodeCount == 0 || nodeCount > MAX_NODES_PER_USER) revert InvalidAmount();
        
        UserInfo storage user = users[msg.sender];
        
        if (user.nodeCount + nodeCount > MAX_NODES_PER_USER) revert NodeLimitReached();
        if (publicNodesIssued + nodeCount > MAX_PUBLIC_NODES) revert PublicNodeLimitReached();
        
        _registerUser(msg.sender, referrerHint);
        
        uint256 totalCost = NODE_PRICE * nodeCount;
        uint256 tokenAmount = _denormalizeAmount(totalCost, tokenDecimals[token]);
        
        IERC20(token).safeTransferFrom(msg.sender, treasury, tokenAmount);
        
        _awardDonationPoints(msg.sender, totalCost);
        
        bool wasNodeHolder = user.nodeCount > 0;
        user.nodeCount += nodeCount;
        publicNodesIssued += nodeCount;
        totalNodesIssued += nodeCount;
        
        if (!wasNodeHolder && user.nodeCount > 0 && user.referrer != address(0)) {
            _grantNodeReferralReward(user.referrer, msg.sender);
        }
        
        emit NodePurchased(msg.sender, nodeCount, totalCost, user.referrer);
    }

    function _checkAndGrantAutoNode(address userAddress) internal {
        UserInfo storage user = users[userAddress];
        
        if (
            !user.hasAutoNode && 
            user.totalDonationUSD >= AUTO_NODE_THRESHOLD &&
            user.nodeCount < MAX_NODES_PER_USER &&
            publicNodesIssued < MAX_PUBLIC_NODES
        ) {
            bool wasNodeHolder = user.nodeCount > 0;
            
            user.nodeCount++;
            user.hasAutoNode = true;
            publicNodesIssued++;
            totalNodesIssued++;
            
            emit AutoNodeGranted(userAddress, user.nodeCount);
            
            if (!wasNodeHolder && user.referrer != address(0)) {
                _grantNodeReferralReward(user.referrer, userAddress);
            }
        }
    }

    function _grantNodeReferralReward(address referrer, address referee) internal {
        UserInfo storage referrerInfo = users[referrer];
        
        referrerInfo.nstReward += NODE_REFERRAL_REWARD;
        referrerInfo.directNodeCount++;
        
        emit NodeReferralReward(referrer, referee, NODE_REFERRAL_REWARD);
        
        if (
            referrerInfo.directNodeCount % FREE_NODE_REFERRAL_THRESHOLD == 0 &&
            referrerInfo.nodeCount < MAX_NODES_PER_USER &&
            publicNodesIssued < MAX_PUBLIC_NODES
        ) {
            referrerInfo.nodeCount++;
            publicNodesIssued++;
            totalNodesIssued++;
            emit FreeNodeGranted(referrer, referrerInfo.nodeCount);
        }
    }

    // ============ Team Node Functions ============
    
    function allocateTeamNodes(address teamMember, uint256 nodeCount) external onlyOwner {
        if (teamMember == address(0)) revert ZeroAddress();
        if (nodeCount == 0) revert InvalidAmount();
        if (teamNodesIssued + nodeCount > TEAM_RESERVED_NODES) revert TeamNodeLimitReached();
        
        TeamNodeInfo storage teamInfo = teamNodes[teamMember];
        UserInfo storage user = users[teamMember];
        
        if (!teamInfo.isTeamMember) {
            teamInfo.isTeamMember = true;
            teamInfo.unlockTime = deploymentTime + TEAM_LOCK_DURATION;
            _registerUser(teamMember, address(0));
        }
        
        teamInfo.count += nodeCount;
        user.teamNodeCount += nodeCount;
        teamNodesIssued += nodeCount;
        totalNodesIssued += nodeCount;
        
        emit TeamNodeAllocated(teamMember, nodeCount, teamInfo.unlockTime);
    }
    
    function areTeamNodesUnlocked(address teamMember) public view returns (bool) {
        TeamNodeInfo memory teamInfo = teamNodes[teamMember];
        return teamInfo.isTeamMember && block.timestamp >= teamInfo.unlockTime;
    }
    
    function getTotalNodeCount(address user) public view returns (uint256) {
        return users[user].nodeCount + users[user].teamNodeCount;
    }

    // ============ Points System ============
    
    function _awardDonationPoints(address user, uint256 usdValue) internal {
        UserInfo storage userInfo = users[user];
        
        uint256 basePoints = (usdValue * POINTS_PER_USD) / 10**18;
        uint256 totalNodes = getTotalNodeCount(user);
        uint256 points = totalNodes > 0 ? basePoints * NODE_HOLDER_MULTIPLIER : basePoints;
        
        userInfo.points += points;
        totalPointsDistributed += points;
        
        emit PointsEarned(user, points, "donation");
    }
    
    function _awardReferralPoints(address referrer, uint256 usdValue) internal {
        UserInfo storage referrerInfo = users[referrer];
        
        uint256 points = (usdValue * POINTS_PER_USD) / 10**18;
        
        referrerInfo.points += points;
        totalPointsDistributed += points;
        
        emit PointsEarned(referrer, points, "referral");
    }

    // ============ Airdrop System (Simplified) ============
    
    /**
     * @notice Create a new airdrop round with Top 20 rankings
     * @dev Called by admin on 10th and 20th of each month
     * @param _topGrowthUsers Top 20 users by growth % (sorted, highest first)
     * @param _topPointsUsers Top 20 users by total points (sorted, highest first)
     * @param growthRewardPerUser NST amount per user for growth ranking
     * @param pointsRewardPerUser NST amount per user for points ranking
     */
    function createAirdropRound(
        address[20] calldata _topGrowthUsers,
        address[20] calldata _topPointsUsers,
        uint256 growthRewardPerUser,
        uint256 pointsRewardPerUser
    ) external onlyOwner {
        currentRound++;
        
        // Store round data
        AirdropRound storage round = airdropRounds[currentRound];
        round.roundNumber = currentRound;
        round.timestamp = block.timestamp;
        round.growthRewardPerUser = growthRewardPerUser;
        round.pointsRewardPerUser = pointsRewardPerUser;
        round.isActive = true;
        
        // Store top users
        topGrowthUsers[currentRound] = _topGrowthUsers;
        topPointsUsers[currentRound] = _topPointsUsers;
        
        // Update snapshot points for all ranked users
        _updateSnapshotForRankers(_topGrowthUsers);
        _updateSnapshotForRankers(_topPointsUsers);
        
        emit AirdropRoundCreated(
            currentRound,
            growthRewardPerUser,
            pointsRewardPerUser,
            block.timestamp
        );
    }
    
    /**
     * @notice Internal function to update snapshot points
     */
    function _updateSnapshotForRankers(address[20] memory rankers) internal {
        uint256 updated = 0;
        for (uint256 i = 0; i < TOP_RANKERS_COUNT; i++) {
            if (rankers[i] != address(0)) {
                users[rankers[i]].lastSnapshotPoints = users[rankers[i]].points;
                updated++;
            }
        }
        emit SnapshotPointsUpdated(updated);
    }
    
    /**
     * @notice Batch update snapshot points for all users
     * @dev Call after creating airdrop round to reset baseline
     */
    function batchUpdateSnapshots(address[] calldata userAddresses) external onlyOwner {
        for (uint256 i = 0; i < userAddresses.length; i++) {
            users[userAddresses[i]].lastSnapshotPoints = users[userAddresses[i]].points;
        }
        emit SnapshotPointsUpdated(userAddresses.length);
    }
    
    /**
     * @notice Claim airdrop for a specific round
     * @dev Users can claim both growth and points rewards in ONE transaction
     * @param round The round number to claim
     */
    function claimAirdrop(uint256 round) external nonReentrant {
        if (round == 0 || round > currentRound) revert InvalidRound();
        
        AirdropRound storage airdropRound = airdropRounds[round];
        if (!airdropRound.isActive) revert RoundNotActive();
        
        uint256 totalReward = 0;
        
        // Check and claim growth reward
        bool isInGrowthTop20 = _isInRanking(topGrowthUsers[round], msg.sender);
        if (isInGrowthTop20 && !hasClaimedGrowth[msg.sender][round]) {
            hasClaimedGrowth[msg.sender][round] = true;
            totalReward += airdropRound.growthRewardPerUser;
        }
        
        // Check and claim points reward
        bool isInPointsTop20 = _isInRanking(topPointsUsers[round], msg.sender);
        if (isInPointsTop20 && !hasClaimedPoints[msg.sender][round]) {
            hasClaimedPoints[msg.sender][round] = true;
            totalReward += airdropRound.pointsRewardPerUser;
        }
        
        if (totalReward == 0) {
            // Either not eligible or already claimed
            if (!isInGrowthTop20 && !isInPointsTop20) revert NotEligible();
            revert AlreadyClaimed();
        }
        
        airdropRound.totalDistributed += totalReward;
        nstToken.safeTransfer(msg.sender, totalReward);
        
        emit AirdropClaimed(
            msg.sender,
            round,
            isInGrowthTop20 && !hasClaimedGrowth[msg.sender][round] ? 0 : airdropRound.growthRewardPerUser,
            isInPointsTop20 && !hasClaimedPoints[msg.sender][round] ? 0 : airdropRound.pointsRewardPerUser
        );
    }
    
    /**
     * @notice Check if address is in ranking array
     */
    function _isInRanking(address[20] storage ranking, address user) internal view returns (bool) {
        for (uint256 i = 0; i < TOP_RANKERS_COUNT; i++) {
            if (ranking[i] == user) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @notice Close an airdrop round (disable claims)
     */
    function closeAirdropRound(uint256 round) external onlyOwner {
        airdropRounds[round].isActive = false;
        emit AirdropRoundClosed(round);
    }

    // ============ NST Reward Functions (Referral Rewards) ============
    
    function claimNSTRewards() external nonReentrant {
        if (!claimEnabled) revert ClaimNotEnabled();
        
        UserInfo storage user = users[msg.sender];
        uint256 reward = user.nstReward;
        
        if (reward == 0) revert NoRewardsToClaim();
        
        user.nstReward = 0;
        nstToken.safeTransfer(msg.sender, reward);
        
        emit NSTClaimed(msg.sender, reward);
    }

    // ============ User Management ============
    
    function _registerUser(address user, address referrerHint) internal {
        if (!isUser[user]) {
            isUser[user] = true;
            totalUsers++;
            
            if (
                referrerHint != address(0) && 
                referrerHint != user && 
                isUser[referrerHint]
            ) {
                users[user].referrer = referrerHint;
                emit UserRegistered(user, referrerHint);
            } else {
                emit UserRegistered(user, address(0));
            }
        }
    }

    // ============ View Functions ============
    
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
    ) {
        UserInfo memory info = users[user];
        return (
            info.totalDonationUSD,
            info.nodeCount,
            info.referrer,
            info.directNodeCount,
            info.directDonationUSD,
            info.nstReward,
            info.hasAutoNode,
            info.points,
            info.lastSnapshotPoints
        );
    }
    
    function getGlobalStats() external view returns (
        uint256 _totalNodesIssued,
        uint256 _totalDonationsUSD,
        uint256 _totalUsers,
        uint256 nodesRemaining,
        uint256 _totalPointsDistributed
    ) {
        return (
            totalNodesIssued,
            totalDonationsUSD,
            totalUsers,
            MAX_TOTAL_NODES - totalNodesIssued,
            totalPointsDistributed
        );
    }
    
    function getNodeStats() external view returns (
        uint256 _publicNodesIssued,
        uint256 _teamNodesIssued,
        uint256 publicNodesRemaining,
        uint256 teamNodesRemaining
    ) {
        return (
            publicNodesIssued,
            teamNodesIssued,
            MAX_PUBLIC_NODES - publicNodesIssued,
            TEAM_RESERVED_NODES - teamNodesIssued
        );
    }
    
    function getUserPointsGrowth(address user) external view returns (uint256 growthBasisPoints) {
        UserInfo memory userInfo = users[user];
        
        if (userInfo.lastSnapshotPoints == 0) {
            return userInfo.points > 0 ? 1000000 : 0;
        }
        
        if (userInfo.points <= userInfo.lastSnapshotPoints) {
            return 0;
        }
        
        uint256 increase = userInfo.points - userInfo.lastSnapshotPoints;
        return (increase * 10000) / userInfo.lastSnapshotPoints;
    }
    
    function isEligibleForAutoNode(address user) external view returns (bool) {
        UserInfo memory info = users[user];
        return (
            !info.hasAutoNode && 
            info.totalDonationUSD >= AUTO_NODE_THRESHOLD &&
            info.nodeCount < MAX_NODES_PER_USER &&
            publicNodesIssued < MAX_PUBLIC_NODES
        );
    }
    
    // ============ Airdrop View Functions ============
    
    /**
     * @notice Get airdrop round details
     */
    function getAirdropRound(uint256 round) external view returns (
        uint256 roundNumber,
        uint256 timestamp,
        uint256 growthRewardPerUser,
        uint256 pointsRewardPerUser,
        uint256 totalDistributed,
        bool isActive
    ) {
        AirdropRound memory r = airdropRounds[round];
        return (
            r.roundNumber,
            r.timestamp,
            r.growthRewardPerUser,
            r.pointsRewardPerUser,
            r.totalDistributed,
            r.isActive
        );
    }
    
    /**
     * @notice Get top growth users for a round
     */
    function getTopGrowthUsers(uint256 round) external view returns (address[20] memory) {
        return topGrowthUsers[round];
    }
    
    /**
     * @notice Get top points users for a round
     */
    function getTopPointsUsers(uint256 round) external view returns (address[20] memory) {
        return topPointsUsers[round];
    }
    
    /**
     * @notice Check user's airdrop eligibility and claim status
     */
    function checkAirdropStatus(address user, uint256 round) external view returns (
        bool isInGrowthTop20,
        bool isInPointsTop20,
        bool hasClaimedGrowthReward,
        bool hasClaimedPointsReward,
        uint256 growthReward,
        uint256 pointsReward,
        uint256 totalClaimable
    ) {
        // Check growth eligibility
        for (uint256 i = 0; i < TOP_RANKERS_COUNT; i++) {
            if (topGrowthUsers[round][i] == user) {
                isInGrowthTop20 = true;
                break;
            }
        }
        
        // Check points eligibility
        for (uint256 i = 0; i < TOP_RANKERS_COUNT; i++) {
            if (topPointsUsers[round][i] == user) {
                isInPointsTop20 = true;
                break;
            }
        }
        
        AirdropRound memory r = airdropRounds[round];
        hasClaimedGrowthReward = hasClaimedGrowth[user][round];
        hasClaimedPointsReward = hasClaimedPoints[user][round];
        
        growthReward = isInGrowthTop20 ? r.growthRewardPerUser : 0;
        pointsReward = isInPointsTop20 ? r.pointsRewardPerUser : 0;
        
        // Calculate total claimable
        if (isInGrowthTop20 && !hasClaimedGrowthReward) {
            totalClaimable += r.growthRewardPerUser;
        }
        if (isInPointsTop20 && !hasClaimedPointsReward) {
            totalClaimable += r.pointsRewardPerUser;
        }
        
        return (
            isInGrowthTop20,
            isInPointsTop20,
            hasClaimedGrowthReward,
            hasClaimedPointsReward,
            growthReward,
            pointsReward,
            totalClaimable
        );
    }
    
    /**
     * @notice Get user's rank position in a round
     */
    function getUserRankPosition(address user, uint256 round) external view returns (
        uint256 growthPosition,
        uint256 pointsPosition
    ) {
        for (uint256 i = 0; i < TOP_RANKERS_COUNT; i++) {
            if (topGrowthUsers[round][i] == user) {
                growthPosition = i + 1;
            }
            if (topPointsUsers[round][i] == user) {
                pointsPosition = i + 1;
            }
        }
        return (growthPosition, pointsPosition);
    }
    
    /**
     * @notice Get current round number
     */
    function getCurrentRound() external view returns (uint256) {
        return currentRound;
    }

    // ============ Admin Functions ============
    
    function addSupportedToken(address token, uint8 decimals) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        supportedTokens[token] = true;
        tokenDecimals[token] = decimals;
        emit TokenAdded(token, decimals);
    }
    
    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
        emit TokenRemoved(token);
    }
    
    function setNSTToken(address _nstToken) external onlyOwner {
        if (_nstToken == address(0)) revert ZeroAddress();
        nstToken = IERC20(_nstToken);
        emit NSTTokenSet(_nstToken);
    }
    
    function setClaimEnabled(bool _enabled) external onlyOwner {
        claimEnabled = _enabled;
        emit ClaimEnabled(_enabled);
    }
    
    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }
    
    function emergencyWithdrawNST(uint256 amount) external onlyOwner {
        nstToken.safeTransfer(owner(), amount);
    }

    // ============ Internal Helper Functions ============
    
    function _normalizeAmount(uint256 amount, uint8 decimals) internal pure returns (uint256) {
        if (decimals == 18) {
            return amount;
        } else if (decimals < 18) {
            return amount * (10 ** (18 - decimals));
        } else {
            return amount / (10 ** (decimals - 18));
        }
    }
    
    function _denormalizeAmount(uint256 amount, uint8 decimals) internal pure returns (uint256) {
        if (decimals == 18) {
            return amount;
        } else if (decimals < 18) {
            return amount / (10 ** (18 - decimals));
        } else {
            return amount * (10 ** (decimals - 18));
        }
    }
}

