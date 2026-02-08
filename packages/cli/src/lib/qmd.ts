import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';

const execAsync = promisify(exec);

/**
 * Check if qmd is available on the system
 */
export async function isQmdAvailable(): Promise<boolean> {
  try {
    await execAsync('qmd --version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Run qmd collection add command
 * This adds a collection to the qmd index
 */
export async function runQmdCollectionAdd(
  collectionName: string,
  docsPath: string
): Promise<void> {
  try {
    // Build the qmd collection add command
    // Format: qmd collection add <path> --name <name> --mask "**/*.md"
    const command = `qmd collection add "${docsPath}" --name "${collectionName}" --mask "**/*.md"`;
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('warning') && !stderr.includes('Warning')) {
      throw new Error(`qmd collection add failed: ${stderr}`);
    }
    
    // Optionally capture the collection ID from stdout
    if (stdout) {
      console.log(`qmd output: ${stdout.trim()}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to add collection to qmd: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Run qmd update command
 * This updates the qmd search index
 */
export async function runQmdUpdate(): Promise<void> {
  try {
    const { stdout, stderr } = await execAsync('qmd update');
    
    if (stderr && !stderr.includes('warning') && !stderr.includes('Warning')) {
      throw new Error(`qmd update failed: ${stderr}`);
    }
    
    if (stdout) {
      console.log(`qmd update: ${stdout.trim()}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update qmd index: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Run qmd search command
 * This searches the qmd index
 */
export async function runQmdSearch(
  query: string,
  collection?: string
): Promise<{ stdout: string; stderr: string }> {
  try {
    let command = `qmd search "${query.replace(/"/g, '\\"')}"`;
    
    if (collection) {
      command += ` --collection "${collection}"`;
    }
    
    const result = await execAsync(command);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`qmd search failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Run qmd vsearch command (vector search)
 * This performs vector/semantic search using qmd
 */
export async function runQmdVectorSearch(
  query: string,
  collection?: string
): Promise<{ stdout: string; stderr: string }> {
  try {
    let command = `qmd vsearch "${query.replace(/"/g, '\\"')}"`;
    
    if (collection) {
      command += ` --collection "${collection}"`;
    }
    
    const result = await execAsync(command);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`qmd vsearch failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Run qmd query command (hybrid search)
 * This performs hybrid search (BM25 + vector) using qmd
 */
export async function runQmdQuery(
  query: string,
  collection?: string
): Promise<{ stdout: string; stderr: string }> {
  try {
    let command = `qmd query "${query.replace(/"/g, '\\"')}"`;
    
    if (collection) {
      command += ` --collection "${collection}"`;
    }
    
    const result = await execAsync(command);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`qmd query failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Run qmd status command
 * Check qmd index status
 */
export async function runQmdStatus(): Promise<{ stdout: string; stderr: string }> {
  try {
    const result = await execAsync('qmd status');
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`qmd status failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * List all qmd collections
 */
export async function listQmdCollections(): Promise<string[]> {
  try {
    const { stdout } = await execAsync('qmd status --json');
    const status = JSON.parse(stdout);
    return status.collections?.map((c: { name: string }) => c.name) || [];
  } catch {
    return [];
  }
}

/**
 * Remove a collection from qmd index
 */
export async function removeQmdCollection(collectionName: string): Promise<void> {
  try {
    const { stderr } = await execAsync(`qmd collection remove "${collectionName}"`);
    
    if (stderr && !stderr.includes('warning') && !stderr.includes('Warning')) {
      throw new Error(`qmd collection remove failed: ${stderr}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to remove collection from qmd: ${error.message}`);
    }
    throw error;
  }
}
