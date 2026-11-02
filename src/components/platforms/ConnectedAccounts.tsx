import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchPlatforms,
  connectSocialAccount,
  disconnectSocialAccount,
} from '../../store/slices/platformSlice';
import { addToast } from '../../store/slices/notificationSlice';
import { SocialPlatformId, ConnectedAccount } from '../../types';
import { ShieldCheck, Share2, Plus, Unlink, Lock, CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';

export const ConnectedAccounts: React.FC = () => {
  const dispatch = useAppDispatch();
  const { platforms, connectedAccounts, isLoading } = useAppSelector((state) => state.platforms);
  const { user } = useAppSelector((state) => state.auth);

  const [connectModalPlatform, setConnectModalPlatform] = useState<SocialPlatformId | null>(null);
  const [customHandle, setCustomHandle] = useState('');
  const [customAccountName, setCustomAccountName] = useState('');

  useEffect(() => {
    dispatch(fetchPlatforms());
  }, [dispatch]);

  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const handleConnect = async () => {
    if (!connectModalPlatform) return;
    try {
      await dispatch(
        connectSocialAccount({
          platformId: connectModalPlatform,
          accountName: customAccountName || undefined,
          handle: customHandle || undefined,
        })
      ).unwrap();

      dispatch(
        addToast({
          type: 'success',
          title: 'Account Connected',
          message: `OAuth token encrypted via AES-256-GCM and stored securely in PostgreSQL.`,
        })
      );
      setConnectModalPlatform(null);
      setCustomHandle('');
      setCustomAccountName('');
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err || 'Failed to connect account' }));
    }
  };

  const handleDisconnect = async (platformId: string) => {
    try {
      await dispatch(disconnectSocialAccount(platformId)).unwrap();
      dispatch(addToast({ type: 'info', message: 'Social account disconnected.' }));
    } catch (err: any) {
      dispatch(addToast({ type: 'error', message: err || 'Failed to disconnect' }));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with AES Encryption Guarantee Callout */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-600" />
            <span>Connected Social Accounts</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authenticated third-party social integrations, credentials, and access limits.
          </p>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>AES-256-GCM Authenticated Encryption</span>
        </div>
      </div>

      {/* Security Architecture Explainer Banner */}
      <div className="bg-slate-900 text-slate-300 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
        <div className="flex items-center gap-2 text-white font-bold">
          <Lock className="w-4 h-4 text-indigo-400" />
          <span>Zero-Knowledge Credential Security Model</span>
        </div>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          PostPulse uses AES-GCM 256-bit encryption with a 96-bit initialization vector (IV) and 128-bit authentication tag to secure all external OAuth tokens in PostgreSQL. Raw access secrets are decrypted in-memory only when the Kafka dispatch worker executes a scheduled syndication. Tokens are never exposed to client browsers or application loggers.
        </p>
      </div>

      {/* Social Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {platforms.map((plat) => {
          const account = connectedAccounts.find((a) => a.platformId === plat.id);
          const isConnected = Boolean(account);

          return (
            <div
              key={plat.id}
              className="bg-white rounded-xl border border-slate-200/90 p-5 flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-xs"
                      style={{ backgroundColor: plat.color }}
                    >
                      {plat.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">{plat.name}</h3>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        Limit: {plat.characterLimit.toLocaleString()} chars
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      isConnected
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {isConnected ? 'Active' : 'Unlinked'}
                  </span>
                </div>

                {isConnected && account ? (
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={account.avatarUrl}
                        alt={account.accountName}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-900 block truncate">{account.accountName}</span>
                        <span className="text-[11px] font-mono text-slate-500 block truncate">{account.handle}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-mono text-slate-600">
                      <span>Followers:</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {account.followersCount.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-mono pt-1">
                      <KeyRound className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">Cipher: AES-GCM (Payload sealed)</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-4 border border-dashed border-slate-200 rounded-lg text-center space-y-1 bg-slate-50/50">
                    <p className="text-xs font-medium text-slate-600">No account connected</p>
                    <p className="text-[11px] text-slate-400">Authenticate to publish directly to {plat.name}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
                {canManage ? (
                  isConnected ? (
                    <button
                      onClick={() => handleDisconnect(plat.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>Disconnect</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setConnectModalPlatform(plat.id)}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Connect {plat.name.split(' ')[0]}</span>
                    </button>
                  )
                ) : (
                  <span className="text-[11px] text-slate-400">Admin/Manager required to modify</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Connect Account Modal */}
      {connectModalPlatform && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Simulate OAuth 2.0 Connection ({connectModalPlatform.toUpperCase()})
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              In production, this initiates the official OAuth redirect flow. For development, specify the account handle to store simulated AES-256-GCM encrypted tokens in PostgreSQL.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Account Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corporation HQ"
                  value={customAccountName}
                  onChange={(e) => setCustomAccountName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Channel Handle / URL</label>
                <input
                  type="text"
                  placeholder="e.g. @acme_hq"
                  value={customHandle}
                  onChange={(e) => setCustomHandle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setConnectModalPlatform(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
              >
                Encrypt & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
