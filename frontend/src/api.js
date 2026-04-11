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
  googleLogin: (credential) => api.post('/auth/google', { credential }),
  forgotPassword: (email) => api.post('/auth/forgotpassword', { email }),
  resetPassword: (token, password) => api.put(`/auth/resetpassword/${token}`, { password }),
  me: () => api.get('/auth/me'),
};

export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  getDashboard: () => api.get('/profile/dashboard'),
  getHealthScore: () => api.get('/profile/health-score'),



  updateAssets: (assets) => api.put('/profile/assets', assets),
  getAssets: () => api.get('/profile/assets'),
  scan: (imageBase64) => api.post('/profile/scan', { imageBase64 })
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

export const predictionsAPI = {
  getAIInvest: (data) => api.post('/predictions/ai-invest', data),
  getAISuggestions: (data) => api.post('/predictions/ai-suggestions', data),
  getStockRisk: (symbol) => api.get(`/predictions/stock-risk/${symbol}`),
  getStockPredict: (symbol) => api.get(`/predictions/stock-predict/${symbol}`),
  getAIGoal: (data) => api.post('/predictions/ai-goal', data),
};

export default api;
