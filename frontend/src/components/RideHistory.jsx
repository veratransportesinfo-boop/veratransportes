import { useState, useEffect, useCallback } from 'react';
import { ridesApi } from '../api.js';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200'
};

function StatusBadge({ status }) {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClass} capitalize`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function RideCard({ ride }) {
  const date = new Date(ride.createdAt);
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400">#{ride.id}</span>
          <StatusBadge status={ride.status} />
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-indigo-600">${ride.price.toFixed(2)}</p>
          <p className="text-xs text-gray-400">{ride.distanceKm} km</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex flex-col items-center flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            <div className="w-0.5 h-6 bg-gray-300 my-0.5"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{ride.origin}</p>
            <p className="text-sm text-gray-500 truncate mt-4">{ride.destination}</p>
          </div>
        </div>
      </div>

      {ride.passengerName && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className="text-xs text-gray-600">{ride.passengerName}</span>
          {ride.passengerEmail && (
            <span className="text-xs text-gray-400 truncate">({ride.passengerEmail})</span>
          )}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-400">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {formattedDate} at {formattedTime}
      </div>
    </div>
  );
}

export default function RideHistory({ user, refreshKey }) {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchRides = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ridesApi.getRides();
      setRides(data.rides);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to load rides';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRides();
  }, [fetchRides, refreshKey]);

  const filteredRides = filter === 'all'
    ? rides
    : rides.filter((r) => r.status === filter);

  const statusCounts = rides.reduce((acc, ride) => {
    acc[ride.status] = (acc[ride.status] || 0) + 1;
    return acc;
  }, {});

  const isDriver = user?.role === 'driver';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {isDriver ? 'All Rides' : 'My Rides'}
          </h2>
          <p className="text-sm text-gray-500">
            {rides.length} ride{rides.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={fetchRides}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats bar */}
      {rides.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{rides.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending || 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">Pending</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{statusCounts.completed || 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">Completed</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-2xl font-bold text-indigo-600">
              ${rides.reduce((sum, r) => sum + r.price, 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Total spent</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {rides.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {['all', 'pending', 'accepted', 'completed', 'cancelled'].map((status) => {
            const count = status === 'all' ? rides.length : (statusCounts[status] || 0);
            if (status !== 'all' && count === 0) return null;
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filter === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                <span className={`ml-1.5 ${filter === status ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <svg className="animate-spin w-8 h-8 text-indigo-600 mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-500 text-sm">Loading rides...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-700 font-semibold mb-1">Failed to load rides</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button onClick={fetchRides} className="btn-primary px-6">Try again</button>
        </div>
      ) : filteredRides.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <p className="text-gray-700 font-semibold mb-1">
            {filter !== 'all' ? `No ${filter} rides` : 'No rides yet'}
          </p>
          <p className="text-gray-500 text-sm">
            {filter !== 'all'
              ? 'Try a different filter'
              : isDriver
                ? 'Rides requested by passengers will appear here'
                : 'Request your first ride to get started!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredRides.map((ride) => (
            <RideCard key={ride.id} ride={ride} />
          ))}
        </div>
      )}
    </div>
  );
}
