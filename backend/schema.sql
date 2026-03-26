-- Transportes App Database Schema
-- Run this file to set up the PostgreSQL database

-- Create database (run this separately as a superuser if needed)
-- CREATE DATABASE transportes_db;

-- Connect to the database before running the rest:
-- \c transportes_db

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('passenger', 'driver', 'admin')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rides table
CREATE TABLE IF NOT EXISTS rides (
  id SERIAL PRIMARY KEY,
  passenger_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  distance_km DECIMAL(10,2) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rides_passenger_id ON rides(passenger_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
