import chalk from 'chalk';
import ora from 'ora';
import fetch from 'node-fetch';
import { isQmdAvailable, runQmdQuery, listQmdCollections } from '../lib/qmd.js';
import { getCollectionPath } from '../config/paths.js';
import { fileExists, readJson } from '../utils/fs.js';
import type { Manifest, SearchResult } from '../types.js';

interface SearchOptions {
  collection?: string;
  category?: string;
  limit?: string;
}

const DEFAULT_REGISTRY = 'https://api.agentlib.xyz';
const DEFAULT_LIMIT = 20;

/**
 * Search across collections
 * First tries local qmd search, falls back to API search if not available
 */
export async function searchCollections(query: string, options: SearchOptions = {}): Promise<void> {
  const limit = parseInt(options.limit || String(DEFAULT_LIMIT), 10);
  
  console.log(chalk.blue(`\n🔍 Searching for: "${query}"\n`));

  // Try local qmd search first
  const qmdAvailable = await isQmdAvailable();
  
  if (qmdAvailable) {
    const spinner = ora('Searching local index...').start();
    
    try {
      // Check if we have local collections
      const localCollections = await listQmdCollections();
      
      if (localCollections.length === 0) {
        spinner.warn('No local collections indexed');
        console.log(chalk.gray('Falling back to API search...\n'));
        await searchViaApi(query, options);
        return;
      }
      
      // Check if specific collection is requested and available locally
      if (options.collection) {
        const collectionPath = getCollectionPath(options.collection);
        const hasLocal = await fileExists(collectionPath);
        
        if (!hasLocal) {
          spinner.text = 'Collection not available locally, searching API...';
          await searchViaApi(query, options);
          return;
        }
      }
      
      spinner.succeed('Found local collections');
      
      // Perform qmd search
      const searchSpinner = ora('Searching local index with qmd...').start();
      
      try {
        const { stdout } = await runQmdQuery(query, options.collection);
        searchSpinner.succeed('Search complete');
        
        // Parse and display results
        displayQmdResults(stdout, query);
        return;
      } catch (error) {
        searchSpinner.fail('Local search failed');
        console.log(chalk.gray('Falling back to API search...\n'));
      }
    } catch {
      spinner.warn('Local search unavailable');
    }
  }
  
  // Fallback to API search
  await searchViaApi(query, options);
}

/**
 * Search via API
 */
async function searchViaApi(query: string, options: SearchOptions): Promise<void> {
  const limit = parseInt(options.limit || String(DEFAULT_LIMIT), 10);
  const registryUrl = process.env.BAIBEL_REGISTRY || DEFAULT_REGISTRY;
  
  const spinner = ora('Searching registry...').start();
  
  try {
    const searchParams = new URLSearchParams();
    searchParams.set('q', query);
    searchParams.set('limit', String(limit));
    
    if (options.collection) {
      searchParams.set('collection', options.collection);
    }
    
    if (options.category) {
      searchParams.set('category', options.category);
    }
    
    const response = await fetch(`${registryUrl}/api/search?${searchParams.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as { error: string };
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json() as {
      query: string;
      results: SearchResult[];
      total: number;
      cacheStatus: string;
    };
    
    spinner.succeed(`Found ${data.total} results`);
    
    displayApiResults(data.results, data.total, query);
  } catch (error) {
    spinner.fail('Search failed');
    console.error(chalk.red(`\n❌ ${error}`));
    process.exit(1);
  }
}

/**
 * Display qmd search results
 */
function displayQmdResults(output: string, query: string): void {
  const lines = output.trim().split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    console.log(chalk.yellow(`\nNo results found for "${query}"`));
    console.log(chalk.gray('\nTry:'));
    console.log(chalk.gray('  • Using different keywords'));
    console.log(chalk.gray('  • Checking your spelling'));
    console.log(chalk.gray('  • Pulling more collections with baibel pull'));
    return;
  }
  
  console.log(chalk.bold(`\nSearch Results (${lines.length} found):\n`));
  
  for (const line of lines.slice(0, 20)) {
    // Try to parse qmd output format
    // Expected: path/to/file.md:line:score or similar
    const match = line.match(/^(.+?):(\d+):?\s*(.*)$/);
    
    if (match) {
      const [, filePath, lineNum, content] = match;
      const collectionMatch = filePath.match(/collections\/([^/]+)/);
      const collectionName = collectionMatch ? collectionMatch[1] : 'unknown';
      
      console.log(`  ${chalk.green('●')} ${chalk.bold(filePath.split('/').pop() || 'unknown')}`);
      console.log(`    ${chalk.gray(`Collection: ${collectionName}`)}`);
      if (content) {
        console.log(`    ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
      }
      console.log(`    ${chalk.cyan(`Line ${lineNum}`)}`);
    } else {
      console.log(`  ${chalk.gray('•')} ${line}`);
    }
    console.log();
  }
  
  if (lines.length > 20) {
    console.log(chalk.gray(`  ... and ${lines.length - 20} more results`));
    console.log(chalk.gray(`  Use --limit to see more results`));
  }
}

/**
 * Display API search results
 */
function displayApiResults(results: SearchResult[], total: number, query: string): void {
  if (results.length === 0) {
    console.log(chalk.yellow(`\nNo results found for "${query}"`));
    console.log(chalk.gray('\nTry:'));
    console.log(chalk.gray('  • Using different keywords'));
    console.log(chalk.gray('  • Checking your spelling'));
    console.log(chalk.gray('  • Browsing available collections with baibel browse'));
    return;
  }
  
  console.log(chalk.bold(`\nSearch Results (${total} total):\n`));
  
  for (const result of results) {
    console.log(`  ${chalk.green('●')} ${chalk.bold(result.title)}`);
    console.log(`    ${chalk.gray(`Collection: ${result.collectionId}`)}`);
    console.log(`    ${chalk.gray(`Category: ${result.category}`)}`);
    
    if (result.excerpt) {
      const excerpt = result.excerpt.length > 150 
        ? result.excerpt.substring(0, 150) + '...' 
        : result.excerpt;
      console.log(`    ${excerpt}`);
    }
    
    if (result.score) {
      const scorePercent = Math.round(result.score * 100);
      console.log(`    ${chalk.cyan(`Relevance: ${scorePercent}%`)}`);
    }
    
    console.log(`    ${chalk.blue(`ID: ${result.docId}`)}`);
    console.log();
  }
  
  if (total > results.length) {
    console.log(chalk.gray(`  ... and ${total - results.length} more results`));
    console.log(chalk.gray(`  Use --limit to see more results`));
  }
}
