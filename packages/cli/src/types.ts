export interface Manifest {
  name: string;
  version: string;
  description: string;
  author: string;
  docCount?: number;
  docs: DocEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface DocEntry {
  path: string;
  title: string;
  category: string;
  tags: string[];
  hash: string;
}

export interface Collection {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  docCount: number;
  manifest: Manifest;
  ipfsCid?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  docCount: number;
  ipfsHash: string;
  qualityScore: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  docId: string;
  collectionId: string;
  title: string;
  category: string;
  excerpt: string;
  score: number;
}
