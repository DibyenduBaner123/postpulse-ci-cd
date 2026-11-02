import React from 'react';
import { Activity, CheckCircle, Clock, AlertTriangle, Layers } from 'lucide-react';
import { AuditLogItem } from '../../types';

interface RecentActivityProps {
  logs: AuditLogItem[];
  onOpenAuditLogs: () => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ logs, onOpenAuditLogs }) => {
  const displayLogs = logs.slice(0, 5);

  const getActionBadge = (action: string) => {
    if (action.includes('PUBLISH')) {
      return <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
    if (action.includes('SCHEDULE')) {
      return <Clock className="w-4 h-4 text-indigo-500 shrink-0" />;
    }
    if (action.includes('FAILED') || action.includes('ERROR')) {
      return <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />;
    }
    return <Layers className="w-4 h-4 text-blue-500 shrink-0" />;
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/80 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Recent System Activities</h3>
          </div>
          <button
            onClick={onOpenAuditLogs}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Audit Trail →
          </button>
        </div>

        {displayLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No recent activities recorded.</p>
        ) : (
          <div className="space-y-3">
            {displayLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-xs">
                <div className="mt-0.5">{getActionBadge(log.action)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 font-mono text-[11px]">{log.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 truncate mt-0.5">{log.details}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-mono">
                    <span>By: {log.userEmail.split('@')[0]}</span>
                    <span>·</span>
                    <span className="truncate">CID: {log.correlationId.slice(0, 14)}...</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between">
        <span>Security: Immutable</span>
        <span>Correlation IDs: Enforced</span>
      </div>
    </div>
  );
};
