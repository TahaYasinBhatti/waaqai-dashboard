import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Clear session data on mount
  useEffect(() => {
    document.cookie = "isAuthenticated=false; path=/; max-age=0";
    document.cookie = "userRole=; path=/; max-age=0";
    document.cookie = "userDevices=; path=/; max-age=0";
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post(
        'https://y083656ei1.execute-api.eu-north-1.amazonaws.com/dev/login',
        { username: username.trim(), password: password.trim() },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const responseData =
        typeof response.data.body === 'string'
          ? JSON.parse(response.data.body)
          : response.data;

      if (!responseData.message || !responseData.role) {
        throw new Error('Invalid server response structure');
      }

      console.log('Login Successful:', responseData);

      // ✅ Store authentication in cookies
      document.cookie = `isAuthenticated=true; path=/; max-age=86400`; // Expires in 1 day
      document.cookie = `userRole=${responseData.role}; path=/; max-age=86400`;
      document.cookie = `userDevices=${encodeURIComponent(JSON.stringify(responseData.devices || []))}; path=/; max-age=86400`;

      console.log("Navigating to /dashboard...");
      //navigate('/dashboard', { replace: true });
      window.location.replace("/dashboard")
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed. Please check credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              autoComplete="username"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
