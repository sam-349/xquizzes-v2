import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('xquizzes_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('xquizzes_token');
      localStorage.removeItem('xquizzes_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
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

export default API;
