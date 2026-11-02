import React, { useState } from 'react';
import { Search, Bell, Plus, Check, ExternalLink, Activity } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { markAsRead } from '../../store/slices/notificationSlice';
import { NavTab } from './Sidebar';
import { RoleBadge } from '../common/Badge';

interface TopNavbarProps {
  activeTab: NavTab;
  onOpenComposer: () => void;
  onOpenKafkaConsole: () => void;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Operational Dashboard', subtitle: 'Real-time multi-platform audience engagement and delivery metrics' },
  composer: { title: 'Multi-Platform Post Composer', subtitle: 'Craft, validate, preview, and syndicate content across social channels' },
  calendar: { title: 'Interactive Content Calendar', subtitle: 'Schedule, drag-and-drop reschedule, and manage scheduled publication queues' },
  drafts: { title: 'Draft Management', subtitle: 'Autosaved drafts, multi-channel templates, and version control' },
  accounts: { title: 'Connected Social Accounts', subtitle: 'AES-256-GCM encrypted OAuth credentials and platform rate limits' },
  analytics: { title: 'Analytics & Performance', subtitle: 'Cross-platform audience engagement, click-through rates, and telemetry' },
  users: { title: 'Team & RBAC Management', subtitle: 'Role-Based Access Control and fine-grained operator permissions' },
  audit: { title: 'Security Audit Logs', subtitle: 'Immutable audit trail with correlation IDs and forensic metadata' },
  kafka: { title: 'Kafka & Redis Console', subtitle: 'Event-driven broker architecture, topic offsets, and DLQ recovery' },
};

export const TopNavbar: React.FC<TopNavbarProps> = ({ activeTab, onOpenComposer, onOpenKafkaConsole }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { notifications, unreadCount } = useAppSelector((state) => state.notifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const currentMeta = TAB_TITLES[activeTab] || { title: 'Dashboard', subtitle: '' };
  const canCreatePost = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'EDITOR';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Breadcrumbs & Section Title */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span>PostPulse</span>
          <span>/</span>
          <span className="text-slate-900 font-semibold capitalize">{activeTab}</span>
        </div>
        <h1 className="text-sm font-bold text-slate-900 leading-tight">{currentMeta.title}</h1>
      </div>

      {/* Right: Actions, Search, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Global Search Input */}
        <div className="relative hidden md:block w-56">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search posts, drafts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Kafka Broker Live Pulse Button */}
        <button
          onClick={onOpenKafkaConsole}
          className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-xs text-slate-600 transition-colors"
          title="Open Kafka & Redis Event Console"
        >
          <Activity className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          <span className="font-mono text-[11px] font-medium text-slate-700">Kafka Bus: Active</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs font-bold text-slate-900">Notifications ({unreadCount} unread)</span>
                <span className="text-[11px] text-slate-500">Live Events</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <p className="p-4 text-xs text-slate-400 text-center">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs transition-colors ${n.read ? 'bg-white' : 'bg-indigo-50/40'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-slate-800">{n.title}</p>
                        {!n.read && (
                          <button
                            onClick={() => dispatch(markAsRead(n.id))}
                            className="text-slate-400 hover:text-indigo-600 p-0.5"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Primary CTA: Create Post */}
        {canCreatePost && (
          <button
            onClick={onOpenComposer}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Create Post</span>
          </button>
        )}

        {/* User Role Tag */}
        {user && <RoleBadge role={user.role} />}
      </div>
    </header>
  );
};
