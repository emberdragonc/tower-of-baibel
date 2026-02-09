"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SearchBar } from "@/components/search-bar";
import { Tower } from "@/components/tower";
import { getCollections, searchCollections, Collection } from "@/lib/supabase";
import { 
  getOnChainAverageRating, 
  getOnChainRatingCount, 
  getOnChainTotalStaked 
} from "@/lib/contracts";
import { ArrowLeft, Sparkles } from "lucide-react";

const ITEMS_PER_PAGE = 10;

interface CollectionWithStats extends Collection {
  onChainRating?: number;
  onChainRatingCount?: number;
  onChainTotalStaked?: string;
}

function BrowseContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [collections, setCollections] = useState<CollectionWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Enrich collections with on-chain data
  const enrichCollections = useCallback(async (cols: Collection[]): Promise<CollectionWithStats[]> => {
    return Promise.all(
      cols.map(async (col) => {
        try {
          const [rating, count, staked] = await Promise.all([
            getOnChainAverageRating(col.id),
            getOnChainRatingCount(col.id),
            getOnChainTotalStaked(col.id),
          ]);
          return { ...col, onChainRating: rating, onChainRatingCount: count, onChainTotalStaked: staked };
        } catch {
          return col;
        }
      })
    );
  }, []);

  // Initial fetch
  useEffect(() => {
    async function fetchInitial() {
      setIsLoading(true);
      try {
        const data = query 
          ? await searchCollections(query)
          : await getCollections(ITEMS_PER_PAGE, 0);
        
        const enriched = await enrichCollections(data);
        setCollections(enriched);
        setHasMore(!query && data.length === ITEMS_PER_PAGE);
      } catch (error) {
        console.error("Error fetching collections:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchInitial();
  }, [query]);

  // Load more for infinite scroll
  const loadMore = useCallback(async (): Promise<Collection[]> => {
    const nextPage = page + 1;
    const offset = nextPage * ITEMS_PER_PAGE;
    const data = await getCollections(ITEMS_PER_PAGE, offset);
    setPage(nextPage);
    return data;
  }, [page]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="relative pt-8 pb-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Tower
          </Link>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">
              {query ? `Search: "${query}"` : "Browse Collections"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isLoading 
                ? "Searching the archives..." 
                : `${collections.length} collection${collections.length !== 1 ? "s" : ""} found`
              }
            </p>
          </div>

          {/* Search */}
          <SearchBar initialQuery={query} placeholder="Search collections..." />
        </div>
      </section>

      {/* Results */}
      <section className="relative">
        <div className="max-w-2xl mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Searching the tower...</p>
            </div>
          ) : collections.length > 0 ? (
            <Tower
              initialCollections={collections}
              hasMore={hasMore}
              onLoadMore={loadMore}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full border-2 border-border flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No collections found</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                {query 
                  ? "Try a different search term or browse all collections"
                  : "The tower is empty. Be the first to publish!"
                }
              </p>
              {query && (
                <Link
                  href="/browse"
                  className="mt-4 text-sm text-primary hover:underline"
                >
                  Clear search
                </Link>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    }>
      <BrowseContent />
    </Suspense>
  );
}
