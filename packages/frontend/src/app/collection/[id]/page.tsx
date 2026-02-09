import { notFound } from "next/navigation";
import Link from "next/link";
import { getCollectionById, getRatings } from "@/lib/supabase";
import { 
  getOnChainCollection, 
  getOnChainAverageRating, 
  getOnChainRatingCount,
  getOnChainAttestations,
  getOnChainTotalStaked,
  CONTRACTS
} from "@/lib/contracts";
import { 
  Star, 
  FileText, 
  User, 
  ExternalLink, 
  TrendingUp,
  Download,
  Terminal,
  ArrowLeft,
  Clock,
  Shield,
  Flame,
  ChevronUp
} from "lucide-react";

interface CollectionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { id } = await params;
  
  // Fetch data in parallel
  const [collection, onChainData, avgRating, ratingCount, attestations, totalStaked] = await Promise.all([
    getCollectionById(id).catch(() => null),
    getOnChainCollection(id),
    getOnChainAverageRating(id),
    getOnChainRatingCount(id),
    getOnChainAttestations(id),
    getOnChainTotalStaked(id),
  ]);

  if (!collection && !onChainData) {
    notFound();
  }

  // Use on-chain data if available, fallback to DB
  const displayData = {
    id,
    name: onChainData?.name || collection?.manifest?.name || id,
    description: collection?.manifest?.description || "",
    author: onChainData?.author || collection?.author_address || "Unknown",
    version: onChainData?.version || collection?.version || "1.0.0",
    docCount: onChainData?.docCount || collection?.doc_count || 0,
    ipfsHash: onChainData?.ipfsHash || collection?.ipfs_hash || "",
    createdAt: onChainData?.createdAt || new Date(collection?.created_at || Date.now()).getTime(),
    tags: collection?.manifest?.tags || [],
    rating: avgRating,
    ratingCount: ratingCount,
    totalStaked: totalStaked,
  };

  const shortAuthor = `${displayData.author.slice(0, 6)}...${displayData.author.slice(-4)}`;
  const ipfsUrl = `https://ipfs.io/ipfs/${displayData.ipfsHash}`;

  return (
    <div className="min-h-screen">
      {/* Tower Spire */}
      <div className="flex justify-center pt-8 pb-4">
        <div className="relative">
          <div className="w-0 h-0 border-l-[30px] border-r-[30px] border-b-[60px] border-l-transparent border-r-transparent border-b-primary/20" />
          <div className="absolute top-12 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gradient-to-b from-primary/30 to-transparent" />
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl pb-20">
        {/* Back Link */}
        <Link
          href="/browse"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to browse
        </Link>

        {/* Main Floor */}
        <div className="relative">
          {/* Floor header */}
          <div className="flex items-center justify-center mb-4">
            <div className="floor-divider flex-1" />
            <div className="mx-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary/50" />
              <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Collection Chamber</span>
              <div className="w-2 h-2 rounded-full bg-primary/50" />
            </div>
            <div className="floor-divider flex-1" />
          </div>

          {/* Main content card */}
          <div className="rounded-xl border border-border bg-card/80 tower-floor-glow overflow-hidden">
            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold mb-3">{displayData.name}</h1>
                
                {displayData.description && (
                  <p className="text-muted-foreground mb-4">{displayData.description}</p>
                )}
                
                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <User className="w-3.5 h-3.5" />
                    <span className="font-mono">{shortAuthor}</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{displayData.docCount} documents</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-green-500 text-xs">On-chain</span>
                  </div>
                </div>

                {/* Tags */}
                {displayData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {displayData.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="px-2 py-1 rounded-full text-xs bg-secondary text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="p-4 rounded-lg bg-secondary/50 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span className="text-xl font-bold">{displayData.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{displayData.ratingCount} ratings</p>
                </div>

                <div className="p-4 rounded-lg bg-secondary/50 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-xl font-bold">{parseFloat(displayData.totalStaked).toFixed(0)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">EMBER staked</p>
                </div>

                <div className="p-4 rounded-lg bg-secondary/50 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-xl font-bold">{displayData.docCount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">documents</p>
                </div>

                <div className="p-4 rounded-lg bg-secondary/50 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-bold">
                      {new Date(displayData.createdAt).toLocaleDateString(undefined, { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">published</p>
                </div>
              </div>

              {/* CLI Command */}
              <div className="p-4 rounded-lg bg-black/50 border border-border mb-6">
                <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Pull with CLI</span>
                </div>
                <div className="font-mono text-sm overflow-x-auto">
                  <span className="text-green-400">$</span>{" "}
                  <span className="text-foreground">baibel pull {id}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <a
                  href={ipfsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 flex-1 min-w-[140px] px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
                
                <a
                  href={`https://basescan.org/address/${CONTRACTS.baseSepolia.baibelRegistry}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 flex-1 min-w-[140px] px-4 py-2.5 rounded-lg border border-border bg-secondary/50 text-sm font-medium hover:bg-secondary transition-colors"
                >
                  <Star className="w-4 h-4" />
                  Rate
                </a>
                
                <a
                  href={`https://basescan.org/address/${CONTRACTS.baseSepolia.baibelStaking}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 flex-1 min-w-[140px] px-4 py-2.5 rounded-lg border border-border bg-secondary/50 text-sm font-medium hover:bg-secondary transition-colors"
                >
                  <Flame className="w-4 h-4" />
                  Stake
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Attestations Section */}
        {attestations.length > 0 && (
          <div className="mt-8">
            {/* Floor divider */}
            <div className="flex items-center justify-center mb-6">
              <div className="floor-divider flex-1" />
              <span className="mx-4 text-xs text-muted-foreground font-mono">{attestations.length} Attestations</span>
              <div className="floor-divider flex-1" />
            </div>

            <div className="space-y-4">
              {attestations.slice(0, 5).map((attestation, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-border bg-card/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="font-mono text-sm">
                        {attestation.rater.slice(0, 6)}...{attestation.rater.slice(-4)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < attestation.rating
                              ? "fill-amber-500 text-amber-500"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {attestation.review && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      "{attestation.review}"
                    </p>
                  )}
                  
                  <div className="mt-3 text-xs text-muted-foreground">
                    {new Date(attestation.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contract Info */}
        <div className="mt-8">
          <div className="flex items-center justify-center mb-4">
            <div className="floor-divider flex-1" />
            <span className="mx-4 text-xs text-muted-foreground font-mono">Contract Info</span>
            <div className="floor-divider flex-1" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={`https://basescan.org/address/${CONTRACTS.baseSepolia.baibelRegistry}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/30 hover:bg-card/50 transition-colors text-sm"
            >
              <span className="text-muted-foreground">Registry</span>
              <span className="font-mono text-xs flex items-center gap-1">
                {CONTRACTS.baseSepolia.baibelRegistry.slice(0, 8)}...
                <ExternalLink className="w-3 h-3" />
              </span>
            </a>

            <a
              href={`https://basescan.org/address/${CONTRACTS.baseSepolia.baibelStaking}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/30 hover:bg-card/50 transition-colors text-sm"
            >
              <span className="text-muted-foreground">Staking</span>
              <span className="font-mono text-xs flex items-center gap-1">
                {CONTRACTS.baseSepolia.baibelStaking.slice(0, 8)}...
                <ExternalLink className="w-3 h-3" />
              </span>
            </a>
          </div>
        </div>

        {/* Back to top */}
        <div className="mt-12 text-center">
          <Link
            href="#"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
            Back to top
          </Link>
        </div>
      </div>
    </div>
  );
}
