import { homedir } from 'node:os';
import { join } from 'node:path';

export const BAIBEL_HOME = join(homedir(), '.baibel');
export const COLLECTIONS_DIR = join(BAIBEL_HOME, 'collections');
export const CONFIG_FILE = join(BAIBEL_HOME, 'config.json');
export const CACHE_DIR = join(BAIBEL_HOME, 'cache');

export function getCollectionPath(collectionId: string): string {
  return join(COLLECTIONS_DIR, collectionId);
}

export function getCollectionManifestPath(collectionId: string): string {
  return join(getCollectionPath(collectionId), 'manifest.json');
}

export function getCollectionDocsPath(collectionId: string): string {
  return join(getCollectionPath(collectionId), 'docs');
}
