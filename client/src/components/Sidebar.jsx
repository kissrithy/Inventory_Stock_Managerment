import React from 'react';
import { 
  LayoutDashboard, Package, ArrowLeftRight, Truck, ShoppingCart, 
  Building, Users, BarChart3, Shield, Warehouse, Sparkles
} from 'lucide-react';

export default function Sidebar({ currentView, onSelectView, user }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'products', label: 'Products & SKUs', icon: Package, badge: null },
    { id: 'stock', label: 'Stock Movements', icon: ArrowLeftRight, badge: 'Live' },
    { id: 'purchasing', label: 'Purchasing', icon: Truck, badge: null },
    { id: 'sales', label: 'Sales & POS', icon: ShoppingCart, badge: 'POS' },
    { id: 'suppliers', label: 'Suppliers', icon: Building, badge: null },
    { id: 'customers', label: 'Customers', icon: Users, badge: null },
    { id: 'reports', label: 'Reports & P&L', icon: BarChart3, badge: null },
    { id: 'admin', label: 'System Admin', icon: Shield, badge: user?.role === 'admin' ? 'Root' : null }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen text-slate-300 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-500/20">
          <Package className="w-6 h-6" />
        </div>
        <div>
          <div className="font-extrabold text-white text-base tracking-tight flex items-center gap-1.5">
            OmniStock
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              v1.0
            </span>
          </div>
          <div className="text-[11px] text-slate-400">Inventory & Supply Chain</div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Core Workflows
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User Status Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs uppercase shrink-0">
            {user?.username?.slice(0, 2) || 'AD'}
          </div>
          <div className="truncate">
            <div className="text-xs font-semibold text-slate-200 truncate">{user?.full_name || 'Staff User'}</div>
            <div className="text-[10px] text-slate-400 capitalize">{user?.role || 'Operator'} • {user?.department || 'Inventory'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
