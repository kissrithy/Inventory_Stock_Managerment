import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Package, DollarSign, AlertTriangle, XCircle, ShoppingCart, 
  TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw, Plus, 
  ExternalLink, Layers, CheckCircle2, Truck
} from 'lucide-react';

export default function DashboardView({ onNavigate, onOpenStockIn }) {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [recent, setRecent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, chartsData, recentData] = await Promise.all([
        api.getDashboardStats(),
        api.getDashboardCharts(),
        api.getDashboardRecent()
      ]);
      setStats(statsData);
      setCharts(chartsData);
      setRecent(recentData);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading live inventory metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between">
        <div>
          <p className="font-semibold">Unable to fetch dashboard</p>
          <p className="text-sm">{error}</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  const kpis = stats?.kpis || {};
  const stockSummary = stats?.stockSummary || {};

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              ● Live Warehouse Feeds
            </span>
            <span className="text-xs text-slate-400">Synced just now</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Inventory Management Dashboard</h1>
          <p className="text-sm text-slate-300 mt-0.5">
            Real-time stock valuation, order processing, and supply chain tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            Launch POS
          </button>
          <button
            onClick={() => onNavigate('products', { openNew: true })}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
          <button
            onClick={() => onNavigate('purchases', { openNew: true })}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-sm font-medium border border-slate-700 transition-all"
          >
            <Truck className="w-4 h-4 text-indigo-400" />
            Purchase Order
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Products</span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900">{kpis.totalProducts.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-medium">Active Catalog items</span> across 3 warehouses
            </p>
          </div>
        </div>

        {/* Stock Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Stock Value</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900">${kpis.stockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-slate-500 mt-1">
              Retail valuation: <span className="font-semibold text-slate-700">${kpis.retailValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </p>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div 
          onClick={() => onNavigate('products', { filter: 'low' })}
          className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs hover:border-amber-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Low Stock Alert</span>
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-amber-900">{kpis.lowStock} Items</div>
            <p className="text-xs text-amber-700 mt-1 font-medium flex items-center gap-1">
              <span>Under minimum threshold</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </p>
          </div>
        </div>

        {/* Out of Stock */}
        <div 
          onClick={() => onNavigate('products', { filter: 'out' })}
          className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs hover:border-rose-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">Out of Stock</span>
            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-rose-900">{kpis.outOfStock} Items</div>
            <p className="text-xs text-rose-700 mt-1 font-medium flex items-center gap-1">
              <span>0 units remaining</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </p>
          </div>
        </div>
      </div>

      {/* Revenue & Purchases Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Sales Revenue</p>
            <p className="text-xl font-bold text-slate-800">${kpis.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-emerald-600 font-medium">{kpis.totalOrders} Completed Invoices</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Purchases Spend</p>
            <p className="text-xl font-bold text-slate-800">${kpis.totalPurchases.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-slate-500 font-medium">Supplier replenishment total</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Inventory Health Status</p>
            <p className="text-xl font-bold text-emerald-600">
              {kpis.totalProducts > 0 
                ? `${Math.round(((kpis.totalProducts - kpis.lowStock - kpis.outOfStock) / kpis.totalProducts) * 100)}%` 
                : '100%'} Optimal
            </p>
            <p className="text-xs text-slate-500 font-medium">{stockSummary.available || 0} Units in Safe Level</p>
          </div>
        </div>
      </div>

      {/* Main Charts & Categories Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Visualizer */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Sales & Purchases Activity</h2>
              <p className="text-xs text-slate-500">Comparison of daily transactions recorded in the system</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-3 h-3 rounded-full bg-indigo-600"></span> Sales
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-3 h-3 rounded-full bg-slate-400"></span> Purchases
              </span>
            </div>
          </div>

          <div className="h-64 flex items-end gap-3 pt-6 border-b border-slate-100 pb-2">
            {charts?.salesTrend?.length > 0 ? (
              charts.salesTrend.map((item, idx) => {
                const maxVal = Math.max(
                  ...charts.salesTrend.map(s => s.sales),
                  ...charts.purchasesTrend.map(p => p.purchases),
                  1000
                );
                const salesHeight = Math.max(12, Math.round((item.sales / maxVal) * 190));
                const matchPurchase = charts.purchasesTrend.find(p => p.date === item.date);
                const purchaseHeight = matchPurchase ? Math.max(12, Math.round((matchPurchase.purchases / maxVal) * 190)) : 10;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-12 hidden group-hover:flex flex-col items-center z-10 bg-slate-900 text-white text-[11px] py-1 px-2.5 rounded shadow pointer-events-none whitespace-nowrap">
                      <span>{item.date}</span>
                      <span className="font-semibold text-emerald-400">Sales: ${item.sales.toFixed(2)}</span>
                    </div>

                    <div className="w-full flex items-end justify-center gap-1 h-48">
                      <div 
                        style={{ height: `${salesHeight}px` }} 
                        className="w-full max-w-[18px] bg-indigo-600 rounded-t-sm transition-all group-hover:bg-indigo-500"
                      />
                      <div 
                        style={{ height: `${purchaseHeight}px` }} 
                        className="w-full max-w-[18px] bg-slate-300 rounded-t-sm transition-all group-hover:bg-slate-400"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 truncate max-w-[42px]">
                      {item.date.slice(5)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                No recent transaction history recorded yet.
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Aggregated by date</span>
            <button onClick={() => onNavigate('reports')} className="text-indigo-600 hover:text-indigo-700 font-medium">
              View Detailed Analytics →
            </button>
          </div>
        </div>

        {/* Stock Category Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <h2 className="text-base font-bold text-slate-900 mb-1">Stock by Category</h2>
          <p className="text-xs text-slate-500 mb-4">Inventory valuation and volume distribution</p>

          <div className="space-y-3.5 flex-1 overflow-y-auto">
            {charts?.categoryBreakdown?.map((cat, idx) => {
              const totalVal = stats?.kpis?.stockValue || 1;
              const percent = Math.min(100, Math.round(((cat.total_value || 0) / totalVal) * 100));
              const colors = ['bg-indigo-600', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
              const color = colors[idx % colors.length];

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 truncate max-w-[160px]">{cat.category}</span>
                    <span className="text-slate-500 font-mono">
                      ${(cat.total_value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${color} rounded-full transition-all`} 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{cat.product_count} products</span>
                    <span>{cat.total_stock} in stock</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 mt-auto border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Categories total: {charts?.categoryBreakdown?.length || 0}</span>
            <button onClick={() => onNavigate('products')} className="text-indigo-600 hover:text-indigo-800 font-medium">
              Manage Products →
            </button>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts & Quick Restock Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Low Stock & Out of Stock Alerts</h2>
              <p className="text-xs text-slate-500">Items requiring immediate reorder to prevent supply disruption</p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('products', { filter: 'low' })}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View All Alerts ({kpis.lowStock + kpis.outOfStock}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-5">SKU / Item</th>
                <th className="py-3 px-5">Category</th>
                <th className="py-3 px-5">Current Stock</th>
                <th className="py-3 px-5">Min Threshold</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recent?.lowStockAlerts?.length > 0 ? (
                recent.lowStockAlerts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900">{prod.name}</div>
                      <div className="text-xs font-mono text-slate-400">{prod.sku}</div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 text-xs">
                      {prod.category_name || 'General'}
                    </td>
                    <td className="py-3.5 px-5 font-bold font-mono">
                      <span className={prod.current_stock <= 0 ? 'text-rose-600' : 'text-amber-600'}>
                        {prod.current_stock}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 font-mono text-xs">
                      {prod.alert_quantity}
                    </td>
                    <td className="py-3.5 px-5">
                      {prod.current_stock <= 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                          Out of Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Low Stock
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => onNavigate('stock', { defaultTab: 'stock-in', productId: prod.id })}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Quick Restock +
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 text-sm">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                    All products are within healthy stock thresholds!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Purchases & Recent Sales Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Purchases */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Purchase Orders</h2>
              <p className="text-xs text-slate-500">Inbound supplier shipments & POs</p>
            </div>
            <button onClick={() => onNavigate('purchases')} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {recent?.recentPurchases?.map(po => (
              <div key={po.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">{po.po_number}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      po.status === 'Received' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {po.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{po.supplier_name || 'Vendor'} • {po.order_date}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 text-sm font-mono">${po.total_amount.toFixed(2)}</div>
                  <span className="text-[11px] text-emerald-600 font-medium">Inbound</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Sales & Invoices</h2>
              <p className="text-xs text-slate-500">POS checkout & customer orders</p>
            </div>
            <button onClick={() => onNavigate('sales')} className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {recent?.recentSales?.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-sm">{s.invoice_number}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {s.payment_status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{s.customer_name || 'Walk-in Customer'} • {s.sale_date}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 text-sm font-mono">${s.grand_total.toFixed(2)}</div>
                  <span className="text-[11px] text-slate-400 font-medium">{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
