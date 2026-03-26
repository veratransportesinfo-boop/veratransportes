require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

async function main() {
  // Step 1: Connect to default 'postgres' DB to create transportes_db if needed
  const adminPool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const dbCheck = await adminPool.query(`SELECT 1 FROM pg_database WHERE datname = 'transportes_db'`);
    if (dbCheck.rows.length === 0) {
      await adminPool.query(`CREATE DATABASE transportes_db`);
      console.log('✓ Database transportes_db created');
    } else {
      console.log('✓ Database transportes_db already exists');
    }
  } finally {
    await adminPool.end();
  }

  // Step 2: Connect to transportes_db
  const appPool = new Pool({
    connectionString: process.env.DATABASE_URL.replace(/\/postgres$/, '/transportes_db')
  });

  try {
    // Create tables
    await appPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('passenger', 'driver', 'admin')),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await appPool.query(`
      CREATE TABLE IF NOT EXISTS rides (
        id SERIAL PRIMARY KEY,
        passenger_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        origin VARCHAR(255) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        distance_km DECIMAL(10,2) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Update constraint to allow admin if table already existed
    await appPool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
    await appPool.query(`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('passenger', 'driver', 'admin'))`);
    console.log('✓ Schema ready');

    // Check if admin already exists
    const existing = await appPool.query(`SELECT id FROM users WHERE email = 'admin@admin.com'`);
    if (existing.rows.length > 0) {
      console.log('✓ Admin already exists');
      console.log('  Email:    admin@admin.com');
      console.log('  Password: admin123');
      return;
    }

    // Create admin user
    const hash = await bcrypt.hash('admin123', 12);
    await appPool.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)`,
      ['Admin', 'admin@admin.com', hash, 'admin']
    );

    console.log('✓ Admin created!');
    console.log('  Email:    admin@admin.com');
    console.log('  Password: admin123');
  } finally {
    await appPool.end();
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
