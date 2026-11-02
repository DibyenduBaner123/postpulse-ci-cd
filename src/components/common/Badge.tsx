import React from 'react';
import { SocialPlatformId, PostStatus, UserRole } from '../../types';

interface PlatformBadgeProps {
  platform: SocialPlatformId;
  size?: 'sm' | 'md';
}

const PLATFORM_STYLES: Record<SocialPlatformId, { name: string; bg: string; text: string; dot: string }> = {
  twitter: { name: 'X (Twitter)', bg: 'bg-slate-100', text: 'text-slate-900', dot: 'bg-slate-900' },
  instagram: { name: 'Instagram', bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-500' },
  facebook: { name: 'Facebook', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-600' },
  linkedin: { name: 'LinkedIn', bg: 'bg-sky-50', text: 'text-sky-800', dot: 'bg-sky-700' },
  youtube: { name: 'YouTube', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-600' },
};

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({ platform, size = 'sm' }) => {
  const meta = PLATFORM_STYLES[platform] || { name: platform, bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' };
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-medium ${meta.bg} ${meta.text} ${textSize}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      <span>{meta.name}</span>
    </span>
  );
};

export const StatusBadge: React.FC<{ status: PostStatus; size?: 'sm' | 'md' }> = ({ status, size = 'sm' }) => {
  const styles: Record<PostStatus, { text: string; bg: string; color: string }> = {
    PUBLISHED: { text: 'Published', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', color: 'bg-emerald-500' },
    SCHEDULED: { text: 'Scheduled', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', color: 'bg-indigo-500' },
    DRAFT: { text: 'Draft', bg: 'bg-amber-50 text-amber-700 border-amber-200', color: 'bg-amber-500' },
    FAILED: { text: 'Failed', bg: 'bg-rose-50 text-rose-700 border-rose-200', color: 'bg-rose-500' },
    CANCELLED: { text: 'Cancelled', bg: 'bg-slate-100 text-slate-600 border-slate-200', color: 'bg-slate-400' },
  };

  const current = styles[status] || styles.DRAFT;
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border font-medium ${current.bg} ${textSize}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.color}`} />
      {current.text}
    </span>
  );
};

export const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const roleStyles: Record<UserRole, { label: string; bg: string; text: string }> = {
    ADMIN: { label: 'Admin', bg: 'bg-purple-100', text: 'text-purple-800' },
    MANAGER: { label: 'Manager', bg: 'bg-blue-100', text: 'text-blue-800' },
    EDITOR: { label: 'Editor', bg: 'bg-emerald-100', text: 'text-emerald-800' },
    VIEWER: { label: 'Viewer', bg: 'bg-slate-100', text: 'text-slate-700' },
  };

  const style = roleStyles[role] || roleStyles.VIEWER;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
};
