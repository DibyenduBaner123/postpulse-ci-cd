import React, { useState, useEffect } from 'react';
import { CanaryStatus } from '../types/index.ts';
import {
  Server,
  Activity,
  AlertTriangle,
  RotateCcw,
  Play,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  Zap,
  Terminal,
} from 'lucide-react';

export const CanaryDashboard: React.FC = () => {
  const [canaryStatus, setCanaryStatus] = useState<CanaryStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/canary/status');
      const data = await res.json();
      setCanaryStatus(data);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const changeTrafficSplit = async (percentage: number) => {
    setIsLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/canary/traffic-split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percentage }),
      });
      const data = await res.json();
      setCanaryStatus(data.status);
      setActionMessage(`Promoted traffic split to ${percentage}% canary.`);
      appendLog(`[TRAFFIC ROUTE] Updated upstream canary weight to ${percentage}%. Stable weight: ${100 - percentage}%.`);
    } catch {
      setActionMessage('Failed to update traffic split.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerRollback = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/canary/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Operator initiated manual rollback' }),
      });
      const data = await res.json();
      setCanaryStatus(data.status);
      setActionMessage('Emergency rollback triggered: 100% traffic routed to Stable v1.0.0.');
      appendLog('[EMERGENCY ROLLBACK] Canary weight immediately set to 0%. Active upstream: backend-stable.');
    } catch {
      setActionMessage('Rollback failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const simulateTrafficBurst = async (errorSpike: boolean) => {
    setIsLoading(true);
    setActionMessage(null);
    try {
      appendLog(`[SIMULATION] Dispatching 50 HTTP synthetic requests (${errorSpike ? 'WITH Canary Error Spike' : 'Normal Traffic'})...`);
      const res = await fetch('/api/canary/simulate-traffic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestCount: 50, errorSpike }),
      });
      const data = await res.json();
      setCanaryStatus(data.status);

      if (data.autoRollbackTriggered) {
        appendLog(`🚨 [CRITICAL ALERT] Canary error rate exceeded 5% threshold (${(data.status.errorRate * 100).toFixed(2)}%)! Automated rollback triggered.`);
        setActionMessage('Circuit breaker tripped! Automated rollback reverted traffic to Stable.');
      } else {
        appendLog(`✓ [SUCCESS] 50 requests processed. Error rate: ${(data.status.errorRate * 100).toFixed(2)}%. Health: ${data.status.health}.`);
        setActionMessage(`Traffic burst simulated successfully.`);
      }
    } catch {
      setActionMessage('Traffic simulation request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const appendLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSimulationLogs((prev) => [`[${timestamp}] ${msg}`, ...prev.slice(0, 30)]);
  };

  const split = canaryStatus?.trafficSplitPercent ?? 10;
  const stableSplit = 100 - split;

  return (
    <div className="space-y-6">
      {/* Header and status banner */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                Canary Deployment Controller
              </h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                  canaryStatus?.health === 'healthy'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : canaryStatus?.health === 'degraded'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {canaryStatus?.health || 'Healthy'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Demonstrates Experiment 2: Side-by-side Stable vs Canary execution with weighted proxying and automated rollback.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => simulateTrafficBurst(false)}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 rounded-xl transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Simulate Normal Traffic</span>
            </button>
            <button
              onClick={() => simulateTrafficBurst(true)}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 text-amber-900 dark:text-amber-200 rounded-xl transition-all cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Inject Canary Errors</span>
            </button>
            <button
              onClick={triggerRollback}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Emergency Rollback</span>
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-indigo-900 dark:text-indigo-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <span className="font-medium">{actionMessage}</span>
          </div>
        )}

        {/* Live Topology Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          {/* Stable Node Card */}
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">backend-stable</h3>
                  <span className="text-[10px] font-mono text-zinc-500">v1.0.0 (Production Stable)</span>
                </div>
              </div>
              <span className="text-xl font-black font-mono text-blue-600 dark:text-blue-400">
                {stableSplit}%
              </span>
            </div>

            <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${stableSplit}%` }} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">Routed Requests</span>
                <span className="font-bold font-mono text-zinc-900 dark:text-white">
                  {canaryStatus?.stableRequests.toLocaleString() || '1,278'}
                </span>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">Health Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Passing (HTTP 200)</span>
              </div>
            </div>
          </div>

          {/* Canary Node Card */}
          <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">backend-canary</h3>
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                    {canaryStatus?.version || 'v1.1.0-canary'} (Candidate)
                  </span>
                </div>
              </div>
              <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">
                {split}%
              </span>
            </div>

            <div className="w-full h-2 bg-amber-200 dark:bg-amber-950 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${split}%` }} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">Canary Requests</span>
                <span className="font-bold font-mono text-zinc-900 dark:text-white">
                  {canaryStatus?.canaryRequests.toLocaleString() || '142'}
                </span>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">Error Rate</span>
                <span
                  className={`font-bold font-mono ${
                    (canaryStatus?.errorRate || 0) > 0.05
                      ? 'text-rose-600'
                      : (canaryStatus?.errorRate || 0) > 0.02
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {((canaryStatus?.errorRate || 0) * 100).toFixed(2)}% (Max 5%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Promotion Stages Buttons */}
        <div className="mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-2">
            Canary Promotion Stages (Nginx Upstream Weights)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[10, 25, 50, 100].map((stage) => {
              const isActive = split === stage;
              return (
                <button
                  key={stage}
                  onClick={() => changeTrafficSplit(stage)}
                  disabled={isLoading}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    isActive
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                      : 'bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:border-indigo-400'
                  }`}
                >
                  <span className="text-sm">{stage}% Traffic</span>
                  <span className="text-[10px] font-normal opacity-80">
                    {stage === 10 ? 'Initial Evaluation' : stage === 25 ? 'Stage 2 Ramp' : stage === 50 ? 'Half Load' : 'Full Promotion'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Routing & Event Logs */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-zinc-300 font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-zinc-400 mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-zinc-200">Canary Traffic & Health Event Stream</span>
          </div>
          <span className="text-[10px] text-zinc-500">Live Telemetry</span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
          {simulationLogs.length === 0 ? (
            <p className="text-zinc-600 italic">No events yet. Click 'Simulate Normal Traffic' or 'Inject Canary Errors' above.</p>
          ) : (
            simulationLogs.map((log, idx) => (
              <div key={idx} className="leading-relaxed">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
