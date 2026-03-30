import { useState, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], shadowSize: [41, 41]
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], shadowSize: [41, 41]
});

function FitBounds({ origin, destination }) {
  const map = useMap();
  useEffect(() => {
    if (origin && destination) {
      const bounds = L.latLngBounds(
        [origin.lat, origin.lng],
        [destination.lat, destination.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (origin) {
      map.setView([origin.lat, origin.lng], 14);
    }
  }, [origin, destination, map]);
  return null;
}

async function searchPlaces(query) {
  if (!query || query.length < 3) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=cl`,
      { headers: { 'Accept-Language': 'es' } }
    );
    return await res.json();
  } catch {
    return [];
  }
}

async function getRoute(origin, destination) {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
    );
    const data = await res.json();
    if (data.routes?.[0]) {
      const route = data.routes[0];
      return {
        distanceKm: parseFloat((route.distance / 1000).toFixed(2)),
        coords: route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
      };
    }
  } catch {}
  return null;
}

function SearchBox({ label, placeholder, color, value, onSelect }) {
  const [query, setQuery] = useState(value?.name || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    if (value?.name) setQuery(value.name);
  }, [value]);

  useEffect(() => {
    const handleClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    clearTimeout(timer.current);
    if (val.length < 3) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      const res = await searchPlaces(val);
      setResults(res);
      setLoading(false);
    }, 500);
  };

  const handleSelect = (place) => {
    setQuery(place.display_name.split(',').slice(0, 2).join(','));
    setResults([]);
    setOpen(false);
    onSelect({
      name: place.display_name.split(',').slice(0, 2).join(','),
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon)
    });
  };

  return (
    <div ref={boxRef} className="relative">
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        <span className={`inline-block w-2.5 h-2.5 rounded-full mr-1.5 ${color === 'green' ? 'bg-green-500' : 'bg-red-500'}`}></span>
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query.length >= 3 && setOpen(true)}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 pr-8"
        />
        {loading && (
          <svg className="animate-spin w-4 h-4 text-gray-400 absolute right-2.5 top-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-[1000] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
          {results.map((place) => (
            <li
              key={place.place_id}
              onClick={() => handleSelect(place)}
              className="px-3 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-0"
            >
              <span className="font-medium">{place.display_name.split(',')[0]}</span>
              <span className="text-gray-400 text-xs ml-1">{place.display_name.split(',').slice(1, 3).join(',')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MapPicker({ onChange }) {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const handleOriginSelect = useCallback((place) => {
    setOrigin(place);
    setRouteCoords([]);
    setDistance(null);
  }, []);

  const handleDestinationSelect = useCallback((place) => {
    setDestination(place);
    setRouteCoords([]);
    setDistance(null);
  }, []);

  useEffect(() => {
    if (!origin || !destination) return;
    setRouteLoading(true);
    getRoute(origin, destination).then((route) => {
      setRouteLoading(false);
      if (route) {
        setRouteCoords(route.coords);
        setDistance(route.distanceKm);
        onChange({ origin: origin.name, destination: destination.name, distance_km: route.distanceKm });
      }
    });
  }, [origin, destination, onChange]);

  return (
    <div className="space-y-3">
      <SearchBox
        label="Origen"
        placeholder="Busca el punto de partida..."
        color="green"
        value={origin}
        onSelect={handleOriginSelect}
      />
      <SearchBox
        label="Destino"
        placeholder="Busca el destino..."
        color="red"
        value={destination}
        onSelect={handleDestinationSelect}
      />

      {routeLoading && (
        <div className="text-sm text-indigo-600 flex items-center gap-2">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Calculando ruta...
        </div>
      )}

      {distance && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2.5 flex items-center justify-between">
          <span className="text-sm text-indigo-700 font-medium">Distancia calculada</span>
          <span className="text-indigo-900 font-bold">{distance} km</span>
        </div>
      )}

      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '300px' }}>
        <MapContainer
          center={[-33.45, -70.65]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {origin && <Marker position={[origin.lat, origin.lng]} icon={greenIcon} />}
          {destination && <Marker position={[destination.lat, destination.lng]} icon={redIcon} />}
          {routeCoords.length > 0 && (
            <Polyline positions={routeCoords} color="#4f46e5" weight={4} opacity={0.8} />
          )}
          <FitBounds origin={origin} destination={destination} />
        </MapContainer>
      </div>
    </div>
  );
}
