import React, { useState } from 'react';
import { Package, Lock, User, ArrowRight, ShieldCheck, Check, Info } from 'lucide-react';
import { api, setAuthToken, setStoredUser } from '../api';

export default function AuthModal({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fillCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.login(username, password);
      setAuthToken(data.token);
      setStoredUser(data.user);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Invalid login credentials. Please use one of the accounts below.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.demoSwitch(role);
      setAuthToken(data.token);
      setStoredUser(data.user);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Failed demo switch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Banner */}
        <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 p-6 text-white text-center relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto mb-2.5">
            <Package className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">OmniStock Management</h2>
          <p className="text-xs text-indigo-200 mt-0.5">Enterprise Inventory, Purchasing, POS & Supply Chain</p>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold leading-relaxed">
              {error}
            </div>
          )}

          {/* Quick Auto-fill buttons */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              <span>Select Role to Autofill</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => fillCredentials('admin', 'admin123')}
                className={`py-1.5 px-2 rounded-lg font-medium border text-center transition-colors ${
                  username === 'admin' 
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('manager', 'manager123')}
                className={`py-1.5 px-2 rounded-lg font-medium border text-center transition-colors ${
                  username === 'manager' 
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('cashier', 'cashier123')}
                className={`py-1.5 px-2 rounded-lg font-medium border text-center transition-colors ${
                  username === 'cashier' 
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Cashier
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Username or Email</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin123"
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Instant Demo Login */}
          <div className="pt-3 border-t border-slate-100">
            <span className="block text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              ⚡ Instant 1-Click Test Login
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="py-1.5 px-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200 transition-colors"
              >
                Log as Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('manager')}
                className="py-1.5 px-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200 transition-colors"
              >
                Log as Manager
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('cashier')}
                className="py-1.5 px-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-xs font-semibold text-slate-700 border border-slate-200 transition-colors"
              >
                Log as Cashier
              </button>
            </div>
          </div>

          {/* Preset Credentials Summary Table */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
            <div className="font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-indigo-500" />
              Verified Accounts:
            </div>
            <div className="grid grid-cols-2 gap-y-1 font-mono text-[10px]">
              <div>👤 <span className="font-semibold">admin</span> : admin123</div>
              <div>👤 <span className="font-semibold">manager</span> : manager123</div>
              <div>👤 <span className="font-semibold">cashier</span> : cashier123</div>
              <div>👤 <span className="font-semibold">staff</span> : staff123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
