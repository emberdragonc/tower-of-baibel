import chalk from 'chalk';
import ora from 'ora';
import { formatEther } from 'viem';
import {
  getPublicClient,
  getNetworkConfig,
  BAIBEL_REGISTRY_ABI,
  BAIBEL_STAKING_ABI,
} from '../lib/contracts.js';

interface InfoOptions {
  wallet?: string;
}

/**
 * Show on-chain info for a collection
 */
export async function showCollectionInfo(
  collectionId: string,
  options: InfoOptions
): Promise<void> {
  console.log(chalk.blue(`\n📊 Collection On-Chain Info\n`));
  console.log(chalk.gray(`Collection: ${collectionId}`));
  console.log();

  const spinner = ora('Fetching on-chain data...').start();

  try {
    const publicClient = getPublicClient();
    const config = getNetworkConfig();

    const registryAddress = config.contracts.baibelRegistry;
    const stakingAddress = config.contracts.baibelStaking;

    // Check if collection exists
    const exists = await publicClient.readContract({
      address: registryAddress as `0x${string}`,
      abi: BAIBEL_REGISTRY_ABI,
      functionName: 'doesCollectionExist',
      args: [collectionId],
    });

    if (!exists) {
      spinner.fail('Collection not found');
      console.error(chalk.red(`\n❌ Collection "${collectionId}" does not exist in the registry`));
      console.log(chalk.gray('\nThis collection may not be registered on-chain yet.'));
      console.log(chalk.gray('Browse available collections with: baibel browse'));
      process.exit(1);
    }

    // Fetch registry data
    const [
      collection,
      avgRating,
      ratingCount,
      attestations,
    ] = await Promise.all([
      publicClient.readContract({
        address: registryAddress as `0x${string}`,
        abi: BAIBEL_REGISTRY_ABI,
        functionName: 'getCollection',
        args: [collectionId],
      }),
      publicClient.readContract({
        address: registryAddress as `0x${string}`,
        abi: BAIBEL_REGISTRY_ABI,
        functionName: 'getAverageRating',
        args: [collectionId],
      }),
      publicClient.readContract({
        address: registryAddress as `0x${string}`,
        abi: BAIBEL_REGISTRY_ABI,
        functionName: 'getRatingCount',
        args: [collectionId],
      }),
      publicClient.readContract({
        address: registryAddress as `0x${string}`,
        abi: BAIBEL_REGISTRY_ABI,
        functionName: 'getAttestations',
        args: [collectionId],
      }),
    ]);

    // Fetch staking data
    let totalStaked = 0n;
    try {
      totalStaked = await publicClient.readContract({
        address: stakingAddress as `0x${string}`,
        abi: BAIBEL_STAKING_ABI,
        functionName: 'getTotalStaked',
        args: [collectionId],
      });
    } catch {
      // Staking may not be available
    }

    spinner.succeed('Fetched on-chain data');

    // Display collection info
    console.log(chalk.bold('📦 Collection Details\n'));
    console.log(`  Name: ${chalk.cyan(collection.name)}`);
    console.log(`  ID: ${chalk.gray(collection.id)}`);
    console.log(`  Version: ${collection.version}`);
    console.log(`  Author: ${chalk.gray(`${collection.author.slice(0, 6)}...${collection.author.slice(-4)}`)}`);
    console.log(`  Documents: ${collection.docCount}`);
    console.log(`  IPFS Hash: ${chalk.gray(collection.ipfsHash.substring(0, 20) + '...')}`);
    console.log(`  Created: ${new Date(Number(collection.createdAt) * 1000).toLocaleDateString()}`);
    if (collection.updatedAt > collection.createdAt) {
      console.log(`  Updated: ${new Date(Number(collection.updatedAt) * 1000).toLocaleDateString()}`);
    }
    console.log();

    // Display rating info
    console.log(chalk.bold('⭐ Rating Stats\n'));
    
    const ratingValue = Number(avgRating) / 100; // Contract stores rating * 100 for precision
    const fullStars = Math.round(ratingValue);
    const emptyStars = 5 - fullStars;
    
    console.log(`  Average: ${chalk.yellow('★'.repeat(fullStars) + '☆'.repeat(emptyStars))} ${ratingValue.toFixed(2)}/5`);
    console.log(`  Total Ratings: ${chalk.cyan(ratingCount.toString())}`);
    console.log();

    // Display staking info
    console.log(chalk.bold('🔒 Staking Stats\n'));
    console.log(`  Total Staked: ${chalk.yellow(formatEther(totalStaked))} EMBER`);
    console.log();

    // Display recent attestations
    if (attestations.length > 0) {
      console.log(chalk.bold('📝 Recent Reviews\n'));
      
      // Show last 5 attestations
      const recentAttestations = attestations.slice(-5).reverse();
      
      for (const attestation of recentAttestations) {
        const rater = `${attestation.rater.slice(0, 6)}...${attestation.rater.slice(-4)}`;
        const stars = '★'.repeat(attestation.rating) + '☆'.repeat(5 - attestation.rating);
        const date = new Date(Number(attestation.timestamp) * 1000).toLocaleDateString();
        
        console.log(`  ${chalk.gray(rater)} ${chalk.yellow(stars)} ${chalk.gray(date)}`);
        if (attestation.review) {
          const review = attestation.review.length > 60 
            ? attestation.review.substring(0, 60) + '...' 
            : attestation.review;
          console.log(`  "${chalk.italic(review)}"`);
        }
        console.log();
      }
    }

    // Show commands
    console.log(chalk.gray('Commands:'));
    console.log(chalk.gray(`  baibel rate ${collectionId} <rating> --review "text"`));
    console.log(chalk.gray(`  baibel stake ${collectionId} <amount>`));
    console.log(chalk.gray(`  baibel unstake ${collectionId}`));
    console.log();

  } catch (error) {
    spinner.fail('Failed to fetch collection info');
    
    if (error instanceof Error) {
      console.error(chalk.red(`\n❌ ${error.message}`));
    } else {
      console.error(chalk.red('\n❌ Unknown error occurred'));
    }
    
    process.exit(1);
  }
}
