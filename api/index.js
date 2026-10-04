const express = require('express');
const cors = require('cors');
const { initDatabase } = require('../server/db');
const routes = require('../server/routes');

const app = express();

// Initialize database schema and seeds
initDatabase();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Support requests routed with or without /api prefix on Vercel
app.use('/api', routes);
app.use('/', routes);

module.exports = app;
