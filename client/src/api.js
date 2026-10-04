// Centralized API client for Inventory Stock Management Web App

const BASE_URL = '/api';

export function getAuthToken() {
  return localStorage.getItem('omnistock_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('omnistock_token', token);
  } else {
    localStorage.removeItem('omnistock_token');
  }
}

export function getStoredUser() {
  const userJson = localStorage.getItem('omnistock_user');
  try {
    return userJson ? JSON.parse(userJson) : null;
  } catch (e) {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('omnistock_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('omnistock_user');
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // Auth
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  demoSwitch: (role) => request('/auth/demo-switch', { method: 'POST', body: JSON.stringify({ role }) }),
  getMe: () => request('/auth/me'),
  changePassword: (currentPassword, newPassword) => request('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  getUsers: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Dashboard
  getDashboardStats: () => request('/dashboard/stats'),
  getDashboardCharts: () => request('/dashboard/charts'),
  getDashboardRecent: () => request('/dashboard/recent'),

  // Products & Attributes
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? `?${query}` : ''}`);
  },
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  getCategories: () => request('/categories'),
  createCategory: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  getBrands: () => request('/brands'),
  createBrand: (data) => request('/brands', { method: 'POST', body: JSON.stringify(data) }),
  getUnits: () => request('/units'),
  createUnit: (data) => request('/units', { method: 'POST', body: JSON.stringify(data) }),
  getWarehouses: () => request('/warehouses'),
  createWarehouse: (data) => request('/warehouses', { method: 'POST', body: JSON.stringify(data) }),

  // Stock Movements & Adjustments & Transfers
  getStockMovements: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/stock/movements${query ? `?${query}` : ''}`);
  },
  stockIn: (data) => request('/stock/in', { method: 'POST', body: JSON.stringify(data) }),
  stockOut: (data) => request('/stock/out', { method: 'POST', body: JSON.stringify(data) }),
  adjustStock: (data) => request('/stock/adjust', { method: 'POST', body: JSON.stringify(data) }),
  transferStock: (data) => request('/stock/transfer', { method: 'POST', body: JSON.stringify(data) }),
  getTransfers: () => request('/stock/transfers'),

  // Purchasing
  getPurchases: () => request('/purchases'),
  getPurchase: (id) => request(`/purchases/${id}`),
  createPurchase: (data) => request('/purchases', { method: 'POST', body: JSON.stringify(data) }),
  receivePurchase: (id) => request(`/purchases/${id}/receive`, { method: 'POST' }),
  purchaseReturn: (data) => request('/purchases/returns', { method: 'POST', body: JSON.stringify(data) }),

  // Sales & POS
  getSales: () => request('/sales'),
  getSale: (id) => request(`/sales/${id}`),
  createSale: (data) => request('/sales', { method: 'POST', body: JSON.stringify(data) }),
  salesReturn: (data) => request('/sales/returns', { method: 'POST', body: JSON.stringify(data) }),

  // Suppliers & Customers
  getSuppliers: () => request('/suppliers'),
  createSupplier: (data) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id, data) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),

  getCustomers: () => request('/customers'),
  createCustomer: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),

  // Reports
  getValuationReport: () => request('/reports/valuation'),
  getLowStockReport: () => request('/reports/low-stock'),
  getProfitLossReport: () => request('/reports/profit-loss'),

  // Admin & Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  getAuditLogs: () => request('/audit-logs')
};
