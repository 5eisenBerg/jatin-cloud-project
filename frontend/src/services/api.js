import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;
      
      if (status === 401) {
        // Unauthorized - redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('devUser');
        window.location.href = '/login';
      }
      
      return Promise.reject({
        status,
        message: data.error?.message || 'An error occurred',
        data,
      });
    } else if (error.request) {
      // Request made but no response
      return Promise.reject({
        status: 0,
        message: 'Network error - please check your connection',
      });
    } else {
      // Request setup error
      return Promise.reject({
        status: 0,
        message: error.message,
      });
    }
  }
);

// API service methods
export const fineService = {
  getAll: (params) => api.get('/fines', { params }),
  getByVehicle: (vehicleNo, status) => api.get(`/fines/vehicle/${vehicleNo}`, { params: { status } }),
  getById: (fineId) => api.get(`/fines/${fineId}`),
  create: (data) => api.post('/fines', data),
  updateStatus: (fineId, status) => api.patch(`/fines/${fineId}/status`, { status }),
  getViolationTypes: () => api.get('/fines/config/violations'),
};

export const vehicleService = {
  getMyVehicles: () => api.get('/vehicles/my'),
  getByNumber: (vehicleNo) => api.get(`/vehicles/${vehicleNo}`),
  getHistory: (vehicleNo) => api.get(`/vehicles/${vehicleNo}/history`),
  create: (data) => api.post('/vehicles', data),
  search: (query) => api.get('/vehicles/search', { params: { q: query } }),
  linkToUser: (vehicleNo) => api.post(`/vehicles/${vehicleNo}/link`),
  getTypes: () => api.get('/vehicles/config/types'),
};

export const paymentService = {
  payFine: (fineId, paymentData) => api.post(`/payments/${fineId}/pay`, paymentData),
  bulkPay: (fineIds, paymentMethod) => api.post('/payments/bulk-pay', { fine_ids: fineIds, payment_method: paymentMethod }),
  getHistory: () => api.get('/payments/history'),
  verify: (transactionId) => api.post('/payments/verify', { transaction_id: transactionId }),
};

export const uploadService = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadWithOCR: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/ocr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  processOCR: (imageUrl) => api.post('/upload/ocr/url', { imageUrl }),
};

export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  getOffenders: (minFines) => api.get('/admin/offenders', { params: { minFines } }),
  getFineStats: () => api.get('/admin/stats/fines'),
  getViolationStats: () => api.get('/admin/stats/violations'),
  getDailyStats: (days) => api.get('/admin/stats/daily', { params: { days } }),
  getRecentPayments: (limit) => api.get('/admin/payments/recent', { params: { limit } }),
};

export const authService = {
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  // Development only
  devLogin: (email) => api.post('/auth/login', { email }),
  devRegister: (data) => api.post('/auth/register', data),
};

export default api;
