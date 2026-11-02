import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchAnalyticsOverview,
  fetchPlatformAnalytics,
} from '../../store/slices/analyticsSlice';
import { kafkaApi } from '../../services/api';
import { addToast } from '../../store/slices/notificationSlice';
import { PlatformBadge } from '../common/Badge';
import {
  BarChart3,
  Calendar,
  Zap,
  TrendingUp,
  Award,
  RefreshCw,
  Eye,
  MousePointer,
  Share2,
  Trash2,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { metrics, platformBreakdown, fromCache, isLoading } = useAppSelector(
    (state) => state.analytics
  );
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [selectedRange, setSelectedRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const loadAll = () => {
    dispatch(fetchAnalyticsOverview());
    dispatch(fetchPlatformAnalytics());
    kafkaApi.getCacheStats().then((res) => setCacheStats(res.data)).catch(() => {});
  };

  useEffect(() => {
    loadAll();
  }, [dispatch, selectedRange]);

  const handleClearCache = async () => {
    try {
      await kafkaApi.clearCache();
      dispatch(
        addToast({
          type: 'info',
          title: 'Redis Cache Flushed',
          message: 'All @Cacheable keys evicted. Next request will query the database directly.',
        })
      );
      loadAll();
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to clear cache' }));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Range Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <span>Analytics & Audience Telemetry</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-platform engagement metrics, impressions, and Redis read-through cache health.
          </p>
        </div>

        {/* Date Range Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-3 py-1 text-xs font-semibold rounded uppercase transition-all ${
                  selectedRange === range
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={loadAll}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Redis Cache Telemetry Box */}
      {cacheStats && (
        <div className="bg-indigo-950 text-indigo-100 p-4 rounded-xl border border-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-900/60 text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white block">Redis Cache Layer (@Cacheable / @CacheEvict)</span>
              <span className="text-[11px] text-indigo-300 font-mono">
                Hit Rate: {cacheStats.hitRate} · Active Keys: {cacheStats.totalKeys} · Evictions: {cacheStats.evictions}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {fromCache ? (
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[11px] font-bold">
                Served from Cache (0.4ms)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[11px] font-bold">
                Database Query (Cached)
              </span>
            )}
            <button
              onClick={handleClearCache}
              className="px-2.5 py-1 rounded bg-indigo-900 hover:bg-indigo-800 text-indigo-200 text-xs font-semibold border border-indigo-700/60 transition-colors"
            >
              Flush Cache
            </button>
          </div>
        </div>
      )}

      {/* Platform Performance Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Performance Breakdown by Channel
          </h3>
          <span className="text-xs text-slate-400 font-mono">Normalized cross-channel stats</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Social Channel</th>
                <th className="py-3 px-4 font-semibold text-right">Published Posts</th>
                <th className="py-3 px-4 font-semibold text-right">Audience Follows</th>
                <th className="py-3 px-4 font-semibold text-right">Gross Impressions</th>
                <th className="py-3 px-4 font-semibold text-right">Estimated Reach</th>
                <th className="py-3 px-4 font-semibold text-right">Avg Engagement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {platformBreakdown.map((row) => (
                <tr key={row.platform} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                    <PlatformBadge platform={row.platform as any} />
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-700">{row.postsCount}</td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-700">{row.followers.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-900">{row.impressions.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-700">{row.reach.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right tabular-nums text-emerald-600 font-bold">{row.engagementRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Performing Content Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-900">Top Performing Publications</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                Highest Reach
              </span>
              <span className="text-xs font-mono text-slate-400">Oct 28, 2026</span>
            </div>
            <p className="text-xs text-slate-800 font-semibold leading-relaxed">
              We are thrilled to unveil PostPulse 3.0! Effortless multi-channel orchestration with automated scheduling...
            </p>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-600">
              <span>Impressions: 48,500</span>
              <span className="text-emerald-600 font-bold">5.8% CTR</span>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold">
                Highest Engagement
              </span>
              <span className="text-xs font-mono text-slate-400">Oct 30, 2026</span>
            </div>
            <p className="text-xs text-slate-800 font-semibold leading-relaxed">
              Deep dive: How event-driven architecture with Apache Kafka and Dead Letter Queues prevents social publishing failures...
            </p>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-600">
              <span>Impressions: 31,200</span>
              <span className="text-emerald-600 font-bold">6.4% CTR</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
