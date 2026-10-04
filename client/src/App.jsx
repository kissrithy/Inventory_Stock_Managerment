import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';

import DashboardView from './views/DashboardView';
import ProductsView from './views/ProductsView';
import StockView from './views/StockView';
import PurchasingView from './views/PurchasingView';
import SalesView from './views/SalesView';
import SuppliersView from './views/SuppliersView';
import CustomersView from './views/CustomersView';
import ReportsView from './views/ReportsView';
import AdminView from './views/AdminView';

import { getStoredUser, setStoredUser, setAuthToken, api } from './api';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [viewParams, setViewParams] = useState({});
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Check initial user session or bootstrap default admin
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      setIsInitializing(false);
    } else {
      // Auto-bootstrap demo admin session so app is immediately interactive
      api.demoSwitch('admin').then(data => {
        setAuthToken(data.token);
        setStoredUser(data.user);
        setUser(data.user);
      }).catch(() => {
        // Fallback to login modal
      }).finally(() => {
        setIsInitializing(false);
      });
    }
  }, []);

  const handleNavigate = (view, params = {}) => {
    setCurrentView(view);
    setViewParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchUserRole = async (role) => {
    try {
      const data = await api.demoSwitch(role);
      setAuthToken(data.token);
      setStoredUser(data.user);
      setUser(data.user);
    } catch (e) {
      alert('Unable to switch role: ' + e.message);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setStoredUser(null);
    setUser(null);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wide">Initializing OmniStock System...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800">
      {/* Dark Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={(v) => handleNavigate(v)}
        user={user}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          currentView={currentView}
          user={user}
          onSwitchUser={handleSwitchUserRole}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'products' && (
            <ProductsView
              initialFilter={viewParams.filter}
              openNewOnMount={viewParams.openNew}
            />
          )}

          {currentView === 'stock' && (
            <StockView
              defaultTab={viewParams.defaultTab || 'ledger'}
              preselectedProductId={viewParams.productId}
            />
          )}

          {currentView === 'purchasing' && (
            <PurchasingView
              openNewOnMount={viewParams.openNew}
            />
          )}

          {currentView === 'sales' && (
            <SalesView defaultTab="invoices" />
          )}

          {currentView === 'pos' && (
            <SalesView defaultTab="pos" />
          )}

          {currentView === 'suppliers' && (
            <SuppliersView />
          )}

          {currentView === 'customers' && (
            <CustomersView />
          )}

          {currentView === 'reports' && (
            <ReportsView />
          )}

          {currentView === 'admin' && (
            <AdminView />
          )}
        </main>
      </div>
    </div>
  );
}
