import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Package, Plus, Search, Filter, Edit2, Trash2, Eye, Barcode as BarcodeIcon, 
  Download, RefreshCw, X, Check, AlertCircle, ArrowUpDown, Tag, Layers, CheckCircle2
} from 'lucide-react';

export default function ProductsView({ initialFilter, openNewOnMount }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockStatus, setStockStatus] = useState(initialFilter || 'all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(openNewOnMount || false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [barcodeProduct, setBarcodeProduct] = useState(null);
  const [attrModal, setAttrModal] = useState(null); // 'category' | 'brand' | 'unit'

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    category_id: '',
    brand_id: '',
    unit_id: '',
    warehouse_id: '1',
    cost_price: 0,
    selling_price: 0,
    current_stock: 0,
    alert_quantity: 10,
    image_url: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // New Attribute Form
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrDesc, setNewAttrDesc] = useState('');
  const [newAttrSymbol, setNewAttrSymbol] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodsData, catsData, brandsData, unitsData, whsData] = await Promise.all([
        api.getProducts({
          search,
          category_id: selectedCategory,
          stock_status: stockStatus !== 'all' ? stockStatus : undefined
        }),
        api.getCategories(),
        api.getBrands(),
        api.getUnits(),
        api.getWarehouses()
      ]);
      setProducts(prodsData.products || []);
      setCategories(catsData.categories || []);
      setBrands(brandsData.brands || []);
      setUnits(unitsData.units || []);
      setWarehouses(whsData.warehouses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedCategory, stockStatus]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `PRD-${Date.now().toString().slice(-6)}`,
      barcode: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      description: '',
      category_id: categories[0]?.id || '',
      brand_id: brands[0]?.id || '',
      unit_id: units[0]?.id || '',
      warehouse_id: warehouses[0]?.id || '1',
      cost_price: 0,
      selling_price: 0,
      current_stock: 0,
      alert_quantity: 10,
      image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&auto=format&fit=crop&q=80'
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || '',
      description: p.description || '',
      category_id: p.category_id || '',
      brand_id: p.brand_id || '',
      unit_id: p.unit_id || '',
      warehouse_id: p.warehouse_id || '1',
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      current_stock: p.current_stock,
      alert_quantity: p.alert_quantity,
      image_url: p.image_url || ''
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
      } else {
        await api.createProduct(formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Error saving product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await api.deleteProduct(id);
        fetchData();
      } catch (err) {
        alert(err.message || 'Cannot delete product.');
      }
    }
  };

  const handleCreateAttribute = async (e) => {
    e.preventDefault();
    try {
      if (attrModal === 'category') {
        await api.createCategory({ name: newAttrName, description: newAttrDesc });
        const res = await api.getCategories();
        setCategories(res.categories);
      } else if (attrModal === 'brand') {
        await api.createBrand({ name: newAttrName, description: newAttrDesc });
        const res = await api.getBrands();
        setBrands(res.brands);
      } else if (attrModal === 'unit') {
        await api.createUnit({ name: newAttrName, short_name: newAttrSymbol });
        const res = await api.getUnits();
        setUnits(res.units);
      }
      setAttrModal(null);
      setNewAttrName('');
      setNewAttrDesc('');
      setNewAttrSymbol('');
    } catch (err) {
      alert(err.message || 'Failed to create attribute');
    }
  };

  const handleExportCSV = () => {
    window.open('/api/reports/export/products', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header and Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Product Catalog & Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage SKUs, barcodes, unit pricing, multi-warehouse stock counts, and reorder levels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-sm font-medium shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={() => setAttrModal('category')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Tag className="w-3.5 h-3.5" />
            + Category
          </button>

          <button
            onClick={() => setAttrModal('unit')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            + Unit
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Product
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, SKU, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Stock Status Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'in', label: 'Healthy Stock' },
            { id: 'low', label: 'Low Stock' },
            { id: 'out', label: 'Out of Stock' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStockStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                stockStatus === tab.id 
                  ? 'bg-white text-slate-900 shadow-xs font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-5">Product Details</th>
                <th className="py-3.5 px-5">Category & Brand</th>
                <th className="py-3.5 px-5">Unit Cost</th>
                <th className="py-3.5 px-5">Selling Price</th>
                <th className="py-3.5 px-5">Stock Level</th>
                <th className="py-3.5 px-5">Total Value</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Fetching product inventory...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    No products match the selected criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const stockValue = p.current_stock * p.cost_price;
                  const isLow = p.current_stock <= p.alert_quantity && p.current_stock > 0;
                  const isOut = p.current_stock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'}
                            alt={p.name}
                            className="w-11 h-11 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 hover:text-indigo-600 cursor-pointer" onClick={() => setViewingProduct(p)}>
                              {p.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                {p.sku}
                              </span>
                              {p.barcode && (
                                <button
                                  onClick={() => setBarcodeProduct(p)}
                                  className="text-[11px] text-slate-400 hover:text-indigo-600 flex items-center gap-1 font-mono"
                                  title="View Barcode"
                                >
                                  <BarcodeIcon className="w-3 h-3" />
                                  {p.barcode}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5">
                        <div className="text-xs font-semibold text-slate-700">{p.category_name || 'Uncategorized'}</div>
                        <div className="text-[11px] text-slate-400">{p.brand_name || 'Generic'}</div>
                      </td>

                      <td className="py-3.5 px-5 font-mono text-slate-700">
                        ${p.cost_price.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                        ${p.selling_price.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold font-mono text-sm ${
                            isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-700'
                          }`}>
                            {p.current_stock}
                          </span>
                          <span className="text-xs text-slate-400 font-sans">
                            {p.unit_name || 'pcs'}
                          </span>
                        </div>
                        <div className="mt-1">
                          {isOut ? (
                            <span className="inline-flex items-center text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Low (Min: {p.alert_quantity})
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              In Stock
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-5 font-mono text-slate-900 font-semibold">
                        ${stockValue.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingProduct(p)}
                            title="Product Details & Movement Ledger"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            title="Edit Product"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            title="Delete Product"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <p className="text-xs text-slate-500">Configure item specifications, pricing, and initial stock</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-4 bg-rose-50 border-b border-rose-100 text-rose-700 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. 4K Ultra-Slim Monitor"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU (Stock Keeping Unit)</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="PRD-001"
                    className="w-full px-3.5 py-2 font-mono border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Barcode (EAN/UPC)</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="89012345..."
                    className="w-full px-3.5 py-2 font-mono border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
                  <select
                    value={formData.brand_id}
                    onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select Brand</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measurement</label>
                  <select
                    value={formData.unit_id}
                    onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select Unit</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Warehouse</label>
                  <select
                    value={formData.warehouse_id}
                    onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="w-full px-3.5 py-2 font-mono border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling / Retail Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    className="w-full px-3.5 py-2 font-mono border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {!editingProduct && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Opening Stock</label>
                    <input
                      type="number"
                      step="1"
                      value={formData.current_stock}
                      onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                      className="w-full px-3.5 py-2 font-mono border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    step="1"
                    value={formData.alert_quantity}
                    onChange={(e) => setFormData({ ...formData, alert_quantity: e.target.value })}
                    className="w-full px-3.5 py-2 font-mono border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Notes</label>
                  <textarea
                    rows="2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Details Drawer */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Product Overview</span>
                <h3 className="text-lg font-bold text-slate-900">{viewingProduct.name}</h3>
              </div>
              <button onClick={() => setViewingProduct(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex gap-4 items-center">
                <img
                  src={viewingProduct.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'}
                  alt={viewingProduct.name}
                  className="w-24 h-24 rounded-2xl object-cover border border-slate-200 shadow-xs"
                />
                <div className="space-y-1">
                  <div className="text-xs text-slate-400 font-mono">SKU: {viewingProduct.sku}</div>
                  <div className="text-xs text-slate-400 font-mono">Barcode: {viewingProduct.barcode || 'N/A'}</div>
                  <div className="text-xs text-slate-600 font-medium">Category: {viewingProduct.category_name}</div>
                  <div className="text-xs text-slate-600 font-medium">Warehouse: {viewingProduct.warehouse_name || 'Central'}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">Cost Price</span>
                  <div className="text-base font-bold font-mono text-slate-900">${viewingProduct.cost_price.toFixed(2)}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium">Selling Price</span>
                  <div className="text-base font-bold font-mono text-slate-900">${viewingProduct.selling_price.toFixed(2)}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-[11px] text-emerald-700 font-medium">Gross Margin</span>
                  <div className="text-base font-bold font-mono text-emerald-800">
                    {viewingProduct.selling_price > 0 
                      ? `${Math.round(((viewingProduct.selling_price - viewingProduct.cost_price) / viewingProduct.selling_price) * 100)}%`
                      : '0%'}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Description</h4>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {viewingProduct.description || 'No detailed description provided for this catalog item.'}
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => {
                    const p = viewingProduct;
                    setViewingProduct(null);
                    handleOpenEditModal(p);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-500"
                >
                  Edit Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Preview & Print Modal */}
      {barcodeProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-6 text-center">
            <h3 className="text-base font-bold text-slate-900 mb-1">Product Barcode Label</h3>
            <p className="text-xs text-slate-500 mb-4">{barcodeProduct.name}</p>

            <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center">
              {/* Simulated Code-128 Barcode Visual */}
              <div className="w-56 h-16 flex items-center justify-between px-2 bg-white border border-slate-200">
                {[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 1, 4, 1, 2, 3].map((w, i) => (
                  <div key={i} className="bg-slate-900 h-full" style={{ width: `${w * 2}px` }} />
                ))}
              </div>
              <div className="mt-2 font-mono font-bold tracking-widest text-sm text-slate-900">
                {barcodeProduct.barcode}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                SKU: {barcodeProduct.sku} • ${barcodeProduct.selling_price.toFixed(2)}
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setBarcodeProduct(null)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold"
              >
                Print Label
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Attribute Modal (Category, Brand, Unit) */}
      {attrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1 capitalize">
              Add New {attrModal}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Extend your product catalog metadata</p>

            <form onSubmit={handleCreateAttribute} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{attrModal} Name *</label>
                <input
                  type="text"
                  required
                  value={newAttrName}
                  onChange={(e) => setNewAttrName(e.target.value)}
                  placeholder={`e.g. Premium ${attrModal}`}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {attrModal === 'unit' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Symbol / Abbreviation *</label>
                  <input
                    type="text"
                    required
                    value={newAttrSymbol}
                    onChange={(e) => setNewAttrSymbol(e.target.value)}
                    placeholder="e.g. pk, dz, ltr"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newAttrDesc}
                    onChange={(e) => setNewAttrDesc(e.target.value)}
                    placeholder="Optional details"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAttrModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500"
                >
                  Save {attrModal}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
