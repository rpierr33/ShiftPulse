"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Star, Users, MapPin, Filter, X } from "lucide-react";
import { searchProviders } from "@/actions/marketplace";
import { PROVIDER_TYPE_LABELS } from "@/types";
import { getProviderScoreTier } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProviderType } from "@prisma/client";

const PROVIDER_TYPES: { value: ProviderType; label: string }[] = Object.entries(
  PROVIDER_TYPE_LABELS
).map(([value, label]) => ({ value: value as ProviderType, label }));

const SORT_OPTIONS = [
  { value: "score" as const, label: "Score" },
  { value: "rating" as const, label: "Rating" },
  { value: "workers" as const, label: "Team Size" },
];

type ProviderResult = Awaited<ReturnType<typeof searchProviders>>["providers"][number];

export default function BrowseProvidersPage() {
  const [providers, setProviders] = useState<ProviderResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [selectedTypes, setSelectedTypes] = useState<ProviderType[]>([]);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState<"score" | "rating" | "workers">("score");

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await searchProviders({
        providerType: selectedTypes.length > 0 ? selectedTypes : undefined,
        city: city || undefined,
        state: state || undefined,
        minScore: minScore > 0 ? minScore : undefined,
        sortBy,
      });
      setProviders(result.providers);
      setTotal(result.total);
    } catch {
      // Silent fail for public page
    } finally {
      setLoading(false);
    }
  }, [selectedTypes, city, state, minScore, sortBy]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  function toggleProviderType(type: ProviderType) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  function clearFilters() {
    setSelectedTypes([]);
    setCity("");
    setState("");
    setMinScore(0);
  }

  const hasActiveFilters = selectedTypes.length > 0 || city || state || minScore > 0;

  return (
    <div className="relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title + Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Healthcare Providers</h1>
            <p className="text-sm text-slate-400 mt-1">
              {total} provider{total !== 1 ? "s" : ""} available on the marketplace
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Sort */}
            <div className="flex items-center bg-white/5 rounded-xl border border-white/10">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={cn(
                    "px-3 py-2 text-xs font-medium transition-colors rounded-xl",
                    sortBy === opt.value
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors border",
                showFilters
                  ? "bg-blue-600/20 text-blue-400 border-blue-500/30"
                  : "text-slate-400 hover:text-white border-white/10 hover:border-white/20"
              )}
            >
              <Filter size={14} />
              Filters
              {hasActiveFilters && <span className="w-2 h-2 bg-blue-400 rounded-full" />}
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filter Sidebar */}
          {showFilters && (
            <div className="w-72 shrink-0 glass rounded-2xl p-6 border border-white/5 h-fit sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-semibold text-white">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-slate-400 hover:text-red-400 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Provider Type */}
              <div className="mb-6">
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                  Provider Type
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {PROVIDER_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className="flex items-center gap-2 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type.value)}
                        onChange={() => toggleProviderType(type.value)}
                        className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/30"
                      />
                      <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                        {type.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="mb-6">
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                  Location
                </h4>
                <div className="space-y-2">
                  <Input
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-8 text-xs bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  />
                  <Input
                    placeholder="State (e.g. FL)"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="h-8 text-xs bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Min Score */}
              <div className="mb-6">
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                  Minimum Score
                </h4>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={minScore}
                  onChange={(e) => setMinScore(parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0</span>
                  <span className="text-blue-400 font-medium">{minScore}</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          )}

          {/* Results Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="glass rounded-2xl p-6 border border-white/5 animate-pulse"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-white/5 rounded w-2/3" />
                        <div className="h-3 bg-white/5 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-3 bg-white/5 rounded w-full" />
                      <div className="h-3 bg-white/5 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : providers.length === 0 ? (
              <div className="text-center py-20">
                <Search size={48} className="text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No providers found</h3>
                <p className="text-sm text-slate-400 mb-6">
                  Try adjusting your filters or search criteria.
                </p>
                {hasActiveFilters && (
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    size="sm"
                    className="border-white/10 text-slate-300 hover:bg-white/5"
                  >
                    <X size={14} /> Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className={cn(
                "grid gap-4",
                showFilters
                  ? "grid-cols-1 lg:grid-cols-2"
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              )}>
                {providers.map((provider) => {
                  const tier = getProviderScoreTier(provider.score);
                  return (
                    <Link
                      key={provider.id}
                      href={`/marketplace/providers/${provider.id}`}
                      className="group glass rounded-2xl p-6 hover:bg-white/[0.06] transition-all border border-white/5 hover:border-white/10"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {provider.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-white font-semibold truncate group-hover:text-purple-400 transition-colors">
                            {provider.name}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {provider.providerType
                              ? PROVIDER_TYPE_LABELS[provider.providerType]
                              : "Healthcare Provider"}
                          </p>
                        </div>
                        <div
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0",
                            tier.bgColor,
                            tier.color
                          )}
                        >
                          {provider.score}
                        </div>
                      </div>

                      {/* Services */}
                      {provider.servicesOffered.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {provider.servicesOffered.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 text-[10px] bg-white/5 text-slate-400 rounded-md border border-white/5"
                            >
                              {s}
                            </span>
                          ))}
                          {provider.servicesOffered.length > 3 && (
                            <span className="px-2 py-0.5 text-[10px] text-slate-500">
                              +{provider.servicesOffered.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Description preview */}
                      {provider.description && (
                        <p className="mt-3 text-xs text-slate-500 line-clamp-2">
                          {provider.description}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                        {provider.averageRating !== null && (
                          <span className="flex items-center gap-1">
                            <Star size={10} className="text-amber-400 fill-amber-400" />
                            {provider.averageRating} ({provider.totalReviews})
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users size={10} />
                          {provider.activeWorkers} worker{provider.activeWorkers !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {provider.city && provider.state && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                          <MapPin size={10} />
                          {provider.city}, {provider.state}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
