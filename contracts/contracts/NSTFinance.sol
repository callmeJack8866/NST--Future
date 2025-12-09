// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NSTFinance
 * @notice Main contract for NST Finance
 * @dev Phase 1 deployment on BSC
 */
contract NSTFinance is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Constants ============
    
    uint256 public constant MINIMUM_DONATION = 100 * 10**18; // 100 USD
    uint256 public constant NODE_PRICE = 2000 * 10**18; // 2000 USD
    uint256 public constant MAX_NODES_PER_USER = 5;
    uint256 public constant MAX_TOTAL_NODES = 120; // Increased from 100
    uint256 public constant MAX_PUBLIC_NODES = 100; // Available for public
    uint256 public constant TEAM_RESERVED_NODES = 20; // Reserved for team
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
        uint256 nodeCount;              // Regular nodes
        uint256 teamNodeCount;          // Team nodes (locked)
        address referrer;
        uint256 directNodeCount;
        uint256 directDonationUSD;
        uint256 nstReward;
        bool hasAutoNode;
        uint256 points;
        uint256 lastSnapshotPoints;
    }
    
    struct TeamNodeInfo {
        uint256 count;                  // Number of team nodes
        uint256 unlockTime;             // When nodes unlock (2 years)
        bool isTeamMember;              // Whether address is team
    }
    
    struct AirdropRound {
        uint256 roundNumber;
        uint256 timestamp;
        uint256 airdropAmount;
        uint256 totalEligible;
        bool isActive;
    }
    
    struct RankingRound {
        uint256 roundNumber;
        uint256 timestamp;
        uint256 growthAirdropAmount;      // Airdrop per user for growth ranking
        uint256 cumulativeAirdropAmount;  // Airdrop per user for cumulative ranking
        bool processed;
    }
    
    mapping(address => UserInfo) public users;
    mapping(address => bool) public isUser;
    mapping(address => TeamNodeInfo) public teamNodes; // Team node tracking
    
    // Points & Airdrop System
    mapping(address => mapping(uint256 => bool)) public hasClaimedAirdrop;
    mapping(address => mapping(uint256 => bool)) public isEligibleForAirdrop;
    mapping(uint256 => AirdropRound) public airdropRounds;
    uint256 public currentAirdropRound;
    uint256 public lastSnapshotTimestamp;
    
    // Ranking System (Monthly Top 20)
    mapping(uint256 => RankingRound) public rankingRounds;
    mapping(uint256 => address[20]) public topGrowthUsers;      // Top 20 by growth % per round
    mapping(uint256 => address[20]) public topCumulativeUsers;  // Top 20 by total points per round
    mapping(address => mapping(uint256 => bool)) public hasClaimedGrowthRanking;
    mapping(address => mapping(uint256 => bool)) public hasClaimedCumulativeRanking;
    uint256 public currentRankingRound;
    uint256 public lastRankingTimestamp;
    
    // Supported stablecoins
    mapping(address => bool) public supportedTokens;
    mapping(address => uint8) public tokenDecimals;
    
    // Treasury and NST token
    address public treasury;
    IERC20 public nstToken;
    bool public claimEnabled;
    
    // Global stats
    uint256 public totalNodesIssued;        // Total nodes (public + team)
    uint256 public publicNodesIssued;       // Public nodes issued
    uint256 public teamNodesIssued;         // Team nodes issued
    uint256 public totalDonationsUSD;
    uint256 public totalUsers;
    uint256 public totalPointsDistributed;
    uint256 public deploymentTime;          // Contract deployment time

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
    event TeamNodeUnlocked(address indexed teamMember, uint256 count);
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
    
    // v1.1 Events
    event PointsEarned(address indexed user, uint256 points, string source);
    event SnapshotTaken(uint256 indexed round, uint256 timestamp);
    event AirdropRoundCreated(uint256 indexed round, uint256 airdropAmount, uint256 totalEligible);
    event AirdropEligibilitySet(address indexed user, uint256 indexed round, bool eligible);
    event AirdropClaimed(address indexed user, uint256 indexed round, uint256 amount);
    
    // v1.2 Ranking Events
    event RankingRoundProcessed(
        uint256 indexed round,
        uint256 timestamp,
        uint256 growthAirdropAmount,
        uint256 cumulativeAirdropAmount
    );
    event TopGrowthRankersSet(uint256 indexed round, address[20] rankers);
    event TopCumulativeRankersSet(uint256 indexed round, address[20] rankers);
    event RankingAirdropClaimed(address indexed user, uint256 indexed round, uint256 amount, string rankingType);
    event SnapshotPointsUpdated(uint256 indexed round, uint256 usersUpdated);

    // ============ Errors ============
    
    error InvalidAmount();
    error InvalidToken();
    error NodeLimitReached();
    error GlobalNodeLimitReached();
    error PublicNodeLimitReached();
    error TeamNodeLimitReached();
    error InvalidReferrer();
    error ClaimNotEnabled();
    error NoRewardsToClaim();
    error ZeroAddress();
    error InsufficientBalance();
    error NotEligibleForAirdrop();
    error AirdropAlreadyClaimed();
    error AirdropRoundNotActive();
    error InvalidAirdropRound();
    error TeamNodesLocked();
    error NotTeamMember();
    error AlreadyTeamMember();
    
    // Ranking errors
    error RankingNotProcessed();
    error NotInTopRankers();
    error RankingAlreadyClaimed();
    error InvalidRankingRound();

    // ============ Constructor ============
    
    constructor(address _treasury) Ownable(msg.sender) {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
        lastSnapshotTimestamp = block.timestamp;
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
        
        // Award points
        _awardDonationPoints(msg.sender, usdValue);
        
        // Update referrer stats
        if (user.referrer != address(0)) {
            UserInfo storage referrer = users[user.referrer];
            uint256 oldDonations = referrer.directDonationUSD;
            referrer.directDonationUSD += usdValue;
            
            // Award points to referrer
            _awardReferralPoints(user.referrer, usdValue);
            
            // Calculate donation referral rewards
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
        
        // Check user limit (regular nodes only, team nodes don't count toward limit)
        if (user.nodeCount + nodeCount > MAX_NODES_PER_USER) revert NodeLimitReached();
        
        // Check public node supply
        if (publicNodesIssued + nodeCount > MAX_PUBLIC_NODES) revert PublicNodeLimitReached();
        
        _registerUser(msg.sender, referrerHint);
        
        uint256 totalCost = NODE_PRICE * nodeCount;
        uint256 tokenAmount = _denormalizeAmount(totalCost, tokenDecimals[token]);
        
        IERC20(token).safeTransferFrom(msg.sender, treasury, tokenAmount);
        
        user.totalDonationUSD += totalCost;
        totalDonationsUSD += totalCost;
        
        // Award points
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
    
    /**
     * @notice Allocate team nodes (owner only, locked for 2 years)
     * @param teamMember Address to receive team nodes
     * @param nodeCount Number of nodes to allocate
     */
    function allocateTeamNodes(address teamMember, uint256 nodeCount) external onlyOwner {
        if (teamMember == address(0)) revert ZeroAddress();
        if (nodeCount == 0) revert InvalidAmount();
        if (teamNodesIssued + nodeCount > TEAM_RESERVED_NODES) revert TeamNodeLimitReached();
        
        TeamNodeInfo storage teamInfo = teamNodes[teamMember];
        UserInfo storage user = users[teamMember];
        
        // Register as team member on first allocation
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
    
    /**
     * @notice Check if team nodes are unlocked
     */
    function areTeamNodesUnlocked(address teamMember) public view returns (bool) {
        TeamNodeInfo memory teamInfo = teamNodes[teamMember];
        return teamInfo.isTeamMember && block.timestamp >= teamInfo.unlockTime;
    }
    
    /**
     * @notice Get total node count (regular + team nodes)
     */
    function getTotalNodeCount(address user) public view returns (uint256) {
        return users[user].nodeCount + users[user].teamNodeCount;
    }

    // ============ Points System ============
    
    function _awardDonationPoints(address user, uint256 usdValue) internal {
        UserInfo storage userInfo = users[user];
        
        uint256 basePoints = (usdValue * POINTS_PER_USD) / 10**18;
        
        // Double points for node holders (including team nodes)
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

    // ============ Snapshot & Airdrop System ============
    
    function takeSnapshot() external onlyOwner {
        currentAirdropRound++;
        lastSnapshotTimestamp = block.timestamp;
        
        emit SnapshotTaken(currentAirdropRound, block.timestamp);
    }
    
    function updateSnapshotPoints(address[] calldata userAddresses) external onlyOwner {
        for (uint256 i = 0; i < userAddresses.length; i++) {
            address user = userAddresses[i];
            users[user].lastSnapshotPoints = users[user].points;
        }
    }
    
    function createAirdropRound(
        uint256 round,
        address[] calldata eligibleUsers,
        uint256 airdropAmount
    ) external onlyOwner {
        if (round == 0) revert InvalidAirdropRound();
        
        AirdropRound storage airdrop = airdropRounds[round];
        airdrop.roundNumber = round;
        airdrop.timestamp = block.timestamp;
        airdrop.airdropAmount = airdropAmount;
        airdrop.totalEligible = eligibleUsers.length;
        airdrop.isActive = true;
        
        for (uint256 i = 0; i < eligibleUsers.length; i++) {
            isEligibleForAirdrop[eligibleUsers[i]][round] = true;
            emit AirdropEligibilitySet(eligibleUsers[i], round, true);
        }
        
        emit AirdropRoundCreated(round, airdropAmount, eligibleUsers.length);
    }
    
    function claimAirdrop(uint256 round) external nonReentrant {
        if (round == 0 || round > currentAirdropRound) revert InvalidAirdropRound();
        
        AirdropRound storage airdrop = airdropRounds[round];
        if (!airdrop.isActive) revert AirdropRoundNotActive();
        
        if (!isEligibleForAirdrop[msg.sender][round]) revert NotEligibleForAirdrop();
        if (hasClaimedAirdrop[msg.sender][round]) revert AirdropAlreadyClaimed();
        
        hasClaimedAirdrop[msg.sender][round] = true;
        
        nstToken.safeTransfer(msg.sender, airdrop.airdropAmount);
        
        emit AirdropClaimed(msg.sender, round, airdrop.airdropAmount);
    }
    
    function closeAirdropRound(uint256 round) external onlyOwner {
        airdropRounds[round].isActive = false;
    }

    // ============ Monthly Ranking System ============
    
    /**
     * @notice Process a ranking round with Top 20 Growth and Top 20 Cumulative users
     * @dev Called by admin on 10th and 20th of each month. Rankings calculated off-chain.
     * @param _topGrowthUsers Top 20 users by growth percentage (sorted, highest first)
     * @param _topCumulativeUsers Top 20 users by cumulative points (sorted, highest first)
     * @param growthAirdropAmount NST amount per user for growth ranking
     * @param cumulativeAirdropAmount NST amount per user for cumulative ranking
     */
    function processRankingRound(
        address[20] calldata _topGrowthUsers,
        address[20] calldata _topCumulativeUsers,
        uint256 growthAirdropAmount,
        uint256 cumulativeAirdropAmount
    ) external onlyOwner {
        currentRankingRound++;
        lastRankingTimestamp = block.timestamp;
        
        // Store ranking round data
        RankingRound storage round = rankingRounds[currentRankingRound];
        round.roundNumber = currentRankingRound;
        round.timestamp = block.timestamp;
        round.growthAirdropAmount = growthAirdropAmount;
        round.cumulativeAirdropAmount = cumulativeAirdropAmount;
        round.processed = true;
        
        // Store top rankers
        topGrowthUsers[currentRankingRound] = _topGrowthUsers;
        topCumulativeUsers[currentRankingRound] = _topCumulativeUsers;
        
        // Auto-update snapshot points for all ranked users
        _updateSnapshotPointsForRankers(_topGrowthUsers);
        _updateSnapshotPointsForRankers(_topCumulativeUsers);
        
        emit RankingRoundProcessed(
            currentRankingRound,
            block.timestamp,
            growthAirdropAmount,
            cumulativeAirdropAmount
        );
        emit TopGrowthRankersSet(currentRankingRound, _topGrowthUsers);
        emit TopCumulativeRankersSet(currentRankingRound, _topCumulativeUsers);
    }
    
    /**
     * @notice Internal function to update snapshot points for ranked users
     */
    function _updateSnapshotPointsForRankers(address[20] memory rankers) internal {
        uint256 updated = 0;
        for (uint256 i = 0; i < TOP_RANKERS_COUNT; i++) {
            if (rankers[i] != address(0)) {
                users[rankers[i]].lastSnapshotPoints = users[rankers[i]].points;
                updated++;
            }
        }
        emit SnapshotPointsUpdated(currentRankingRound, updated);
    }
    
    /**
     * @notice Batch update snapshot points for non-ranked users
     * @dev Call this after processRankingRound to reset baseline for everyone
     */
    function batchUpdateSnapshotPoints(address[] calldata userAddresses) external onlyOwner {
        for (uint256 i = 0; i < userAddresses.length; i++) {
            users[userAddresses[i]].lastSnapshotPoints = users[userAddresses[i]].points;
        }
    }
    
    /**
     * @notice Claim growth ranking airdrop
     * @param round The ranking round number
     */
    function claimGrowthRankingAirdrop(uint256 round) external nonReentrant {
        if (round == 0 || round > currentRankingRound) revert InvalidRankingRound();
        
        RankingRound storage rankingRound = rankingRounds[round];
        if (!rankingRound.processed) revert RankingNotProcessed();
        if (hasClaimedGrowthRanking[msg.sender][round]) revert RankingAlreadyClaimed();
        
        // Check if user is in top growth rankers
        bool isRanker = false;
        for (uint256 i = 0; i < TOP_RANKERS_COUNT; i++) {
            if (topGrowthUsers[round][i] == msg.sender) {
                isRanker = true;
                break;
            }
        }
        if (!isRanker) revert NotInTopRankers();
        
        hasClaimedGrowthRanking[msg.sender][round] = true;
        nstToken.safeTransfer(msg.sender, rankingRound.growthAirdropAmount);
        
        emit RankingAirdropClaimed(msg.sender, round, rankingRound.growthAirdropAmount, "growth");
    }
    
    /**
     * @notice Claim cumulative ranking airdrop
     * @param round The ranking round number
     */
    function claimCumulativeRankingAirdrop(uint256 round) external nonReentrant {
        if (round == 0 || round > currentRankingRound) revert InvalidRankingRound();
        
        RankingRound storage rankingRound = rankingRounds[round];
        if (!rankingRound.processed) revert RankingNotProcessed();
        if (hasClaimedCumulativeRanking[msg.sender][round]) revert RankingAlreadyClaimed();
        
        // Check if user is in top cumulative rankers
        bool isRanker = false;
        for (uint256 i = 0; i < TOP_RANKERS_COUNT; i++) {
            if (topCumulativeUsers[round][i] == msg.sender) {
                isRanker = true;
                break;
            }
        }
        if (!isRanker) revert NotInTopRankers();
        
        hasClaimedCumulativeRanking[msg.sender][round] = true;
        nstToken.safeTransfer(msg.sender, rankingRound.cumulativeAirdropAmount);
        
        emit RankingAirdropClaimed(msg.sender, round, rankingRound.cumulativeAirdropAmount, "cumulative");
    }

    // ============ NST Reward Functions ============
    
    function claimNST() external nonReentrant {
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
    
    function checkAirdropEligibility(address user, uint256 round) external view returns (
        bool eligible,
        bool claimed,
        uint256 amount
    ) {
        return (
            isEligibleForAirdrop[user][round],
            hasClaimedAirdrop[user][round],
            airdropRounds[round].airdropAmount
        );
    }
    
    function getAirdropRound(uint256 round) external view returns (
        uint256 roundNumber,
        uint256 timestamp,
        uint256 airdropAmount,
        uint256 totalEligible,
        bool isActive
    ) {
        AirdropRound memory airdrop = airdropRounds[round];
        return (
            airdrop.roundNumber,
            airdrop.timestamp,
            airdrop.airdropAmount,
            airdrop.totalEligible,
            airdrop.isActive
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
    
    // ============ Ranking View Functions ============
    
    /**
     * @notice Get ranking round details
     */
    function getRankingRound(uint256 round) external view returns (
        uint256 roundNumber,
        uint256 timestamp,
        uint256 growthAirdropAmount,
        uint256 cumulativeAirdropAmount,
        bool processed
    ) {
        RankingRound memory r = rankingRounds[round];
        return (r.roundNumber, r.timestamp, r.growthAirdropAmount, r.cumulativeAirdropAmount, r.processed);
    }
    
    /**
     * @notice Get top growth users for a round
     */
    function getTopGrowthUsers(uint256 round) external view returns (address[20] memory) {
        return topGrowthUsers[round];
    }
    
    /**
     * @notice Get top cumulative users for a round
     */
    function getTopCumulativeUsers(uint256 round) external view returns (address[20] memory) {
        return topCumulativeUsers[round];
    }
    
    /**
     * @notice Check user's ranking claim status for a round
     */
    function checkRankingClaimStatus(address user, uint256 round) external view returns (
        bool isInGrowthTop20,
        bool isInCumulativeTop20,
        bool hasClaimedGrowth,
        bool hasClaimedCumulative,
        uint256 growthAmount,
        uint256 cumulativeAmount
    ) {
        // Check if in growth top 20
        for (uint256 i = 0; i < TOP_RANKERS_COUNT; i++) {
            if (topGrowthUsers[round][i] == user) {
                isInGrowthTop20 = true;
                break;
            }
        }
        
        // Check if in cumulative top 20
        for (uint256 i = 0; i < TOP_RANKERS_COUNT; i++) {
            if (topCumulativeUsers[round][i] == user) {
                isInCumulativeTop20 = true;
                break;
            }
        }
        
        RankingRound memory r = rankingRounds[round];
        
        return (
            isInGrowthTop20,
            isInCumulativeTop20,
            hasClaimedGrowthRanking[user][round],
            hasClaimedCumulativeRanking[user][round],
            r.growthAirdropAmount,
            r.cumulativeAirdropAmount
        );
    }
    
    /**
     * @notice Get user's rank position in a round (0 = not ranked, 1-20 = position)
     */
    function getUserRankPosition(address user, uint256 round) external view returns (
        uint256 growthPosition,
        uint256 cumulativePosition
    ) {
        for (uint256 i = 0; i < TOP_RANKERS_COUNT; i++) {
            if (topGrowthUsers[round][i] == user) {
                growthPosition = i + 1;
            }
            if (topCumulativeUsers[round][i] == user) {
                cumulativePosition = i + 1;
            }
        }
        return (growthPosition, cumulativePosition);
    }
    
    /**
     * @notice Get ranking system stats
     */
    function getRankingStats() external view returns (
        uint256 _currentRankingRound,
        uint256 _lastRankingTimestamp
    ) {
        return (currentRankingRound, lastRankingTimestamp);
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