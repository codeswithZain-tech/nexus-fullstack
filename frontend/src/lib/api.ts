import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export const api = axios.create({ baseURL: API_URL });

const TOKEN_KEY = 'business_nexus_token';

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);
export const getToken = () => localStorage.getItem(TOKEN_KEY);

// ---- Auth ----
export const apiRegister = (data: { name: string; email: string; password: string; role: 'investor' | 'entrepreneur' }) =>
  api.post('/auth/register', data);
export const apiLogin = (data: { email: string; password: string }) => api.post('/auth/login', data);
export const apiGetMe = () => api.get('/auth/me');
export const apiForgotPassword = (email: string) => api.post('/auth/forgot-password', { email });
export const apiResetPassword = (token: string, newPassword: string) =>
  api.post('/auth/reset-password', { token, newPassword });

// ---- Profile ----
export const apiUpdateProfile = (updates: object) => api.put('/users/profile', updates);
export const apiGetUser = (id: string) => api.get(`/users/${id}`);
export const apiListInvestors = () => api.get('/users/investors');
export const apiListEntrepreneurs = () => api.get('/users/entrepreneurs');

// ---- Meetings ----
export const apiScheduleMeeting = (data: {
  participant: string;
  title: string;
  notes?: string;
  startTime: string;
  endTime: string;
}) => api.post('/meetings', data);
export const apiGetMyMeetings = () => api.get('/meetings');
export const apiRespondToMeeting = (id: string, status: 'accepted' | 'rejected') =>
  api.put(`/meetings/${id}/respond`, { status });
export const apiCancelMeeting = (id: string) => api.delete(`/meetings/${id}`);

// ---- Documents ----
export const apiUploadDocument = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const apiGetMyDocuments = () => api.get('/documents');
export const apiSignDocument = (id: string, signatureImageUrl: string) =>
  api.post(`/documents/${id}/sign`, { signatureImageUrl });

// ---- Payments ----
export const apiDeposit = (amount: number) => api.post('/payments/deposit', { amount });
export const apiWithdraw = (amount: number) => api.post('/payments/withdraw', { amount });
export const apiTransfer = (toUser: string, amount: number) => api.post('/payments/transfer', { toUser, amount });
export const apiGetTransactionHistory = () => api.get('/payments/history');

// ---- Messages ----
export const apiSendMessage = (receiverId: string, content: string) => api.post('/messages', { receiverId, content });
export const apiGetMessages = (userId: string) => api.get(`/messages/${userId}`);
export const apiGetConversations = () => api.get('/messages/conversations');
export const apiMarkAsRead = (userId: string) => api.put(`/messages/${userId}/read`);
