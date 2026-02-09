import chalk from 'chalk';
import ora from 'ora';
import {
  getPublicClient,
  getWalletClient,
  getWalletAddress,
  getNetworkConfig,
  BAIBEL_REGISTRY_ABI,
} from '../lib/contracts.js';

interface RateOptions {
  wallet?: string;
  review?: string;
}

/**
 * Rate a collection on-chain
 */
export async function rateCollection(
  collectionId: string,
  rating: number,
  options: RateOptions
): Promise<void> {
  // Validate rating
  if (rating < 1 || rating > 5) {
    console.error(chalk.red('❌ Rating must be between 1 and 5'));
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
  
  console.log(chalk.blue(`\n⭐ Rating Collection\n`));
  console.log(chalk.gray(`Collection: ${collectionId}`));
  console.log(chalk.gray(`Rating: ${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5)`));
  if (options.review) {
    console.log(chalk.gray(`Review: "${options.review}"`));
  }
  console.log(chalk.gray(`Network: ${config.chain.name}`));
  console.log(chalk.gray(`Wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`));
  console.log();

  const spinner = ora('Submitting attestation on-chain...').start();

  try {
    const publicClient = getPublicClient();
    const walletClient = getWalletClient(privateKey);

    // Check if collection exists
    const exists = await publicClient.readContract({
      address: config.contracts.baibelRegistry as `0x${string}`,
      abi: BAIBEL_REGISTRY_ABI,
      functionName: 'doesCollectionExist',
      args: [collectionId],
    });

    if (!exists) {
      spinner.fail('Collection not found');
      console.error(chalk.red(`\n❌ Collection "${collectionId}" does not exist in the registry`));
      console.log(chalk.gray('\nYou can only rate registered collections.'));
      console.log(chalk.gray('Browse available collections with: baibel browse'));
      process.exit(1);
    }

    // Check if user already rated
    const hasAttested = await publicClient.readContract({
      address: config.contracts.baibelRegistry as `0x${string}`,
      abi: BAIBEL_REGISTRY_ABI,
      functionName: 'hasUserAttested',
      args: [collectionId, walletAddress],
    });

    if (hasAttested) {
      spinner.warn('You have already rated this collection');
      console.log(chalk.yellow('\n⚠️  You can only submit one rating per collection.'));
      console.log(chalk.gray('Your previous rating will be overwritten with this new one.'));
      
      // Get previous attestation
      const prevAttestation = await publicClient.readContract({
        address: config.contracts.baibelRegistry as `0x${string}`,
        abi: BAIBEL_REGISTRY_ABI,
        functionName: 'getAttestation',
        args: [collectionId, walletAddress],
      });
      
      console.log(chalk.gray(`Previous: ${prevAttestation.rating}/5`));
      if (prevAttestation.review) {
        console.log(chalk.gray(`Review: "${prevAttestation.review}"`));
      }
      console.log();
    }

    // Submit attestation
    spinner.text = 'Sending transaction...';
    
    const reviewText = options.review || '';
    
    const hash = await walletClient.writeContract({
      address: config.contracts.baibelRegistry as `0x${string}`,
      abi: BAIBEL_REGISTRY_ABI,
      functionName: 'submitAttestation',
      args: [collectionId, rating, reviewText],
    });

    spinner.text = 'Waiting for confirmation...';

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      spinner.succeed('Attestation submitted successfully!');
      
      console.log(chalk.green(`\n✅ Collection rated on-chain`));
      console.log(chalk.gray(`Transaction: ${hash}`));
      console.log(chalk.gray(`Block: ${receipt.blockNumber}`));
      console.log();
      console.log(chalk.cyan(`Your rating helps other agents find quality collections!`));
    } else {
      spinner.fail('Transaction failed');
      console.error(chalk.red(`\n❌ Transaction failed on-chain`));
      console.log(chalk.gray(`Transaction: ${hash}`));
      process.exit(1);
    }
  } catch (error) {
    spinner.fail('Failed to submit attestation');
    
    if (error instanceof Error) {
      // Handle specific error cases
      if (error.message.includes('SelfRatingNotAllowed')) {
        console.error(chalk.red('\n❌ You cannot rate your own collection'));
      } else if (error.message.includes('InvalidRating')) {
        console.error(chalk.red('\n❌ Invalid rating value'));
      } else if (error.message.includes('CollectionNotFound')) {
        console.error(chalk.red('\n❌ Collection not found in registry'));
      } else if (error.message.includes('insufficient funds')) {
        console.error(chalk.red('\n❌ Insufficient funds for gas'));
        console.log(chalk.gray('Make sure your wallet has ETH for transaction fees'));
      } else {
        console.error(chalk.red(`\n❌ ${error.message}`));
      }
    } else {
      console.error(chalk.red('\n❌ Unknown error occurred'));
    }
    
    process.exit(1);
  }
}
