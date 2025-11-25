// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NSTFinance
 * @notice Main contract for NST Finance - Donation & Node-based reward ecosystem with Points & Airdrop System
 * @dev Phase 1 deployment on BSC with v1.1 features
 */
contract NSTFinance is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Constants ============
    
    uint256 public constant MINIMUM_DONATION = 100 * 10**18; // 100 USD (18 decimals)
    uint256 public constant NODE_PRICE = 2000 * 10**18; // 2000 USD
    uint256 public constant MAX_NODES_PER_USER = 5;
    uint256 public constant MAX_TOTAL_NODES = 100;
    uint256 public constant AUTO_NODE_THRESHOLD = 2000 * 10**18;
    
    // Referral rewards
    uint256 public constant NODE_REFERRAL_REWARD = 500 * 10**18; // 500 NST
    uint256 public constant DONATION_REFERRAL_REWARD_PER_1000 = 100 * 10**18; // 100 NST per 1000 USD
    uint256 public constant FREE_NODE_REFERRAL_THRESHOLD = 10;
    
    // Points system (1 USD = 1 point, stored as 18 decimals)
    uint256 public constant POINTS_PER_USD = 1 * 10**18; // 1 point per USD
    uint256 public constant NODE_HOLDER_MULTIPLIER = 2; // 2x points for node holders

    // ============ State Variables ============
    
    struct UserInfo {
        uint256 totalDonationUSD;      // Total donations in USD (18 decimals)
        uint256 nodeCount;              // Number of nodes owned
        address referrer;               // Referrer address (permanent)
        uint256 directNodeCount;        // Direct referrals who became node holders
        uint256 directDonationUSD;      // Total donations from direct referrals
        uint256 nstReward;              // Accumulated NST rewards
        bool hasAutoNode;               // Whether auto-node from donations was claimed
        uint256 points;                 // User's total points (v1.1)
        uint256 lastSnapshotPoints;     // Points at last snapshot (for growth calculation)
    }
    
    struct AirdropRound {
        uint256 roundNumber;
        uint256 timestamp;
        uint256 airdropAmount;          // Amount per eligible user
        uint256 totalEligible;          // Number of eligible users
        bool isActive;                  // Whether round is active for claims
    }
    
    mapping(address => UserInfo) public users;
    mapping(address => bool) public isUser;
    
    // Points & Airdrop System (v1.1)
    mapping(address => mapping(uint256 => bool)) public hasClaimedAirdrop; // user => round => claimed
    mapping(address => mapping(uint256 => bool)) public isEligibleForAirdrop; // user => round => eligible
    mapping(uint256 => AirdropRound) public airdropRounds;
    uint256 public currentAirdropRound;
    uint256 public lastSnapshotTimestamp;
    
    // Supported stablecoins
    mapping(address => bool) public supportedTokens;
    mapping(address => uint8) public tokenDecimals;
    
    // Treasury and NST token
    address public treasury;
    IERC20 public nstToken;
    bool public claimEnabled;
    
    // Global stats
    uint256 public totalNodesIssued;
    uint256 public totalDonationsUSD;
    uint256 public totalUsers;
    uint256 public totalPointsDistributed;

    // ============ Events ============
    
    // Existing events
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

    // ============ Errors ============
    
    error InvalidAmount();
    error InvalidToken();
    error NodeLimitReached();
    error GlobalNodeLimitReached();
    error InvalidReferrer();
    error ClaimNotEnabled();
    error NoRewardsToClaim();
    error ZeroAddress();
    error InsufficientBalance();
    error NotEligibleForAirdrop();
    error AirdropAlreadyClaimed();
    error AirdropRoundNotActive();
    error InvalidAirdropRound();

    // ============ Constructor ============
    
    constructor(address _treasury) Ownable(msg.sender) {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
        lastSnapshotTimestamp = block.timestamp;
    }

    // ============ Donation Functions ============
    
    /**
     * @notice Make a donation in supported stablecoin
     * @param token The stablecoin address (USDT/USDC)
     * @param amount The amount to donate (in token decimals)
     * @param referrerHint Optional referrer address (only used if user has no referrer)
     */
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
        
        // Award points (v1.1)
        _awardDonationPoints(msg.sender, usdValue);
        
        // Update referrer stats and process rewards
        if (user.referrer != address(0)) {
            UserInfo storage referrer = users[user.referrer];
            uint256 oldDonations = referrer.directDonationUSD;
            referrer.directDonationUSD += usdValue;
            
            // Award points to referrer for referee donation (v1.1)
            _awardReferralPoints(user.referrer, usdValue);
            
            // Calculate donation referral rewards (100 NST per 1000 USD)
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
    
    /**
     * @notice Purchase nodes directly
     * @param token The stablecoin address (USDT/USDC)
     * @param nodeCount Number of nodes to purchase (1-5)
     * @param referrerHint Optional referrer address
     */
    function buyNode(
        address token,
        uint256 nodeCount,
        address referrerHint
    ) external nonReentrant {
        if (!supportedTokens[token]) revert InvalidToken();
        if (nodeCount == 0 || nodeCount > MAX_NODES_PER_USER) revert InvalidAmount();
        
        UserInfo storage user = users[msg.sender];
        
        if (user.nodeCount + nodeCount > MAX_NODES_PER_USER) revert NodeLimitReached();
        if (totalNodesIssued + nodeCount > MAX_TOTAL_NODES) revert GlobalNodeLimitReached();
        
        _registerUser(msg.sender, referrerHint);
        
        uint256 totalCost = NODE_PRICE * nodeCount;
        uint256 tokenAmount = _denormalizeAmount(totalCost, tokenDecimals[token]);
        
        IERC20(token).safeTransferFrom(msg.sender, treasury, tokenAmount);
        
        user.totalDonationUSD += totalCost;
        totalDonationsUSD += totalCost;
        
        // Award points (node purchase counts as donation) (v1.1)
        _awardDonationPoints(msg.sender, totalCost);
        
        bool wasNodeHolder = user.nodeCount > 0;
        user.nodeCount += nodeCount;
        totalNodesIssued += nodeCount;
        
        if (!wasNodeHolder && user.nodeCount > 0 && user.referrer != address(0)) {
            _grantNodeReferralReward(user.referrer, msg.sender);
        }
        
        emit NodePurchased(msg.sender, nodeCount, totalCost, user.referrer);
    }

    /**
     * @notice Internal function to check and grant auto-node from donations
     */
    function _checkAndGrantAutoNode(address userAddress) internal {
        UserInfo storage user = users[userAddress];
        
        if (
            !user.hasAutoNode && 
            user.totalDonationUSD >= AUTO_NODE_THRESHOLD &&
            user.nodeCount < MAX_NODES_PER_USER &&
            totalNodesIssued < MAX_TOTAL_NODES
        ) {
            bool wasNodeHolder = user.nodeCount > 0;
            
            user.nodeCount++;
            user.hasAutoNode = true;
            totalNodesIssued++;
            
            emit AutoNodeGranted(userAddress, user.nodeCount);
            
            if (!wasNodeHolder && user.referrer != address(0)) {
                _grantNodeReferralReward(user.referrer, userAddress);
            }
        }
    }

    /**
     * @notice Internal function to grant node referral rewards
     */
    function _grantNodeReferralReward(address referrer, address referee) internal {
        UserInfo storage referrerInfo = users[referrer];
        
        referrerInfo.nstReward += NODE_REFERRAL_REWARD;
        referrerInfo.directNodeCount++;
        
        emit NodeReferralReward(referrer, referee, NODE_REFERRAL_REWARD);
        
        if (
            referrerInfo.directNodeCount % FREE_NODE_REFERRAL_THRESHOLD == 0 &&
            referrerInfo.nodeCount < MAX_NODES_PER_USER &&
            totalNodesIssued < MAX_TOTAL_NODES
        ) {
            referrerInfo.nodeCount++;
            totalNodesIssued++;
            emit FreeNodeGranted(referrer, referrerInfo.nodeCount);
        }
    }

    // ============ Points System (v1.1) ============
    
    /**
     * @notice Award points for donations
     * @dev Node holders get 2x points
     */
    function _awardDonationPoints(address user, uint256 usdValue) internal {
        UserInfo storage userInfo = users[user];
        
        // Calculate points: 1 USD = 1 point
        uint256 basePoints = (usdValue * POINTS_PER_USD) / 10**18;
        
        // Double points for node holders
        uint256 points = userInfo.nodeCount > 0 
            ? basePoints * NODE_HOLDER_MULTIPLIER 
            : basePoints;
        
        userInfo.points += points;
        totalPointsDistributed += points;
        
        emit PointsEarned(user, points, "donation");
    }
    
    /**
     * @notice Award points to referrer for referee donations
     */
    function _awardReferralPoints(address referrer, uint256 usdValue) internal {
        UserInfo storage referrerInfo = users[referrer];
        
        // Referrer gets base points for referee donations
        uint256 points = (usdValue * POINTS_PER_USD) / 10**18;
        
        referrerInfo.points += points;
        totalPointsDistributed += points;
        
        emit PointsEarned(referrer, points, "referral");
    }

    // ============ Snapshot & Airdrop System (v1.1) ============
    
    /**
     * @notice Take snapshot of current points for ranking calculation
     * @dev Called by admin twice a month (10th and 20th)
     */
    function takeSnapshot() external onlyOwner {
        currentAirdropRound++;
        lastSnapshotTimestamp = block.timestamp;
        
        emit SnapshotTaken(currentAirdropRound, block.timestamp);
    }
    
    /**
     * @notice Update snapshot points for specific users (called by backend after snapshot)
     * @param userAddresses Array of user addresses
     */
    function updateSnapshotPoints(address[] calldata userAddresses) external onlyOwner {
        for (uint256 i = 0; i < userAddresses.length; i++) {
            address user = userAddresses[i];
            users[user].lastSnapshotPoints = users[user].points;
        }
    }
    
    /**
     * @notice Create airdrop round with eligible users
     * @param round Airdrop round number
     * @param eligibleUsers Array of eligible user addresses
     * @param airdropAmount NST amount per eligible user
     */
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
        
        // Mark eligible users
        for (uint256 i = 0; i < eligibleUsers.length; i++) {
            isEligibleForAirdrop[eligibleUsers[i]][round] = true;
            emit AirdropEligibilitySet(eligibleUsers[i], round, true);
        }
        
        emit AirdropRoundCreated(round, airdropAmount, eligibleUsers.length);
    }
    
    /**
     * @notice Claim airdrop for a specific round
     * @param round Airdrop round number
     */
    function claimAirdrop(uint256 round) external nonReentrant {
        if (round == 0 || round > currentAirdropRound) revert InvalidAirdropRound();
        
        AirdropRound storage airdrop = airdropRounds[round];
        if (!airdrop.isActive) revert AirdropRoundNotActive();
        
        if (!isEligibleForAirdrop[msg.sender][round]) revert NotEligibleForAirdrop();
        if (hasClaimedAirdrop[msg.sender][round]) revert AirdropAlreadyClaimed();
        
        hasClaimedAirdrop[msg.sender][round] = true;
        
        // Transfer airdrop
        nstToken.safeTransfer(msg.sender, airdrop.airdropAmount);
        
        emit AirdropClaimed(msg.sender, round, airdrop.airdropAmount);
    }
    
    /**
     * @notice Close airdrop round (prevent further claims)
     */
    function closeAirdropRound(uint256 round) external onlyOwner {
        airdropRounds[round].isActive = false;
    }

    // ============ NST Reward Functions ============
    
    /**
     * @notice Claim accumulated NST rewards
     */
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
    
    /**
     * @notice Internal function to register user and set referrer
     */
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
    
    /**
     * @notice Get user information
     */
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
    
    /**
     * @notice Get global statistics
     */
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
    
    /**
     * @notice Check airdrop eligibility for user and round
     */
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
    
    /**
     * @notice Get airdrop round details
     */
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
    
    /**
     * @notice Calculate user's point growth percentage since last snapshot
     * @dev Returns growth as basis points (100 = 1%, 10000 = 100%)
     */
    function getUserPointsGrowth(address user) external view returns (uint256 growthBasisPoints) {
        UserInfo memory userInfo = users[user];
        
        if (userInfo.lastSnapshotPoints == 0) {
            return userInfo.points > 0 ? 1000000 : 0; // 10000% if starting from 0
        }
        
        if (userInfo.points <= userInfo.lastSnapshotPoints) {
            return 0;
        }
        
        uint256 increase = userInfo.points - userInfo.lastSnapshotPoints;
        return (increase * 10000) / userInfo.lastSnapshotPoints;
    }
    
    /**
     * @notice Check if user is eligible for auto-node
     */
    function isEligibleForAutoNode(address user) external view returns (bool) {
        UserInfo memory info = users[user];
        return (
            !info.hasAutoNode && 
            info.totalDonationUSD >= AUTO_NODE_THRESHOLD &&
            info.nodeCount < MAX_NODES_PER_USER &&
            totalNodesIssued < MAX_TOTAL_NODES
        );
    }

    // ============ Admin Functions ============
    
    /**
     * @notice Add supported stablecoin
     */
    function addSupportedToken(address token, uint8 decimals) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        supportedTokens[token] = true;
        tokenDecimals[token] = decimals;
        emit TokenAdded(token, decimals);
    }
    
    /**
     * @notice Remove supported stablecoin
     */
    function removeSupportedToken(address token) external onlyOwner {
        supportedTokens[token] = false;
        emit TokenRemoved(token);
    }
    
    /**
     * @notice Set NST token address
     */
    function setNSTToken(address _nstToken) external onlyOwner {
        if (_nstToken == address(0)) revert ZeroAddress();
        nstToken = IERC20(_nstToken);
        emit NSTTokenSet(_nstToken);
    }
    
    /**
     * @notice Enable/disable NST claiming
     */
    function setClaimEnabled(bool _enabled) external onlyOwner {
        claimEnabled = _enabled;
        emit ClaimEnabled(_enabled);
    }
    
    /**
     * @notice Update treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }
    
    /**
     * @notice Emergency withdraw NST tokens (only owner)
     */
    function emergencyWithdrawNST(uint256 amount) external onlyOwner {
        nstToken.safeTransfer(owner(), amount);
    }

    // ============ Internal Helper Functions ============
    
    /**
     * @notice Normalize token amount to 18 decimals
     */
    function _normalizeAmount(uint256 amount, uint8 decimals) internal pure returns (uint256) {
        if (decimals == 18) {
            return amount;
        } else if (decimals < 18) {
            return amount * (10 ** (18 - decimals));
        } else {
            return amount / (10 ** (decimals - 18));
        }
    }
    
    /**
     * @notice Denormalize from 18 decimals to token decimals
     */
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