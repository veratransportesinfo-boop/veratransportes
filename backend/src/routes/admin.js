const express = require('express');
const bcrypt = require('bcrypt');
const { query } = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 12;

// All admin routes require authentication + admin role
router.use(authenticateToken, requireAdmin);

// GET /api/admin/stats - Dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const [usersResult, ridesResult, revenueResult] = await Promise.all([
      query(`SELECT role, COUNT(*) as count FROM users GROUP BY role`),
      query(`SELECT status, COUNT(*) as count FROM rides GROUP BY status`),
      query(`SELECT COALESCE(SUM(price), 0) as total FROM rides WHERE status != 'cancelled'`)
    ]);

    const usersByRole = { passenger: 0, driver: 0, admin: 0 };
    usersResult.rows.forEach((r) => { usersByRole[r.role] = parseInt(r.count); });

    const ridesByStatus = { pending: 0, accepted: 0, in_progress: 0, completed: 0, cancelled: 0 };
    ridesResult.rows.forEach((r) => { ridesByStatus[r.status] = parseInt(r.count); });

    const totalRevenue = parseFloat(revenueResult.rows[0].total);
    const totalRides = Object.values(ridesByStatus).reduce((a, b) => a + b, 0);
    const totalUsers = Object.values(usersByRole).reduce((a, b) => a + b, 0);

    return res.json({ totalUsers, usersByRole, totalRides, ridesByStatus, totalRevenue });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/users - List all users
router.get('/users', async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC`
    );
    return res.json({ users: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('Admin list users error:', err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/admin/users - Create a user (any role, including admin)
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required: name, email, password, role' });
    }

    if (!['passenger', 'driver', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be passenger, driver, or admin' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name.trim(), email.toLowerCase(), hashedPassword, role]
    );

    return res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    console.error('Admin create user error:', err);
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Admin delete user error:', err);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET /api/admin/rides - List all rides
router.get('/rides', async (req, res) => {
  try {
    const result = await query(
      `SELECT r.id, r.passenger_id, r.origin, r.destination,
              r.distance_km, r.price, r.status, r.created_at,
              u.name as passenger_name, u.email as passenger_email
       FROM rides r
       LEFT JOIN users u ON r.passenger_id = u.id
       ORDER BY r.created_at DESC`
    );

    const rides = result.rows.map((r) => ({
      id: r.id,
      passengerId: r.passenger_id,
      passengerName: r.passenger_name,
      passengerEmail: r.passenger_email,
      origin: r.origin,
      destination: r.destination,
      distanceKm: parseFloat(r.distance_km),
      price: parseFloat(r.price),
      status: r.status,
      createdAt: r.created_at
    }));

    return res.json({ rides, total: rides.length });
  } catch (err) {
    console.error('Admin list rides error:', err);
    return res.status(500).json({ error: 'Failed to fetch rides' });
  }
});

// PATCH /api/admin/rides/:id/status - Update ride status
router.patch('/rides/:id/status', async (req, res) => {
  try {
    const rideId = parseInt(req.params.id);
    const { status } = req.body;

    if (isNaN(rideId)) {
      return res.status(400).json({ error: 'Invalid ride ID' });
    }

    const validStatuses = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await query(
      'UPDATE rides SET status = $1 WHERE id = $2 RETURNING id, status',
      [status, rideId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    return res.json({ ride: result.rows[0] });
  } catch (err) {
    console.error('Admin update ride status error:', err);
    return res.status(500).json({ error: 'Failed to update ride status' });
  }
});

module.exports = router;
