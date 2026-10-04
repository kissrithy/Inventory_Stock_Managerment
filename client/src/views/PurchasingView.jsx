import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Truck, Plus, CheckCircle2, Clock, Eye, Printer, 
  RotateCcw, RefreshCw, X, AlertCircle, Search, DollarSign 
} from 'lucide-react';

export default function PurchasingView({ openNewOnMount = false }) {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(openNewOnMount);
  const [viewingPO, setViewingPO] = useState(null);
  const [returnPO, setReturnPO] = useState(null);

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('1');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [autoReceive, setAutoReceive] = useState(true);
  const [items, setItems] = useState([{ product_id: '', quantity: 10, unit_cost: 0 }]);

  // Return Form State
  const [returnReason, setReturnReason] = useState('Defective shipment');
  const [returnItems, setReturnItems] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [posData, supsData, prodsData, whsData] = await Promise.all([
        api.getPurchases(),
        api.getSuppliers(),
        api.getProducts(),
        api.getWarehouses()
      ]);
      setPurchases(posData.purchases || []);
      setSuppliers(supsData.suppliers || []);
      setProducts(prodsData.products || []);
      setWarehouses(whsData.warehouses || []);
      if (supsData.suppliers?.length) setSupplierId(supsData.suppliers[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProductSelect = (idx, prodId) => {
    const next = [...items];
    const prod = products.find(p => p.id === parseInt(prodId));
    next[idx].product_id = prodId;
    if (prod) {
      next[idx].unit_cost = prod.cost_price || 0;
    }
    setItems(next);
  };

  const handleAddItem = () => {
    setItems([...items, { product_id: '', quantity: 1, unit_cost: 0 }]);
  };

  const handleRemoveItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const calculateGrandTotal = () => {
    return items.reduce((acc, it) => acc + ((parseFloat(it.quantity) || 0) * (parseFloat(it.unit_cost) || 0)), 0);
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const validItems = items.filter(it => it.product_id && parseFloat(it.quantity) > 0);
      if (!validItems.length) throw new Error('Please include at least one valid product line.');

      await api.createPurchase({
        supplier_id: supplierId,
        warehouse_id: warehouseId,
        order_date: orderDate,
        expected_date: expectedDate || null,
        notes,
        auto_receive: autoReceive,
        items: validItems
      });

      setSuccessMsg('Purchase Order created successfully!');
      setIsCreateOpen(false);
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Error creating purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiveStock = async (poId) => {
    if (window.confirm('Confirm receipt of all products in this purchase order into warehouse stock?')) {
      try {
        await api.receivePurchase(poId);
        setSuccessMsg('Purchase order marked as Received. Inventory stock updated!');
        loadData();
      } catch (err) {
        alert(err.message || 'Error receiving purchase order');
      }
    }
  };

  const handleViewPO = async (id) => {
    try {
      const data = await api.getPurchase(id);
      setViewingPO(data);
    } catch (err) {
      alert('Error fetching PO details');
    }
  };

  const handleOpenReturn = async (po) => {
    const data = await api.getPurchase(po.id);
    setReturnPO(data);
    setReturnItems(data.items.map(it => ({
      product_id: it.product_id,
      product_name: it.product_name,
      quantity: 1,
      unit_cost: it.unit_cost,
      max_qty: it.received_quantity || it.quantity
    })));
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.purchaseReturn({
        purchase_id: returnPO.purchase.id,
        supplier_id: returnPO.purchase.supplier_id,
        reason: returnReason,
        items: returnItems
      });
      setSuccessMsg('Purchase return recorded and stock deducted!');
      setReturnPO(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Error processing return');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Purchasing & Vendor Replenishment</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create purchase orders, receive supplier shipments, update costs, and process returns.
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreateOpen(true);
            setItems([{ product_id: products[0]?.id || '', quantity: 10, unit_cost: products[0]?.cost_price || 0 }]);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Purchase Order
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800 text-xs">Dismiss</button>
        </div>
      )}

      {/* PO Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-5">PO Number</th>
                <th className="py-3 px-5">Supplier</th>
                <th className="py-3 px-5">Order Date</th>
                <th className="py-3 px-5">Warehouse</th>
                <th className="py-3 px-5">Line Items</th>
                <th className="py-3 px-5 font-mono">Total ($)</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading purchase orders...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Truck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    No purchase orders recorded yet.
                  </td>
                </tr>
              ) : (
                purchases.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">{po.po_number}</td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-800">{po.supplier_name}</div>
                      <div className="text-[11px] text-slate-400">{po.supplier_company}</div>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-600">{po.order_date}</td>
                    <td className="py-3.5 px-5 text-xs text-slate-600">{po.warehouse_name || 'Central'}</td>
                    <td className="py-3.5 px-5 font-mono text-xs text-slate-700">{po.item_count} SKU(s)</td>
                    <td className="py-3.5 px-5 font-bold font-mono text-slate-900">${po.total_amount.toFixed(2)}</td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        po.status === 'Received' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {po.status === 'Received' ? '● Received' : '⏳ Pending Delivery'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {po.status !== 'Received' && (
                          <button
                            onClick={() => handleReceiveStock(po.id)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold"
                            title="Receive Stock into Inventory"
                          >
                            Receive Stock
                          </button>
                        )}
                        <button
                          onClick={() => handleViewPO(po.id)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                          title="View & Print PO"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {po.status === 'Received' && (
                          <button
                            onClick={() => handleOpenReturn(po)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Process Return to Supplier"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Purchase Order Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl my-8 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">New Purchase Order</h3>
                <p className="text-xs text-slate-500">Order inventory supplies from authorized vendors</p>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && <p className="mb-4 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl">{errorMsg}</p>}

            <form onSubmit={handleCreatePO} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier *</label>
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.company_name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Warehouse</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Order Date</label>
                  <input
                    type="date"
                    required
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Order Items</span>
                  <span className="text-xs font-bold text-slate-700 font-mono">
                    Total: ${calculateGrandTotal().toFixed(2)}
                  </span>
                </div>

                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      required
                      value={it.product_id}
                      onChange={(e) => handleProductSelect(idx, e.target.value)}
                      className="flex-2 px-3 py-1.5 border border-slate-200 rounded-xl text-sm"
                    >
                      <option value="">Select Item</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Stock: {p.current_stock})</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={it.quantity}
                      onChange={(e) => {
                        const next = [...items];
                        next[idx].quantity = e.target.value;
                        setItems(next);
                      }}
                      className="w-20 px-2.5 py-1.5 border border-slate-200 rounded-xl text-sm font-mono"
                    />

                    <input
                      type="number"
                      step="0.01"
                      placeholder="Cost"
                      value={it.unit_cost}
                      onChange={(e) => {
                        const next = [...items];
                        next[idx].unit_cost = e.target.value;
                        setItems(next);
                      }}
                      className="w-24 px-2.5 py-1.5 border border-slate-200 rounded-xl text-sm font-mono"
                    />

                    <span className="w-24 font-mono text-xs font-bold text-slate-700 text-right pr-2">
                      ${((parseFloat(it.quantity) || 0) * (parseFloat(it.unit_cost) || 0)).toFixed(2)}
                    </span>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold mt-1"
                >
                  + Add Another Product Line
                </button>
              </div>

              {/* Instant Stock Receipt Checkbox */}
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="autoReceive"
                  checked={autoReceive}
                  onChange={(e) => setAutoReceive(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <label htmlFor="autoReceive" className="text-xs font-medium text-slate-700 cursor-pointer">
                  <span className="font-semibold text-indigo-900">Instant Stock Receipt</span> — Immediately increment inventory and record ledger movements upon creating this PO.
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Instructions</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Rush priority delivery, pallet pack"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {submitting ? 'Generating...' : 'Save & Dispatch PO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View / Print Purchase Order Drawer */}
      {viewingPO && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Purchase Order Details</span>
                <h3 className="text-xl font-bold font-mono text-slate-900">{viewingPO.purchase.po_number}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button onClick={() => setViewingPO(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs mb-5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-500 uppercase tracking-wider">Vendor Information</span>
                <div className="font-bold text-slate-900 text-sm mt-1">{viewingPO.purchase.supplier_name}</div>
                <div className="text-slate-600">{viewingPO.purchase.company_name}</div>
                <div className="text-slate-500 mt-1">{viewingPO.purchase.supplier_phone} • {viewingPO.purchase.supplier_email}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-500 uppercase tracking-wider">Order Meta</span>
                <div className="mt-1 space-y-0.5 text-slate-700">
                  <div>Date: <span className="font-semibold">{viewingPO.purchase.order_date}</span></div>
                  <div>Warehouse: <span className="font-semibold">{viewingPO.purchase.warehouse_name || 'Central'}</span></div>
                  <div>Status: <span className="font-semibold text-emerald-600">{viewingPO.purchase.status}</span></div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left text-xs mb-4">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <tr>
                  <th className="py-2 px-3">Item Description</th>
                  <th className="py-2 px-3 text-right">Quantity</th>
                  <th className="py-2 px-3 text-right">Unit Cost</th>
                  <th className="py-2 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {viewingPO.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{it.product_name}</div>
                      <div className="text-slate-400 font-mono text-[10px]">{it.product_sku}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium">{it.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-mono">${it.unit_cost.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">${it.total_cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-sm font-bold">
              <span>Grand Total PO Amount</span>
              <span className="text-indigo-600 font-mono text-base">${viewingPO.purchase.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Return Modal */}
      {returnPO && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Return Goods to Supplier</h3>
                <p className="text-xs text-slate-500">PO Ref: {returnPO.purchase.po_number} ({returnPO.purchase.supplier_name})</p>
              </div>
              <button onClick={() => setReturnPO(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Return Reason</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="Defective or Damaged">Defective or Damaged</option>
                  <option value="Incorrect Specification">Incorrect Specification</option>
                  <option value="Excess Shipment">Excess Shipment</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Select Quantities to Return</label>
                {returnItems.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <span className="font-semibold text-slate-800">{it.product_name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono">Max: {it.max_qty}</span>
                      <input
                        type="number"
                        min="1"
                        max={it.max_qty}
                        value={it.quantity}
                        onChange={(e) => {
                          const next = [...returnItems];
                          next[idx].quantity = e.target.value;
                          setReturnItems(next);
                        }}
                        className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-sm font-mono text-center"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReturnPO(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  {submitting ? 'Processing...' : 'Authorize Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
