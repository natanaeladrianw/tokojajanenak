// API Configuration
// Backend base URL - can be overridden with environment variable
//
// To configure the backend URL:
// 1. Create a .env file in the frontend root directory
// 2. Add: REACT_APP_API_BASE_URL=http://your-backend-url:port
// 3. Restart the development server
//
// Example:
//   REACT_APP_API_BASE_URL=http://localhost:5000
//   REACT_APP_API_BASE_URL=https://api.yourdomain.com
//
// Default (if not set): http://localhost:5000
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// Helper function to build full API URL
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Helper function to get full image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // Otherwise prepend base URL
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${API_BASE_URL}${cleanPath}`;
};

// Export base URL for direct use if needed
export const API_BASE = API_BASE_URL;

// Export axios instance with baseURL configured
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default API_BASE_URL;

