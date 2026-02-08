import chalk from 'chalk';
import ora from 'ora';
import fetch from 'node-fetch';
import type { CollectionMetadata } from '../types.js';

interface BrowseOptions {
  category?: string;
  sort?: string;
  limit?: string;
}

const DEFAULT_REGISTRY = 'https://api.agentlib.xyz';
const DEFAULT_LIMIT = 20;

/**
 * Browse available collections from the registry
 */
export async function browseCollections(options: BrowseOptions = {}): Promise<void> {
  const limit = parseInt(options.limit || String(DEFAULT_LIMIT), 10);
  const sort = options.sort || 'quality';
  const registryUrl = process.env.BAIBEL_REGISTRY || DEFAULT_REGISTRY;
  
  console.log(chalk.blue(`\n📚 Browsing collections\n`));
  
  if (options.category) {
    console.log(chalk.gray(`Category: ${options.category}`));
  }
  console.log(chalk.gray(`Sort by: ${sort}`));
  console.log();

  const spinner = ora('Fetching collections from registry...').start();
  
  try {
    const searchParams = new URLSearchParams();
    searchParams.set('limit', String(limit));
    searchParams.set('sort', sort);
    
    if (options.category) {
      searchParams.set('category', options.category);
    }
    
    const response = await fetch(`${registryUrl}/api/collections?${searchParams.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as { error: string };
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json() as {
      collections: CollectionMetadata[];
      total: number;
      offset: number;
      limit: number;
      cacheStatus: string;
    };
    
    spinner.succeed(`Found ${data.total} collections`);
    
    displayCollections(data.collections, data.total, sort);
  } catch (error) {
    spinner.fail('Failed to fetch collections');
    console.error(chalk.red(`\n❌ ${error}`));
    console.log(chalk.gray('\nTroubleshooting:'));
    console.log(chalk.gray('  • Check your internet connection'));
    console.log(chalk.gray('  • Verify the registry URL is correct'));
    console.log(chalk.gray(`  • Current registry: ${registryUrl}`));
    console.log(chalk.gray('  • Set BAIBEL_REGISTRY env var to change registry'));
    process.exit(1);
  }
}

/**
 * Display collections in a formatted list
 */
function displayCollections(collections: CollectionMetadata[], total: number, sortBy: string): void {
  if (collections.length === 0) {
    console.log(chalk.yellow('\nNo collections found.'));
    console.log(chalk.gray('\nTry:'));
    console.log(chalk.gray('  • Removing category filter'));
    console.log(chalk.gray('  • Browsing all collections'));
    console.log(chalk.gray('  • Pushing your own collection with baibel push'));
    return;
  }
  
  console.log(chalk.bold(`\nAvailable Collections (${total} total):\n`));
  
  for (let i = 0; i < collections.length; i++) {
    const collection = collections[i];
    const rank = i + 1;
    
    // Collection header with rank
    const rankColor = rank <= 3 ? chalk.yellow : chalk.gray;
    console.log(`  ${rankColor(`${rank}.`)} ${chalk.bold(collection.name)} ${chalk.gray(`v${collection.version}`)}`);
    
    // Description
    if (collection.description) {
      const desc = collection.description.length > 80 
        ? collection.description.substring(0, 80) + '...' 
        : collection.description;
      console.log(`     ${desc}`);
    }
    
    // Stats row
    const stats: string[] = [];
    
    if (collection.qualityScore > 0) {
      const stars = '★'.repeat(Math.round(collection.qualityScore));
      const emptyStars = '☆'.repeat(5 - Math.round(collection.qualityScore));
      stats.push(`${chalk.yellow(stars + emptyStars)} ${collection.qualityScore.toFixed(1)}`);
    }
    
    if (collection.ratingCount > 0) {
      stats.push(`${collection.ratingCount} ratings`);
    }
    
    if (collection.docCount > 0) {
      stats.push(`${collection.docCount} docs`);
    }
    
    // Author (truncated)
    if (collection.author) {
      const shortAuthor = `${collection.author.slice(0, 6)}...${collection.author.slice(-4)}`;
      stats.push(`by ${shortAuthor}`);
    }
    
    if (stats.length > 0) {
      console.log(`     ${chalk.gray(stats.join(' · '))}`);
    }
    
    // Install hint
    console.log(`     ${chalk.cyan(`baibel pull ${collection.id || collection.name}`)}`);
    console.log();
  }
  
  // Footer
  if (total > collections.length) {
    console.log(chalk.gray(`  ... and ${total - collections.length} more collections`));
    console.log(chalk.gray(`  Use --limit to see more`));
  }
  
  console.log(chalk.gray(`\nSorted by: ${sortBy}`));
  console.log(chalk.gray('Sort options: quality | recent | popular'));
}
