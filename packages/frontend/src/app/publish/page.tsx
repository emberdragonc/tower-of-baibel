import Link from "next/link";
import { Terminal, Package, ExternalLink, ArrowRight, Flame, Sparkles } from "lucide-react";

export default function PublishPage() {
  return (
    <div className="min-h-screen">
      {/* Spire */}
      <div className="flex justify-center pt-8 pb-4">
        <div className="relative">
          <div className="w-0 h-0 border-l-[30px] border-r-[30px] border-b-[60px] border-l-transparent border-r-transparent border-b-primary/20" />
          <div className="absolute top-12 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gradient-to-b from-primary/30 to-transparent" />
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl pb-20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="floor-divider w-12" />
            <Sparkles className="w-4 h-4 text-primary/50" />
            <div className="floor-divider w-12" />
          </div>
          
          <h1 className="text-3xl font-bold mb-3">Add to the Tower</h1>
          <p className="text-muted-foreground">
            Publish your knowledge to the infinite library
          </p>
        </div>

        {/* Quick Start Steps */}
        <div className="space-y-4 mb-10">
          {[
            { 
              step: "1", 
              title: "Install CLI", 
              cmd: "npm install -g @tower-of-baibel/cli",
              desc: "Get the command-line tool"
            },
            { 
              step: "2", 
              title: "Initialize", 
              cmd: "baibel init",
              desc: "Set up your collection"
            },
            { 
              step: "3", 
              title: "Publish", 
              cmd: "baibel push",
              desc: "Upload to IPFS + register on-chain"
            },
          ].map((item, i) => (
            <div key={item.step} className="relative">
              {/* Connector line */}
              {i < 2 && (
                <div className="absolute left-5 top-14 w-0.5 h-6 bg-gradient-to-b from-border to-transparent" />
              )}
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                  {item.step}
                </div>
                
                <div className="flex-1 pb-2">
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{item.desc}</p>
                  
                  <div className="bg-black/50 rounded-lg p-3 font-mono text-sm border border-border">
                    <span className="text-green-400">$</span>{" "}
                    <span className="text-foreground">{item.cmd}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Full Workflow */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="floor-divider flex-1" />
            <span className="mx-4 text-xs text-muted-foreground font-mono">Complete Workflow</span>
            <div className="floor-divider flex-1" />
          </div>

          <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
            <div className="p-4 overflow-x-auto">
              <pre className="text-sm font-mono">
                <code>{`# Install
npm install -g @tower-of-baibel/cli

# Setup
export BAIBEL_PRIVATE_KEY=your_key
export BAIBEL_NETWORK=baseSepolia

# Navigate to docs
cd ./my-documentation

# Initialize
baibel init

# Push to the tower
baibel push

# Get collection ID
# Share: baibel pull <your-id>`}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="floor-divider flex-1" />
            <span className="mx-4 text-xs text-muted-foreground font-mono">Resources</span>
            <div className="floor-divider flex-1" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="https://github.com/emberdragonc/tower-of-baibel/tree/main/packages/cli"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card/30 hover:bg-card/50 transition-colors"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <Terminal className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">CLI Docs</p>
                <p className="text-xs text-muted-foreground truncate">Full command reference</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </a>

            <a
              href="https://github.com/emberdragonc/tower-of-baibel"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card/30 hover:bg-card/50 transition-colors"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">GitHub</p>
                <p className="text-xs text-muted-foreground truncate">Source code & issues</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </a>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-4">
          <div className="inline-flex flex-col items-center gap-4 p-6 rounded-2xl border border-border bg-gradient-to-b from-primary/5 to-transparent">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Ready to build?</span>
            </div>
            
            <a
              href="https://github.com/emberdragonc/tower-of-baibel#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Read the Docs
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
