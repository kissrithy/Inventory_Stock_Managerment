import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  BarChart3, DollarSign, TrendingUp, AlertTriangle, Download, 
  Printer, RefreshCw, FileText, ArrowUpRight, CheckCircle2 
} from 'lucide-react';

export default function ReportsView() {
  const [activeReport, setActiveReport] = useState('valuation');
  const [valuationData, setValuationData] = useState(null);
  const [lowStockData, setLowStockData] = useState([]);
  const [profitLoss, setProfitLoss] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [valRes, lowRes, plRes] = await Promise.all([
        api.getValuationReport(),
        api.getLowStockReport(),
        api.getProfitLossReport()
      ]);
      setValuationData(valRes);
      setLowStockData(lowRes.lowStock || []);
      setProfitLoss(plRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleExportCSV = (type) => {
    window.open(`/api/reports/export/${type}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reports & Inventory Valuation</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit inventory assets, evaluate gross profit margins, analyze reorder deficits, and download exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportCSV(activeReport === 'valuation' ? 'products' : 'sales')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* Report Selector Pills */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'valuation', label: 'Inventory Valuation', icon: DollarSign },
          { id: 'low-stock', label: 'Low Stock Deficit', icon: AlertTriangle },
          { id: 'profit-loss', label: 'Profit & Loss (P&L)', icon: TrendingUp }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeReport === tab.id
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
          Calculating live financial and valuation metrics...
        </div>
      ) : (
        <>
          {/* 1. INVENTORY VALUATION REPORT */}
          {activeReport === 'valuation' && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Stock Cost Value</span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
                    ${(valuationData?.totalCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Total invested capital in physical stock</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Retail Valuation</span>
                  <div className="text-2xl font-extrabold text-indigo-600 mt-2 font-mono">
                    ${(valuationData?.totalRetail || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Expected turnover at current selling prices</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Unrealized Potential Profit</span>
                  <div className="text-2xl font-extrabold text-emerald-700 mt-2 font-mono">
                    ${((valuationData?.totalRetail || 0) - (valuationData?.totalCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-emerald-700 mt-1">Gross potential markup on hand</p>
                </div>
              </div>

              {/* Detail Valuation Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900">Perpetual Stock Valuation Table</h3>
                  <span className="text-xs text-slate-500">{valuationData?.valuation?.length || 0} Catalog SKUs</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-5">SKU & Item</th>
                        <th className="py-3 px-5">Category</th>
                        <th className="py-3 px-5 text-right font-mono">Current Stock</th>
                        <th className="py-3 px-5 text-right font-mono">Unit Cost</th>
                        <th className="py-3 px-5 text-right font-mono">Unit Price</th>
                        <th className="py-3 px-5 text-right font-mono">Total Cost Value</th>
                        <th className="py-3 px-5 text-right font-mono">Total Retail Value</th>
                        <th className="py-3 px-5 text-right font-mono">Est. Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {valuationData?.valuation?.map(v => (
                        <tr key={v.id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-5">
                            <div className="font-semibold text-slate-900">{v.name}</div>
                            <div className="text-xs font-mono text-slate-400">{v.sku}</div>
                          </td>
                          <td className="py-3.5 px-5 text-xs text-slate-600">{v.category_name}</td>
                          <td className="py-3.5 px-5 text-right font-mono font-bold">{v.current_stock}</td>
                          <td className="py-3.5 px-5 text-right font-mono text-slate-600">${v.cost_price.toFixed(2)}</td>
                          <td className="py-3.5 px-5 text-right font-mono text-slate-900 font-semibold">${v.selling_price.toFixed(2)}</td>
                          <td className="py-3.5 px-5 text-right font-mono font-semibold">${v.stock_cost_value.toFixed(2)}</td>
                          <td className="py-3.5 px-5 text-right font-mono text-indigo-600 font-bold">${v.stock_retail_value.toFixed(2)}</td>
                          <td className="py-3.5 px-5 text-right font-mono text-emerald-600 font-bold">${v.potential_profit.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. LOW STOCK DEFICIT REPORT */}
          {activeReport === 'low-stock' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800 font-medium">
                  Showing all products that are at or below their configured minimum threshold point. Immediate purchase orders should be dispatched.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-5">SKU & Item</th>
                        <th className="py-3 px-5">Category & Brand</th>
                        <th className="py-3 px-5 text-right font-mono">Current Stock</th>
                        <th className="py-3 px-5 text-right font-mono">Min Threshold</th>
                        <th className="py-3 px-5 text-right font-mono">Deficit / Needed</th>
                        <th className="py-3 px-5 text-right font-mono">Unit Cost</th>
                        <th className="py-3 px-5 text-right font-mono">Restock Cost Est.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lowStockData.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-10 text-center text-slate-400">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                            No inventory deficits found! All products are stocked safely.
                          </td>
                        </tr>
                      ) : (
                        lowStockData.map(p => {
                          const needed = Math.max(0, p.alert_quantity - p.current_stock);
                          const estRestockCost = needed * p.cost_price;
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/70">
                              <td className="py-3.5 px-5">
                                <div className="font-semibold text-slate-900">{p.name}</div>
                                <div className="text-xs font-mono text-slate-400">{p.sku}</div>
                              </td>
                              <td className="py-3.5 px-5 text-xs text-slate-600">{p.category_name} ({p.brand_name || 'Generic'})</td>
                              <td className="py-3.5 px-5 text-right font-mono font-bold text-rose-600">{p.current_stock}</td>
                              <td className="py-3.5 px-5 text-right font-mono text-slate-600">{p.alert_quantity}</td>
                              <td className="py-3.5 px-5 text-right font-mono font-bold text-amber-700">+{needed}</td>
                              <td className="py-3.5 px-5 text-right font-mono text-slate-700">${p.cost_price.toFixed(2)}</td>
                              <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900">${estRestockCost.toFixed(2)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. PROFIT & LOSS REPORT */}
          {activeReport === 'profit-loss' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Sales Revenue</span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
                    ${(profitLoss?.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{profitLoss?.totalSalesCount} Completed Invoices</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost of Goods Sold (COGS)</span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">
                    ${(profitLoss?.cogs || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Direct product inventory acquisition cost</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Gross Realized Profit</span>
                  <div className="text-2xl font-extrabold text-emerald-700 mt-2 font-mono">
                    ${(profitLoss?.grossProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-emerald-700 mt-1">Revenue minus wholesale COGS</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
                  <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Net Gross Margin</span>
                  <div className="text-2xl font-extrabold text-indigo-700 mt-2 font-mono">
                    {profitLoss?.marginPercent || 0}%
                  </div>
                  <p className="text-xs text-indigo-700 mt-1">Efficiency markup ratio</p>
                </div>
              </div>

              {/* Procurement vs Sales comparison */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Cash Flow & Capital Allocation Breakdown</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Total Procurement Spend</span>
                      <span className="font-mono">${(profitLoss?.totalPurchases || 0).toFixed(2)}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-400 rounded-full" style={{ width: '70%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Total Sales Revenue</span>
                      <span className="font-mono text-emerald-600">${(profitLoss?.revenue || 0).toFixed(2)}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
