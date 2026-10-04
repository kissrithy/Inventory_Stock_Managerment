import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  ArrowDownLeft, ArrowUpRight, ArrowLeftRight, SlidersHorizontal, 
  History, Plus, RefreshCw, X, Check, AlertCircle, Warehouse, 
  Search, Filter, Calendar, FileText
} from 'lucide-react';

export default function StockView({ defaultTab = 'ledger', preselectedProductId = null }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for ledger
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Stock In / Out Modal State
  const [actionModal, setActionModal] = useState(null); // 'in' | 'out' | 'adjust' | 'transfer'
  const [selectedProduct, setSelectedProduct] = useState(preselectedProductId || '');
  const [selectedWarehouse, setSelectedWarehouse] = useState('1');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [reason, setReason] = useState('Physical Inventory Count');
  const [notes, setNotes] = useState('');

  // Transfer State
  const [fromWh, setFromWh] = useState('1');
  const [toWh, setToWh] = useState('2');
  const [transferItems, setTransferItems] = useState([{ product_id: '', quantity: '' }]);

  // Adjustment State (multi-item)
  const [adjustmentItems, setAdjustmentItems] = useState([{ product_id: '', type: 'addition', quantity: '' }]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [movData, prodsData, whsData, trfData] = await Promise.all([
        api.getStockMovements({ movement_type: typeFilter || undefined, limit: 100 }),
        api.getProducts(),
        api.getWarehouses(),
        api.getTransfers()
      ]);
      setMovements(movData.movements || []);
      setProducts(prodsData.products || []);
      setWarehouses(whsData.warehouses || []);
      setTransfers(trfData.transfers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter]);

  const handleStockInSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.stockIn({
        product_id: selectedProduct,
        warehouse_id: selectedWarehouse,
        quantity: parseFloat(quantity),
        unit_cost: unitCost ? parseFloat(unitCost) : undefined,
        notes
      });
      setSuccessMsg('Stock In registered and ledger balance updated!');
      setActionModal(null);
      resetForms();
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Error processing stock in');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStockOutSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.stockOut({
        product_id: selectedProduct,
        warehouse_id: selectedWarehouse,
        quantity: parseFloat(quantity),
        notes
      });
      setSuccessMsg('Stock Out deducted and ledger recorded!');
      setActionModal(null);
      resetForms();
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Error processing stock out');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const validItems = adjustmentItems.filter(it => it.product_id && parseFloat(it.quantity) > 0);
      if (!validItems.length) {
        throw new Error('Please specify at least one valid adjustment item.');
      }
      await api.adjustStock({
        warehouse_id: selectedWarehouse,
        reason,
        notes,
        items: validItems
      });
      setSuccessMsg('Stock adjustments reconciled successfully!');
      setActionModal(null);
      resetForms();
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Error adjusting stock');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      if (fromWh === toWh) {
        throw new Error('Source and destination warehouses cannot be the same');
      }
      const validItems = transferItems.filter(it => it.product_id && parseFloat(it.quantity) > 0);
      if (!validItems.length) {
        throw new Error('Please select items to transfer with positive quantity.');
      }
      await api.transferStock({
        from_warehouse_id: fromWh,
        to_warehouse_id: toWh,
        notes,
        items: validItems
      });
      setSuccessMsg('Inter-warehouse stock transfer dispatched!');
      setActionModal(null);
      resetForms();
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Error transferring stock');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForms = () => {
    setQuantity('');
    setUnitCost('');
    setNotes('');
    setAdjustmentItems([{ product_id: '', type: 'addition', quantity: '' }]);
    setTransferItems([{ product_id: '', quantity: '' }]);
  };

  const filteredMovements = movements.filter(m => {
    if (!searchFilter) return true;
    const s = searchFilter.toLowerCase();
    return (
      m.product_name?.toLowerCase().includes(s) ||
      m.product_sku?.toLowerCase().includes(s) ||
      m.reference_id?.toLowerCase().includes(s) ||
      m.movement_type?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Stock Movements & Warehouse Ledger</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit perpetual inventory, log inbound/outbound movements, adjustments, and inter-facility transfers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => { setActionModal('in'); resetForms(); }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <ArrowDownLeft className="w-4 h-4" />
            + Stock In
          </button>
          <button
            onClick={() => { setActionModal('out'); resetForms(); }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            - Stock Out
          </button>
          <button
            onClick={() => { setActionModal('adjust'); resetForms(); }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Adjust Stock
          </button>
          <button
            onClick={() => { setActionModal('transfer'); resetForms(); }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Transfer Stock
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800 text-xs">Dismiss</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === 'ledger'
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          Stock Movement Ledger
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
            activeTab === 'transfers'
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Warehouse className="w-4 h-4" />
          Warehouse Transfers Log ({transfers.length})
        </button>
      </div>

      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter ledger by product name, SKU, or reference..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none"
              >
                <option value="">All Movement Types</option>
                <option value="Opening Stock">Opening Stock</option>
                <option value="Purchase In">Purchase In</option>
                <option value="Sale Out">Sale Out</option>
                <option value="Stock In">Manual Stock In</option>
                <option value="Stock Out">Manual Stock Out</option>
                <option value="Adjustment (+)">Adjustment (+)</option>
                <option value="Adjustment (-)">Adjustment (-)</option>
                <option value="Transfer In">Transfer In</option>
                <option value="Transfer Out">Transfer Out</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing {filteredMovements.length} ledger events
            </div>
          </div>

          {/* Movements Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-5">Date & Time</th>
                    <th className="py-3 px-5">Product Details</th>
                    <th className="py-3 px-5">Movement Type</th>
                    <th className="py-3 px-5">Reference</th>
                    <th className="py-3 px-5">Warehouse</th>
                    <th className="py-3 px-5 text-right">Change Qty</th>
                    <th className="py-3 px-5 text-right">Running Stock</th>
                    <th className="py-3 px-5">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                        Loading stock ledger entries...
                      </td>
                    </tr>
                  ) : filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        No movement entries found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((m) => {
                      const isPositive = m.quantity > 0;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-5 text-xs text-slate-500 whitespace-nowrap font-mono">
                            {m.created_at}
                          </td>

                          <td className="py-3.5 px-5">
                            <div className="font-semibold text-slate-900">{m.product_name}</div>
                            <div className="text-xs font-mono text-slate-400">{m.product_sku}</div>
                          </td>

                          <td className="py-3.5 px-5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              m.movement_type.includes('In') || m.movement_type.includes('(+)')
                                ? 'bg-emerald-100 text-emerald-800'
                                : m.movement_type.includes('Out') || m.movement_type.includes('(-)')
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}>
                              {m.movement_type}
                            </span>
                          </td>

                          <td className="py-3.5 px-5 font-mono text-xs text-slate-600">
                            {m.reference_id || '—'}
                          </td>

                          <td className="py-3.5 px-5 text-xs text-slate-600">
                            {m.warehouse_name || 'Central Hub'}
                          </td>

                          <td className={`py-3.5 px-5 text-right font-bold font-mono ${
                            isPositive ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {isPositive ? `+${m.quantity}` : m.quantity}
                          </td>

                          <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-900">
                            <div className="flex items-center justify-end gap-1.5 text-xs">
                              <span className="text-slate-400 font-normal">{m.before_stock} →</span>
                              <span className="text-slate-900">{m.after_stock}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-5 text-xs text-slate-500">
                            {m.user_name || 'System / Auto'}
                          </td>
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

      {activeTab === 'transfers' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Inter-Facility Stock Transfers</h3>
            <button
              onClick={() => { setActionModal('transfer'); resetForms(); }}
              className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500"
            >
              + New Transfer
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5">Transfer #</th>
                  <th className="py-3 px-5">Source Warehouse</th>
                  <th className="py-3 px-5">Destination Warehouse</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Items Transferred</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Dispatched By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      No inter-warehouse transfers recorded.
                    </td>
                  </tr>
                ) : (
                  transfers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900">{t.transfer_number}</td>
                      <td className="py-3.5 px-5 text-slate-700">{t.from_warehouse_name}</td>
                      <td className="py-3.5 px-5 text-slate-700 font-semibold">{t.to_warehouse_name}</td>
                      <td className="py-3.5 px-5 text-xs text-slate-500">{t.transfer_date}</td>
                      <td className="py-3.5 px-5 font-mono text-slate-800">{t.item_count} SKU(s)</td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-500">{t.created_by_name || 'Admin'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock In Modal */}
      {actionModal === 'in' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Manual Stock In</h3>
                <p className="text-xs text-slate-500">Replenish product inventory into warehouse</p>
              </div>
              <button onClick={() => setActionModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && <p className="mb-3 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">{errorMsg}</p>}

            <form onSubmit={handleStockInSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product *</label>
                <select
                  required
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">Select Catalog Item</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.current_stock})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Warehouse</label>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                >
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Reason</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Supplier extra shipment, return restocking"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {submitting ? 'Receiving...' : 'Confirm Stock In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Out Modal */}
      {actionModal === 'out' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Stock Out / Write-Off</h3>
                <p className="text-xs text-slate-500">Remove damaged, expired, or decommissioned goods</p>
              </div>
              <button onClick={() => setActionModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && <p className="mb-3 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">{errorMsg}</p>}

            <form onSubmit={handleStockOutSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product *</label>
                <select
                  required
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">Select Catalog Item</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.current_stock})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Warehouse</label>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                >
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deduction Quantity *</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Disposal Note</label>
                <input
                  type="text"
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Water damage during transit, expired warranty"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {submitting ? 'Deducting...' : 'Confirm Stock Out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {actionModal === 'adjust' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Inventory Stock Adjustment</h3>
                <p className="text-xs text-slate-500">Reconcile discrepancies discovered during physical stock count</p>
              </div>
              <button onClick={() => setActionModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && <p className="mb-3 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">{errorMsg}</p>}

            <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Warehouse</label>
                  <select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Reason</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="Physical Inventory Count">Physical Inventory Count</option>
                    <option value="Packaging Shrinkage">Packaging Shrinkage</option>
                    <option value="Found Unaccounted Units">Found Unaccounted Units</option>
                    <option value="Data Correction">Data Correction</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Items to Reconcile</label>
                {adjustmentItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      required
                      value={item.product_id}
                      onChange={(e) => {
                        const next = [...adjustmentItems];
                        next[idx].product_id = e.target.value;
                        setAdjustmentItems(next);
                      }}
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="">Select Product</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Cur: {p.current_stock})</option>
                      ))}
                    </select>

                    <select
                      value={item.type}
                      onChange={(e) => {
                        const next = [...adjustmentItems];
                        next[idx].type = e.target.value;
                        setAdjustmentItems(next);
                      }}
                      className="w-28 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-medium"
                    >
                      <option value="addition">+ Addition</option>
                      <option value="subtraction">- Subtraction</option>
                    </select>

                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => {
                        const next = [...adjustmentItems];
                        next[idx].quantity = e.target.value;
                        setAdjustmentItems(next);
                      }}
                      className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-mono"
                    />

                    {adjustmentItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setAdjustmentItems(adjustmentItems.filter((_, i) => i !== idx))}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setAdjustmentItems([...adjustmentItems, { product_id: '', type: 'addition', quantity: '' }])}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  + Add Another Product
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Memo</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. End of month physical audit reconciliation"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {submitting ? 'Applying...' : 'Apply Adjustments'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inter-Warehouse Transfer Modal */}
      {actionModal === 'transfer' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Inter-Warehouse Stock Transfer</h3>
                <p className="text-xs text-slate-500">Move products from one facility or warehouse to another</p>
              </div>
              <button onClick={() => setActionModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && <p className="mb-3 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg">{errorMsg}</p>}

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">From Origin Warehouse *</label>
                  <select
                    value={fromWh}
                    onChange={(e) => setFromWh(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">To Destination Warehouse *</label>
                  <select
                    value={toWh}
                    onChange={(e) => setToWh(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Products to Transfer</label>
                {transferItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      required
                      value={item.product_id}
                      onChange={(e) => {
                        const next = [...transferItems];
                        next[idx].product_id = e.target.value;
                        setTransferItems(next);
                      }}
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="">Select Product</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Stock: {p.current_stock})</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => {
                        const next = [...transferItems];
                        next[idx].quantity = e.target.value;
                        setTransferItems(next);
                      }}
                      className="w-24 px-2 py-1.5 border border-slate-200 rounded-lg text-sm font-mono"
                    />

                    {transferItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setTransferItems(transferItems.filter((_, i) => i !== idx))}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setTransferItems([...transferItems, { product_id: '', quantity: '' }])}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  + Add Line Item
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Memo</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Replenishing retail storefront backroom"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {submitting ? 'Transferring...' : 'Dispatch Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
