const express = require('express');
const { query } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { calculatePrice } = require('../services/price');
const { sendRideSummaryEmail } = require('../services/email');

const router = express.Router();

// POST /api/rides - Create a new ride (passengers only)
router.post('/', authenticateToken, requireRole('passenger'), async (req, res) => {
  try {
    const { origin, destination, distance_km, passenger_email } = req.body;
    const passengerId = req.user.id;

    // Validate required fields
    if (!origin || !destination || !distance_km) {
      return res.status(400).json({ error: 'Origin, destination, and distance_km are required' });
    }

    if (!origin.trim() || !destination.trim()) {
      return res.status(400).json({ error: 'Origin and destination cannot be empty' });
    }

    // Calculate price
    let priceData;
    try {
      priceData = calculatePrice(distance_km);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    const { price, distanceKm } = priceData;

    // Insert ride into database
    const result = await query(
      `INSERT INTO rides (passenger_id, origin, destination, distance_km, price, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING id, passenger_id, origin, destination, distance_km, price, status, created_at`,
      [passengerId, origin.trim(), destination.trim(), distanceKm, price]
    );

    const ride = result.rows[0];

    // Determine email recipient: use provided email or fall back to authenticated user's email
    const emailRecipient = passenger_email || req.user.email;

    // Send confirmation email (non-blocking - failure won't fail the request)
    const emailResult = await sendRideSummaryEmail(
      {
        rideId: ride.id,
        origin: ride.origin,
        destination: ride.destination,
        distanceKm: ride.distance_km,
        price: ride.price,
        passengerName: req.user.name,
        createdAt: ride.created_at
      },
      emailRecipient
    );

    return res.status(201).json({
      message: 'Ride requested successfully',
      ride: {
        id: ride.id,
        passengerId: ride.passenger_id,
        origin: ride.origin,
        destination: ride.destination,
        distanceKm: parseFloat(ride.distance_km),
        price: parseFloat(ride.price),
        status: ride.status,
        createdAt: ride.created_at
      },
      priceBreakdown: {
        baseFare: priceData.baseFare,
        pricePerKm: priceData.pricePerKm,
        distanceKm: priceData.distanceKm,
        total: price
      },
      emailSent: emailResult.success,
      emailRecipient: emailRecipient
    });
  } catch (err) {
    console.error('Create ride error:', err);
    return res.status(500).json({ error: 'Failed to create ride. Please try again.' });
  }
});

// GET /api/rides - Get rides for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let result;

    if (userRole === 'passenger') {
      // Passengers see their own rides
      result = await query(
        `SELECT r.id, r.passenger_id, r.origin, r.destination,
                r.distance_km, r.price, r.status, r.created_at,
                u.name as passenger_name, u.email as passenger_email
         FROM rides r
         JOIN users u ON r.passenger_id = u.id
         WHERE r.passenger_id = $1
         ORDER BY r.created_at DESC`,
        [userId]
      );
    } else if (userRole === 'driver' || userRole === 'admin') {
      // Drivers and admins see all rides
      result = await query(
        `SELECT r.id, r.passenger_id, r.origin, r.destination,
                r.distance_km, r.price, r.status, r.created_at,
                u.name as passenger_name, u.email as passenger_email
         FROM rides r
         JOIN users u ON r.passenger_id = u.id
         ORDER BY r.created_at DESC`,
        []
      );
    }

    const rides = result.rows.map((ride) => ({
      id: ride.id,
      passengerId: ride.passenger_id,
      passengerName: ride.passenger_name,
      passengerEmail: ride.passenger_email,
      origin: ride.origin,
      destination: ride.destination,
      distanceKm: parseFloat(ride.distance_km),
      price: parseFloat(ride.price),
      status: ride.status,
      createdAt: ride.created_at
    }));

    return res.status(200).json({
      rides,
      total: rides.length
    });
  } catch (err) {
    console.error('Get rides error:', err);
    return res.status(500).json({ error: 'Failed to fetch rides. Please try again.' });
  }
});

// GET /api/rides/:id - Get a specific ride by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const rideId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    if (isNaN(rideId)) {
      return res.status(400).json({ error: 'Invalid ride ID' });
    }

    const result = await query(
      `SELECT r.id, r.passenger_id, r.origin, r.destination,
              r.distance_km, r.price, r.status, r.created_at,
              u.name as passenger_name, u.email as passenger_email
       FROM rides r
       JOIN users u ON r.passenger_id = u.id
       WHERE r.id = $1`,
      [rideId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    const ride = result.rows[0];

    // Passengers can only see their own rides
    if (userRole === 'passenger' && ride.passenger_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.status(200).json({
      ride: {
        id: ride.id,
        passengerId: ride.passenger_id,
        passengerName: ride.passenger_name,
        passengerEmail: ride.passenger_email,
        origin: ride.origin,
        destination: ride.destination,
        distanceKm: parseFloat(ride.distance_km),
        price: parseFloat(ride.price),
        status: ride.status,
        createdAt: ride.created_at
      }
    });
  } catch (err) {
    console.error('Get ride by ID error:', err);
    return res.status(500).json({ error: 'Failed to fetch ride. Please try again.' });
  }
});

// GET /api/rides/calculate/price - Calculate price without creating a ride
router.get('/calculate/price', authenticateToken, (req, res) => {
  try {
    const { distance_km } = req.query;

    if (!distance_km) {
      return res.status(400).json({ error: 'distance_km query parameter is required' });
    }

    const priceData = calculatePrice(distance_km);

    return res.status(200).json({
      distanceKm: priceData.distanceKm,
      baseFare: priceData.baseFare,
      pricePerKm: priceData.pricePerKm,
      totalPrice: priceData.price
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router;
