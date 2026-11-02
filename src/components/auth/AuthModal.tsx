import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { loginUser, registerUser, clearAuthError, switchRoleDemo } from '../../store/slices/authSlice';
import { addToast } from '../../store/slices/notificationSlice';
import { UserRole } from '../../types';
import { Lock, Mail, User, Shield, Sparkles, Layers, ArrowRight, Check } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('Marketing');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearAuthError());

    if (mode === 'login') {
      try {
        await dispatch(loginUser({ email, password })).unwrap();
        dispatch(
          addToast({
            type: 'success',
            title: 'Welcome Back',
            message: 'Authenticated successfully via JWT Access & Refresh Token flow.',
          })
        );
      } catch (err: any) {
        // Error handled in slice
      }
    } else {
      try {
        await dispatch(registerUser({ name, email, password, department })).unwrap();
        dispatch(
          addToast({
            type: 'success',
            title: 'Registration Complete',
            message: 'Your account was created and assigned the default EDITOR role.',
          })
        );
      } catch (err: any) {
        // Error handled in slice
      }
    }
  };

  const handleQuickDemo = (role: UserRole) => {
    dispatch(switchRoleDemo(role));
    dispatch(
      addToast({
        type: 'info',
        title: `Logged In as ${role}`,
        message: `Session initialized with full ${role} RBAC authorities.`,
      })
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col">
        {/* Modal Brand Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white text-center relative">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-indigo-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">PostPulse</h2>
          <p className="text-xs text-slate-300 mt-1">Multi-Platform Social Media Management System</p>
        </div>

        {/* 1-Click Evaluation Demo Logins */}
        <div className="p-4 bg-indigo-50/60 border-b border-indigo-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase text-indigo-900 tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              1-Click Role Testing Logins:
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Password: Pulse123!</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleQuickDemo('ADMIN')}
              className="py-1.5 px-2 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 text-center transition-colors shadow-2xs"
            >
              ADMIN
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('MANAGER')}
              className="py-1.5 px-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-900 text-center transition-colors shadow-2xs"
            >
              MANAGER
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('EDITOR')}
              className="py-1.5 px-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-center transition-colors shadow-2xs"
            >
              EDITOR
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('VIEWER')}
              className="py-1.5 px-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-center transition-colors shadow-2xs"
            >
              VIEWER
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              dispatch(clearAuthError());
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-all ${
              mode === 'login'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 bg-slate-50'
            }`}
          >
            Sign In with JWT
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              dispatch(clearAuthError());
            }}
            className={`flex-1 py-3 text-center border-b-2 transition-all ${
              mode === 'register'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 bg-slate-50'
            }`}
          >
            Create New Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 leading-relaxed">
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="admin@postpulse.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isLoading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-400">
          Encrypted with PBKDF2/BCrypt hashing and stateless JWT bearer tokens.
        </div>
      </div>
    </div>
  );
};
