import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTemperatureHigh, FaWater, FaSmog } from 'react-icons/fa';
import { fetchLatestData, fetchHistoricalData, processHistoricalData } from '../services/api';
import DeviceDropdown from '../components/DeviceDropdown';
import DataCard from '../components/DataCard';
import LineChart from '../components/LineChart';
import Dial from '../components/Dial';
import Heatmap from '../components/Heatmap';
import { devices as deviceLocations } from '../data/devices';

const getCookie = (name) => {
  const cookies = document.cookie.split('; ');
  const cookie = cookies.find(row => row.startsWith(name + '='));
  return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const userRole = getCookie('userRole') || localStorage.getItem('userRole');
  const userDevices = JSON.parse(getCookie('userDevices') || '[]');
  const allDevices = Array.from({ length: 20 }, (_, i) => ({
    label: `Device ${i + 1}`,
    value: String(i + 1),
  }));

  const labeledDevicesMap = deviceLocations.reduce((map, device) => {
    map[device.id] = device.label;
    return map;
  }, {});

  let filteredDevices = (userRole === 'admin'
    ? allDevices
    : allDevices.filter(device =>
        userDevices.some(userDevice => userDevice === device.label)
      )
  ).map(device => ({
    ...device,
    label: labeledDevicesMap[device.value] || device.label
  }));

  // Sort devices alphabetically by their label
  filteredDevices = filteredDevices.sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' })
  );

  const [selectedDevice, setSelectedDevice] = useState(filteredDevices[0]?.value || '1');
  const [realTimeData, setRealTimeData] = useState({
    temperature: 'N/A',
    humidity: 'N/A',
    pm25: 'N/A',
    lastModified: 'N/A',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [rawHistoricalData, setRawHistoricalData] = useState([]);
  const [dateRange, setDateRange] = useState('24hours');

  // Keep the dropdown for JSON/CSV downloads
  const [downloadFormat, setDownloadFormat] = useState('json');

  const selectedDeviceLocation = deviceLocations.find(
    (device) => device.id.toString() === selectedDevice.toString()
  );

  useEffect(() => {
    if (!getCookie('isAuthenticated') && !localStorage.getItem('isAuthenticated')) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const fetchRealTimeData = async (signal) => {
    try {
      const realTime = await fetchLatestData(selectedDevice, signal);

      const isValidData = [realTime.temperature, realTime.humidity, realTime.pm25].every(
        val => !isNaN(val) && val !== 'N/A'
      );

      setRealTimeData({
        temperature: isValidData ? realTime.temperature : 'N/A',
        humidity: isValidData ? realTime.humidity : 'N/A',
        pm25: isValidData ? realTime.pm25 : 'N/A',
        lastModified:
          realTime.sourceTime === 'N/A'
            ? 'N/A'
            : new Date(realTime.sourceTime).toLocaleString(),
      });
    } catch (err) {
      if (err.name !== 'CanceledError') {
        setError(err.message);
        setRealTimeData({
          temperature: 'N/A',
          humidity: 'N/A',
          pm25: 'N/A',
          lastModified: 'N/A',
        });
      }
    }
  };

  const fetchAndSetHistoricalData = async (startTime, endTime, signal) => {
    try {
      setLoading(true);
      setError(null);
      const rawData = await fetchHistoricalData(selectedDevice, startTime, endTime, signal);
      setRawHistoricalData(rawData);
      setChartData(processHistoricalData(rawData));
    } catch (err) {
      if (err.name !== 'CanceledError') {
        setError(err.message);
        setChartData([]);
        setRawHistoricalData([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper: convert dateRange to hours
  const getHoursForRange = (range) => {
    const ranges = {
      '24hours': 24,
      '7days': 7 * 24,
      '30days': 30 * 24,
      '3months': 90 * 24,
      '6months': 180 * 24,
    };
    return ranges[range] || 24;
  };

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const fetchData = async () => {
      try {
        setRealTimeData({
          temperature: 'N/A',
          humidity: 'N/A',
          pm25: 'N/A',
          lastModified: 'N/A',
        });

        const now = new Date();

        // Fetch real-time data
        await fetchRealTimeData(abortController.signal);

        // Fetch historical data using the current dateRange
        if (isMounted) {
          const hours = getHoursForRange(dateRange);
          await fetchAndSetHistoricalData(
            new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString(),
            now.toISOString(),
            abortController.signal
          );
        }
      } catch (err) {
        if (isMounted && err.name !== 'CanceledError') {
          setError('Failed to load device data');
        }
      }
    };

    // Initial fetch
    fetchData();

    // Polling interval to refresh both real-time & historical data
    const pollingInterval = setInterval(async () => {
      const now = new Date();
      await fetchRealTimeData(abortController.signal);
      if (isMounted) {
        const hours = getHoursForRange(dateRange);
        await fetchAndSetHistoricalData(
          new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString(),
          now.toISOString(),
          abortController.signal
        );
      }
    }, 120000);

    return () => {
      isMounted = false;
      abortController.abort();
      clearInterval(pollingInterval);
    };
    // Now depends on both selectedDevice & dateRange
  }, [selectedDevice, dateRange]);

  if (!selectedDeviceLocation) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="bg-red-100 border-red-400 text-red-700 p-4 rounded-lg">
          Error: Device {selectedDevice} not found in registry
        </div>
      </div>
    );
  }

  const handleDateRangeChange = (event) => {
    const range = event.target.value;
    setDateRange(range);
    const now = new Date();
    const hours = getHoursForRange(range);
    fetchAndSetHistoricalData(
      new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString(),
      now.toISOString()
    );
  };

  const handleLogout = () => {
    document.cookie = 'isAuthenticated=; max-age=0; path=/';
    document.cookie = 'userRole=; max-age=0; path=/';
    document.cookie = 'userDevices=; max-age=0; path=/';

    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userDevices');

    navigate('/login');
  };

  // Determine if last update was within 30 minutes
  const lastModifiedDate =
    realTimeData.lastModified !== 'N/A' ? new Date(realTimeData.lastModified) : null;

  let isWithin30Mins = false;
  if (lastModifiedDate && !isNaN(lastModifiedDate)) {
    const diffMinutes = (new Date() - lastModifiedDate) / (1000 * 60);
    isWithin30Mins = diffMinutes <= 30;
  }

  const isAdmin = (userRole === 'admin');

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col lg:flex-row items-start gap-4">
      <div className="hidden lg:flex flex-col justify-center items-center space-y-2 w-[220px] flex-shrink-0">
        <img
          src="/Laaca.jpg"
          alt="Clean Air Illustration"
          className="w-full h-[250px] object-cover rounded-lg shadow-md"
        />
        <p className="text-center text-gray-500 text-sm">Breathe clean, live green 🌱</p>
      </div>

      <div className="flex-1 w-full max-w-6xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h1 className="text-xl font-bold text-gray-800 mb-2 md:mb-0">WAQIA Dashboard</h1>

          <div className="flex items-center space-x-3">
            {/* Only show these buttons if admin */}
            {isAdmin && (
              <>
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
              </>
            )}

            <DeviceDropdown
              devices={filteredDevices}
              selectedDevice={selectedDevice}
              onDeviceChange={setSelectedDevice}
            />

            {/* Status label and circle on same row */}
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-600">Status:</span>
              <div
                className="w-3 h-3 rounded-full border border-gray-300"
                style={{ backgroundColor: isWithin30Mins ? '#10B981' : '#EF4444' }}
              />
            </div>

            <button
              onClick={handleLogout}
              className="bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <DataCard title="Temperature" color="text-orange-500" icon={<FaTemperatureHigh />}>
            <div className="h-32">
              <Dial
                value={realTimeData.temperature}
                min={-10}
                max={50}
                unit="°C"
                colors={['#0000FF', '#00FFFF', '#00FF00', '#FFFF00', '#FFA500', '#FF0000']}
              />
            </div>
          </DataCard>

          <DataCard title="Humidity" color="text-blue-500" icon={<FaWater />}>
            <div className="h-32">
              <Dial
                value={realTimeData.humidity}
                min={0}
                max={100}
                unit="%"
                colors={['#ADD8E6', '#87CEEB', '#4682B4', '#000080']}
              />
            </div>
          </DataCard>

          <DataCard title="PM 2.5" color="text-red-500" icon={<FaSmog />}>
            <div className="h-32">
              <Dial
                value={realTimeData.pm25}
                min={0}
                max={500}
                unit="µg/m³"
                colors={['#00E400', '#FFFF00', '#FFA500', '#FF4500', '#8B4513']}
              />
            </div>
          </DataCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded-xl shadow-sm h-[350px]">
            <h2 className="text-md font-bold text-gray-700 mb-2">
              {selectedDeviceLocation.locationTitle}
            </h2>
            <Heatmap
              key={selectedDevice}
              pm25Value={realTimeData.pm25}
              coordinates={[selectedDeviceLocation.lat, selectedDeviceLocation.lng]}
            />
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm h-[350px]">
            <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Select Date Range:
                </label>
                <select
                  className="border border-gray-300 rounded-md p-1 w-36"
                  onChange={handleDateRangeChange}
                  value={dateRange}
                >
                  <option value="24hours">Last 24 Hours</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                </select>
              </div>

              {/* JSON/CSV download dropdown and button */}
              <div className="flex items-center space-x-2">
                <select
                  value={downloadFormat}
                  onChange={(e) => setDownloadFormat(e.target.value)}
                  className="border border-gray-300 rounded-md p-1"
                >
                  <option value="json">.json</option>
                  <option value="csv">.csv</option>
                </select>
                <button
                  onClick={() => {
                    if (downloadFormat === 'json') {
                      // JSON download
                      const blob = new Blob(
                        [JSON.stringify(rawHistoricalData, null, 2)],
                        { type: 'application/json' }
                      );
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `device-${selectedDevice}-unprocessed-data-${new Date().toISOString()}.json`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                    } else {
                      // CSV download
                      if (rawHistoricalData.length > 0) {
                        const headers = Object.keys(rawHistoricalData[0]);
                        const csvRows = [];
                        // Add header row
                        csvRows.push(headers.join(','));
                        // Add data rows
                        rawHistoricalData.forEach((item) => {
                          const row = headers.map((h) => {
                            const val = item[h] == null ? '' : item[h];
                            // Escape any quotes
                            return `"${String(val).replace(/"/g, '""')}"`;
                          });
                          csvRows.push(row.join(','));
                        });
                        const csvContent = csvRows.join('\n');
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `device-${selectedDevice}-unprocessed-data-${new Date().toISOString()}.csv`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                      } else {
                        alert('No data available to download.');
                      }
                    }
                  }}
                  className="bg-green-500 text-white py-1 px-3 rounded-md hover:bg-green-600"
                >
                  Download Data
                </button>
              </div>
            </div>

            <h2 className="text-md font-bold text-gray-700 mb-2">PM 2.5 Levels</h2>
            <div className="mb-2 text-sm text-gray-600">
              Last Updated: {realTimeData.lastModified}
            </div>
            <div className="h-40">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-4 border-t-transparent border-blue-500"></div>
                </div>
              ) : chartData.length > 0 ? (
                <LineChart data={chartData} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No chart data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-[220px] flex-shrink-0">
        <img
          src="https://media.istockphoto.com/id/650754962/vector/ecology-air-and-atmosphere-pollution.jpg?s=612x612&w=0&k=20&c=TZhrkmjUly1hgIW3oMwYt2x9J6vui_LTYAYCfqpJpt4="
          alt="Pollution Illustration"
          className="w-full h-[250px] object-cover rounded-lg shadow-md"
        />
        <p className="text-center text-gray-500 text-sm">Monitor pollution, save lives ❤️</p>
      </div>
    </div>
  );
};

export default Dashboard;
