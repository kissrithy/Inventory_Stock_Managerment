const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'inventory.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for better concurrency
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

function initDatabase() {
  // Schema definition
  db.exec(`
    -- 1. Users and Authentication
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff', -- admin, manager, staff, cashier
      department TEXT DEFAULT 'Inventory',
      avatar TEXT,
      is_active INTEGER DEFAULT 1,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Categories, Brands, Units, Warehouses
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      short_name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS warehouses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT,
      contact TEXT,
      is_default INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 3. Products
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      barcode TEXT,
      name TEXT NOT NULL,
      description TEXT,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
      unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
      warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE SET NULL,
      cost_price REAL NOT NULL DEFAULT 0.00,
      selling_price REAL NOT NULL DEFAULT 0.00,
      current_stock REAL NOT NULL DEFAULT 0.00,
      alert_quantity REAL NOT NULL DEFAULT 10.00,
      image_url TEXT,
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Suppliers & Customers
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company_name TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      tax_number TEXT,
      balance REAL DEFAULT 0.00,
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      credit_limit REAL DEFAULT 1000.00,
      balance REAL DEFAULT 0.00,
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 5. Purchasing
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_number TEXT UNIQUE NOT NULL,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE RESTRICT,
      warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE RESTRICT,
      order_date DATE NOT NULL,
      expected_date DATE,
      total_amount REAL NOT NULL DEFAULT 0.00,
      paid_amount REAL NOT NULL DEFAULT 0.00,
      status TEXT DEFAULT 'Received', -- Draft, Ordered, Received, Cancelled
      payment_status TEXT DEFAULT 'Paid', -- Unpaid, Partial, Paid
      notes TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE RESTRICT,
      quantity REAL NOT NULL,
      unit_cost REAL NOT NULL,
      total_cost REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS purchase_returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_number TEXT UNIQUE NOT NULL,
      purchase_id INTEGER REFERENCES purchase_orders(id),
      supplier_id INTEGER REFERENCES suppliers(id),
      return_date DATE NOT NULL,
      total_amount REAL NOT NULL DEFAULT 0.00,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchase_return_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_id INTEGER REFERENCES purchase_returns(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      quantity REAL NOT NULL,
      unit_cost REAL NOT NULL,
      total_cost REAL NOT NULL
    );

    -- 6. Sales
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      warehouse_id INTEGER REFERENCES warehouses(id),
      sale_date DATE NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0.00,
      tax_amount REAL NOT NULL DEFAULT 0.00,
      discount REAL NOT NULL DEFAULT 0.00,
      grand_total REAL NOT NULL DEFAULT 0.00,
      paid_amount REAL NOT NULL DEFAULT 0.00,
      payment_method TEXT DEFAULT 'Cash', -- Cash, Card, Bank, Transfer
      payment_status TEXT DEFAULT 'Paid', -- Paid, Partial, Unpaid
      status TEXT DEFAULT 'Completed', -- Completed, Pending, Cancelled
      cashier_id INTEGER REFERENCES users(id),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      discount REAL DEFAULT 0.00,
      total_price REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sales_returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_number TEXT UNIQUE NOT NULL,
      sale_id INTEGER REFERENCES sales(id),
      customer_id INTEGER REFERENCES customers(id),
      return_date DATE NOT NULL,
      refund_amount REAL NOT NULL DEFAULT 0.00,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales_return_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      return_id INTEGER REFERENCES sales_returns(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL
    );

    -- 7. Stock Movements & Ledger
    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      warehouse_id INTEGER REFERENCES warehouses(id),
      movement_type TEXT NOT NULL, -- 'Opening Stock', 'Purchase In', 'Sale Out', 'Adjustment (+)', 'Adjustment (-)', 'Transfer In', 'Transfer Out', 'Purchase Return', 'Sale Return'
      reference_type TEXT, -- 'purchase', 'sale', 'adjustment', 'transfer', 'manual'
      reference_id TEXT,
      quantity REAL NOT NULL, -- can be positive or negative
      before_stock REAL NOT NULL,
      after_stock REAL NOT NULL,
      unit_cost REAL DEFAULT 0.00,
      notes TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 8. Stock Adjustments & Transfers
    CREATE TABLE IF NOT EXISTS stock_adjustments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      adjustment_number TEXT UNIQUE NOT NULL,
      warehouse_id INTEGER REFERENCES warehouses(id),
      adjustment_date DATE NOT NULL,
      reason TEXT NOT NULL,
      notes TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_adjustment_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      adjustment_id INTEGER REFERENCES stock_adjustments(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      type TEXT NOT NULL, -- 'addition', 'subtraction'
      quantity REAL NOT NULL,
      unit_cost REAL DEFAULT 0.00
    );

    CREATE TABLE IF NOT EXISTS stock_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_number TEXT UNIQUE NOT NULL,
      from_warehouse_id INTEGER REFERENCES warehouses(id),
      to_warehouse_id INTEGER REFERENCES warehouses(id),
      transfer_date DATE NOT NULL,
      status TEXT DEFAULT 'Completed', -- Pending, Completed, Cancelled
      notes TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stock_transfer_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transfer_id INTEGER REFERENCES stock_transfers(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      quantity REAL NOT NULL
    );

    -- 9. Audit Logs & System Settings
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      username TEXT,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      description TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) return; // already seeded

  console.log('Seeding initial inventory database...');

  // Seed default settings
  const insertSetting = db.prepare('INSERT INTO settings (key, value, description) VALUES (?, ?, ?)');
  const defaultSettings = [
    ['company_name', 'OmniStock Logistics & Retail Ltd.', 'Organization legal name'],
    ['company_email', 'ops@omnistock.io', 'Main business contact email'],
    ['company_phone', '+1 (800) 555-STOCK', 'Customer support and vendor contact line'],
    ['company_address', '100 Industrial Parkway, Suite 400, Chicago, IL 60601', 'Primary HQ Address'],
    ['currency', 'USD', 'Active system currency code'],
    ['currency_symbol', '$', 'Currency symbol representation'],
    ['tax_rate', '8.5', 'Default VAT / Sales Tax percentage'],
    ['low_stock_threshold', '10', 'Global fallback low stock threshold'],
    ['barcode_prefix', 'STK', 'Default auto-generated barcode prefix']
  ];
  defaultSettings.forEach(([k, v, d]) => insertSetting.run(k, v, d));

  // Seed Default Users
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('admin123', salt);
  const managerHash = bcrypt.hashSync('manager123', salt);
  const cashierHash = bcrypt.hashSync('cashier123', salt);
  const staffHash = bcrypt.hashSync('staff123', salt);

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, email, password_hash, full_name, role, department)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertUser.run('admin', 'admin@inventory.local', adminHash, 'Eleanor Vance (Admin)', 'admin', 'Executive & IT');
  insertUser.run('manager', 'manager@inventory.local', managerHash, 'Marcus Sterling (Manager)', 'manager', 'Warehouse & Supply Chain');
  insertUser.run('cashier', 'cashier@inventory.local', cashierHash, 'Chloe Bennet (POS Cashier)', 'cashier', 'Retail & Front Desk');
  insertUser.run('staff', 'staff@inventory.local', staffHash, 'David Miller (Warehouse Staff)', 'staff', 'Inventory Operations');

  // Seed Warehouses
  const insertWarehouse = db.prepare('INSERT INTO warehouses (name, location, contact, is_default) VALUES (?, ?, ?, ?)');
  insertWarehouse.run('Central Hub - Warehouse A', 'Building 1, Industrial District', '+1-555-0101', 1);
  insertWarehouse.run('West Coast Depot - Warehouse B', 'Dock 12, Pier Harbor', '+1-555-0102', 0);
  insertWarehouse.run('Retail Storefront Backroom', 'Downtown Mall, Unit 4B', '+1-555-0103', 0);

  // Seed Units
  const insertUnit = db.prepare('INSERT INTO units (name, short_name) VALUES (?, ?)');
  insertUnit.run('Pieces', 'pcs');
  insertUnit.run('Boxes (12 pk)', 'box');
  insertUnit.run('Kilograms', 'kg');
  insertUnit.run('Meters', 'm');
  insertUnit.run('Sets', 'set');

  // Seed Categories
  const insertCategory = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
  insertCategory.run('Electronics & Peripherals', 'Laptops, displays, smart gadgets, and high-tech gear');
  insertCategory.run('Audio & Studio Gear', 'Headphones, microphones, audio amplifiers, and monitors');
  insertCategory.run('Office Furniture & Storage', 'Ergonomic chairs, desks, file cabinets, and shelves');
  insertCategory.run('Networking & Cables', 'Routers, switches, Cat6 cables, and fiber transceivers');
  insertCategory.run('Packaging & Shipping Supplies', 'Corrugated cartons, bubble wrap, thermal labels, and tape');

  // Seed Brands
  const insertBrand = db.prepare('INSERT INTO brands (name, description) VALUES (?, ?)');
  insertBrand.run('LogiTech Pro', 'Precision ergonomic and gaming input peripherals');
  insertBrand.run('Apex Dynamics', 'High-reliability enterprise audio and computing systems');
  insertBrand.run('ErgoComfort', 'Commercial ergonomic furniture and workspace solutions');
  insertBrand.run('NetPulse', 'Commercial networking and telecom connectivity hardware');
  insertBrand.run('PackMaster', 'Industrial standard packaging materials');

  // Seed Suppliers
  const insertSupplier = db.prepare(`
    INSERT INTO suppliers (name, company_name, email, phone, address, tax_number, balance)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertSupplier.run('Global Tech Distributors', 'GTD Wholesale LLC', 'sales@gtd-wholesale.com', '+1-800-444-1122', '455 Logistics Blvd, Dallas TX', 'TX-9920192', 0);
  insertSupplier.run('Apex Hardware Group', 'Apex Hardware Global Corp', 'orders@apex-hardware.com', '+1-888-223-4411', '12 Industry Way, Seattle WA', 'WA-8839211', 0);
  insertSupplier.run('Pacific Office Supply Co.', 'Pacific Supply Partners', 'account@pacificoffice.com', '+1-877-339-1002', '808 Harbor Way, San Diego CA', 'CA-5510293', 0);
  insertSupplier.run('Prime Pack Materials', 'Prime Packaging Solutions', 'support@primepack.net', '+1-800-771-3329', '19 Carton Rd, Atlanta GA', 'GA-1192837', 0);

  // Seed Customers
  const insertCustomer = db.prepare(`
    INSERT INTO customers (name, email, phone, address, credit_limit, balance)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertCustomer.run('Acme Corp Labs', 'procurement@acmelabs.com', '+1-555-901-2200', '101 Innovation Dr, Austin TX', 15000, 0);
  insertCustomer.run('Starlight Creative Studio', 'studio@starlightcreative.io', '+1-555-883-1992', '77 Sunset Strip, Los Angeles CA', 8000, 0);
  insertCustomer.run('NexGen Software Solutions', 'billing@nexgensoft.com', '+1-555-772-9110', '320 Tech Plaza, New York NY', 25000, 0);
  insertCustomer.run('Walk-in Customer / Retail', 'retail@omnistock.local', '+1-555-000-0000', 'Front Counter Walk-in', 500, 0);

  // Seed Products with diverse stock statuses (Healthy, Low Stock, Out of Stock)
  const insertProduct = db.prepare(`
    INSERT INTO products (sku, barcode, name, description, category_id, brand_id, unit_id, warehouse_id, cost_price, selling_price, current_stock, alert_quantity, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialProducts = [
    ['PRD-ELC-001', '890123450001', 'Wireless Pro Ergonomic Mouse', 'Tri-mode 2.4GHz + BT mouse with optical silent switches', 1, 1, 1, 1, 35.00, 69.99, 142.0, 20.0, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&auto=format&fit=crop&q=80'],
    ['PRD-ELC-002', '890123450002', 'Mechanical RGB Hot-Swap Keyboard', '75% layout, lubed linear red switches with aluminum frame', 1, 1, 1, 1, 55.00, 119.00, 48.0, 15.0, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&auto=format&fit=crop&q=80'],
    ['PRD-ELC-003', '890123450003', 'Ultra-Wide 34-Inch Curved Monitor', '144Hz WQHD IPS HDR display with 90W USB-C PD dock', 1, 2, 1, 1, 320.00, 549.99, 12.0, 10.0, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&auto=format&fit=crop&q=80'],
    ['PRD-AUD-004', '890123450004', 'Studio Active Noise Cancelling Headphones', 'Lossless Bluetooth 5.3 with transparency mode and 40h battery', 2, 2, 1, 1, 95.00, 189.50, 7.0, 15.0, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80'], // LOW STOCK
    ['PRD-AUD-005', '890123450005', 'USB-C Podcast Condenser Microphone', '24-bit/192kHz cardioid mic with built-in pop filter and mute touch', 2, 2, 1, 1, 42.00, 89.00, 0.0, 10.0, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=80'], // OUT OF STOCK
    ['PRD-FUR-006', '890123450006', 'Executive Mesh Ergonomic Chair', 'Adjustable 4D armrests, dynamic lumbar support, breathable Korean mesh', 3, 3, 1, 1, 140.00, 279.00, 24.0, 8.0, 'https://images.unsplash.com/photo-1580481077195-c3f99508933b?w=400&auto=format&fit=crop&q=80'],
    ['PRD-FUR-007', '890123450007', 'Motorized Dual-Motor Standing Desk Frame', 'Heavy duty dual-motor sit-stand frame with 4 programmable presets', 3, 3, 1, 2, 180.00, 349.00, 5.0, 10.0, 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=400&auto=format&fit=crop&q=80'], // LOW STOCK
    ['PRD-NET-008', '890123450008', 'Gigabit 16-Port Managed PoE+ Switch', 'Full L2+ managed rackmount switch with 250W power budget', 4, 4, 1, 1, 110.00, 219.00, 31.0, 10.0, 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&auto=format&fit=crop&q=80'],
    ['PRD-NET-009', '890123450009', 'Cat6 Shielded Patch Cable 3m (Pack of 10)', 'Snagless gold plated connectors, 550MHz certified', 4, 4, 2, 1, 12.00, 28.50, 85.0, 20.0, 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=80'],
    ['PRD-PKG-010', '890123450010', 'Heavy Duty Shipping Tape (6 Rolls)', 'Crystal clear 2.8 mil industrial strength packaging tape', 5, 5, 2, 1, 8.50, 18.00, 160.0, 30.0, 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=400&auto=format&fit=crop&q=80'],
    ['PRD-ELC-011', '890123450011', 'Thunderbolt 4 Quad-Display Docking Station', 'Dual HDMI + Dual DP 4K@60Hz with 100W PD passthrough', 1, 1, 1, 1, 115.00, 229.00, 3.0, 12.0, 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&auto=format&fit=crop&q=80'], // LOW STOCK
    ['PRD-PKG-012', '890123450012', 'Recycled Bubble Mailers #2 (50 Pack)', 'Self-sealing tamper-evident waterproof kraft mailers', 5, 5, 2, 1, 14.00, 29.99, 0.0, 25.0, 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&auto=format&fit=crop&q=80'] // OUT OF STOCK
  ];

  const insertMovement = db.prepare(`
    INSERT INTO stock_movements (product_id, warehouse_id, movement_type, reference_type, reference_id, quantity, before_stock, after_stock, unit_cost, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  initialProducts.forEach(p => {
    const res = insertProduct.run(...p);
    const prodId = res.lastInsertRowid;
    const initialQty = p[10];
    const unitCost = p[8];
    const whId = p[7];
    // Record opening stock movement
    insertMovement.run(prodId, whId, 'Opening Stock', 'manual', 'INIT-SETUP', initialQty, 0, initialQty, unitCost, 'Initial baseline stock inventory entry', 1);
  });

  // Seed sample Completed Purchase Orders
  const insertPO = db.prepare(`
    INSERT INTO purchase_orders (po_number, supplier_id, warehouse_id, order_date, expected_date, total_amount, paid_amount, status, payment_status, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertPOItem = db.prepare(`
    INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost, total_cost)
    VALUES (?, ?, ?, ?, ?)
  `);

  const po1 = insertPO.run('PO-2026-001', 1, 1, '2026-09-20', '2026-09-24', 4200.00, 4200.00, 'Received', 'Paid', 'Batch order for Q3 peripherals restocking', 1);
  insertPOItem.run(po1.lastInsertRowid, 1, 60, 35.00, 2100.00);
  insertPOItem.run(po1.lastInsertRowid, 2, 38, 55.00, 2090.00);

  const po2 = insertPO.run('PO-2026-002', 2, 1, '2026-09-28', '2026-10-02', 3200.00, 3200.00, 'Received', 'Paid', 'Studio ANC headphones and microphone inventory', 2);
  insertPOItem.run(po2.lastInsertRowid, 4, 20, 95.00, 1900.00);
  insertPOItem.run(po2.lastInsertRowid, 5, 30, 42.00, 1260.00);

  const po3 = insertPO.run('PO-2026-003', 3, 1, '2026-10-01', '2026-10-06', 4900.00, 2500.00, 'Ordered', 'Partial', 'Ergonomic furniture replenishment order', 1);
  insertPOItem.run(po3.lastInsertRowid, 6, 20, 140.00, 2800.00);
  insertPOItem.run(po3.lastInsertRowid, 7, 10, 180.00, 1800.00);

  // Seed sample Sales & POS Transactions
  const insertSale = db.prepare(`
    INSERT INTO sales (invoice_number, customer_id, warehouse_id, sale_date, subtotal, tax_amount, discount, grand_total, paid_amount, payment_method, payment_status, status, cashier_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSaleItem = db.prepare(`
    INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, discount, total_price)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const s1 = insertSale.run('INV-2026-1001', 1, 1, '2026-09-29', 2419.80, 205.68, 50.00, 2575.48, 2575.48, 'Bank', 'Paid', 'Completed', 1, 'Corporate office hardware upgrade batch');
  insertSaleItem.run(s1.lastInsertRowid, 3, 3, 549.99, 0, 1649.97);
  insertSaleItem.run(s1.lastInsertRowid, 2, 4, 119.00, 0, 476.00);
  insertSaleItem.run(s1.lastInsertRowid, 1, 5, 69.99, 50.00, 299.95);

  const s2 = insertSale.run('INV-2026-1002', 2, 1, '2026-10-02', 847.50, 72.04, 0.00, 919.54, 919.54, 'Card', 'Paid', 'Completed', 3, 'Studio gear & accessories bundle');
  insertSaleItem.run(s2.lastInsertRowid, 4, 3, 189.50, 0, 568.50);
  insertSaleItem.run(s2.lastInsertRowid, 9, 5, 28.50, 0, 142.50);
  insertSaleItem.run(s2.lastInsertRowid, 1, 2, 69.99, 0, 139.98);

  const s3 = insertSale.run('INV-2026-1003', 4, 1, '2026-10-04', 188.99, 16.06, 0.00, 205.05, 205.05, 'Cash', 'Paid', 'Completed', 3, 'Walk-in customer POS counter purchase');
  insertSaleItem.run(s3.lastInsertRowid, 1, 1, 69.99, 0, 69.99);
  insertSaleItem.run(s3.lastInsertRowid, 2, 1, 119.00, 0, 119.00);

  // Seed sample audit logs
  const insertAudit = db.prepare('INSERT INTO audit_logs (user_id, username, action, module, description, ip_address) VALUES (?, ?, ?, ?, ?, ?)');
  insertAudit.run(1, 'admin', 'SYSTEM_INITIALIZE', 'System', 'Inventory Stock Management system schema initialized and baseline seeded', '127.0.0.1');
  insertAudit.run(1, 'admin', 'LOGIN', 'Authentication', 'Admin logged into administration control panel', '127.0.0.1');
  insertAudit.run(2, 'manager', 'CREATE_PURCHASE', 'Purchasing', 'Created purchase order PO-2026-003 for ergonomic supplies', '192.168.1.15');
  insertAudit.run(3, 'cashier', 'POS_SALE', 'Sales', 'Completed POS terminal checkout INV-2026-1003', '192.168.1.50');

  console.log('Database initialization & seeding completed successfully.');
}

module.exports = {
  db,
  initDatabase
};
