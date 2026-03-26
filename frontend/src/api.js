import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  login: async (data) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  }
};

// Rides endpoints
export const ridesApi = {
  createRide: async (data) => {
    const response = await api.post('/rides', data);
    return response.data;
  },
  getRides: async () => {
    const response = await api.get('/rides');
    return response.data;
  },
  getRideById: async (id) => {
    const response = await api.get(`/rides/${id}`);
    return response.data;
  },
  calculatePrice: async (distanceKm) => {
    const response = await api.get('/rides/calculate/price', {
      params: { distance_km: distanceKm }
    });
    return response.data;
  }
};

// Admin endpoints
export const adminApi = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },
  createUser: async (data) => {
    const response = await api.post('/admin/users', data);
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },
  getRides: async () => {
    const response = await api.get('/admin/rides');
    return response.data;
  },
  updateRideStatus: async (id, status) => {
    const response = await api.patch(`/admin/rides/${id}/status`, { status });
    return response.data;
  }
};

export default api;
