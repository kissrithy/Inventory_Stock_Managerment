const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDatabase } = require('./db');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database schema and seeds
initDatabase();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Endpoints
app.use('/api', routes);

// Serve static frontend in production
const distPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(distPath));

// Fallback for Single Page Application routing (compatible with Express 4 and 5)
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api')) {
    return next();
  }
  const indexFile = path.join(distPath, 'index.html');
  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head><title>Inventory Stock Management API</title></head>
    <body style="font-family: sans-serif; padding: 40px; text-align: center;">
      <h2>Inventory Stock Management API Server</h2>
      <p>API is running smoothly on port ${PORT}.</p>
      <p>Run <code>npm run build</code> to compile the frontend, or launch Vite dev server with <code>npm run client</code>.</p>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`📦 Inventory Stock Management System Backend Online!`);
  console.log(`🔗 API & Web App at: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
