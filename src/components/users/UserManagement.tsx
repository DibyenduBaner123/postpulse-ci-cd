import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchUsers, updateUserRole, inviteNewUser } from '../../store/slices/userSlice';
import { addToast } from '../../store/slices/notificationSlice';
import { UserRole, User } from '../../types';
import { RoleBadge } from '../common/Badge';
import { Users, UserPlus, Shield, Check, Lock, AlertCircle, X } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { users, isLoading } = useAppSelector((state) => state.users);
  const { user: currentUser } = useAppSelector((state) => state.auth);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('EDITOR');
  const [inviteDepartment, setInviteDepartment] = useState('Marketing');

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const isAdmin = currentUser?.role === 'ADMIN';

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!isAdmin) {
      dispatch(
        addToast({
          type: 'error',
          title: 'Permission Denied (403)',
          message: 'Only ADMIN users have permission to alter team RBAC roles.',
        })
      );
      return;
    }

    try {
      await dispatch(updateUserRole({ id: userId, role: newRole })).unwrap();
      dispatch(
        addToast({
          type: 'success',
          title: 'Role Updated',
          message: `User role successfully assigned to ${newRole}.`,
        })
      );
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err || 'Failed to update user role' }));
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(
        inviteNewUser({
          name: inviteName,
          email: inviteEmail,
          role: inviteRole,
          department: inviteDepartment,
        })
      ).unwrap();

      dispatch(
        addToast({
          type: 'success',
          title: 'Member Invited',
          message: `Invitation sent to ${inviteEmail} with role ${inviteRole}.`,
        })
      );

      setShowInviteModal(false);
      setInviteName('');
      setInviteEmail('');
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err || 'Failed to invite user' }));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Team & Role-Based Access Control (RBAC)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure operator permissions across Admin, Manager, Editor, and Viewer tiers.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Team Member</span>
        </button>
      </div>

      {/* RBAC Permission Matrix Reference */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-indigo-600" />
          <span>RBAC Privilege Hierarchy</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 space-y-1">
            <span className="font-bold text-purple-900 block">ADMIN</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Full system control: modify user roles, audit logs, external OAuth connections, DLQ replay, and cache.
            </p>
          </div>
          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-1">
            <span className="font-bold text-blue-900 block">MANAGER</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Team coordinator: invite members, schedule posts, manage social accounts, and view analytics.
            </p>
          </div>
          <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 space-y-1">
            <span className="font-bold text-emerald-900 block">EDITOR</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Content specialist: compose, edit, schedule, save drafts, and publish to connected channels.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">VIEWER</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Read-only stakeholder: inspect dashboards, review analytics, and view content calendar.
            </p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-between">
          <span>Active Team Operators ({users.length})</span>
          {!isAdmin && (
            <span className="text-[11px] text-amber-600 flex items-center gap-1 font-normal">
              <Lock className="w-3 h-3" />
              Role modification restricted to ADMIN accounts
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">User</th>
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold">Role Tier</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Role Assignment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80'}
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">{u.name}</span>
                        <span className="text-slate-400 font-mono text-[11px]">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{u.department}</td>
                  <td className="py-3 px-4">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <select
                      value={u.role}
                      disabled={!isAdmin || u.id === currentUser?.id}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="EDITOR">EDITOR</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleInviteSubmit}
            className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Invite New Team Member</h3>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Smith"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jordan@postpulse.io"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Assigned Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="EDITOR">EDITOR</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Department</label>
                  <input
                    type="text"
                    value={inviteDepartment}
                    onChange={(e) => setInviteDepartment(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
              >
                Send Invite
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
