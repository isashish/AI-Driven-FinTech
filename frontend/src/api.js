import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (userData) => api.post('/auth/register', userData),
  me: () => api.get('/auth/me'),
};

export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  getDashboard: () => api.get('/profile/dashboard'),
  getHealthScore: () => api.get('/profile/health-score'),
};

export const goalsAPI = {
  getAll: () => api.get('/goals'),
  create: (goal) => api.post('/goals', goal),
  update: (id, goal) => api.put(`/goals/${id}`, goal),
  delete: (id) => api.delete(`/goals/${id}`),
};

export const chatAPI = {
  sendMessage: (message) => api.post('/chat/message', { message }),
  getHistory: () => api.get('/chat/history'),
  clearHistory: () => api.delete('/chat/history'),
};

export default api;
