// src/pages/AllDevicesPM25.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLatestData } from '../services/api';
import { devices as deviceLocations } from '../data/devices';
import Dial from '../components/Dial';

/**
 * Retry helper for transient server errors.
 * @param {Function} fetchFn  - An async function that fetches data (e.g., fetchLatestData).
 * @param {number}   maxRetries  - Number of times to retry on failure.
 * @param {number}   retryDelay  - Milliseconds to wait between retries.
 */
async function fetchWithRetry(fetchFn, maxRetries = 2, retryDelay = 500) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fetchFn();
      return result;
    } catch (err) {
      lastError = err;
      // If it's not a server error or known retriable error, stop early
      if (!isRetriableError(err)) {
        break;
      }
      // Wait briefly before next attempt
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
  // All retries failed
  throw lastError;
}

function isRetriableError(err) {
  // You can adjust this logic. Here we assume "500" or "Internal Server Error" in the message means retriable.
  const msg = err.message || '';
  return msg.includes('500') || msg.includes('Internal Server Error');
}

const AllDevicesPM25 = () => {
  const navigate = useNavigate();

  // 1) Sort devices alphabetically by label
  const sortedLocations = [...deviceLocations].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' })
  );

  // State: after loading, holds array of { id, label, pm25, lastModified }
  const [devicesData, setDevicesData] = useState([]);
  // Whether the entire page is still loading
  const [isLoadingAll, setIsLoadingAll] = useState(true);

  // Fetch data for each device in parallel with Promise.all, but use fetchWithRetry for each
  const fetchAllDevices = async () => {
    setIsLoadingAll(true);

    try {
      const promises = sortedLocations.map(async (device) => {
        try {
          // Attempt to fetch device data with small retries
          const realTime = await fetchWithRetry(() => fetchLatestData(device.id), 2, 500);
          return {
            id: device.id,
            label: device.label,
            pm25: realTime.pm25,
            lastModified:
              realTime.sourceTime === 'N/A'
                ? 'N/A'
                : new Date(realTime.sourceTime).toLocaleString(),
          };
        } catch {
          // If all retries fail or a non-retriable error occurs
          return {
            id: device.id,
            label: device.label,
            pm25: 'N/A',
            lastModified: 'N/A',
          };
        }
      });

      // Wait for all requests to finish
      const results = await Promise.all(promises);
      setDevicesData(results);
    } finally {
      setIsLoadingAll(false);
    }
  };

  useEffect(() => {
    // Initial load
    fetchAllDevices();

    // Auto-refresh every 2 minutes
    const interval = setInterval(() => {
      fetchAllDevices();
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  // If still loading all devices, show a full-page spinner
  if (isLoadingAll) {
    return (
      <div className="p-4 min-h-screen bg-gray-50">
        {/* Top bar with title and navigation */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 md:mb-0">
            Command &amp; Control - PM2.5 Overview
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-500 text-white py-1 px-3 rounded-md hover:bg-blue-600"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/all-devices')}
              className="bg-blue-500 text-white py-1 px-3 rounded-md hover:bg-blue-600"
            >
              All Gauges
            </button>
          </div>
        </div>

        {/* Full-page spinner */}
        <div className="flex justify-center items-center" style={{ height: '70vh' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-blue-500"></div>
        </div>
      </div>
    );
  }

  // Once loaded, display the device dials
  return (
    <div className="p-4 min-h-screen bg-gray-50">
      {/* Top bar with title and navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 md:mb-0">
          Command &amp; Control - PM2.5 Overview
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-500 text-white py-1 px-3 rounded-md hover:bg-blue-600"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate('/all-devices')}
            className="bg-blue-500 text-white py-1 px-3 rounded-md hover:bg-blue-600"
          >
            All Gauges
          </button>
        </div>
      </div>

      {/* Grid of PM2.5 dials for all devices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {devicesData.map((device) => (
          <div key={device.id} className="bg-white rounded-md shadow p-4">
            <h2 className="text-md font-semibold text-gray-700 mb-2">
              {device.label}
            </h2>

            {/* Increased container height and spacing to avoid overlap */}
            <div className="h-44 pt-4 flex flex-col items-center justify-center overflow-hidden">
              {device.pm25 === null ? (
                <div className="text-gray-500">Loading...</div>
              ) : (
                <Dial
                  value={device.pm25}
                  min={0}
                  max={500}
                  unit="µg/m³"
                  colors={['#00E400', '#FFFF00', '#FFA500', '#FF4500', '#8B4513']}
                />
              )}
            </div>

            {/* PM2.5 Value */}
            <div className="mt-6 text-base text-gray-800">
              {device.pm25 === 'N/A' ? 'No Data' : `${device.pm25} µg/m³`}
            </div>

            {/* Last Updated Timestamp */}
            <p className="mt-2 text-xs text-gray-500">
              Last Updated: {device.lastModified ?? 'N/A'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllDevicesPM25;
