import React from 'react';

interface ChartsProps {
  weeklyActivity: Array<{ day: string; scheduled: number; published: number }>;
  engagementTrends: Array<{ date: string; impressions: number; engagements: number; clicks: number }>;
}

export const Charts: React.FC<ChartsProps> = ({ weeklyActivity, engagementTrends }) => {
  // SVG Area Chart calculation for Engagement Trends
  const trendData = engagementTrends.length > 0 ? engagementTrends : [
    { date: 'Oct 18', impressions: 4200, engagements: 280, clicks: 120 },
    { date: 'Oct 20', impressions: 5800, engagements: 390, clicks: 170 },
    { date: 'Oct 22', impressions: 7100, engagements: 510, clicks: 230 },
    { date: 'Oct 24', impressions: 6400, engagements: 440, clicks: 195 },
    { date: 'Oct 26', impressions: 8900, engagements: 620, clicks: 310 },
    { date: 'Oct 28', impressions: 12500, engagements: 890, clicks: 450 },
    { date: 'Oct 30', impressions: 15400, engagements: 1120, clicks: 580 },
    { date: 'Nov 01', impressions: 14200, engagements: 980, clicks: 510 },
  ];

  const maxImp = Math.max(...trendData.map((d) => d.impressions), 16000);
  const chartHeight = 160;
  const chartWidth = 500;

  const points = trendData.map((d, i) => {
    const x = (i / (trendData.length - 1)) * chartWidth;
    const y = chartHeight - (d.impressions / maxImp) * (chartHeight - 20) - 10;
    return { x, y, data: d };
  });

  const linePath = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const areaPath = `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  // Platform Performance comparison data
  const platformData = [
    { name: 'X (Twitter)', percent: 72, color: 'bg-slate-900', count: '34.2K impr' },
    { name: 'LinkedIn', percent: 89, color: 'bg-sky-700', count: '48.5K impr' },
    { name: 'Instagram', percent: 64, color: 'bg-pink-600', count: '28.9K impr' },
    { name: 'Facebook', percent: 45, color: 'bg-blue-600', count: '18.4K impr' },
    { name: 'YouTube', percent: 55, color: 'bg-red-600', count: '22.1K impr' },
  ];

  // Weekly activity data
  const weekly = weeklyActivity.length > 0 ? weeklyActivity : [
    { day: 'Mon', scheduled: 2, published: 3 },
    { day: 'Tue', scheduled: 4, published: 4 },
    { day: 'Wed', scheduled: 1, published: 5 },
    { day: 'Thu', scheduled: 5, published: 2 },
    { day: 'Fri', scheduled: 3, published: 6 },
    { day: 'Sat', scheduled: 2, published: 1 },
    { day: 'Sun', scheduled: 4, published: 2 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chart 1: Impressions & Engagement Trends Over Time */}
      <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Impressions & Audience Growth</h3>
            <p className="text-xs text-slate-500">Cross-channel reach trend across active publication cycles</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span>Impressions</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span>Engagements</span>
            </span>
          </div>
        </div>

        {/* SVG Area Chart */}
        <div className="w-full overflow-hidden">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 overflow-visible">
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal guide grids */}
            {[0.25, 0.5, 0.75, 1].map((ratio, idx) => (
              <line
                key={idx}
                x1="0"
                y1={chartHeight * ratio}
                x2={chartWidth}
                y2={chartHeight * ratio}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
            ))}

            {/* Area & Line */}
            <path d={areaPath} fill="url(#areaGradient)" />
            <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />

            {/* Dots */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="3.5"
                className="fill-white stroke-indigo-600 stroke-[2] transition-transform hover:scale-150"
              />
            ))}
          </svg>

          {/* X Axis Labels */}
          <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-100">
            {trendData.map((d, i) => (
              <span key={i}>{d.date}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 2: Platform-Wise Performance Breakdown */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Platform Performance</h3>
              <p className="text-xs text-slate-500">Share of impressions</p>
            </div>
            <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
              LinkedIn #1
            </span>
          </div>

          <div className="space-y-3.5">
            {platformData.map((plat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700">{plat.name}</span>
                  <span className="text-slate-500 font-mono tabular-nums">{plat.count}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`${plat.color} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${plat.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 mt-4 text-[11px] text-slate-400 flex justify-between">
          <span>Target Reach: 100K</span>
          <span className="font-mono text-slate-700 font-medium">Progress: 79.7%</span>
        </div>
      </div>

      {/* Chart 3: Weekly Activity Distribution (Scheduled vs Published) */}
      <div className="lg:col-span-3 bg-white p-5 rounded-xl border border-slate-200/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Weekly Cadence: Scheduled vs Published Posts</h3>
            <p className="text-xs text-slate-500">Distribution of content releases across days of the week</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-600" />
              <span>Published</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-200" />
              <span>Scheduled</span>
            </span>
          </div>
        </div>

        {/* Weekly Bar Chart */}
        <div className="grid grid-cols-7 gap-3 pt-3">
          {weekly.map((w, idx) => {
            const maxPosts = 10;
            const pubHeight = (w.published / maxPosts) * 100;
            const schHeight = (w.scheduled / maxPosts) * 100;

            return (
              <div key={idx} className="flex flex-col items-center">
                <div className="h-28 w-full flex items-end justify-center gap-1.5 pb-2">
                  <div
                    className="w-5 bg-indigo-600 rounded-t transition-all duration-300 hover:opacity-90 relative group"
                    style={{ height: `${Math.max(pubHeight, 8)}%` }}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-mono pointer-events-none">
                      {w.published}
                    </span>
                  </div>
                  <div
                    className="w-5 bg-indigo-200 rounded-t transition-all duration-300 hover:opacity-90 relative group"
                    style={{ height: `${Math.max(schHeight, 8)}%` }}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-mono pointer-events-none">
                      {w.scheduled}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-600 font-mono mt-1">{w.day}</span>
                <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                  {w.published + w.scheduled} posts
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
