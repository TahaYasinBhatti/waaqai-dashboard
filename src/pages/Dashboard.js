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

  const filteredDevices = (userRole === 'admin' 
    ? allDevices 
    : allDevices.filter(device => 
        userDevices.some(userDevice => userDevice === device.label)
      )
  ).map(device => ({
    ...device,
    label: labeledDevicesMap[device.value] || device.label
  }));

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
        lastModified: realTime.sourceTime === 'N/A' 
          ? 'N/A' 
          : new Date(realTime.sourceTime).toLocaleString()
      });
    } catch (err) {
      if (err.name !== 'CanceledError') {
        setError(err.message);
        setRealTimeData({
          temperature: 'N/A',
          humidity: 'N/A',
          pm25: 'N/A',
          lastModified: 'N/A'
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

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const fetchData = async () => {
      try {
        setRealTimeData({
          temperature: 'N/A',
          humidity: 'N/A',
          pm25: 'N/A',
          lastModified: 'N/A'
        });

        const now = new Date();
        await fetchRealTimeData(abortController.signal);

        if (isMounted) {
          await fetchAndSetHistoricalData(
            new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
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

    setLoading(true);
    fetchData();

    const pollingInterval = setInterval(() => {
      fetchRealTimeData(abortController.signal);
    }, 120000);

    return () => {
      isMounted = false;
      abortController.abort();
      clearInterval(pollingInterval);
    };
  }, [selectedDevice]);

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
    const ranges = {
      '24hours': 24,
      '7days': 7 * 24,
      '30days': 30 * 24,
      '3months': 90 * 24,
      '6months': 180 * 24
    };
    const startTime = new Date(now.getTime() - (ranges[range] || 24) * 60 * 60 * 1000).toISOString();
    fetchAndSetHistoricalData(startTime, now.toISOString());
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
            <DeviceDropdown devices={filteredDevices} selectedDevice={selectedDevice} onDeviceChange={setSelectedDevice} />
            <button onClick={handleLogout} className="bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600">
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <DataCard title="Temperature" color="text-orange-500" icon={<FaTemperatureHigh />}>
            <div className="h-32">
              <Dial value={realTimeData.temperature} min={-10} max={50} unit="°C" colors={['#0000FF', '#00FFFF', '#00FF00', '#FFFF00', '#FFA500', '#FF0000']} />
            </div>
          </DataCard>

          <DataCard title="Humidity" color="text-blue-500" icon={<FaWater />}>
            <div className="h-32">
              <Dial value={realTimeData.humidity} min={0} max={100} unit="%" colors={['#ADD8E6', '#87CEEB', '#4682B4', '#000080']} />
            </div>
          </DataCard>

          <DataCard title="PM 2.5" color="text-red-500" icon={<FaSmog />}>
            <div className="h-32">
              <Dial value={realTimeData.pm25} min={0} max={500} unit="µg/m³" colors={['#00E400', '#FFFF00', '#FFA500', '#FF4500', '#8B4513']} />
            </div>
          </DataCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded-xl shadow-sm h-[350px]">
            <h2 className="text-md font-bold text-gray-700 mb-2">{selectedDeviceLocation.locationTitle}</h2>
            <Heatmap key={selectedDevice} pm25Value={realTimeData.pm25} coordinates={[selectedDeviceLocation.lat, selectedDeviceLocation.lng]} />
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm h-[350px]">
            <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Date Range:</label>
                <select className="border border-gray-300 rounded-md p-1 w-36" onChange={handleDateRangeChange} value={dateRange}>
                  <option value="24hours">Last 24 Hours</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                </select>
              </div>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(rawHistoricalData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `device-${selectedDevice}-unprocessed-data-${new Date().toISOString()}.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
                className="bg-green-500 text-white py-1 px-3 rounded-md hover:bg-green-600"
              >
                Download Data
              </button>
            </div>
            <h2 className="text-md font-bold text-gray-700 mb-2">PM 2.5 Levels</h2>
            <div className="h-40">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-4 border-t-transparent border-blue-500"></div>
                </div>
              ) : chartData.length > 0 ? (
                <LineChart data={chartData} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">No chart data available</div>
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
