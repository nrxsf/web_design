import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5174';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 3500,
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response
      ? `Server returned ${error.response.status}: ${error.response.statusText}`
      : 'Local json-server unreachable';
    return Promise.reject(new Error(message));
  },
);

export default http;
