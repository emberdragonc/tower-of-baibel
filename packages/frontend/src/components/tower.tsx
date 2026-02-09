"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { 
  Star, 
  FileText, 
  TrendingUp, 
  ChevronDown,
  Flame,
  ArrowUpRight,
  Loader2
} from "lucide-react";
import { Collection } from "@/lib/supabase";
import { 
  getOnChainAverageRating, 
  getOnChainRatingCount,
  getOnChainTotalStaked 
} from "@/lib/contracts";

interface TowerFloorProps {
  collection: CollectionWithStats;
  floorNumber: number;
  isExpanded: boolean;
  onToggle: () => void;
}

interface CollectionWithStats extends Collection {
  onChainRating?: number;
  onChainRatingCount?: number;
  onChainTotalStaked?: string;
}

function TowerFloor({ collection, floorNumber, isExpanded, onToggle }: TowerFloorProps) {
  const displayName = collection.manifest?.name || collection.id;
  const shortAuthor = `${collection.author_address.slice(0, 6)}...${collection.author_address.slice(-4)}`;
  const floorRef = useRef(null);
  const isInView = useInView(floorRef, { once: true, margin: "-100px" });
  
  return (
    <motion.div 
      ref={floorRef}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ 
        duration: 0.6, 
        delay: 0.1,
        ease: [0.16, 1, 0.3, 1]
      }}
      className="relative tower-floor-3d"
    >
      {/* Floor divider with number */}
      <div className="flex items-center justify-center py-4">
        <div className="floor-divider flex-1" />
        <div className="mx-4 px-3 py-1 rounded-full bg-background border border-border text-xs text-muted-foreground font-mono">
          Floor {floorNumber}
        </div>
        <div className="floor-divider flex-1" />
      </div>

      {/* Floor content - The "Room" */}
      <div 
        onClick={onToggle}
        className={`
          relative mx-4 rounded-lg overflow-hidden cursor-pointer
          transition-all duration-500 ease-out
          ${isExpanded ? 'bg-card/80 tower-floor-glow' : 'bg-card/40 hover:bg-card/60'}
          border border-border hover:border-primary/30
        `}
      >
        {/* Window frame effect */}
        <div className="absolute inset-0 tower-bricks opacity-50 pointer-events-none" />
        
        {/* Window glow when expanded */}
        {isExpanded && (
          <div className="absolute inset-0 tower-window-lit pointer-events-none" />
        )}

        {/* Content */}
        <div className="relative p-6">
          {/* Header - Always visible */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                {displayName}
              </h3>
              <p className="text-sm text-muted-foreground font-mono mt-1">
                {shortAuthor}
              </p>
            </div>
            
            <div className={`
              p-2 rounded-full transition-transform duration-300
              ${isExpanded ? 'rotate-180 bg-primary/10' : 'bg-secondary'}
            `}>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Quick stats - Always visible */}
          <div className="flex items-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{collection.doc_count}</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span className={collection.onChainRating ? "text-amber-500" : "text-muted-foreground"}>
                {collection.onChainRating?.toFixed(1) || "—"}
              </span>
            </div>
            
            {collection.onChainTotalStaked && collection.onChainTotalStaked !== "0" && (
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                <span className="text-green-500">
                  {parseFloat(collection.onChainTotalStaked).toFixed(0)} EMBER
                </span>
              </div>
            )}
          </div>

          {/* Expanded content */}
          <div className={`
            overflow-hidden transition-all duration-500 ease-out
            ${isExpanded ? 'max-h-96 opacity-100 mt-6 pt-6 border-t border-border' : 'max-h-0 opacity-0'}
          `}>
            <div className="space-y-4">
              {/* Description */}
              {collection.manifest?.description && (
                <p className="text-sm text-muted-foreground">
                  {collection.manifest.description}
                </p>
              )}

              {/* Tags */}
              {collection.manifest?.tags && collection.manifest.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {collection.manifest.tags.map((tag) => (
                    <span 
                      key={tag}
                      className="px-2 py-1 rounded-full text-xs bg-secondary text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Rating</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < Math.round(collection.onChainRating || 0)
                            ? "fill-amber-500 text-amber-500"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {collection.onChainRatingCount || 0} ratings
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Version</p>
                  <p className="text-sm font-mono">{collection.version}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(collection.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Link
                  href={`/collection/${collection.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  View Details
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface TowerProps {
  initialCollections: Collection[];
  hasMore: boolean;
  onLoadMore: (page: number) => Promise<Collection[]>;
}

export function Tower({ initialCollections, hasMore: initialHasMore, onLoadMore }: TowerProps) {
  const [collections, setCollections] = useState<CollectionWithStats[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Fetch on-chain stats for collections
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

  // Initialize with initial collections
  useEffect(() => {
    enrichCollections(initialCollections).then(setCollections);
  }, [initialCollections, enrichCollections]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setIsLoading(true);
          try {
            const currentPage = page;
            const newCollections = await onLoadMore(currentPage);
            if (newCollections.length === 0) {
              setHasMore(false);
            } else {
              const enriched = await enrichCollections(newCollections);
              setCollections((prev) => [...prev, ...enriched]);
              setPage((p) => p + 1);
            }
          } catch (error) {
            console.error("Error loading more:", error);
          } finally {
            setIsLoading(false);
          }
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="relative tower-3d">
      {/* Tower structure - left and right pillars with 3D depth */}
      <div className="absolute left-0 top-0 bottom-0 w-4 md:w-8 lg:w-12">
        <div className="h-full w-full tower-bricks border-r border-border/50 bg-gradient-to-r from-background to-card/20" />
        {/* Decorative elements */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary/30 animate-pulse" />
        <div className="absolute top-60 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary/20 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-40 left-1/4 w-1 h-1 rounded-full bg-primary/40 star" />
      </div>
      
      <div className="absolute right-0 top-0 bottom-0 w-4 md:w-8 lg:w-12">
        <div className="h-full w-full tower-bricks border-l border-border/50 bg-gradient-to-l from-background to-card/20" />
        {/* Decorative elements */}
        <div className="absolute top-32 right-1/2 translate-x-1/2 w-2 h-2 rounded-full bg-primary/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-80 right-1/2 translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary/20 animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-56 right-1/4 w-1 h-1 rounded-full bg-primary/40 star" style={{ animationDelay: '2s' }} />
      </div>

      {/* Tower floors */}
      <div className="mx-4 md:mx-8 lg:mx-12">
        {collections.map((collection, index) => (
          <TowerFloor
            key={collection.id}
            collection={collection}
            floorNumber={collections.length - index}
            isExpanded={expandedId === collection.id}
            onToggle={() => handleToggle(collection.id)}
          />
        ))}

        {/* Loading indicator / Bottom of tower */}
        <div 
          ref={loaderRef}
          className="py-12 text-center"
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Descending deeper...</p>
            </div>
          ) : hasMore ? (
            <div className="flex flex-col items-center gap-2 opacity-50">
              <div className="w-1 h-16 bg-gradient-to-b from-border to-transparent" />
              <p className="text-xs text-muted-foreground">Scroll to explore more floors</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full border-2 border-border flex items-center justify-center">
                <Flame className="w-6 h-6 text-primary/50" />
              </div>
              <p className="text-sm text-muted-foreground">You&apos;ve reached the foundation</p>
              <p className="text-xs text-muted-foreground">
                {collections.length} floors explored
              </p>
            </div>
          )}
        </div>

        {/* Bottom glow effect */}
        <div className="h-32 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
