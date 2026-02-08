import { writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import chalk from 'chalk';
import ora from 'ora';
import fetch from 'node-fetch';
import { getCollectionPath, getCollectionDocsPath, BAIBEL_HOME } from '../config/paths.js';
import { downloadFromIPFS } from '../lib/ipfs.js';
import { runQmdCollectionAdd, runQmdUpdate, isQmdAvailable } from '../lib/qmd.js';
import { ensureDir, fileExists, writeJson } from '../utils/fs.js';
import type { Manifest, CollectionMetadata } from '../types.js';

interface PullOptions {
  registry?: string;
  force?: boolean;
}

const DEFAULT_REGISTRY = 'https://api.agentlib.xyz';

/**
 * Pull a collection from the registry and index it locally
 */
export async function pullCollection(collectionId: string, options: PullOptions = {}): Promise<void> {
  const collectionPath = getCollectionPath(collectionId);
  const docsPath = getCollectionDocsPath(collectionId);
  
  console.log(chalk.blue(`\n📥 Pulling collection: ${collectionId}\n`));

  // Check if already exists (unless force)
  if (!options.force) {
    const exists = await fileExists(join(collectionPath, 'manifest.json'));
    if (exists) {
      console.log(chalk.yellow(`Collection ${collectionId} is already installed.`));
      console.log(chalk.gray(`Use --force to re-download and re-index.`));
      return;
    }
  } else {
    console.log(chalk.yellow('Force mode: will re-download and re-index'));
  }

  // Step 1: Fetch collection metadata from API
  const registryUrl = options.registry || DEFAULT_REGISTRY;
  const metadataSpinner = ora('Fetching collection metadata...').start();
  
  let metadata: CollectionMetadata;
  try {
    const response = await fetch(`${registryUrl}/api/collections/${collectionId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Collection "${collectionId}" not found in registry`);
      }
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as { error: string };
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    metadata = await response.json() as CollectionMetadata;
    metadataSpinner.succeed(`Found collection: ${metadata.name} v${metadata.version}`);
  } catch (error) {
    metadataSpinner.fail('Failed to fetch collection metadata');
    console.error(chalk.red(`\n❌ ${error}`));
    process.exit(1);
  }

  // Step 2: Download from IPFS
  const downloadSpinner = ora(`Downloading from IPFS (${metadata.ipfsHash})...`).start();
  
  try {
    // Create collection directory
    await ensureDir(collectionPath);
    await ensureDir(docsPath);
    
    // Download content from IPFS
    const content = await downloadFromIPFS(metadata.ipfsHash);
    
    // For now, we assume the IPFS content is a tarball or we fetch individual files
    // In a real implementation, we'd need to handle IPFS directory structures
    // For this implementation, we'll fetch via the gateway URL which serves files
    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${metadata.ipfsHash}`;
    
    // Save manifest
    const manifest: Manifest = metadata.manifest || {
      name: metadata.name,
      version: metadata.version,
      description: metadata.description,
      author: metadata.author,
      docCount: metadata.docCount,
      docs: [],
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
    };
    
    await writeJson(join(collectionPath, 'manifest.json'), manifest);
    
    // Download docs if available in manifest
    if (manifest.docs && manifest.docs.length > 0) {
      for (const doc of manifest.docs) {
        const docUrl = `${gatewayUrl}/docs/${doc.path}`;
        try {
          const docResponse = await fetch(docUrl);
          if (docResponse.ok) {
            const docContent = await docResponse.text();
            const docPath = join(docsPath, doc.path);
            await ensureDir(resolve(docPath, '..'));
            await writeFile(docPath, docContent, 'utf-8');
          }
        } catch (docError) {
          console.warn(chalk.yellow(`Warning: Could not download ${doc.path}`));
        }
      }
    } else {
      // Try to fetch docs directory listing from IPFS
      try {
        const docsResponse = await fetch(`${gatewayUrl}/docs/`);
        if (docsResponse.ok) {
          downloadSpinner.text = 'Downloading docs from IPFS...';
          // Parse directory listing and download files
          // This is a simplified approach - real implementation would parse IPFS directory
        }
      } catch {
        // No docs available
      }
    }
    
    downloadSpinner.succeed('Downloaded collection files');
  } catch (error) {
    downloadSpinner.fail('Failed to download from IPFS');
    console.error(chalk.red(`\n❌ ${error}`));
    process.exit(1);
  }

  // Step 3: Index with qmd if available
  const qmdSpinner = ora('Indexing collection with qmd...').start();
  
  const qmdAvailable = await isQmdAvailable();
  
  if (!qmdAvailable) {
    qmdSpinner.warn('qmd not available, skipping local indexing');
    console.log(chalk.gray('Install qmd for local search: https://github.com/yourusername/qmd'));
  } else {
    try {
      // Add collection to qmd
      await runQmdCollectionAdd(collectionId, docsPath);
      
      // Update qmd index
      await runQmdUpdate();
      
      qmdSpinner.succeed('Indexed collection for local search');
    } catch (error) {
      qmdSpinner.fail('Failed to index with qmd');
      console.warn(chalk.yellow(`\n⚠️  ${error}`));
      console.log(chalk.gray('Collection is installed but not indexed for local search'));
    }
  }

  // Success output
  console.log(chalk.green('\n✅ Collection pulled successfully!\n'));
  console.log(chalk.white('Collection Details:'));
  console.log(chalk.gray(`  Name:        ${metadata.name}`));
  console.log(chalk.gray(`  Version:     ${metadata.version}`));
  console.log(chalk.gray(`  Author:      ${metadata.author}`));
  console.log(chalk.gray(`  Description: ${metadata.description}`));
  console.log(chalk.gray(`  Docs:        ${metadata.docCount}`));
  console.log();
  console.log(chalk.white('Local Path:'));
  console.log(chalk.gray(`  ${collectionPath}`));
  console.log();
  console.log(chalk.white('Next steps:'));
  console.log(chalk.gray(`  baibel list              # List all installed collections`));
  console.log(chalk.gray(`  baibel search "query"    # Search within collections`));
  console.log();
}
