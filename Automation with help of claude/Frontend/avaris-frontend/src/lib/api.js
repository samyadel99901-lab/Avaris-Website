import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Interceptor: نضيف الـ token تلقائياً لكل request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('avaris_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: لو الـ token مش صالح، يخرجنا للـ login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('avaris_token');
      localStorage.removeItem('avaris_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;