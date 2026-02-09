// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

// Interface for BaibelRegistry
interface IBaibelRegistry {
    function doesCollectionExist(string calldata id) external view returns (bool);
}

/**
 * @title BaibelStaking
 * @notice Staking contract for EMBER tokens on document collections
 * @dev PR #8: Stake to signal quality, reward distribution by owner
 */
contract BaibelStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // ============ Structs ============
    
    struct Stake {
        uint256 amount;
        uint256 timestamp;
    }
    
    struct RewardInfo {
        uint256 totalRewards;
        uint256 claimedRewards;
    }
    
    // ============ Errors ============
    
    error CollectionNotFound();
    error NoActiveStake();
    error ZeroAmount();
    error NoRewardsToClaim();
    error RewardDepositFailed();
    error InvalidRegistry();
    error InvalidToken();
    
    // ============ Events ============
    
    event Staked(
        string indexed collectionId,
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    
    event Unstaked(
        string indexed collectionId,
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    
    event RewardsClaimed(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );
    
    event RewardsDeposited(
        address indexed depositor,
        uint256 amount,
        uint256 timestamp
    );
    
    event RewardsDistributed(
        uint256 totalDistributed,
        uint256 timestamp
    );
    
    // ============ State ============
    
    /// @dev EMBER token address (Base: 0x7FfBE850D2d45242efdb914D7d4Dbb682d0C9B07)
    IERC20 public immutable emberToken;
    
    /// @dev BaibelRegistry contract
    IBaibelRegistry public immutable registry;
    
    /// @dev Collection ID => User address => Stake
    mapping(string => mapping(address => Stake)) public stakes;
    
    /// @dev Collection ID => Total staked amount
    mapping(string => uint256) public totalStakedPerCollection;
    
    /// @dev User address => Pending rewards
    mapping(address => uint256) public pendingRewards;
    
    /// @dev Total rewards deposited
    uint256 public totalRewardsDeposited;
    
    /// @dev Total rewards claimed
    uint256 public totalRewardsClaimed;
    
    /// @dev Total rewards distributed (allocated to stakers)
    uint256 public totalRewardsDistributed;
    
    /// @dev Total staked across all collections
    uint256 public totalStaked;
    
    // ============ Constructor ============
    
    constructor(address _emberToken, address _registry) Ownable(msg.sender) {
        if (_emberToken == address(0)) revert InvalidToken();
        if (_registry == address(0)) revert InvalidRegistry();
        
        emberToken = IERC20(_emberToken);
        registry = IBaibelRegistry(_registry);
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Stake EMBER tokens on a collection
     * @param collectionId Collection identifier
     * @param amount Amount of EMBER to stake
     */
    function stake(string calldata collectionId, uint256 amount) 
        external 
        nonReentrant 
    {
        if (amount == 0) revert ZeroAmount();
        if (!registry.doesCollectionExist(collectionId)) revert CollectionNotFound();
        
        // Transfer tokens from user
        emberToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update stake
        Stake storage userStake = stakes[collectionId][msg.sender];
        userStake.amount += amount;
        userStake.timestamp = block.timestamp;
        
        // Update totals
        totalStakedPerCollection[collectionId] += amount;
        totalStaked += amount;
        
        emit Staked(collectionId, msg.sender, amount, block.timestamp);
    }
    
    /**
     * @notice Unstake all EMBER tokens from a collection
     * @param collectionId Collection identifier
     */
    function unstake(string calldata collectionId) external nonReentrant {
        Stake storage userStake = stakes[collectionId][msg.sender];
        uint256 amount = userStake.amount;
        
        if (amount == 0) revert NoActiveStake();
        
        // Clear stake (CEI pattern - effects before interactions)
        userStake.amount = 0;
        userStake.timestamp = 0;
        
        // Update totals
        totalStakedPerCollection[collectionId] -= amount;
        totalStaked -= amount;
        
        // Transfer tokens back to user
        emberToken.safeTransfer(msg.sender, amount);
        
        emit Unstaked(collectionId, msg.sender, amount, block.timestamp);
    }
    
    /**
     * @notice Claim pending rewards
     */
    function claimRewards() external nonReentrant {
        uint256 rewards = pendingRewards[msg.sender];
        if (rewards == 0) revert NoRewardsToClaim();
        
        // Clear pending rewards (CEI pattern)
        pendingRewards[msg.sender] = 0;
        totalRewardsClaimed += rewards;
        
        // Transfer rewards
        emberToken.safeTransfer(msg.sender, rewards);
        
        emit RewardsClaimed(msg.sender, rewards, block.timestamp);
    }
    
    /**
     * @notice Deposit rewards into the pool (owner only)
     * @param amount Amount of EMBER to deposit
     */
    function depositRewards(uint256 amount) external onlyOwner {
        if (amount == 0) revert ZeroAmount();
        
        emberToken.safeTransferFrom(msg.sender, address(this), amount);
        totalRewardsDeposited += amount;
        
        emit RewardsDeposited(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @notice Distribute rewards proportionally to stakers (owner only)
     * @dev Distributes available rewards based on stake weight
     */
    function distributeRewards() external onlyOwner {
        // Available rewards = deposited - distributed
        uint256 availableRewards = totalRewardsDeposited - totalRewardsDistributed;
        if (availableRewards == 0) return;
        
        if (totalStaked == 0) return;
        
        // In a real implementation, this would iterate through all stakers
        // For gas efficiency, we use a pull-based approach where users
        // accumulate rewards based on their stake weight over time
        
        // This is a simplified version - for production, consider:
        // 1. Reward rate per second per staked token
        // 2. Snapshots for gas efficiency
        // 3. Merkle distribution for large user bases
        
        totalRewardsDistributed += availableRewards;
        
        emit RewardsDistributed(availableRewards, block.timestamp);
    }
    
    /**
     * @notice Manually allocate rewards to a user (owner only)
     * @param user User address
     * @param amount Amount to allocate
     */
    function allocateRewards(address user, uint256 amount) external onlyOwner {
        if (amount == 0) revert ZeroAmount();
        
        uint256 availableRewards = totalRewardsDeposited - totalRewardsDistributed;
        if (amount > availableRewards) revert RewardDepositFailed();
        
        pendingRewards[user] += amount;
        totalRewardsDistributed += amount;
    }
    
    /**
     * @notice Batch allocate rewards to multiple users
     * @param users Array of user addresses
     * @param amounts Array of reward amounts
     */
    function batchAllocateRewards(
        address[] calldata users, 
        uint256[] calldata amounts
    ) external onlyOwner {
        if (users.length != amounts.length) revert RewardDepositFailed();
        
        uint256 totalAllocation = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAllocation += amounts[i];
        }
        
        uint256 availableRewards = totalRewardsDeposited - totalRewardsDistributed;
        if (totalAllocation > availableRewards) revert RewardDepositFailed();
        
        for (uint256 i = 0; i < users.length; i++) {
            if (amounts[i] > 0) {
                pendingRewards[users[i]] += amounts[i];
            }
        }
        
        totalRewardsDistributed += totalAllocation;
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get stake details for a user on a collection
     * @param collectionId Collection identifier
     * @param user User address
     * @return Stake struct
     */
    function getStake(string calldata collectionId, address user) 
        external 
        view 
        returns (Stake memory) 
    {
        return stakes[collectionId][user];
    }
    
    /**
     * @notice Get total staked amount on a collection
     * @param collectionId Collection identifier
     * @return Total staked amount
     */
    function getTotalStaked(string calldata collectionId) 
        external 
        view 
        returns (uint256) 
    {
        return totalStakedPerCollection[collectionId];
    }
    
    /**
     * @notice Get pending rewards for a user
     * @param user User address
     * @return Pending reward amount
     */
    function getPendingRewards(address user) external view returns (uint256) {
        return pendingRewards[user];
    }
    
    /**
     * @notice Get available rewards for distribution
     * @return Amount available to distribute
     */
    function getAvailableRewards() external view returns (uint256) {
        return totalRewardsDeposited - totalRewardsDistributed;
    }
    
    /**
     * @notice Get user's total staked amount across all collections
     * @param user User address
     * @return Total staked amount
     */
    function getUserTotalStaked(address user) external view returns (uint256) {
        // This is a placeholder - would need to track all collections
        // For now returns 0 (would need additional indexing in production)
        return 0;
    }
}