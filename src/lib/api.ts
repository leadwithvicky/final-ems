import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (userData: any) =>
    api.post('/auth/register', userData),
};

// Employee API
export const employeeAPI = {
  getAll: () => api.get('/employees'),
  getById: (id: string) => api.get(`/employees/${id}`),
  create: (employeeData: any) => api.post('/employees', employeeData),
  update: (id: string, employeeData: any) => api.put(`/employees/${id}`, employeeData),
  delete: (id: string) => api.delete(`/employees/${id}`),
  getMyProfile: () => api.get('/employees/user/me'),
  getByDepartment: (department: string) => api.get(`/employees/department/${department}`),
};

// Leave API
export const leaveAPI = {
  getAll: () => api.get('/leaves'),
  getById: (id: string) => api.get(`/leaves/${id}`),
  getMyLeaves: () => api.get('/leaves/my-leaves'),
  create: (leaveData: any) => api.post('/leaves', leaveData),
  update: (id: string, leaveData: any) => api.put(`/leaves/${id}`, leaveData),
  delete: (id: string) => api.delete(`/leaves/${id}`),
  approve: (id: string, status: string, comments?: string) =>
    api.put(`/leaves/${id}/approve`, { status, comments }),
  getStats: () => api.get('/leaves/stats'),
};

// Attendance API
export const attendanceAPI = {
  getAll: (params?: any) => api.get('/attendance', { params }),
  getMyAttendance: () => api.get('/attendance'),
  clockIn: (location?: any) => api.post('/attendance', { action: 'clock-in', location }),
  clockOut: (location?: any) => api.post('/attendance', { action: 'clock-out', location }),
  getStats: () => api.get('/attendance/stats'),
};

// Payroll API
export const payrollAPI = {
  getAll: (params?: any) => api.get('/payroll', { params }),
  getMyPayroll: () => api.get('/payroll'),
  create: (payrollData: any) => api.post('/payroll', payrollData),
  update: (id: string, payrollData: any) => api.put(`/payroll/${id}`, payrollData),
  getById: (id: string) => api.get(`/payroll/${id}`),
  getStats: () => api.get('/payroll/stats'),
};

// Task API
export const taskAPI = {
  getAll: (params?: any) => api.get('/tasks', { params }),
  getMyTasks: () => api.get('/tasks'),
  create: (taskData: any) => api.post('/tasks', taskData),
  update: (id: string, taskData: any) => api.put(`/tasks/${id}`, taskData),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  updateProgress: (id: string, progress: number) => api.put(`/tasks/${id}/progress`, { progress }),
  addComment: (id: string, comment: string) => api.post(`/tasks/${id}/comments`, { comment }),
  getStats: () => api.get('/tasks/stats'),
};

export default api;
