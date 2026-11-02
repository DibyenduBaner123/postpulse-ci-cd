import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchAnalyticsOverview } from '../../store/slices/analyticsSlice';
import { fetchPosts } from '../../store/slices/postSlice';
import { fetchAuditLogs } from '../../store/slices/userSlice';
import { StatCards } from './StatCards';
import { Charts } from './Charts';
import { UpcomingQueue } from './UpcomingQueue';
import { RecentActivity } from './RecentActivity';
import { NavTab } from '../layout/Sidebar';
import { Database, Zap, RefreshCw } from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const dispatch = useAppDispatch();
  const { metrics, weeklyActivity, engagementTrends, fromCache, isLoading } = useAppSelector(
    (state) => state.analytics
  );
  const { posts } = useAppSelector((state) => state.posts);
  const { auditLogs } = useAppSelector((state) => state.users);

  const loadData = () => {
    dispatch(fetchAnalyticsOverview());
    dispatch(fetchPosts({ page: 0, size: 20 }));
    dispatch(fetchAuditLogs(20));
  };

  useEffect(() => {
    loadData();
  }, [dispatch]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / System Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold uppercase tracking-wider">
              System Active
            </span>
            {fromCache && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 font-mono">
                <Zap className="w-3 h-3" />
                Redis Cache Hit
              </span>
            )}
          </div>
          <h2 className="text-base font-bold tracking-tight text-white mt-1">
            Enterprise Social Command Center
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Synchronized with PostgreSQL 16, Redis Cache, and Apache Kafka Event Stream.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
          <button
            onClick={() => onNavigate('composer')}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            Create Post
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <StatCards metrics={metrics} />

      {/* Charts Visualization Section */}
      <Charts weeklyActivity={weeklyActivity} engagementTrends={engagementTrends} />

      {/* 2-Column Split: Upcoming Scheduled Queue & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingQueue posts={posts} onOpenCalendar={() => onNavigate('calendar')} />
        <RecentActivity logs={auditLogs} onOpenAuditLogs={() => onNavigate('audit')} />
      </div>
    </div>
  );
};
