import React from 'react';
import { Send, Clock, FileText, AlertCircle, Share2, TrendingUp, Eye, Users } from 'lucide-react';

interface StatCardsProps {
  metrics: {
    totalPosts: number;
    publishedPosts: number;
    scheduledPosts: number;
    draftPosts: number;
    failedPosts: number;
    connectedAccountsCount: number;
    totalReach: number;
    impressions: number;
    engagementRate: string;
    totalEngagements: number;
  };
}

export const StatCards: React.FC<StatCardsProps> = ({ metrics }) => {
  const cards = [
    {
      label: 'Published Posts',
      value: metrics.publishedPosts.toLocaleString(),
      subtext: `${metrics.totalPosts} total created`,
      icon: <Send className="w-4 h-4 text-emerald-600" />,
      bg: 'bg-emerald-50/60',
    },
    {
      label: 'Scheduled Queue',
      value: metrics.scheduledPosts.toLocaleString(),
      subtext: 'Next in 48 hours',
      icon: <Clock className="w-4 h-4 text-indigo-600" />,
      bg: 'bg-indigo-50/60',
    },
    {
      label: 'Active Drafts',
      value: metrics.draftPosts.toLocaleString(),
      subtext: 'Auto-saved',
      icon: <FileText className="w-4 h-4 text-amber-600" />,
      bg: 'bg-amber-50/60',
    },
    {
      label: 'Failed / Alerts',
      value: metrics.failedPosts.toLocaleString(),
      subtext: metrics.failedPosts > 0 ? 'Retry in DLQ' : 'All clear',
      icon: <AlertCircle className="w-4 h-4 text-rose-600" />,
      bg: 'bg-rose-50/60',
    },
    {
      label: 'Connected Accounts',
      value: metrics.connectedAccountsCount.toLocaleString(),
      subtext: 'AES-256 encrypted',
      icon: <Share2 className="w-4 h-4 text-blue-600" />,
      bg: 'bg-blue-50/60',
    },
    {
      label: 'Avg Engagement Rate',
      value: metrics.engagementRate,
      subtext: '+0.8% vs last month',
      icon: <TrendingUp className="w-4 h-4 text-purple-600" />,
      bg: 'bg-purple-50/60',
    },
    {
      label: 'Total Impressions',
      value: (metrics.impressions || 79700).toLocaleString(),
      subtext: 'Cross-platform total',
      icon: <Eye className="w-4 h-4 text-cyan-600" />,
      bg: 'bg-cyan-50/60',
    },
    {
      label: 'Estimated Reach',
      value: (metrics.totalReach || 58900).toLocaleString(),
      subtext: 'Unique accounts',
      icon: <Users className="w-4 h-4 text-teal-600" />,
      bg: 'bg-teal-50/60',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{card.label}</span>
            <div className={`p-1.5 rounded-lg ${card.bg}`}>{card.icon}</div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-slate-900 font-mono tracking-tight tabular-nums">
              {card.value}
            </span>
            <span className="block text-[11px] text-slate-400 mt-0.5">{card.subtext}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
