"use client";

import { useState, FormEvent } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  initialQuery?: string;
  placeholder?: string;
  size?: "default" | "large";
}

export function SearchBar({ 
  initialQuery = "", 
  placeholder = "Search collections...",
  size = "default" 
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/browse?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const heightClass = size === "large" ? "h-14" : "h-11";
  const iconSize = size === "large" ? "w-6 h-6" : "w-5 h-5";
  const textSize = size === "large" ? "text-lg" : "text-base";

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground ${iconSize}`} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={`
            w-full ${heightClass} ${textSize}
            pl-12 pr-4
            rounded-full
            bg-card border border-border
            text-foreground placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
            transition-all
          `}
        />
        {query && (
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Search
          </button>
        )}
      </div>
    </form>
  );
}
