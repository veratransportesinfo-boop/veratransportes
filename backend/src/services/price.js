const BASE_FARE = 2.50;
const PRICE_PER_KM = 1.20;

/**
 * Calculate trip price based on distance
 * Formula: price = BASE_FARE + (distance_km * PRICE_PER_KM)
 * @param {number} distanceKm - Distance in kilometers
 * @returns {object} - { price, baseFare, pricePerKm, distanceKm }
 */
const calculatePrice = (distanceKm) => {
  const distance = parseFloat(distanceKm);

  if (isNaN(distance) || distance <= 0) {
    throw new Error('Distance must be a positive number');
  }

  const price = BASE_FARE + (distance * PRICE_PER_KM);

  return {
    price: parseFloat(price.toFixed(2)),
    baseFare: BASE_FARE,
    pricePerKm: PRICE_PER_KM,
    distanceKm: distance
  };
};

module.exports = { calculatePrice, BASE_FARE, PRICE_PER_KM };
