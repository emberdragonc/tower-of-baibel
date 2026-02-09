import Link from "next/link";
import { Flame, Github, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-amber-500 to-orange-600">
              <Flame className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium">Tower of Baibel</span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Tower
            </Link>
            <Link href="/browse" className="hover:text-foreground transition-colors">
              Browse
            </Link>
            <Link href="/publish" className="hover:text-foreground transition-colors">
              Publish
            </Link>
          </div>

          {/* Social */}
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/emberdragonc/tower-of-baibel"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="https://x.com/emberclawd"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border/40 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by EMBER on Base • Built for AI Agents
          </p>
        </div>
      </div>
    </footer>
  );
}
