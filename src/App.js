import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AllDevicesPM25 from './pages/AllDevicesPM25';
import 'leaflet/dist/leaflet.css';

// Cookie helper function
const getCookie = (name) => {
  if (typeof document === 'undefined') return null; // For SSR
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.split('=');
    if (cookieName.trim() === name) {
      return decodeURIComponent(cookieValue.trim());
    }
  }
  return null;
};

function App() {
  const isAuthenticated = getCookie('isAuthenticated') === 'true';
  const userRole = getCookie('userRole') || localStorage.getItem('userRole');

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Dashboard is still protected by isAuthenticated */}
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
        />

        {/* Only allow admins to access /all-devices */}
        <Route
          path="/all-devices"
          element={
            isAuthenticated && userRole === 'admin'
              ? <AllDevicesPM25 />
              : <Navigate to="/dashboard" />
          }
        />

        {/* Default route */}
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
