import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Create a mock client for build-time when env vars are not available
function createMockClient(): SupabaseClient {
  const mockClient = {
    from: () => ({
      select: () => ({
        order: () => ({
          range: () => Promise.resolve({ data: [], error: null }),
        }),
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: new Error("Not found") }),
          order: () => Promise.resolve({ data: [], error: null }),
        }),
        or: () => ({
          limit: () => Promise.resolve({ data: [], error: null }),
        }),
        limit: () => Promise.resolve({ data: [], error: null }),
      }),
    }),
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  } as unknown as SupabaseClient;
  
  return mockClient;
}

// Create the actual client or mock if env vars are missing
export const supabase: SupabaseClient = (() => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase URL or Anon Key not set - using mock client");
    // During build time, return mock client
    if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
      return createMockClient();
    }
  }
  
  // Return real client (will error at runtime if env vars missing)
  return createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder", {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
})();

// Database types based on the API package
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Manifest {
  name?: string;
  description?: string;
  version?: string;
  author?: string;
  tags?: string[];
  docs?: Array<{
    path: string;
    title: string;
    category?: string;
    tags?: string[];
  }>;
  [key: string]: Json | undefined;
}

export interface Collection {
  id: string;
  manifest: Manifest;
  ipfs_hash: string;
  author_address: string;
  version: string;
  doc_count: number;
  quality_score: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface CollectionVersion {
  id: string;
  collection_id: string;
  version: string;
  ipfs_hash: string;
  manifest: Json;
  created_at: string;
}

export interface Doc {
  id: string;
  collection_id: string;
  filename: string;
  title: string;
  source_url: string | null;
  category: string | null;
  tags: string[] | null;
  content_hash: string | null;
  created_at: string;
  updated_at: string;
}

export interface Rating {
  id: string;
  collection_id: string;
  rater_address: string;
  rating: number;
  review: string | null;
  tx_hash: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  doc_count: number;
  collection_count: number;
}

// Helper functions
export async function getCollections(limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) throw error;
  return data as Collection[];
}

export async function getCollectionById(id: string) {
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) throw error;
  return data as Collection;
}

export async function searchCollections(query: string) {
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .or(`id.ilike.%${query}%,author_address.ilike.%${query}%`)
    .limit(20);
  
  if (error) throw error;
  return data as Collection[];
}

export async function getRatings(collectionId: string) {
  const { data, error } = await supabase
    .from("ratings")
    .select("*")
    .eq("collection_id", collectionId)
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  return data as Rating[];
}

export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  
  if (error) throw error;
  return data as Category[];
}

export async function getStats() {
  const [{ count: collections }, { count: docs }, { count: ratings }] = await Promise.all([
    supabase.from("collections").select("*", { count: "exact", head: true }),
    supabase.from("docs").select("*", { count: "exact", head: true }),
    supabase.from("ratings").select("*", { count: "exact", head: true }),
  ]);
  
  return {
    collections: collections || 0,
    docs: docs || 0,
    ratings: ratings || 0,
  };
}
