import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  ShoppingCart, Search, CreditCard, Banknote, Trash2, Plus, Minus, 
  Printer, CheckCircle2, RotateCcw, Eye, ArrowRight, X, AlertTriangle, 
  UserCheck, Receipt, DollarSign, Layers, Package
} from 'lucide-react';

export default function SalesView({ defaultTab = 'pos' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // POS State
  const [cart, setCart] = useState([]);
  const [posSearch, setPosSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [overallDiscount, setOverallDiscount] = useState(0);

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [tenderAmount, setTenderAmount] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);

  // Sales View / Details
  const [viewingSale, setViewingSale] = useState(null);
  const [returnSale, setReturnSale] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [returnReason, setReturnReason] = useState('Customer changed mind');

  const loadData = async () => {
    setLoading(true);
    try {
      const [salesData, prodsData, catsData, custsData] = await Promise.all([
        api.getSales(),
        api.getProducts(),
        api.getCategories(),
        api.getCustomers()
      ]);
      setSales(salesData.sales || []);
      setProducts(prodsData.products || []);
      setCategories(catsData.categories || []);
      setCustomers(custsData.customers || []);
      if (custsData.customers?.length) {
        setSelectedCustomerId(custsData.customers[custsData.customers.length - 1].id); // default to walk-in
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // POS Add to Cart
  const addToCart = (product) => {
    if (product.current_stock <= 0) {
      alert(`"${product.name}" is currently out of stock!`);
      return;
    }

    const existingIndex = cart.findIndex(item => item.product_id === product.id);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + 1 > product.current_stock) {
        alert(`Cannot add more than available stock (${product.current_stock})`);
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        unit_price: product.selling_price,
        quantity: 1,
        max_stock: product.current_stock,
        discount: 0
      }]);
    }
  };

  // Barcode / Scanner Direct Enter
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!posSearch.trim()) return;
    const match = products.find(p => 
      p.barcode?.toLowerCase() === posSearch.trim().toLowerCase() ||
      p.sku?.toLowerCase() === posSearch.trim().toLowerCase() ||
      p.name?.toLowerCase().includes(posSearch.trim().toLowerCase())
    );
    if (match) {
      addToCart(match);
      setPosSearch('');
    } else {
      alert('No matching product found for: ' + posSearch);
    }
  };

  const updateQuantity = (idx, delta) => {
    const item = cart[idx];
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter((_, i) => i !== idx));
    } else if (newQty > item.max_stock) {
      alert(`Cannot exceed stock level of ${item.max_stock}`);
    } else {
      const updated = [...cart];
      updated[idx].quantity = newQty;
      setCart(updated);
    }
  };

  const removeCartItem = (idx) => {
    setCart(cart.filter((_, i) => i !== idx));
  };

  // Calculations
  const subtotal = cart.reduce((acc, it) => acc + (it.unit_price * it.quantity), 0);
  const discountVal = parseFloat(overallDiscount) || 0;
  const taxable = Math.max(0, subtotal - discountVal);
  const tax = taxable * 0.085; // 8.5%
  const grandTotal = taxable + tax;

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setCheckoutLoading(true);
    try {
      const res = await api.createSale({
        customer_id: selectedCustomerId,
        warehouse_id: 1,
        discount: discountVal,
        payment_method: paymentMethod,
        paid_amount: parseFloat(tenderAmount) || grandTotal,
        items: cart.map(it => ({
          product_id: it.product_id,
          quantity: it.quantity,
          unit_price: it.unit_price,
          discount: it.discount || 0
        }))
      });

      // Prepare receipt data
      setLastInvoice({
        invoice_number: res.invoice_number,
        date: new Date().toLocaleString(),
        items: [...cart],
        subtotal,
        discount: discountVal,
        tax,
        grandTotal,
        paid: parseFloat(tenderAmount) || grandTotal,
        change: Math.max(0, (parseFloat(tenderAmount) || grandTotal) - grandTotal),
        paymentMethod,
        customerName: customers.find(c => c.id === parseInt(selectedCustomerId))?.name || 'Walk-in Customer'
      });

      setCart([]);
      setOverallDiscount(0);
      setIsCheckoutOpen(false);
      setTenderAmount('');
      loadData();
    } catch (err) {
      alert(err.message || 'Error completing checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleOpenSaleDetail = async (id) => {
    try {
      const data = await api.getSale(id);
      setViewingSale(data);
    } catch (e) {
      alert('Error fetching invoice details');
    }
  };

  const handleOpenSaleReturn = async (s) => {
    const data = await api.getSale(s.id);
    setReturnSale(data);
    setReturnItems(data.items.map(it => ({
      product_id: it.product_id,
      product_name: it.product_name,
      quantity: 1,
      unit_price: it.unit_price,
      max_qty: it.quantity
    })));
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    try {
      await api.salesReturn({
        sale_id: returnSale.sale.id,
        customer_id: returnSale.sale.customer_id,
        reason: returnReason,
        items: returnItems
      });
      alert('Return processed and inventory replenished!');
      setReturnSale(null);
      loadData();
    } catch (e) {
      alert(e.message || 'Error processing sales return');
    }
  };

  const filteredProducts = products.filter(p => {
    if (selectedCategory && p.category_id !== parseInt(selectedCategory)) return false;
    if (posSearch && !p.name.toLowerCase().includes(posSearch.toLowerCase()) && !p.sku.toLowerCase().includes(posSearch.toLowerCase()) && !p.barcode?.includes(posSearch)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sales Orders & POS Terminal</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Instant point-of-sale checkout, customer invoices, payment collection, and returns.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'pos'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            POS Terminal
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'invoices'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Invoices History ({sales.length})
          </button>
        </div>
      </div>

      {/* POS TERMINAL TAB */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Product Selection Grid */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            {/* Search & Category Tabs */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <form onSubmit={handleBarcodeSubmit} className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Scan barcode or type SKU / item name and press Enter..."
                  value={posSearch}
                  onChange={(e) => setPosSearch(e.target.value)}
                  className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  Find / Add
                </button>
              </form>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                    selectedCategory === '' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Items
                </button>
                {categories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors ${
                      selectedCategory === c.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map(p => {
                const isOutOfStock = p.current_stock <= 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    className={`bg-white p-3 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                      isOutOfStock
                        ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50'
                        : 'border-slate-200/80 hover:border-indigo-400 hover:shadow-sm cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    <div className="relative mb-2">
                      <img
                        src={p.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
                        alt={p.name}
                        className="w-full h-24 object-cover rounded-xl bg-slate-100"
                      />
                      <span className={`absolute top-1.5 right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isOutOfStock ? 'bg-rose-600 text-white' : 'bg-slate-900/80 text-white'
                      }`}>
                        {isOutOfStock ? '0 Left' : `${p.current_stock} ${p.unit_name || 'pcs'}`}
                      </span>
                    </div>

                    <div>
                      <div className="font-semibold text-xs text-slate-900 line-clamp-2 leading-snug">
                        {p.name}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                        {p.sku}
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-bold font-mono text-sm text-indigo-600">
                        ${p.selling_price.toFixed(2)}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md hover:bg-indigo-50 hover:text-indigo-600">
                        + Add
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: POS Cart & Checkout Drawer */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col min-h-[580px]">
            {/* Customer Picker */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                ))}
              </select>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-72 pr-1 border-t border-b border-slate-100 py-3">
              {cart.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs">
                  <ShoppingCart className="w-8 h-8 text-slate-300 mb-2" />
                  Cart is empty. Tap items or scan barcodes to begin.
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex-1 pr-2">
                      <div className="font-semibold text-xs text-slate-900 truncate">{item.name}</div>
                      <div className="font-mono text-[11px] text-slate-500">${item.unit_price.toFixed(2)} / unit</div>
                    </div>

                    {/* Qty controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(idx, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold text-xs w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(idx, 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right pl-3">
                      <div className="font-mono font-bold text-xs text-slate-900">
                        ${(item.unit_price * item.quantity).toFixed(2)}
                      </div>
                      <button
                        onClick={() => removeCartItem(idx)}
                        className="text-[10px] text-rose-500 hover:text-rose-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-1.5 pt-4 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} items)</span>
                <span className="font-mono">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500 items-center">
                <span>Discount ($)</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={overallDiscount}
                  onChange={(e) => setOverallDiscount(e.target.value)}
                  className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-right font-mono text-xs"
                />
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax (VAT 8.5%)</span>
                <span className="font-mono">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold text-base pt-2 border-t border-slate-100">
                <span>Grand Total</span>
                <span className="font-mono text-indigo-600">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              disabled={cart.length === 0}
              onClick={() => {
                setTenderAmount(grandTotal.toFixed(2));
                setIsCheckoutOpen(true);
              }}
              className="mt-4 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              <span>Pay & Print Receipt</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SALES INVOICES HISTORY TAB */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5">Invoice #</th>
                  <th className="py-3 px-5">Customer</th>
                  <th className="py-3 px-5">Sale Date</th>
                  <th className="py-3 px-5">Payment Method</th>
                  <th className="py-3 px-5 font-mono">Amount ($)</th>
                  <th className="py-3 px-5">Payment Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">{s.invoice_number}</td>
                    <td className="py-3.5 px-5 text-slate-800 font-medium">{s.customer_name || 'Walk-in Customer'}</td>
                    <td className="py-3.5 px-5 text-xs text-slate-500">{s.sale_date}</td>
                    <td className="py-3.5 px-5 text-xs">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {s.payment_method}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-bold font-mono text-slate-900">${s.grand_total.toFixed(2)}</td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        {s.payment_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenSaleDetail(s.id)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenSaleReturn(s)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Process Return / Refund"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POS Tender & Payment Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Complete POS Payment</h3>
                <p className="text-xs text-slate-500">Collect payment and generate sales invoice</p>
              </div>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-600">Due Amount</span>
                <span className="text-xl font-bold font-mono text-indigo-600">${grandTotal.toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Method</label>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {['Cash', 'Card', 'Bank', 'Transfer'].map(method => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 rounded-xl border font-semibold text-center transition-colors ${
                        paymentMethod === method
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tender / Received Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={tenderAmount}
                  onChange={(e) => setTenderAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 font-mono text-base font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {parseFloat(tenderAmount) > grandTotal && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center">
                  <span className="text-xs font-semibold text-emerald-800">Change Due</span>
                  <span className="text-base font-bold font-mono text-emerald-800">
                    ${(parseFloat(tenderAmount) - grandTotal).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={checkoutLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {checkoutLoading ? 'Processing...' : 'Confirm Checkout & Print'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instant Printable Receipt Modal */}
      {lastInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-slate-900">Sale Completed!</h3>
            <p className="text-xs text-slate-500 mb-4">Invoice #{lastInvoice.invoice_number}</p>

            {/* Receipt Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-left text-xs space-y-2">
              <div className="text-center font-bold text-slate-900 uppercase">OMNISTOCK STOREFRONT</div>
              <div className="text-center text-[10px] text-slate-400">100 Industrial Pkwy, Chicago IL</div>
              <div className="border-b border-dashed border-slate-300 py-1 text-[11px] text-slate-500">
                Customer: {lastInvoice.customerName}
                <br />Time: {lastInvoice.date}
              </div>

              <div className="space-y-1 py-1">
                {lastInvoice.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.quantity}x {it.name.slice(0, 18)}</span>
                    <span>${(it.unit_price * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-0.5">
                <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>${lastInvoice.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-slate-500"><span>Tax (8.5%)</span><span>${lastInvoice.tax.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-slate-900 text-sm pt-1">
                  <span>TOTAL</span><span>${lastInvoice.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1">
                  <span>Paid ({lastInvoice.paymentMethod})</span><span>${lastInvoice.paid.toFixed(2)}</span>
                </div>
                {lastInvoice.change > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Change</span><span>${lastInvoice.change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setLastInvoice(null)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close / New Order
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Viewer Drawer */}
      {viewingSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Sales Invoice</span>
                <h3 className="text-xl font-bold font-mono text-slate-900">{viewingSale.sale.invoice_number}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button onClick={() => setViewingSale(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="text-xs space-y-3 mb-4">
              <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <div className="font-semibold text-slate-500">Customer</div>
                  <div className="font-bold text-slate-900 text-sm">{viewingSale.sale.customer_name || 'Walk-in'}</div>
                  <div>{viewingSale.sale.customer_email || 'No email'}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-500">Payment Method</div>
                  <div className="font-bold text-emerald-600">{viewingSale.sale.payment_method}</div>
                  <div>Date: {viewingSale.sale.sale_date}</div>
                </div>
              </div>

              <table className="w-full text-left">
                <thead className="bg-slate-100 font-semibold text-slate-600">
                  <tr>
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-right">Price</th>
                    <th className="py-2 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewingSale.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-semibold text-slate-900">{it.product_name}</td>
                      <td className="py-2 px-3 text-right font-mono">{it.quantity}</td>
                      <td className="py-2 px-3 text-right font-mono">${it.unit_price.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">${it.total_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-sm font-bold">
                <span>Grand Total</span>
                <span className="font-mono text-indigo-600 text-base">${viewingSale.sale.grand_total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
