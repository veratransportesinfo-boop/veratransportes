require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err);
});

// Helper to run queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query executed', { text: text.substring(0, 80), duration, rows: result.rowCount });
    return result;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
};

// Initialize database schema
const initDb = async () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('passenger', 'driver')),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const createRidesTable = `
    CREATE TABLE IF NOT EXISTS rides (
      id SERIAL PRIMARY KEY,
      passenger_id INTEGER REFERENCES users(id),
      origin VARCHAR(255) NOT NULL,
      destination VARCHAR(255) NOT NULL,
      distance_km DECIMAL(10,2) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  try {
    await pool.query(createUsersTable);
    await pool.query(createRidesTable);
    console.log('Database schema initialized successfully');
  } catch (err) {
    console.error('Error initializing database schema:', err);
    throw err;
  }
};

// Run schema init on startup
initDb().catch(console.error);

module.exports = { pool, query };
