import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api.js';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-800',
  driver: 'bg-blue-100 text-blue-800',
  passenger: 'bg-gray-100 text-gray-700'
};

const VALID_STATUSES = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'passenger' });
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch {
      setError('Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getUsers();
      setUsers(data.users);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRides = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getRides();
      setRides(data.rides);
    } catch {
      setError('Failed to load rides');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'stats') loadStats();
    else if (activeTab === 'users') loadUsers();
    else if (activeTab === 'rides') loadRides();
  }, [activeTab, loadStats, loadUsers, loadRides]);

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleStatusChange = async (rideId, newStatus) => {
    try {
      await adminApi.updateRideStatus(rideId, newStatus);
      setRides((prev) => prev.map((r) => r.id === rideId ? { ...r, status: newStatus } : r));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!createForm.name || !createForm.email || !createForm.password) {
      setCreateError('All fields are required');
      return;
    }
    setCreateLoading(true);
    try {
      await adminApi.createUser(createForm);
      setShowCreateUser(false);
      setCreateForm({ name: '', email: '', password: '', role: 'passenger' });
      loadUsers();
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div>
      {/* Tab nav */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'stats', label: 'Statistics' },
          { id: 'users', label: 'Users' },
          { id: 'rides', label: 'All Rides' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <svg className="animate-spin w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {/* STATS TAB */}
      {!loading && activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={stats.totalUsers} color="purple" />
            <StatCard label="Passengers" value={stats.usersByRole.passenger} color="gray" />
            <StatCard label="Drivers" value={stats.usersByRole.driver} color="blue" />
            <StatCard label="Admins" value={stats.usersByRole.admin} color="indigo" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Total Rides" value={stats.totalRides} color="yellow" />
            <StatCard label="Completed" value={stats.ridesByStatus.completed} color="green" />
            <StatCard label="Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} color="emerald" />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-3">Rides by Status</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.ridesByStatus).map(([status, count]) => (
                <span key={status} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_COLORS[status]}`}>
                  {status.replace('_', ' ')} <span className="font-bold">{count}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {!loading && activeTab === 'users' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">{users.length} users total</p>
            <button
              onClick={() => setShowCreateUser((v) => !v)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
            >
              {showCreateUser ? 'Cancel' : '+ New User'}
            </button>
          </div>

          {showCreateUser && (
            <form onSubmit={handleCreateUser} className="bg-white border border-gray-200 rounded-xl p-5 mb-5 space-y-3">
              <h3 className="font-semibold text-gray-800">Create User</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text" placeholder="Full name" value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  className="input-field" disabled={createLoading}
                />
                <input
                  type="email" placeholder="Email" value={createForm.email}
                  onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                  className="input-field" disabled={createLoading}
                />
                <input
                  type="password" placeholder="Password (min 6 chars)" value={createForm.password}
                  onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                  className="input-field" disabled={createLoading}
                />
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))}
                  className="input-field" disabled={createLoading}
                >
                  <option value="passenger">Passenger</option>
                  <option value="driver">Driver</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {createError && <p className="text-red-600 text-sm">{createError}</p>}
              <button type="submit" disabled={createLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50">
                {createLoading ? 'Creating...' : 'Create User'}
              </button>
            </form>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Joined</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${ROLE_COLORS[user.role]}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDeleteUser(user.id, user.name)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium transition-colors">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RIDES TAB */}
      {!loading && activeTab === 'rides' && (
        <div>
          <p className="text-sm text-gray-500 mb-4">{rides.length} rides total</p>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold">
                <tr>
                  <th className="text-left px-4 py-3">#</th>
                  <th className="text-left px-4 py-3">Passenger</th>
                  <th className="text-left px-4 py-3">Route</th>
                  <th className="text-left px-4 py-3">Price</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rides.map((ride) => (
                  <tr key={ride.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">#{ride.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{ride.passengerName || '—'}</p>
                      <p className="text-xs text-gray-400">{ride.passengerEmail || ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800">{ride.origin}</p>
                      <p className="text-xs text-gray-400">→ {ride.destination}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">${ride.price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={ride.status}
                        onChange={(e) => handleStatusChange(ride.id, e.target.value)}
                        className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer ${STATUS_COLORS[ride.status]}`}
                      >
                        {VALID_STATUSES.map((s) => (
                          <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(ride.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {rides.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No rides found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
