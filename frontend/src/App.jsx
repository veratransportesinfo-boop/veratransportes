import { useState, useEffect, useCallback } from 'react';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import RequestRide from './components/RequestRide.jsx';
import RideHistory from './components/RideHistory.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';

const TABS = {
  REQUEST: 'request',
  HISTORY: 'history'
};

export default function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [activeTab, setActiveTab] = useState(TABS.REQUEST);
  const [rideRefreshKey, setRideRefreshKey] = useState(0);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  // Listen for global logout events (triggered by 401 interceptor)
  useEffect(() => {
    const handleLogout = () => handleLogoutAction();
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const handleLoginSuccess = useCallback((userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    if (userData.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab(userData.role === 'passenger' ? TABS.REQUEST : TABS.HISTORY);
    }
  }, []);

  const handleLogoutAction = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setAuthView('login');
  }, []);

  const handleRideCreated = useCallback(() => {
    setRideRefreshKey((k) => k + 1);
    setActiveTab(TABS.HISTORY);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo / Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg mb-4">
              <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Vera Transportes</h1>
            <p className="text-gray-500 mt-1">Your ride, your way</p>
          </div>

          {/* Auth toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-6 bg-white shadow-sm">
            <button
              onClick={() => setAuthView('login')}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                authView === 'login'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setAuthView('register')}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                authView === 'register'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Register
            </button>
          </div>

          {authView === 'login' ? (
            <Login
              onSuccess={handleLoginSuccess}
              onSwitchToRegister={() => setAuthView('register')}
            />
          ) : (
            <Register
              onSuccess={handleLoginSuccess}
              onSwitchToLogin={() => setAuthView('login')}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg">Vera Transportes</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-800">{user.name}</p>
              <p className={`text-xs capitalize font-medium ${user.role === 'admin' ? 'text-purple-600' : 'text-indigo-600'}`}>{user.role}</p>
            </div>
            <button
              onClick={handleLogoutAction}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Tab navigation */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        {user.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <>
            <div className="flex gap-2 mb-6">
              {user.role === 'passenger' && (
                <button
                  onClick={() => setActiveTab(TABS.REQUEST)}
                  className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                    activeTab === TABS.REQUEST
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  Request Ride
                </button>
              )}
              <button
                onClick={() => setActiveTab(TABS.HISTORY)}
                className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  activeTab === TABS.HISTORY
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {user.role === 'driver' ? 'Available Rides' : 'My Rides'}
              </button>
            </div>

            {/* Tab content */}
            <div className="pb-10">
              {activeTab === TABS.REQUEST && user.role === 'passenger' && (
                <RequestRide user={user} onRideCreated={handleRideCreated} />
              )}
              {activeTab === TABS.HISTORY && (
                <RideHistory user={user} refreshKey={rideRefreshKey} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
