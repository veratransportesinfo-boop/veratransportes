import { useState, useCallback, lazy, Suspense } from 'react';
import { ridesApi } from '../api.js';
const MapPicker = lazy(() => import('./MapPicker.jsx'));

const BASE_FARE = 2.50;
const PRICE_PER_KM = 1.20;

function calculateLocalPrice(distanceKm) {
  const d = parseFloat(distanceKm);
  if (isNaN(d) || d <= 0) return null;
  return parseFloat((BASE_FARE + d * PRICE_PER_KM).toFixed(2));
}

export default function RequestRide({ user, onRideCreated }) {
  const [mapData, setMapData] = useState({ origin: '', destination: '', distance_km: '' });
  const [passengerEmail, setPassengerEmail] = useState(user?.email || '');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successRide, setSuccessRide] = useState(null);

  const handleMapChange = useCallback((data) => {
    setMapData(data);
    setErrors({});
    setApiError('');
  }, []);

  const estimatedPrice = calculateLocalPrice(mapData.distance_km);

  const validate = () => {
    const newErrors = {};
    if (!mapData.origin) newErrors.map = 'Selecciona un punto de origen en el mapa';
    else if (!mapData.destination) newErrors.map = 'Selecciona un destino en el mapa';
    else if (!mapData.distance_km) newErrors.map = 'Espera que se calcule la ruta';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (passengerEmail && !emailRegex.test(passengerEmail)) {
      newErrors.email = 'Formato de email inválido';
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
        origin: mapData.origin,
        destination: mapData.destination,
        distance_km: parseFloat(mapData.distance_km),
        passenger_email: passengerEmail.trim() || undefined
      });
      setSuccessRide(data);
      setMapData({ origin: '', destination: '', distance_km: '' });
      if (onRideCreated) onRideCreated(data.ride);
    } catch (err) {
      setApiError(err.response?.data?.error || 'Error al solicitar el viaje. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
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
          <h2 className="text-xl font-bold text-gray-900 mb-1">¡Viaje Solicitado!</h2>
          <p className="text-gray-500 text-sm mb-6">Tu viaje #{ride.id} está pendiente de confirmación</p>

          {/* Status tracker */}
          <div className="flex items-center justify-between mb-6 px-2">
            {['Pendiente', 'Aceptado', 'En camino', 'Completado'].map((step, i) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {i + 1}
                  </div>
                  <span className={`text-xs mt-1 ${i === 0 ? 'text-indigo-600 font-semibold' : 'text-gray-400'}`}>{step}</span>
                </div>
                {i < 3 && <div className="w-8 h-0.5 bg-gray-200 mx-1 mb-4"></div>}
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Desde</span>
              <span className="text-gray-800 font-semibold text-right max-w-[60%]">{ride.origin}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Hasta</span>
              <span className="text-gray-800 font-semibold text-right max-w-[60%]">{ride.destination}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 font-medium">Distancia</span>
              <span className="text-gray-800">{ride.distanceKm} km</span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tarifa base</span>
              <span>${priceBreakdown.baseFare.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{ride.distanceKm} km × ${priceBreakdown.pricePerKm}</span>
              <span>${(ride.distanceKm * priceBreakdown.pricePerKm).toFixed(2)}</span>
            </div>
            <hr className="border-gray-200" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-indigo-600">${ride.price.toFixed(2)}</span>
            </div>
          </div>

          {emailSent && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 mb-5">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Confirmación enviada a {emailRecipient}
            </div>
          )}

          <button onClick={() => setSuccessRide(null)} className="btn-primary w-full py-2.5">
            Solicitar otro viaje
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Solicitar Viaje</h2>
        <p className="text-sm text-gray-500 mb-5">Busca tu origen y destino en el mapa</p>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Suspense fallback={<div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">Cargando mapa...</div>}>
            <MapPicker onChange={handleMapChange} />
          </Suspense>

          {errors.map && (
            <p className="text-red-500 text-sm flex items-center gap-1.5">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.map}
            </p>
          )}

          {estimatedPrice !== null && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-2">Precio estimado</p>
              <div className="flex justify-between text-sm text-indigo-700 mb-1">
                <span>Tarifa base</span>
                <span>${BASE_FARE.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-indigo-700 mb-2">
                <span>{mapData.distance_km} km × ${PRICE_PER_KM}</span>
                <span>${(parseFloat(mapData.distance_km) * PRICE_PER_KM).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-indigo-900 text-lg border-t border-indigo-200 pt-2">
                <span>Total</span>
                <span>${estimatedPrice.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="label" htmlFor="passenger_email">
              Email de confirmación
              <span className="text-gray-400 font-normal ml-1">(opcional)</span>
            </label>
            <input
              id="passenger_email"
              type="email"
              value={passengerEmail}
              onChange={(e) => setPassengerEmail(e.target.value)}
              placeholder="tu@email.com"
              className={`input-field ${errors.email ? 'border-red-400' : ''}`}
              disabled={loading}
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {apiError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !mapData.distance_km}
            className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Solicitando viaje...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Confirmar Viaje{estimatedPrice ? ` — $${estimatedPrice.toFixed(2)}` : ''}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
