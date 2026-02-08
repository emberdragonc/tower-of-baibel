import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import chalk from 'chalk';
import ora from 'ora';
import { validateManifest, getAllFiles } from '../lib/manifest.js';
import { uploadToIPFS, testPinataConnection } from '../lib/ipfs.js';
import type { Manifest } from '../types.js';

interface PushOptions {
  private?: boolean;
  skipValidation?: boolean;
  registry?: string;
}

const DEFAULT_REGISTRY = 'https://api.agentlib.xyz';

/**
 * Push a collection directory to the registry
 */
export async function pushCollection(directory: string, options: PushOptions = {}): Promise<void> {
  const dirPath = resolve(directory);
  
  console.log(chalk.blue(`\n📦 Preparing to push: ${dirPath}\n`));

  // Step 1: Validate manifest
  if (!options.skipValidation) {
    const spinner = ora('Validating manifest...').start();
    
    const validation = await validateManifest(dirPath);
    
    if (!validation.valid) {
      spinner.fail('Validation failed');
      console.error(chalk.red('\n❌ Errors:'));
      validation.errors.forEach(error => {
        console.error(chalk.red(`   • ${error}`));
      });
      process.exit(1);
    }
    
    spinner.succeed('Manifest valid');
  } else {
    console.log(chalk.yellow('⚠️  Skipping validation'));
  }

  // Step 2: Read manifest
  const manifestPath = join(dirPath, 'manifest.json');
  const manifestContent = await readFile(manifestPath, 'utf-8');
  const manifest: Manifest = JSON.parse(manifestContent);

  // Step 3: Check IPFS credentials
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataSecretKey = process.env.PINATA_SECRET_KEY;

  if (!pinataApiKey || !pinataSecretKey) {
    console.error(chalk.red('\n❌ Missing Pinata credentials'));
    console.error(chalk.gray('Set PINATA_API_KEY and PINATA_SECRET_KEY environment variables'));
    process.exit(1);
  }

  // Test Pinata connection
  const connectionSpinner = ora('Connecting to Pinata...').start();
  const connected = await testPinataConnection({ apiKey: pinataApiKey, secretKey: pinataSecretKey });
  
  if (!connected) {
    connectionSpinner.fail('Failed to connect to Pinata');
    console.error(chalk.red('Check your API credentials'));
    process.exit(1);
  }
  
  connectionSpinner.succeed('Connected to Pinata');

  // Step 4: Collect files for upload
  const collectSpinner = ora('Collecting files...').start();
  
  // Read all files from docs directory
  const docsPath = join(dirPath, 'docs');
  const docFiles = await getAllFiles(docsPath, 'docs');
  
  // Add manifest.json
  const manifestBuffer = Buffer.from(manifestContent);
  docFiles.push({ path: 'manifest.json', content: manifestBuffer });
  
  collectSpinner.succeed(`Found ${docFiles.length} files to upload`);

  // Step 5: Upload to IPFS
  const uploadSpinner = ora('Uploading to IPFS...').start();
  
  const uploadResult = await uploadToIPFS(docFiles, {
    apiKey: pinataApiKey,
    secretKey: pinataSecretKey,
  });
  
  if (!uploadResult.success || !uploadResult.ipfsHash) {
    uploadSpinner.fail('Upload failed');
    console.error(chalk.red(`\n❌ ${uploadResult.error}`));
    process.exit(1);
  }
  
  uploadSpinner.succeed(`Uploaded to IPFS: ${chalk.cyan(uploadResult.ipfsHash)}`);

  // If private mode, stop here
  if (options.private) {
    console.log(chalk.green('\n✅ Collection uploaded privately'));
    console.log(chalk.gray(`IPFS Hash: ${uploadResult.ipfsHash}`));
    console.log(chalk.gray(`Gateway URL: https://gateway.pinata.cloud/ipfs/${uploadResult.ipfsHash}`));
    return;
  }

  // Step 6: Register with API
  const registerSpinner = ora('Registering with Tower of Baibel...').start();
  
  const registryUrl = options.registry || DEFAULT_REGISTRY;
  
  try {
    const response = await fetch(`${registryUrl}/api/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        manifest,
        ipfsHash: uploadResult.ipfsHash,
        authorAddress: manifest.author,
        // TODO: Add signature verification in Phase 2
        signature: '0x', // Placeholder
        message: `Create collection ${manifest.name} v${manifest.version}`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as { error: string };
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json() as { id: string };
    registerSpinner.succeed('Collection registered');

    // Success output
    console.log(chalk.green('\n✅ Collection pushed successfully!\n'));
    console.log(chalk.white('Collection Details:'));
    console.log(chalk.gray(`  Name:        ${manifest.name}`));
    console.log(chalk.gray(`  Version:     ${manifest.version}`));
    console.log(chalk.gray(`  Author:      ${manifest.author}`));
    console.log(chalk.gray(`  Description: ${manifest.description}`));
    console.log(chalk.gray(`  Docs:        ${manifest.docCount || 'N/A'}`));
    console.log();
    console.log(chalk.white('IPFS:'));
    console.log(chalk.gray(`  Hash:        ${uploadResult.ipfsHash}`));
    console.log(chalk.gray(`  Gateway:     https://gateway.pinata.cloud/ipfs/${uploadResult.ipfsHash}`));
    console.log();
    console.log(chalk.white('Registry:'));
    console.log(chalk.gray(`  ID:          ${result.id}`));
    console.log(chalk.gray(`  URL:         ${registryUrl}/api/collections/${result.id}`));
    console.log();

  } catch (error) {
    registerSpinner.fail('Registration failed');
    console.error(chalk.red(`\n❌ ${error}`));
    console.log(chalk.yellow('\n⚠️  Collection was uploaded to IPFS but not registered'));
    console.log(chalk.gray(`IPFS Hash: ${uploadResult.ipfsHash}`));
    process.exit(1);
  }
}
