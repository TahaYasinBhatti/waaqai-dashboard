import axios from 'axios';

const API_BASE_URL = 'https://guh87mw3g2.execute-api.eu-north-1.amazonaws.com/dev';
const API_TIMEOUT = 10000;

// Handle API errors
const handleApiError = (error) => {
  let errorMessage = 'API Request Failed: ';
  if (error.response) errorMessage += `Server Error (${error.response.status})`;
  else if (error.request) errorMessage += 'No response from server';
  else errorMessage += `Request Error: ${error.message}`;
  if (error.code === 'ECONNABORTED') errorMessage += ' - Request timed out';

  console.error('API Error:', errorMessage);
  throw new Error(errorMessage);
};

// Login API
export const loginUser = async (username, password) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await axios.post(
      `${API_BASE_URL}/login`,
      { username, password },
      {
        signal: controller.signal,
        timeout: API_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: (status) => status >= 200 && status < 300, // Accept only successful responses
      }
    );

    clearTimeout(timeoutId);

    // Parse and return response data
    return response.data;
  } catch (error) {
    clearTimeout(timeoutId);
    handleApiError(error);
  }
};
