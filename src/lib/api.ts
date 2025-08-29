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
  getAll: (params?: any) => api.get('/employees', { params }),
  getById: (id: string) => api.get(`/employees/${id}`),
  create: (employeeData: any) => api.post('/employees', employeeData),
  update: (id: string, employeeData: any) => api.put(`/employees/${id}`, employeeData),
  delete: (id: string) => api.delete(`/employees/${id}`),
  transfer: (id: string, toDepartment: string, reason?: string) => api.post(`/employees/${id}/transfer`, { toDepartment, reason }),
  addDocument: (id: string, payload: { type: string; url: string; expiryDate?: string; verificationStatus?: string; notes?: string }) => api.post(`/employees/${id}/documents`, payload),
  updateDocument: (id: string, index: number, updates: any) => api.put(`/employees/${id}/documents`, { index, updates }),
  exit: (id: string, payload: { resignationReason?: string; lastWorkingDay?: string; clearanceStatus?: string }) => api.post(`/employees/${id}/exit`, payload),
  reactivate: (id: string) => api.post(`/employees/${id}/reactivate`),
  bulkImport: (data: any[] | string, isCsv = false) => isCsv ? api.post('/employees/bulk-import', data, { headers: { 'Content-Type': 'text/csv' } }) : api.post('/employees/bulk-import', data),
  getMyProfile: () => api.get('/employees/user/me'),
  getByDepartment: (department: string) => api.get(`/employees/department/${department}`),
};

// Department API
export const departmentAPI = {
  getAll: () => api.get('/departments'),
  getFull: () => api.get('/departments', { params: { full: true } }),
  create: (payload: { name: string; code?: string; description?: string }) => api.post('/departments', payload),
  update: (id: string, payload: Partial<{ name: string; code: string; description: string; isActive: boolean }>) => api.put(`/departments/${id}`, payload),
  deactivate: (id: string) => api.delete(`/departments/${id}`),
  getById: (id: string) => api.get(`/departments/${id}`),
  getEmployees: (department: string) => api.get(`/departments/by-name/${encodeURIComponent(department)}/employees`),
};

// Leave API
export const leaveAPI = {
  getAll: () => api.get('/leaves'),
  getById: (id: string) => api.get(`/leaves/${id}`),
  getMyLeaves: () => api.get('/leaves/my-leaves'),
  create: (leaveData: any) => api.post('/leaves', leaveData),
  update: (id: string, leaveData: any) => api.put(`/leaves/${id}`, leaveData),
  delete: (id: string) => api.delete(`/leaves/${id}`),
  approve: (id: string, comments?: string) => api.post(`/leaves/${id}/approve`, comments ? { comments } : {}),
  reject: (id: string, comments?: string) => api.post(`/leaves/${id}/reject`, comments ? { comments } : {}),
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
  process: (payload: { 
    month: number; 
    year: number; 
    employeeId?: string; 
    notes?: string; 
    recompute?: boolean;
    recomputeReason?: string;
    bonus?: number;
    allowances?: { housing?: number; transport?: number; meal?: number; other?: number };
  }) => api.post('/payroll/process', payload),
  stats: (params?: { month?: number; year?: number }) => api.get('/payroll/stats', { params }),
  markPaid: (id: string) => api.put(`/payroll/${id}/pay`),
  finalize: (id: string, notes?: string) => api.put(`/payroll/${id}/finalize`, notes ? { notes } : {}),
  adjust: (id: string, payload: any) => api.put(`/payroll/${id}/adjust`, payload),
  downloadPayslip: (id: string) => api.get(`/payroll/${id}/payslip`),
  downloadPayslipPdf: async (id: string) => {
    const res = await api.get(`/payroll/${id}/payslip/pdf`, { responseType: 'blob' });
    return res.data as Blob;
  },
  exportCsv: async (params: any = {}) => {
    const res = await api.get('/payroll', { params: { ...params, format: 'csv' }, responseType: 'blob' });
    return res.data as Blob;
  },
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
