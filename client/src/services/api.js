import axios from 'axios';

const API = axios.create({
  // Use Vite environment variable for the API base URL at build time.
  // If not provided, fall back to '/api' to keep local dev working with a proxy.
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('xquizzes_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally (skip auth endpoints so inline errors show)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    const isAuthEndpoint = ['/auth/login', '/auth/admin/login', '/auth/register', '/auth/admin/register'].some((path) =>
      requestUrl.includes(path)
    );

    if (status === 401 && !isAuthEndpoint) {
      const userData = localStorage.getItem('xquizzes_user');
      const isAdmin = userData ? JSON.parse(userData).role === 'admin' : false;
      localStorage.removeItem('xquizzes_token');
      localStorage.removeItem('xquizzes_user');
      window.location.href = isAdmin ? '/admin/login' : '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  adminLogin: (data) => API.post('/auth/admin/login', data),
  adminRegister: (data) => API.post('/auth/admin/register', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
};

// Test APIs
export const testAPI = {
  generate: (formData) =>
    API.post('/tests/generate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2 min timeout for AI generation
    }),
  getMyTests: (params) => API.get('/tests', { params }),
  getById: (id) => API.get(`/tests/${id}`),
  getForTaking: (id) => API.get(`/tests/${id}/take`),
  delete: (id) => API.delete(`/tests/${id}`),
};

// Attempt APIs
export const attemptAPI = {
  submit: (testId, data) => API.post(`/attempts/${testId}/submit`, data),
  getById: (id) => API.get(`/attempts/${id}`),
  getByTest: (testId) => API.get(`/attempts/test/${testId}`),
  getMy: (params) => API.get('/attempts/my', { params }),
  getAnalytics: () => API.get('/attempts/analytics'),
};

// Admin APIs
export const adminAPI = {
  getStats: () => API.get('/admin/stats'),
  getUsers: (params) => API.get('/admin/users', { params }),
  getUserReport: (id) => API.get(`/admin/users/${id}/report`),
  getTests: (params) => API.get('/admin/tests', { params }),
  generateTest: (formData) =>
    API.post('/admin/tests/generate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    }),
  assignTest: (testId, userIds) => API.put(`/admin/tests/${testId}/assign`, { userIds }),
};

// Notification APIs
export const notificationAPI = {
  getAll: (params) => API.get('/notifications', { params }),
  markAsRead: (id) => API.put(`/notifications/${id}/read`),
  markAllAsRead: () => API.put('/notifications/read-all'),
};

export default API;
