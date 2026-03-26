import { useState, useEffect, useCallback } from 'react';
import { ridesApi } from '../api.js';

const BASE_FARE = 2.50;
const PRICE_PER_KM = 1.20;

function calculateLocalPrice(distanceKm) {
  const d = parseFloat(distanceKm);
  if (isNaN(d) || d <= 0) return null;
  return parseFloat((BASE_FARE + d * PRICE_PER_KM).toFixed(2));
}

export default function RequestRide({ user, onRideCreated }) {
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    distance_km: '',
    passenger_email: user?.email || ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successRide, setSuccessRide] = useState(null);
  const [estimatedPrice, setEstimatedPrice] = useState(null);

  // Live price estimate as user types distance
  useEffect(() => {
    const price = calculateLocalPrice(form.distance_km);
    setEstimatedPrice(price);
  }, [form.distance_km]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!form.origin.trim()) newErrors.origin = 'Origin is required';
    if (!form.destination.trim()) newErrors.destination = 'Destination is required';
    if (!form.distance_km) {
      newErrors.distance_km = 'Distance is required';
    } else if (isNaN(parseFloat(form.distance_km)) || parseFloat(form.distance_km) <= 0) {
      newErrors.distance_km = 'Distance must be a positive number';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.passenger_email && !emailRegex.test(form.passenger_email)) {
      newErrors.passenger_email = 'Invalid email format';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessRide(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const data = await ridesApi.createRide({
        origin: form.origin.trim(),
        destination: form.destination.trim(),
        distance_km: parseFloat(form.distance_km),
        passenger_email: form.passenger_email.trim() || undefined
      });

      setSuccessRide(data);
      setForm({ origin: '', destination: '', distance_km: '', passenger_email: user?.email || '' });
      setEstimatedPrice(null);

      if (onRideCreated) onRideCreated(data.ride);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to request ride. Please try again.';
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccessRide(null);
    setApiError('');
    setErrors({});
  };

  if (successRide) {
    const { ride, priceBreakdown, emailSent, emailRecipient } = successRide;
    return (
      <div className="max-w-lg mx-auto">
        <div className="card text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Ride Requested!</h2>
          <p className="text-gray-500 text-sm mb-6">Your ride #{ride.id} is pending confirmation</p>

          <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">From</span>
              <span className="text-gray-800 font-semibold text-right max-w-[60%]">{ride.origin}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">To</span>
              <span className="text-gray-800 font-semibold text-right max-w-[60%]">{ride.destination}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Distance</span>
              <span className="text-gray-800">{ride.distanceKm} km</span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Base fare</span>
              <span>${priceBreakdown.baseFare.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Distance ({ride.distanceKm} km × ${priceBreakdown.pricePerKm})</span>
              <span>${(ride.distanceKm * priceBreakdown.pricePerKm).toFixed(2)}</span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-indigo-600">${ride.price.toFixed(2)}</span>
            </div>
          </div>

          {emailSent ? (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 mb-5">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Confirmation email sent to {emailRecipient}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5 mb-5">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Ride created but email could not be sent
            </div>
          )}

          <button onClick={handleReset} className="btn-primary w-full py-2.5">
            Request another ride
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Request a Ride</h2>
        <p className="text-sm text-gray-500 mb-6">Fill in the details to book your trip</p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="label" htmlFor="origin">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                Origin
              </span>
            </label>
            <input
              id="origin"
              type="text"
              name="origin"
              value={form.origin}
              onChange={handleChange}
              placeholder="e.g. 123 Main St, New York"
              className={`input-field ${errors.origin ? 'border-red-400 focus:ring-red-400' : ''}`}
              disabled={loading}
            />
            {errors.origin && <p className="error-text">{errors.origin}</p>}
          </div>

          <div>
            <label className="label" htmlFor="destination">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-red-500 rounded-full inline-block"></span>
                Destination
              </span>
            </label>
            <input
              id="destination"
              type="text"
              name="destination"
              value={form.destination}
              onChange={handleChange}
              placeholder="e.g. JFK Airport, Queens"
              className={`input-field ${errors.destination ? 'border-red-400 focus:ring-red-400' : ''}`}
              disabled={loading}
            />
            {errors.destination && <p className="error-text">{errors.destination}</p>}
          </div>

          <div>
            <label className="label" htmlFor="distance_km">Distance (km)</label>
            <input
              id="distance_km"
              type="number"
              name="distance_km"
              value={form.distance_km}
              onChange={handleChange}
              placeholder="e.g. 12.5"
              min="0.1"
              step="0.1"
              className={`input-field ${errors.distance_km ? 'border-red-400 focus:ring-red-400' : ''}`}
              disabled={loading}
            />
            {errors.distance_km && <p className="error-text">{errors.distance_km}</p>}
          </div>

          {/* Live price estimate */}
          {estimatedPrice !== null && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-2">Price Estimate</p>
              <div className="flex justify-between text-sm text-indigo-700 mb-1">
                <span>Base fare</span>
                <span>${BASE_FARE.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-indigo-700 mb-2">
                <span>{form.distance_km} km × ${PRICE_PER_KM}</span>
                <span>${(parseFloat(form.distance_km) * PRICE_PER_KM).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-indigo-900 text-lg border-t border-indigo-200 pt-2">
                <span>Total</span>
                <span>${estimatedPrice.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="label" htmlFor="passenger_email">
              Confirmation email
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <input
              id="passenger_email"
              type="email"
              name="passenger_email"
              value={form.passenger_email}
              onChange={handleChange}
              placeholder="your@email.com"
              autoComplete="email"
              className={`input-field ${errors.passenger_email ? 'border-red-400 focus:ring-red-400' : ''}`}
              disabled={loading}
            />
            {errors.passenger_email && <p className="error-text">{errors.passenger_email}</p>}
            <p className="text-xs text-gray-400 mt-1">Trip summary will be sent to this address</p>
          </div>

          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {apiError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Requesting ride...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Confirm Ride
                {estimatedPrice !== null && ` — $${estimatedPrice.toFixed(2)}`}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
