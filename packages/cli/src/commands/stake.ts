import chalk from 'chalk';
import ora from 'ora';
import { parseEther, formatEther } from 'viem';
import {
  getPublicClient,
  getWalletClient,
  getWalletAddress,
  getNetworkConfig,
  BAIBEL_STAKING_ABI,
  ERC20_ABI,
} from '../lib/contracts.js';

interface StakeOptions {
  wallet?: string;
}

interface UnstakeOptions {
  wallet?: string;
}

/**
 * Stake EMBER tokens on a collection
 */
export async function stakeOnCollection(
  collectionId: string,
  amount: string,
  options: StakeOptions
): Promise<void> {
  // Validate amount
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    console.error(chalk.red('❌ Amount must be a positive number'));
    process.exit(1);
  }

  // Get wallet private key
  const privateKey = options.wallet || process.env.EMBER_WALLET_KEY;
  
  if (!privateKey) {
    console.error(chalk.red('❌ No wallet key provided'));
    console.log(chalk.gray('\nOptions:'));
    console.log(chalk.gray('  1. Use --wallet flag with private key'));
    console.log(chalk.gray('  2. Set EMBER_WALLET_KEY environment variable'));
    process.exit(1);
  }

  const config = getNetworkConfig();
  const walletAddress = getWalletAddress(privateKey);
  
  console.log(chalk.blue(`\n🔒 Stake on Collection\n`));
  console.log(chalk.gray(`Collection: ${collectionId}`));
  console.log(chalk.gray(`Amount: ${amount} EMBER`));
  console.log(chalk.gray(`Network: ${config.chain.name}`));
  console.log(chalk.gray(`Wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`));
  console.log();

  const spinner = ora('Preparing stake...').start();

  try {
    const publicClient = getPublicClient();
    const walletClient = getWalletClient(privateKey);

    const stakingAddress = config.contracts.baibelStaking;
    const tokenAddress = config.contracts.mockEmber;
    const stakeAmount = parseEther(amount);

    // Check token balance
    const balance = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [walletAddress],
    });

    if (balance < stakeAmount) {
      spinner.fail('Insufficient EMBER balance');
      console.error(chalk.red(`\n❌ Your balance (${formatEther(balance)} EMBER) is less than stake amount (${amount} EMBER)`));
      
      // If on testnet, suggest minting
      if (config.chain.id === 84532) { // baseSepolia chain id
        console.log(chalk.gray('\nOn testnet? Mint some test EMBER from the contract.'));
      }
      
      process.exit(1);
    }

    // Check current allowance
    spinner.text = 'Checking token allowance...';
    
    const currentAllowance = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [walletAddress, stakingAddress],
    });

    // Approve if needed
    if (currentAllowance < stakeAmount) {
      spinner.text = 'Approving token transfer...';
      
      const approveHash = await walletClient.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [stakingAddress, stakeAmount],
      });

      spinner.text = 'Waiting for approval confirmation...';
      const approveReceipt = await publicClient.waitForTransactionReceipt({ hash: approveHash });

      if (approveReceipt.status !== 'success') {
        spinner.fail('Token approval failed');
        console.error(chalk.red('\n❌ Failed to approve token transfer'));
        process.exit(1);
      }
      
      spinner.succeed('Token approved');
      spinner.start('Staking tokens...');
    } else {
      spinner.text = 'Token already approved, staking...';
    }

    // Stake tokens
    const stakeHash = await walletClient.writeContract({
      address: stakingAddress as `0x${string}`,
      abi: BAIBEL_STAKING_ABI,
      functionName: 'stake',
      args: [collectionId, stakeAmount],
    });

    spinner.text = 'Waiting for stake confirmation...';
    const stakeReceipt = await publicClient.waitForTransactionReceipt({ hash: stakeHash });

    if (stakeReceipt.status === 'success') {
      spinner.succeed('Tokens staked successfully!');
      
      console.log(chalk.green(`\n✅ Staked ${amount} EMBER on ${collectionId}`));
      console.log(chalk.gray(`Transaction: ${stakeHash}`));
      console.log(chalk.gray(`Block: ${stakeReceipt.blockNumber}`));
      
      // Show updated stake info
      const stake = await publicClient.readContract({
        address: stakingAddress as `0x${string}`,
        abi: BAIBEL_STAKING_ABI,
        functionName: 'getStake',
        args: [collectionId, walletAddress],
      });
      
      console.log();
      console.log(chalk.cyan(`Your stake on this collection: ${formatEther(stake.amount)} EMBER`));
    } else {
      spinner.fail('Stake transaction failed');
      console.error(chalk.red(`\n❌ Stake failed on-chain`));
      console.log(chalk.gray(`Transaction: ${stakeHash}`));
      process.exit(1);
    }
  } catch (error) {
    spinner.fail('Failed to stake');
    
    if (error instanceof Error) {
      if (error.message.includes('CollectionNotFound')) {
        console.error(chalk.red('\n❌ Collection not found in registry'));
      } else if (error.message.includes('ZeroAmount')) {
        console.error(chalk.red('\n❌ Stake amount must be greater than 0'));
      } else if (error.message.includes('insufficient funds')) {
        console.error(chalk.red('\n❌ Insufficient ETH for gas'));
      } else {
        console.error(chalk.red(`\n❌ ${error.message}`));
      }
    } else {
      console.error(chalk.red('\n❌ Unknown error occurred'));
    }
    
    process.exit(1);
  }
}

/**
 * Unstake EMBER tokens from a collection
 */
export async function unstakeFromCollection(
  collectionId: string,
  options: UnstakeOptions
): Promise<void> {
  // Get wallet private key
  const privateKey = options.wallet || process.env.EMBER_WALLET_KEY;
  
  if (!privateKey) {
    console.error(chalk.red('❌ No wallet key provided'));
    console.log(chalk.gray('\nOptions:'));
    console.log(chalk.gray('  1. Use --wallet flag with private key'));
    console.log(chalk.gray('  2. Set EMBER_WALLET_KEY environment variable'));
    process.exit(1);
  }

  const config = getNetworkConfig();
  const walletAddress = getWalletAddress(privateKey);
  
  console.log(chalk.blue(`\n🔓 Unstake from Collection\n`));
  console.log(chalk.gray(`Collection: ${collectionId}`));
  console.log(chalk.gray(`Network: ${config.chain.name}`));
  console.log(chalk.gray(`Wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`));
  console.log();

  const spinner = ora('Checking stake...').start();

  try {
    const publicClient = getPublicClient();
    const walletClient = getWalletClient(privateKey);

    const stakingAddress = config.contracts.baibelStaking;

    // Get current stake
    const stake = await publicClient.readContract({
      address: stakingAddress as `0x${string}`,
      abi: BAIBEL_STAKING_ABI,
      functionName: 'getStake',
      args: [collectionId, walletAddress],
    });

    if (stake.amount === 0n) {
      spinner.fail('No active stake found');
      console.error(chalk.red(`\n❌ You have no staked tokens on "${collectionId}"`));
      console.log(chalk.gray('Use `baibel stake` to stake tokens on this collection.'));
      process.exit(1);
    }

    spinner.text = `Unstaking ${formatEther(stake.amount)} EMBER...`;

    // Unstake tokens
    const unstakeHash = await walletClient.writeContract({
      address: stakingAddress as `0x${string}`,
      abi: BAIBEL_STAKING_ABI,
      functionName: 'unstake',
      args: [collectionId],
    });

    spinner.text = 'Waiting for confirmation...';
    const receipt = await publicClient.waitForTransactionReceipt({ hash: unstakeHash });

    if (receipt.status === 'success') {
      spinner.succeed('Tokens unstaked successfully!');
      
      console.log(chalk.green(`\n✅ Unstaked ${formatEther(stake.amount)} EMBER from ${collectionId}`));
      console.log(chalk.gray(`Transaction: ${unstakeHash}`));
      console.log(chalk.gray(`Block: ${receipt.blockNumber}`));
      
      // Show pending rewards if any
      try {
        const pendingRewards = await publicClient.readContract({
          address: stakingAddress as `0x${string}`,
          abi: BAIBEL_STAKING_ABI,
          functionName: 'getPendingRewards',
          args: [walletAddress],
        });
        
        if (pendingRewards > 0n) {
          console.log();
          console.log(chalk.cyan(`You have ${formatEther(pendingRewards)} EMBER in pending rewards!`));
          console.log(chalk.gray(`Claim with: baibel claim-rewards`));
        }
      } catch {
        // Ignore reward check errors
      }
    } else {
      spinner.fail('Unstake transaction failed');
      console.error(chalk.red(`\n❌ Unstake failed on-chain`));
      console.log(chalk.gray(`Transaction: ${unstakeHash}`));
      process.exit(1);
    }
  } catch (error) {
    spinner.fail('Failed to unstake');
    
    if (error instanceof Error) {
      if (error.message.includes('NoActiveStake')) {
        console.error(chalk.red('\n❌ No active stake found for this collection'));
      } else if (error.message.includes('CollectionNotFound')) {
        console.error(chalk.red('\n❌ Collection not found in registry'));
      } else if (error.message.includes('insufficient funds')) {
        console.error(chalk.red('\n❌ Insufficient ETH for gas'));
      } else {
        console.error(chalk.red(`\n❌ ${error.message}`));
      }
    } else {
      console.error(chalk.red('\n❌ Unknown error occurred'));
    }
    
    process.exit(1);
  }
}

/**
 * Show staking info for a collection
 */
export async function showStakingInfo(
  collectionId: string
): Promise<void> {
  console.log(chalk.blue(`\n🔒 Staking Info\n`));
  console.log(chalk.gray(`Collection: ${collectionId}`));
  console.log();

  const spinner = ora('Fetching on-chain data...').start();

  try {
    const publicClient = getPublicClient();
    const config = getNetworkConfig();
    const stakingAddress = config.contracts.baibelStaking;

    // Get total staked on collection
    const totalStaked = await publicClient.readContract({
      address: stakingAddress as `0x${string}`,
      abi: BAIBEL_STAKING_ABI,
      functionName: 'getTotalStaked',
      args: [collectionId],
    });

    spinner.succeed('Fetched staking data');

    console.log(chalk.bold('Collection Staking Stats:\n'));
    console.log(`  Total Staked: ${chalk.yellow(formatEther(totalStaked))} EMBER`);
    console.log();
    console.log(chalk.gray('To view your personal stake, provide a wallet key.'));
    console.log(chalk.gray('  baibel stake-info ' + collectionId + ' --wallet <key>'));
  } catch (error) {
    spinner.fail('Failed to fetch staking data');
    
    if (error instanceof Error) {
      console.error(chalk.red(`\n❌ ${error.message}`));
    } else {
      console.error(chalk.red('\n❌ Unknown error occurred'));
    }
    
    process.exit(1);
  }
}
