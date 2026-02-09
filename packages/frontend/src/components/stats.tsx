"use client";

import { useEffect, useState } from "react";
import { BookOpen, FileText, Star, TrendingUp } from "lucide-react";
import { getStats } from "@/lib/supabase";
import { getOnChainGlobalStats } from "@/lib/contracts";

interface StatItemProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  isLoading?: boolean;
}

function StatItem({ icon, value, label, isLoading }: StatItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border">
      <div className="p-3 rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold">
          {isLoading ? "—" : value}
        </div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

export function Stats() {
  const [stats, setStats] = useState({
    collections: 0,
    docs: 0,
    ratings: 0,
    totalStaked: "0",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true);
        const [dbStats, chainStats] = await Promise.all([
          getStats(),
          getOnChainGlobalStats(),
        ]);
        
        setStats({
          ...dbStats,
          totalStaked: chainStats.totalStaked,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <section className="py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatItem
            icon={<BookOpen className="w-6 h-6" />}
            value={stats.collections.toLocaleString()}
            label="Collections"
            isLoading={isLoading}
          />
          <StatItem
            icon={<FileText className="w-6 h-6" />}
            value={stats.docs.toLocaleString()}
            label="Documents"
            isLoading={isLoading}
          />
          <StatItem
            icon={<Star className="w-6 h-6" />}
            value={stats.ratings.toLocaleString()}
            label="Ratings"
            isLoading={isLoading}
          />
          <StatItem
            icon={<TrendingUp className="w-6 h-6" />}
            value={`${parseFloat(stats.totalStaked).toFixed(0)} EMBER`}
            label="Total Staked"
            isLoading={isLoading}
          />
        </div>
      </div>
    </section>
  );
}
