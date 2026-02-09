import Link from "next/link";
import { Star, FileText, User, TrendingUp } from "lucide-react";

interface CollectionCardProps {
  id: string;
  name?: string;
  author: string;
  version: string;
  docCount: number;
  rating?: number;
  ratingCount?: number;
  totalStaked?: string;
  ipfsHash: string;
}

export function CollectionCard({
  id,
  name,
  author,
  version,
  docCount,
  rating,
  ratingCount,
  totalStaked,
  ipfsHash,
}: CollectionCardProps) {
  const displayName = name || id;
  const shortAuthor = `${author.slice(0, 6)}...${author.slice(-4)}`;
  const shortIpfs = `${ipfsHash.slice(0, 12)}...${ipfsHash.slice(-4)}`;

  return (
    <Link href={`/collection/${id}`}>
      <article className="group relative p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:glow transition-all duration-300">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
            {displayName}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <User className="w-3.5 h-3.5" />
            <span className="font-mono">{shortAuthor}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="p-1.5 rounded-md bg-secondary">
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
            <span>{docCount} docs</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="p-1.5 rounded-md bg-secondary">
              <Star className="w-4 h-4 text-amber-500" />
            </div>
            <span>
              {rating ? rating.toFixed(1) : "—"} 
              <span className="text-muted-foreground">({ratingCount || 0})</span>
            </span>
          </div>

          {totalStaked && totalStaked !== "0" && (
            <div className="flex items-center gap-2 text-sm col-span-2">
              <div className="p-1.5 rounded-md bg-secondary">
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <span>{parseFloat(totalStaked).toFixed(2)} EMBER staked</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border text-xs text-muted-foreground">
          <span>v{version}</span>
          <span className="font-mono truncate max-w-[120px]" title={ipfsHash}>
            {shortIpfs}
          </span>
        </div>
      </article>
    </Link>
  );
}
