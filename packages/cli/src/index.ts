#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { listCollections } from './commands/list.js';
import { pushCollection } from './commands/push.js';
import { pullCollection } from './commands/pull.js';
import { searchCollections } from './commands/search.js';
import { browseCollections } from './commands/browse.js';
import { rateCollection } from './commands/rate.js';
import { stakeOnCollection, unstakeFromCollection } from './commands/stake.js';
import { showCollectionInfo } from './commands/info.js';

const program = new Command();

program
  .name('baibel')
  .description('Tower of Baibel - Decentralized Agent Knowledge Base')
  .version('1.0.0');

program
  .command('list')
  .description('List installed local collections')
  .action(async () => {
    try {
      await listCollections();
    } catch (error) {
      console.error(chalk.red('Error listing collections:'), error);
      process.exit(1);
    }
  });

program
  .command('pull <collection>')
  .description('Download and index a collection')
  .option('-r, --registry <url>', 'Registry API URL')
  .option('-f, --force', 'Re-download even if cached')
  .action(async (collection: string, options: { registry?: string; force?: boolean }) => {
    try {
      await pullCollection(collection, options);
    } catch (error) {
      console.error(chalk.red('Error pulling collection:'), error);
      process.exit(1);
    }
  });

program
  .command('push <directory>')
  .description('Publish a directory as a collection')
  .option('--private', 'Do not publish to public registry')
  .option('--skip-validation', 'Skip manifest validation')
  .option('-r, --registry <url>', 'Registry API URL')
  .action(async (directory: string, options: { private?: boolean; skipValidation?: boolean; registry?: string }) => {
    try {
      await pushCollection(directory, options);
    } catch (error) {
      console.error(chalk.red('Error pushing collection:'), error);
      process.exit(1);
    }
  });

program
  .command('search <query>')
  .description('Search across installed collections')
  .option('-c, --collection <id>', 'Search within specific collection')
  .option('--category <cat>', 'Filter by category')
  .option('-l, --limit <n>', 'Max results', '20')
  .action(async (query: string, options: { collection?: string; category?: string; limit?: string }) => {
    try {
      await searchCollections(query, options);
    } catch (error) {
      console.error(chalk.red('Error searching collections:'), error);
      process.exit(1);
    }
  });

program
  .command('browse')
  .description('Browse top collections from registry')
  .option('--category <cat>', 'Filter by category')
  .option('--sort <quality|recent|popular>', 'Sort order', 'quality')
  .option('-l, --limit <n>', 'Max results', '20')
  .action(async (options: { category?: string; sort?: string; limit?: string }) => {
    try {
      await browseCollections(options);
    } catch (error) {
      console.error(chalk.red('Error browsing collections:'), error);
      process.exit(1);
    }
  });

program
  .command('rate <collection> <rating>')
  .description('Rate a collection 1-5 stars on-chain')
  .option('--review <text>', 'Optional review text')
  .option('-w, --wallet <key>', 'Wallet private key (or uses EMBER_WALLET_KEY env var)')
  .action(async (
    collection: string,
    rating: string,
    options: { review?: string; wallet?: string }
  ) => {
    try {
      const ratingNum = parseInt(rating, 10);
      await rateCollection(collection, ratingNum, options);
    } catch (error) {
      console.error(chalk.red('Error rating collection:'), error);
      process.exit(1);
    }
  });

program
  .command('stake <collection> <amount>')
  .description('Stake EMBER tokens on a collection')
  .option('-w, --wallet <key>', 'Wallet private key (or uses EMBER_WALLET_KEY env var)')
  .action(async (
    collection: string,
    amount: string,
    options: { wallet?: string }
  ) => {
    try {
      await stakeOnCollection(collection, amount, options);
    } catch (error) {
      console.error(chalk.red('Error staking:'), error);
      process.exit(1);
    }
  });

program
  .command('unstake <collection>')
  .description('Unstake EMBER tokens from a collection')
  .option('-w, --wallet <key>', 'Wallet private key (or uses EMBER_WALLET_KEY env var)')
  .action(async (
    collection: string,
    options: { wallet?: string }
  ) => {
    try {
      await unstakeFromCollection(collection, options);
    } catch (error) {
      console.error(chalk.red('Error unstaking:'), error);
      process.exit(1);
    }
  });

program
  .command('info <collection>')
  .description('Show on-chain info for a collection')
  .option('-w, --wallet <key>', 'Wallet private key (optional, for personal stake info)')
  .action(async (
    collection: string,
    options: { wallet?: string }
  ) => {
    try {
      await showCollectionInfo(collection, options);
    } catch (error) {
      console.error(chalk.red('Error fetching collection info:'), error);
      process.exit(1);
    }
  });

program.parse();
