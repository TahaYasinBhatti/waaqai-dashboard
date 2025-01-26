// src/pages/Login.js
// In Login.js
import React, { useState, useEffect } from 'react'; // Add useEffect here
import { useNavigate } from 'react-router-dom';
import { users } from '../data/users';
const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
  
    // Clear any existing auth state on mount
    useEffect(() => {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userDevices');
    }, []);
  
    const handleLogin = async (e) => {
        e.preventDefault();
      
        try {
          const user = users.find(
            u => u.username === username && u.password === password
          );
      
          if (!user) {
            throw new Error('Invalid credentials');
          }
      
          // Use Promise.all for parallel storage operations
          await Promise.all([
            localStorage.setItem('isAuthenticated', 'true'),
            localStorage.setItem('userRole', user.role),
            localStorage.setItem('userDevices', JSON.stringify(user.devices))
          ]);
      
          // Force state update across browser tabs
          window.dispatchEvent(new Event('storage'));
      
          // Add slight delay for state propagation
          await new Promise(resolve => setTimeout(resolve, 50));
          
          navigate('/dashboard', { replace: true });
      
        } catch (err) {
          setError(err.message);
          // Clear auth state on failure
          localStorage.removeItem('isAuthenticated');
        }
      };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Waaqai Login</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
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