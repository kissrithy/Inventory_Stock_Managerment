import React, { useState, useEffect } from 'react';
import { 
  Bell, User, LogOut, ChevronDown, Check, AlertTriangle, 
  Warehouse, Sparkles, Key, ShieldCheck, ShoppingCart 
} from 'lucide-react';
import { api } from '../api';

export default function Navbar({ currentView, user, onSwitchUser, onLogout, onNavigate }) {
  const [alerts, setAlerts] = useState([]);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    // Poll or fetch low stock alerts
    api.getDashboardRecent().then(data => {
      setAlerts(data?.lowStockAlerts || []);
    }).catch(() => {});
  }, [currentView]);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Breadcrumb Title */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Inventory App</span>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-bold text-slate-800 capitalize">
          {currentView === 'pos' ? 'Point of Sale (POS)' : currentView}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Demo Role Switcher */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
          <span className="px-2 text-slate-400 font-semibold text-[11px] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            Switch:
          </span>
          {['admin', 'manager', 'cashier'].map(role => (
            <button
              key={role}
              onClick={() => onSwitchUser(role)}
              className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                user?.role === role
                  ? 'bg-white font-bold text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Low Stock Alerts Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsAlertOpen(!isAlertOpen)}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            {alerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {alerts.length}
              </span>
            )}
          </button>

          {isAlertOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Low Stock Threshold Alerts
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{alerts.length} items</span>
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No current stock warnings.</p>
                ) : (
                  alerts.map(a => (
                    <div
                      key={a.id}
                      onClick={() => {
                        setIsAlertOpen(false);
                        onNavigate('stock', { defaultTab: 'stock-in', productId: a.id });
                      }}
                      className="p-2 rounded-xl hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs border border-transparent hover:border-slate-100"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">{a.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{a.sku}</div>
                      </div>
                      <span className="font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        {a.current_stock} left
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 mt-2 border-t border-slate-100 text-center">
                <button
                  onClick={() => {
                    setIsAlertOpen(false);
                    onNavigate('products', { filter: 'low' });
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  View All in Product Catalog →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-100 text-left transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              {user?.username?.slice(0, 1).toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-bold text-slate-800 leading-tight">{user?.full_name || 'Admin'}</div>
              <div className="text-[10px] text-slate-400 capitalize">{user?.role}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-xs">
              <div className="p-2 border-b border-slate-100 mb-1">
                <p className="font-bold text-slate-900">{user?.full_name}</p>
                <p className="text-slate-400 text-[11px] truncate">{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onNavigate('admin');
                }}
                className="w-full text-left p-2 rounded-lg hover:bg-slate-50 text-slate-700 font-medium"
              >
                System Settings
              </button>

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onLogout();
                }}
                className="w-full text-left p-2 rounded-lg hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
