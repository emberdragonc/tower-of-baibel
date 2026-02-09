import { SearchBar } from "@/components/search-bar";
import { Tower } from "@/components/tower";
import { ParallaxBackground } from "@/components/parallax-background";
import { getCollections, Collection } from "@/lib/supabase";
import { Flame, Sparkles } from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default async function Home() {
  // Fetch initial collections
  const initialCollections = await getCollections(ITEMS_PER_PAGE, 0);

  // Server action for loading more
  async function loadMoreCollections(page: number): Promise<Collection[]> {
    "use server";
    const offset = page * ITEMS_PER_PAGE;
    return getCollections(ITEMS_PER_PAGE, offset);
  }

  return (
    <div className="min-h-screen relative">
      {/* Parallax Background */}
      <ParallaxBackground />

      {/* Hero Section with Spire */}
      <section className="relative pt-12 pb-8">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-amber-500/10 via-amber-500/5 to-transparent blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Spire */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Spire triangle */}
              <div className="w-0 h-0 border-l-[40px] border-r-[40px] border-b-[80px] border-l-transparent border-r-transparent border-b-primary/30" />
              <div className="absolute top-16 left-1/2 -translate-x-1/2 w-1 h-8 bg-gradient-to-b from-primary/50 to-transparent" />
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 animate-pulse">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
              <Flame className="w-3.5 h-3.5" />
              <span>Powered by EMBER</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              <span className="gradient-text">Tower of Baibel</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-6">
              The Knowledge Layer for AI Agents
            </p>

            <div className="max-w-md mx-auto">
              <SearchBar placeholder="Search the tower..." />
            </div>
          </div>
        </div>
      </section>

      {/* Tower Section */}
      <section className="relative">
        {/* Tower container with max width */}
        <div className="max-w-2xl mx-auto">
          {/* Tower header */}
          <div className="text-center py-6">
            <div className="inline-flex items-center gap-2">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-border" />
              <span className="text-xs text-muted-foreground uppercase tracking-widest">Explore the Floors</span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-border" />
            </div>
          </div>

          {/* The Tower */}
          <Tower 
            initialCollections={initialCollections}
            hasMore={initialCollections.length === ITEMS_PER_PAGE}
            onLoadMore={loadMoreCollections}
          />
        </div>
      </section>
    </div>
  );
}
