// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {BaibelRegistry} from "../src/BaibelRegistry.sol";
import {BaibelStaking} from "../src/BaibelStaking.sol";
import {MockEmberToken} from "../src/mocks/MockEmberToken.sol";

contract BaibelStakingTest is Test {
    BaibelRegistry public registry;
    BaibelStaking public staking;
    MockEmberToken public emberToken;
    
    address public owner = address(1);
    address public author = address(2);
    address public staker1 = address(3);
    address public staker2 = address(4);
    address public staker3 = address(5);
    
    string public constant COLLECTION_1 = "col-1";
    string public constant COLLECTION_2 = "col-2";
    
    // Define events for testing
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
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy mock token (mints to owner)
        emberToken = new MockEmberToken();
        
        // Deploy registry
        registry = new BaibelRegistry();
        
        // Deploy staking
        staking = new BaibelStaking(address(emberToken), address(registry));
        
        vm.stopPrank();
        
        // Register collections (as author)
        vm.prank(author);
        registry.registerCollection(COLLECTION_1, "Collection 1", "1.0", 100, "QmTest1");
        
        vm.prank(author);
        registry.registerCollection(COLLECTION_2, "Collection 2", "1.0", 200, "QmTest2");
        
        // Fund stakers from owner
        vm.startPrank(owner);
        emberToken.transfer(staker1, 10_000 ether);
        emberToken.transfer(staker2, 10_000 ether);
        emberToken.transfer(staker3, 10_000 ether);
        vm.stopPrank();
    }
    
    // ============ Stake Tests ============
    
    function test_Stake() public {
        uint256 stakeAmount = 1000 ether;
        
        vm.startPrank(staker1);
        emberToken.approve(address(staking), stakeAmount);
        
        vm.expectEmit(true, true, false, true);
        emit Staked(COLLECTION_1, staker1, stakeAmount, block.timestamp);
        
        staking.stake(COLLECTION_1, stakeAmount);
        vm.stopPrank();
        
        // Verify stake
        BaibelStaking.Stake memory stake = staking.getStake(COLLECTION_1, staker1);
        assertEq(stake.amount, stakeAmount);
        assertEq(stake.timestamp, block.timestamp);
        
        // Verify totals
        assertEq(staking.getTotalStaked(COLLECTION_1), stakeAmount);
        assertEq(staking.totalStaked(), stakeAmount);
        
        // Verify token transfer
        assertEq(emberToken.balanceOf(address(staking)), stakeAmount);
        assertEq(emberToken.balanceOf(staker1), 9000 ether);
    }
    
    function test_Stake_MultipleCollections() public {
        uint256 stakeAmount1 = 500 ether;
        uint256 stakeAmount2 = 750 ether;
        
        vm.startPrank(staker1);
        emberToken.approve(address(staking), stakeAmount1 + stakeAmount2);
        
        staking.stake(COLLECTION_1, stakeAmount1);
        staking.stake(COLLECTION_2, stakeAmount2);
        vm.stopPrank();
        
        assertEq(staking.getTotalStaked(COLLECTION_1), stakeAmount1);
        assertEq(staking.getTotalStaked(COLLECTION_2), stakeAmount2);
        assertEq(staking.totalStaked(), stakeAmount1 + stakeAmount2);
        
        BaibelStaking.Stake memory stake1 = staking.getStake(COLLECTION_1, staker1);
        BaibelStaking.Stake memory stake2 = staking.getStake(COLLECTION_2, staker1);
        
        assertEq(stake1.amount, stakeAmount1);
        assertEq(stake2.amount, stakeAmount2);
    }
    
    function test_Stake_AddToExisting() public {
        uint256 stakeAmount1 = 500 ether;
        uint256 stakeAmount2 = 300 ether;
        
        vm.startPrank(staker1);
        emberToken.approve(address(staking), stakeAmount1 + stakeAmount2);
        
        staking.stake(COLLECTION_1, stakeAmount1);
        vm.warp(block.timestamp + 1);
        staking.stake(COLLECTION_1, stakeAmount2);
        vm.stopPrank();
        
        BaibelStaking.Stake memory stake = staking.getStake(COLLECTION_1, staker1);
        assertEq(stake.amount, stakeAmount1 + stakeAmount2);
    }
    
    function test_Stake_RevertIf_ZeroAmount() public {
        vm.prank(staker1);
        vm.expectRevert(BaibelStaking.ZeroAmount.selector);
        staking.stake(COLLECTION_1, 0);
    }
    
    function test_Stake_RevertIf_CollectionNotFound() public {
        vm.startPrank(staker1);
        emberToken.approve(address(staking), 1000 ether);
        
        vm.expectRevert(BaibelStaking.CollectionNotFound.selector);
        staking.stake("nonexistent", 1000 ether);
        vm.stopPrank();
    }
    
    // ============ Unstake Tests ============
    
    function test_Unstake() public {
        uint256 stakeAmount = 1000 ether;
        
        // Stake first
        vm.startPrank(staker1);
        emberToken.approve(address(staking), stakeAmount);
        staking.stake(COLLECTION_1, stakeAmount);
        
        uint256 balanceBefore = emberToken.balanceOf(staker1);
        
        vm.expectEmit(true, true, false, true);
        emit Unstaked(COLLECTION_1, staker1, stakeAmount, block.timestamp);
        
        staking.unstake(COLLECTION_1);
        vm.stopPrank();
        
        // Verify stake cleared
        BaibelStaking.Stake memory stake = staking.getStake(COLLECTION_1, staker1);
        assertEq(stake.amount, 0);
        
        // Verify totals updated
        assertEq(staking.getTotalStaked(COLLECTION_1), 0);
        assertEq(staking.totalStaked(), 0);
        
        // Verify token returned
        assertEq(emberToken.balanceOf(staker1), balanceBefore + stakeAmount);
        assertEq(emberToken.balanceOf(address(staking)), 0);
    }
    
    function test_Unstake_RevertIf_NoActiveStake() public {
        vm.prank(staker1);
        vm.expectRevert(BaibelStaking.NoActiveStake.selector);
        staking.unstake(COLLECTION_1);
    }
    
    // ============ Rewards Tests ============
    
    function test_DepositRewards() public {
        uint256 rewardAmount = 5000 ether;
        
        vm.startPrank(owner);
        emberToken.approve(address(staking), rewardAmount);
        
        vm.expectEmit(true, false, false, true);
        emit RewardsDeposited(owner, rewardAmount, block.timestamp);
        
        staking.depositRewards(rewardAmount);
        vm.stopPrank();
        
        assertEq(staking.totalRewardsDeposited(), rewardAmount);
        assertEq(staking.getAvailableRewards(), rewardAmount);
        assertEq(emberToken.balanceOf(address(staking)), rewardAmount);
    }
    
    function test_AllocateRewards() public {
        uint256 rewardAmount = 5000 ether;
        uint256 allocation = 1000 ether;
        
        // Deposit rewards
        vm.startPrank(owner);
        emberToken.approve(address(staking), rewardAmount);
        staking.depositRewards(rewardAmount);
        
        // Allocate to staker
        staking.allocateRewards(staker1, allocation);
        vm.stopPrank();
        
        assertEq(staking.getPendingRewards(staker1), allocation);
        assertEq(staking.totalRewardsDistributed(), allocation);
        assertEq(staking.getAvailableRewards(), rewardAmount - allocation);
    }
    
    function test_BatchAllocateRewards() public {
        uint256 rewardAmount = 5000 ether;
        uint256 allocation1 = 1000 ether;
        uint256 allocation2 = 1500 ether;
        uint256 allocation3 = 500 ether;
        
        // Deposit rewards
        vm.startPrank(owner);
        emberToken.approve(address(staking), rewardAmount);
        staking.depositRewards(rewardAmount);
        
        // Batch allocate
        address[] memory users = new address[](3);
        users[0] = staker1;
        users[1] = staker2;
        users[2] = staker3;
        
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = allocation1;
        amounts[1] = allocation2;
        amounts[2] = allocation3;
        
        staking.batchAllocateRewards(users, amounts);
        vm.stopPrank();
        
        assertEq(staking.getPendingRewards(staker1), allocation1);
        assertEq(staking.getPendingRewards(staker2), allocation2);
        assertEq(staking.getPendingRewards(staker3), allocation3);
        assertEq(staking.totalRewardsDistributed(), allocation1 + allocation2 + allocation3);
    }
    
    function test_ClaimRewards() public {
        uint256 rewardAmount = 5000 ether;
        uint256 allocation = 1000 ether;
        
        // Setup rewards
        vm.startPrank(owner);
        emberToken.approve(address(staking), rewardAmount);
        staking.depositRewards(rewardAmount);
        staking.allocateRewards(staker1, allocation);
        vm.stopPrank();
        
        uint256 balanceBefore = emberToken.balanceOf(staker1);
        
        vm.prank(staker1);
        vm.expectEmit(true, false, false, true);
        emit RewardsClaimed(staker1, allocation, block.timestamp);
        staking.claimRewards();
        
        assertEq(staking.getPendingRewards(staker1), 0);
        assertEq(staking.totalRewardsClaimed(), allocation);
        assertEq(emberToken.balanceOf(staker1), balanceBefore + allocation);
    }
    
    function test_ClaimRewards_RevertIf_NoRewards() public {
        vm.prank(staker1);
        vm.expectRevert(BaibelStaking.NoRewardsToClaim.selector);
        staking.claimRewards();
    }
    
    // ============ Integration Tests ============
    
    function test_FullFlow_StakeAndClaim() public {
        uint256 stakeAmount = 1000 ether;
        uint256 rewardAmount = 500 ether;
        
        // Stake
        vm.startPrank(staker1);
        emberToken.approve(address(staking), stakeAmount);
        staking.stake(COLLECTION_1, stakeAmount);
        vm.stopPrank();
        
        // Owner deposits and allocates rewards
        vm.startPrank(owner);
        emberToken.approve(address(staking), rewardAmount);
        staking.depositRewards(rewardAmount);
        staking.allocateRewards(staker1, rewardAmount);
        vm.stopPrank();
        
        // Staker claims
        uint256 balanceBefore = emberToken.balanceOf(staker1);
        vm.prank(staker1);
        staking.claimRewards();
        
        // Verify: should have original balance (rewards compensate for staked amount staying in contract)
        // Actually they still have stake in contract, so balance = original - stake + rewards
        assertEq(emberToken.balanceOf(staker1), balanceBefore + rewardAmount);
        
        // Unstake
        vm.prank(staker1);
        staking.unstake(COLLECTION_1);
        
        // Verify full withdrawal
        assertEq(emberToken.balanceOf(staker1), 10_000 ether + rewardAmount);
    }
    
    function test_MultipleStakers_OneCollection() public {
        uint256 stake1 = 1000 ether;
        uint256 stake2 = 2000 ether;
        uint256 stake3 = 3000 ether;
        uint256 totalStake = stake1 + stake2 + stake3;
        
        // All stake on same collection
        vm.startPrank(staker1);
        emberToken.approve(address(staking), stake1);
        staking.stake(COLLECTION_1, stake1);
        vm.stopPrank();
        
        vm.startPrank(staker2);
        emberToken.approve(address(staking), stake2);
        staking.stake(COLLECTION_1, stake2);
        vm.stopPrank();
        
        vm.startPrank(staker3);
        emberToken.approve(address(staking), stake3);
        staking.stake(COLLECTION_1, stake3);
        vm.stopPrank();
        
        assertEq(staking.getTotalStaked(COLLECTION_1), totalStake);
        assertEq(staking.totalStaked(), totalStake);
        
        // Allocate proportional rewards
        uint256 rewardAmount = 6000 ether;
        vm.startPrank(owner);
        emberToken.approve(address(staking), rewardAmount);
        staking.depositRewards(rewardAmount);
        
        // 1:2:3 ratio
        staking.allocateRewards(staker1, 1000 ether);
        staking.allocateRewards(staker2, 2000 ether);
        staking.allocateRewards(staker3, 3000 ether);
        vm.stopPrank();
        
        // All claim and unstake
        vm.startPrank(staker1);
        staking.claimRewards();
        staking.unstake(COLLECTION_1);
        vm.stopPrank();
        
        vm.startPrank(staker2);
        staking.claimRewards();
        staking.unstake(COLLECTION_1);
        vm.stopPrank();
        
        vm.startPrank(staker3);
        staking.claimRewards();
        staking.unstake(COLLECTION_1);
        vm.stopPrank();
        
        // Verify final balances (original + rewards)
        assertEq(emberToken.balanceOf(staker1), 10_000 ether + 1000 ether);
        assertEq(emberToken.balanceOf(staker2), 10_000 ether + 2000 ether);
        assertEq(emberToken.balanceOf(staker3), 10_000 ether + 3000 ether);
        assertEq(emberToken.balanceOf(address(staking)), 0);
    }
    
    // ============ Access Control Tests ============
    
    function test_DepositRewards_RevertIf_NotOwner() public {
        vm.startPrank(staker1);
        emberToken.approve(address(staking), 1000 ether);
        
        vm.expectRevert();
        staking.depositRewards(1000 ether);
        vm.stopPrank();
    }
    
    function test_AllocateRewards_RevertIf_NotOwner() public {
        // First deposit as owner
        vm.startPrank(owner);
        emberToken.approve(address(staking), 5000 ether);
        staking.depositRewards(5000 ether);
        vm.stopPrank();
        
        // Try to allocate as non-owner
        vm.prank(staker1);
        vm.expectRevert();
        staking.allocateRewards(staker2, 1000 ether);
    }
    
    // ============ Edge Cases ============
    
    function test_ReentrancyProtection_Stake() public {
        // This is a basic check - full reentrancy tests would need a malicious contract
        uint256 stakeAmount = 1000 ether;
        
        vm.startPrank(staker1);
        emberToken.approve(address(staking), stakeAmount);
        staking.stake(COLLECTION_1, stakeAmount);
        vm.stopPrank();
        
        // Verify state is correct
        assertEq(staking.getTotalStaked(COLLECTION_1), stakeAmount);
    }
    
    function test_Constructor_RevertIf_ZeroToken() public {
        vm.expectRevert(BaibelStaking.InvalidToken.selector);
        new BaibelStaking(address(0), address(registry));
    }
    
    function test_Constructor_RevertIf_ZeroRegistry() public {
        vm.expectRevert(BaibelStaking.InvalidRegistry.selector);
        new BaibelStaking(address(emberToken), address(0));
    }
    
    function test_BatchAllocateRewards_RevertIf_ArrayLengthMismatch() public {
        vm.startPrank(owner);
        emberToken.approve(address(staking), 5000 ether);
        staking.depositRewards(5000 ether);
        
        address[] memory users = new address[](2);
        users[0] = staker1;
        users[1] = staker2;
        
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1000 ether;
        
        vm.expectRevert(BaibelStaking.RewardDepositFailed.selector);
        staking.batchAllocateRewards(users, amounts);
        vm.stopPrank();
    }
    
    function test_AllocateRewards_RevertIf_ExceedsAvailable() public {
        vm.startPrank(owner);
        emberToken.approve(address(staking), 1000 ether);
        staking.depositRewards(1000 ether);
        
        vm.expectRevert(BaibelStaking.RewardDepositFailed.selector);
        staking.allocateRewards(staker1, 2000 ether);
        vm.stopPrank();
    }
}