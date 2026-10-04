# 📦 OmniStock — Enterprise Inventory Stock Management Web App

An end-to-end, full-stack **Inventory Stock Management Web Application** architected across **10 major operational areas**, implementing real-time perpetual stock ledger tracking, Point of Sale (POS) checkout, automated reorder thresholds, supplier replenishment, and executive financial reports.

---

## 🌟 The 10 Core Application Areas

```
                         INVENTORY STOCK MANAGEMENT
                                  WEB APP
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
   1. AUTHENTICATION           2. DASHBOARD                 3. PRODUCTS
        ├─ JWT & Session Tokens      ├─ Total Active Products     ├─ SKU & Barcode Generator
        ├─ 1-Click Role Switcher     ├─ Stock Valuation ($)       ├─ Cost & Selling Prices
        ├─ Role Access Control       ├─ Low & Out of Stock Alerts ├─ Multi-Category & Brands
        └─ Audit Trail Logger        └─ Sales vs Spend Trends     └─ Reorder Point Rules

        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
  4. STOCK MOVEMENTS           5. PURCHASING                6. SALES & POS
        ├─ Perpetual Stock Ledger    ├─ Purchase Orders (PO)      ├─ Rapid POS Terminal
        ├─ Direct Manual Stock In    ├─ 1-Click Receive Stock     ├─ Barcode & SKU Scanner
        ├─ Direct Stock Out (Write)  ├─ Auto-Replenishment        ├─ Printable Invoices
        ├─ Physical Audit Adjustment ├─ Supplier Invoices         ├─ Cash / Card / Transfer
        └─ Inter-Warehouse Transfers └─ Purchase Returns          └─ Customer Sales Returns

        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
  7. SUPPLIERS                  8. CUSTOMERS                 9. REPORTS & P&L
        ├─ Vendor Directory          ├─ Client Accounts           ├─ Stock Valuation Report
        ├─ Purchase Order Counts     ├─ Credit Limits             ├─ Low Stock Deficit Plan
        └─ Contact & Payment Info    └─ Sales History             ├─ Profit & Loss (COGS)
                                                                  └─ CSV & Print Exports

                              │
                       10. SYSTEM ADMIN
             ┌────────────────┼─────────────────┐
          Users & Roles    Settings          Security
             ├─ Staff Users   ├─ Company Info   ├─ Immutable Audit Log
             ├─ Access Roles  ├─ VAT / Tax %    ├─ JSON Database Backup
             └─ Departments   └─ Low Stock Mins └─ System Health
```

---

## 🔄 Core Inventory Workflow & Stock Formula

The engine enforces perpetual inventory calculations through the unified stock formula:

$$\text{Current Stock} = \text{Opening Stock} + \text{Purchases In} + \text{Transfers In} - \text{Sales Out} - \text{Transfers Out} \pm \text{Adjustments}$$

Every transaction automatically creates a cryptographically auditable entry in `stock_movements`, recording `before_stock`, `after_stock`, reference numbers, and operator identity.

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js** (v18 or higher; tested on v24)
- **npm** (v9+)

### 2. Start Application
From the project root:

```bash
# Start backend server & frontend together on port 5000:
npm start
```

Visit **`http://localhost:5000`** in your browser.

### 3. Developer Mode (Optional)
If modifying React frontend components with live HMR:

```bash
# Terminal 1: Backend API
npm run server

# Terminal 2: Vite Client (with Hot Module Replacement)
npm run client
```
The Vite development server runs on **`http://localhost:5173`** with an automated proxy to port 5000.

---

## 🔑 Demo Access Accounts

Use the **1-Click Demo Switcher** in the top navigation bar or log in with:

| Role | Username | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin` | `admin123` | Full access to all 10 areas, Users, Settings, & Backups |
| **Warehouse Manager**| `manager` | `manager123` | Product catalog, POs, Stock In/Out, Transfers, & Adjustments |
| **Cashier / Front Desk** | `cashier` | `staff123` | POS Terminal, Invoices, Sales Checkout & Receipts |

---

## 🗄️ Database Architecture (SQLite)

- `users` — Authentication credentials, roles, departments, activity status.
- `categories`, `brands`, `units`, `warehouses` — Dimensional metadata.
- `products` — SKU, barcode, unit cost, retail price, stock level, alert threshold.
- `suppliers` & `customers` — Entities with balances, contacts, and tax IDs.
- `purchase_orders` & `purchase_items` — Procurement records with auto-receive stock hooks.
- `purchase_returns` & `purchase_return_items` — Inbound return tracking.
- `sales` & `sale_items` — Customer orders & POS tickets.
- `sales_returns` & `sales_return_items` — Customer refund and stock replenishment.
- `stock_movements` — Master immutable stock ledger.
- `stock_adjustments` — Physical audit variance reconciliations.
- `stock_transfers` — Multi-facility transit records.
- `audit_logs` — System security activity log.
- `settings` — System parameters (Tax %, Currency, Thresholds).

---

## 📊 Core Features

1. **Dashboard**
   - KPI metrics: Total Products, Stock Valuation, Low Stock Count, Out of Stock Count, Purchases Spend, Sales Revenue.
   - Sales vs Purchases comparison charts.
   - Low stock warning table with direct "Quick Restock" buttons.
2. **Products**
   - Live SKU & EAN/UPC Barcode generator with printable label format.
   - Stock level indicators (Healthy, Low Stock, Out of Stock).
   - Real-time catalog search and category/brand filters.
   - CSV product export.
3. **Stock Management**
   - Complete perpetual movement ledger tracking before & after balance.
   - Dedicated modals for Stock In, Stock Out (write-off), Adjustments (+/-), and Inter-Warehouse Transfers.
4. **Purchasing**
   - Multi-line item Purchase Orders with live total computation.
   - One-click "Instant Stock Receipt" that updates catalog quantities.
   - Supplier return workflow.
5. **Point of Sale (POS)**
   - Visual catalog tiles + instant barcode scanner input.
   - Dynamic cart with item quantity adjustments and item removal.
   - Customer selection and VAT/Tax computation.
   - Tender modal with cash change calculation.
   - Instant printable thermal/standard receipt.
6. **Reports & Valuation**
   - Real-time inventory valuation at cost and retail prices.
   - Reorder deficit report detailing exact units needed and estimated replenishment costs.
   - Profit & Loss statement calculating COGS, Gross Profit, and Margin %.
7. **System Administration**
   - Role-based user creation and status toggles.
   - Configurable tax rates, currency symbol, and company details.
   - Full immutable security audit log.
   - One-click JSON database snapshot backup.
