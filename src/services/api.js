import axios from 'axios';

const API_BASE_URL = 'https://y083656ei1.execute-api.eu-north-1.amazonaws.com/dev';
const API_TIMEOUT = 10000;

const handleApiError = (error) => {
  let errorMessage = 'API Request Failed: ';
  if (error.response) errorMessage += `Server Error (${error.response.status})`;
  else if (error.request) errorMessage += 'No response from server';
  else errorMessage += `Request Error: ${error.message}`;
  if (error.code === 'ECONNABORTED') errorMessage += ' - Request timed out';
  
  console.error('API Error:', errorMessage);
  throw new Error(errorMessage);
};

const parseResponse = (response, dataField) => {
  if (!response.data?.body) throw new Error('Invalid API response structure');
  
  const parsedData = JSON.parse(response.data.body);
  if (!parsedData?.[dataField]) throw new Error(`Missing ${dataField} in response`);
  
  return parsedData[dataField];
};

export const fetchLatestData = async (deviceId, signal) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await axios.get(`${API_BASE_URL}/latest`, {
      params: { device_id: deviceId },
      signal: signal || controller.signal, // Use provided signal or create new
      validateStatus: (status) => status === 200,
    });

    clearTimeout(timeoutId);
    
    if (!response.data?.body) {
      return {
        temperature: 'N/A',
        humidity: 'N/A',
        pm25: 'N/A',
        sourceTime: 'N/A',
        timestamp: 'N/A'
      };
    }

    const parsedData = parseResponse(response, 'latest_data');

    // Safe number conversion (handles 0 and NaN)
    const safeNumber = (val) => {
      const num = Number(val);
      return isNaN(num) ? 'N/A' : num;
    };

    return {
      temperature: safeNumber(parsedData.temperature),
      humidity: safeNumber(parsedData.humidity),
      pm25: safeNumber(parsedData.pm25),
      sourceTime: parsedData.source_time || 'N/A',
      timestamp: parsedData.timestamp || 'N/A'
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name !== 'CanceledError') {
      return {
        temperature: 'N/A',
        humidity: 'N/A',
        pm25: 'N/A',
        sourceTime: 'N/A',
        timestamp: 'N/A'
      };
    }
    throw error; // Re-throw cancellation errors
  }
};

export const fetchHistoricalData = async (deviceId, startTime = null, endTime = null, signal) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const params = { device_id: deviceId };
    if (startTime) params.start_time = startTime;
    if (endTime) params.end_time = endTime;

    const response = await axios.get(`${API_BASE_URL}/historical`, {
      params,
      signal: signal || controller.signal, // Use provided signal or create new
      validateStatus: (status) => status === 200,
    });

    clearTimeout(timeoutId);
    return parseResponse(response, 'historical_data');
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name !== 'CanceledError') {
      return handleApiError(error);
    }
    throw error; // Re-throw cancellation errors
  }
};

export const processHistoricalData = (rawData) => {
  return rawData
    .map((entry) => {
      const entryTime = entry.source_time || entry.timestamp;
      
      return {
        date: entryTime,
        value: Number(entry.pm25) || 0 // Default to 0 if NaN
      };
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};