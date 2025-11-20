// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NSTFinance
 * @notice Main contract for NST Finance - Donation & Node-based reward ecosystem
 * @dev Phase 1 deployment on BSC network
 */
contract NSTFinance is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Constants ============
    
    uint256 public constant MINIMUM_DONATION = 100 * 10**18; // 100 USD (assuming 18 decimals)
    uint256 public constant NODE_PRICE = 2000 * 10**18; // 2000 USD
    uint256 public constant MAX_NODES_PER_USER = 5;
    uint256 public constant MAX_TOTAL_NODES = 100;
    uint256 public constant AUTO_NODE_THRESHOLD = 2000 * 10**18; // 2000 USD total donations
    
    // Referral rewards
    uint256 public constant NODE_REFERRAL_REWARD = 500 * 10**18; // 500 NST
    uint256 public constant DONATION_REFERRAL_REWARD_PER_1000 = 100 * 10**18; // 100 NST per 1000 USD
    uint256 public constant FREE_NODE_REFERRAL_THRESHOLD = 10; // 10 node referrals = 1 free node

    // ============ State Variables ============
    
    struct UserInfo {
        uint256 totalDonationUSD;      // Total donations in USD (18 decimals)
        uint256 nodeCount;              // Number of nodes owned
        address referrer;               // Referrer address (permanent)
        uint256 directNodeCount;        // Direct referrals who became node holders
        uint256 directDonationUSD;      // Total donations from direct referrals
        uint256 nstReward;              // Accumulated NST rewards
        bool hasAutoNode;               // Whether auto-node from donations was claimed
    }
    
    mapping(address => UserInfo) public users;
    mapping(address => bool) public isUser; // Track if address has interacted
    
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

    // ============ Constructor ============
    
    constructor(address _treasury) Ownable(msg.sender) {
        if (_treasury == address(0)) revert ZeroAddress();
        treasury = _treasury;
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
        
        // Convert to 18 decimal USD value
        uint256 usdValue = _normalizeAmount(amount, tokenDecimals[token]);
        
        if (usdValue < MINIMUM_DONATION) revert InvalidAmount();
        
        // Register user and set referrer if needed
        _registerUser(msg.sender, referrerHint);
        
        // Transfer tokens to treasury
        IERC20(token).safeTransferFrom(msg.sender, treasury, amount);
        
        // Update user donation stats
        UserInfo storage user = users[msg.sender];
        user.totalDonationUSD += usdValue;
        totalDonationsUSD += usdValue;
        
        // Update referrer stats and process rewards
        if (user.referrer != address(0)) {
            UserInfo storage referrer = users[user.referrer];
            uint256 oldDonations = referrer.directDonationUSD;
            referrer.directDonationUSD += usdValue;
            
            // Calculate donation referral rewards (100 NST per 1000 USD)
            uint256 newThousands = referrer.directDonationUSD / (1000 * 10**18);
            uint256 oldThousands = oldDonations / (1000 * 10**18);
            
            if (newThousands > oldThousands) {
                uint256 rewardAmount = (newThousands - oldThousands) * DONATION_REFERRAL_REWARD_PER_1000;
                referrer.nstReward += rewardAmount;
                emit DonationReferralReward(user.referrer, rewardAmount, usdValue);
            }
        }
        
        // Check for auto-node eligibility
        _checkAndGrantAutoNode(msg.sender);
        
        emit DonationReceived(msg.sender, token, amount, usdValue, user.referrer);
    }

    // ============ Node Functions ============
    
    /**
     * @notice Purchase nodes directly
     * @param token The stablecoin address (USDT/USDC)
     * @param nodeCount Number of nodes to purchase (1-5)
     * @param referrerHint Optional referrer address (only used if user has no referrer)
     */
    function buyNode(
        address token,
        uint256 nodeCount,
        address referrerHint
    ) external nonReentrant {
        if (!supportedTokens[token]) revert InvalidToken();
        if (nodeCount == 0 || nodeCount > MAX_NODES_PER_USER) revert InvalidAmount();
        
        UserInfo storage user = users[msg.sender];
        
        // Check limits
        if (user.nodeCount + nodeCount > MAX_NODES_PER_USER) revert NodeLimitReached();
        if (totalNodesIssued + nodeCount > MAX_TOTAL_NODES) revert GlobalNodeLimitReached();
        
        // Register user and set referrer if needed
        _registerUser(msg.sender, referrerHint);
        
        // Calculate cost
        uint256 totalCost = NODE_PRICE * nodeCount;
        uint256 tokenAmount = _denormalizeAmount(totalCost, tokenDecimals[token]);
        
        // Transfer tokens to treasury
        IERC20(token).safeTransferFrom(msg.sender, treasury, tokenAmount);
        
        // Track as donation (node purchases count toward donation total)
        user.totalDonationUSD += totalCost;
        totalDonationsUSD += totalCost;
        
        // Grant nodes
        bool wasNodeHolder = user.nodeCount > 0;
        user.nodeCount += nodeCount;
        totalNodesIssued += nodeCount;
        
        // Process node referral reward (only first node triggers reward)
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
        
        // Check if eligible for auto-node
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
            
            // Process node referral reward if this is their first node
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
        
        // Grant 500 NST reward
        referrerInfo.nstReward += NODE_REFERRAL_REWARD;
        referrerInfo.directNodeCount++;
        
        emit NodeReferralReward(referrer, referee, NODE_REFERRAL_REWARD);
        
        // Check for free node milestone (every 10 node referrals)
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

    // ============ NST Reward Functions ============
    
    /**
     * @notice Claim accumulated NST rewards
     */
    function claimNST() external nonReentrant {
        if (!claimEnabled) revert ClaimNotEnabled();
        
        UserInfo storage user = users[msg.sender];
        uint256 reward = user.nstReward;
        
        if (reward == 0) revert NoRewardsToClaim();
        
        // Reset reward balance
        user.nstReward = 0;
        
        // Transfer NST tokens
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
            
            // Set referrer (permanent, one-time only)
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
        bool hasAutoNode
    ) {
        UserInfo memory info = users[user];
        return (
            info.totalDonationUSD,
            info.nodeCount,
            info.referrer,
            info.directNodeCount,
            info.directDonationUSD,
            info.nstReward,
            info.hasAutoNode
        );
    }
    
    /**
     * @notice Get global statistics
     */
    function getGlobalStats() external view returns (
        uint256 _totalNodesIssued,
        uint256 _totalDonationsUSD,
        uint256 _totalUsers,
        uint256 nodesRemaining
    ) {
        return (
            totalNodesIssued,
            totalDonationsUSD,
            totalUsers,
            MAX_TOTAL_NODES - totalNodesIssued
        );
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
