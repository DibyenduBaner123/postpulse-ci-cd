import React, { useState } from 'react';
import {
  LayoutDashboard,
  PenTool,
  Calendar as CalendarIcon,
  FileText,
  Share2,
  BarChart3,
  Users,
  ShieldCheck,
  Cpu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { logoutUser, switchRoleDemo } from '../../store/slices/authSlice';
import { RoleBadge } from '../common/Badge';
import { UserRole } from '../../types';

export type NavTab =
  | 'dashboard'
  | 'composer'
  | 'calendar'
  | 'drafts'
  | 'accounts'
  | 'analytics'
  | 'users'
  | 'audit'
  | 'kafka';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenKafkaConsole: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, onOpenKafkaConsole }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode; requiredRoles?: UserRole[] }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'composer', label: 'Create Post', icon: <PenTool className="w-4 h-4" />, requiredRoles: ['ADMIN', 'MANAGER', 'EDITOR'] },
    { id: 'calendar', label: 'Content Calendar', icon: <CalendarIcon className="w-4 h-4" /> },
    { id: 'drafts', label: 'Drafts', icon: <FileText className="w-4 h-4" /> },
    { id: 'accounts', label: 'Connected Accounts', icon: <Share2 className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics & Reports', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'users', label: 'Team & RBAC', icon: <Users className="w-4 h-4" />, requiredRoles: ['ADMIN', 'MANAGER'] },
    { id: 'audit', label: 'Security Audit Logs', icon: <ShieldCheck className="w-4 h-4" />, requiredRoles: ['ADMIN', 'MANAGER'] },
  ];

  const handleRoleSwitch = (newRole: UserRole) => {
    dispatch(switchRoleDemo(newRole));
    setShowRoleSwitcher(false);
  };

  const currentRole = user?.role || 'VIEWER';

  return (
    <aside
      className={`bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 z-30 shrink-0 select-none ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-white tracking-tight text-base leading-tight">PostPulse</span>
              <span className="text-[10px] text-indigo-400 font-medium tracking-wide uppercase">Enterprise Suite</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isAllowed = !item.requiredRoles || item.requiredRoles.includes(currentRole);
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (isAllowed) onSelectTab(item.id);
              }}
              disabled={!isAllowed}
              title={!isAllowed ? `Requires ${item.requiredRoles?.join(' or ')} permission` : item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isAllowed
                  ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  : 'text-slate-600 cursor-not-allowed opacity-60'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <div className="shrink-0">{item.icon}</div>
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {!isCollapsed && !isAllowed && (
                <span className="ml-auto text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 font-semibold">
                  Locked
                </span>
              )}
            </button>
          );
        })}

        {/* Separator */}
        <div className="pt-2 pb-1">
          <div className="border-t border-slate-800" />
        </div>

        {/* Kafka & Cache Console Launcher */}
        <button
          onClick={onOpenKafkaConsole}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-amber-400 hover:bg-amber-950/30 hover:text-amber-300 ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title="Kafka & Redis Event Console"
        >
          <Cpu className="w-4 h-4 shrink-0 text-amber-400" />
          {!isCollapsed && (
            <div className="flex items-center justify-between w-full">
              <span className="truncate">Kafka & Redis Bus</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          )}
        </button>
      </div>

      {/* Role Switcher Demo Box (For Examiners and Testing) */}
      {!isCollapsed && (
        <div className="px-3 py-2 mx-2 mb-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              RBAC Role Simulator
            </span>
            <RoleBadge role={currentRole} />
          </div>
          <p className="text-[11px] text-slate-400 mb-2 leading-tight">Switch user role to test permissions:</p>
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            {(['ADMIN', 'MANAGER', 'EDITOR', 'VIEWER'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => handleRoleSwitch(r)}
                className={`py-1 px-1.5 rounded font-medium text-center transition-colors ${
                  currentRole === r
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <img
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80'}
            alt={user?.name || 'User'}
            className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-700"
          />
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-white truncate leading-snug">{user?.name}</span>
              <span className="text-[10px] text-slate-400 truncate">{user?.email}</span>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <button
            onClick={() => dispatch(logoutUser())}
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
