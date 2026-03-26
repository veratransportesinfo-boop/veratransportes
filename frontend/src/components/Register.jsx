import { useState } from 'react';
import { authApi } from '../api.js';

export default function Register({ onSuccess, onSwitchToLogin }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'passenger' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    else if (form.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!emailRegex.test(form.email)) newErrors.email = 'Invalid email format';

    if (!form.password) newErrors.password = 'Password is required';
    else if (form.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    if (!form.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role
      });
      onSuccess(data.user, data.token);
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed. Please try again.';
      setApiError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Create account</h2>
      <p className="text-sm text-gray-500 mb-6">Join Transportes App today</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="label" htmlFor="reg-name">Full name</label>
          <input
            id="reg-name"
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="John Doe"
            autoComplete="name"
            className={`input-field ${errors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
            disabled={loading}
          />
          {errors.name && <p className="error-text">{errors.name}</p>}
        </div>

        <div>
          <label className="label" htmlFor="reg-email">Email address</label>
          <input
            id="reg-email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            className={`input-field ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
            disabled={loading}
          />
          {errors.email && <p className="error-text">{errors.email}</p>}
        </div>

        <div>
          <label className="label" htmlFor="reg-password">Password</label>
          <input
            id="reg-password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Min. 6 characters"
            autoComplete="new-password"
            className={`input-field ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
            disabled={loading}
          />
          {errors.password && <p className="error-text">{errors.password}</p>}
        </div>

        <div>
          <label className="label" htmlFor="reg-confirm-password">Confirm password</label>
          <input
            id="reg-confirm-password"
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Repeat your password"
            autoComplete="new-password"
            className={`input-field ${errors.confirmPassword ? 'border-red-400 focus:ring-red-400' : ''}`}
            disabled={loading}
          />
          {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
        </div>

        <div>
          <label className="label">I am a...</label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-all ${
                form.role === 'passenger'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="role"
                value="passenger"
                checked={form.role === 'passenger'}
                onChange={handleChange}
                className="text-indigo-600"
                disabled={loading}
              />
              <div>
                <span className="block text-sm font-semibold">Passenger</span>
                <span className="block text-xs text-gray-500">I need rides</span>
              </div>
            </label>
            <label
              className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-all ${
                form.role === 'driver'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="role"
                value="driver"
                checked={form.role === 'driver'}
                onChange={handleChange}
                className="text-indigo-600"
                disabled={loading}
              />
              <div>
                <span className="block text-sm font-semibold">Driver</span>
                <span className="block text-xs text-gray-500">I give rides</span>
              </div>
            </label>
          </div>
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
          className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-5">
        Already have an account?{' '}
        <button
          onClick={onSwitchToLogin}
          className="text-indigo-600 hover:text-indigo-800 font-semibold"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}
