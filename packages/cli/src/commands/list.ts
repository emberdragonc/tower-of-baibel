import { listDirectories, readJson, fileExists } from '../utils/fs.js';
import { COLLECTIONS_DIR } from '../config/paths.js';
import type { Manifest } from '../types.js';
import chalk from 'chalk';

export async function listCollections(): Promise<void> {
  const collections = await listDirectories(COLLECTIONS_DIR);
  
  if (collections.length === 0) {
    console.log(chalk.yellow('No collections installed.'));
    console.log(`Run ${chalk.cyan('baibel pull <collection-id>')} to install a collection.`);
    return;
  }

  console.log(chalk.bold(`\nInstalled collections (${collections.length}):\n`));

  for (const id of collections) {
    const manifestPath = `${COLLECTIONS_DIR}/${id}/manifest.json`;
    
    if (await fileExists(manifestPath)) {
      try {
        const manifest = await readJson<Manifest>(manifestPath);
        console.log(`  ${chalk.green('●')} ${chalk.bold(manifest.name)} ${chalk.gray(`v${manifest.version}`)}`);
        console.log(`    ${manifest.description || 'No description'}`);
        console.log(`    ${chalk.gray(`${manifest.docs.length} docs`)}`);
      } catch {
        console.log(`  ${chalk.yellow('●')} ${chalk.bold(id)} ${chalk.red('(invalid manifest)')}`);
      }
    } else {
      console.log(`  ${chalk.yellow('●')} ${chalk.bold(id)} ${chalk.red('(no manifest)')}`);
    }
    console.log();
  }
}
