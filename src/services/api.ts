import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  User,
  Post,
  Draft,
  SocialPlatformConfig,
  ConnectedAccount,
  CalendarEventItem,
  NotificationItem,
  AuditLogItem,
  KafkaEventItem,
  UserRole,
} from '../types';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token and correlation ID to all outgoing requests
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('postpulse_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!config.headers['X-Correlation-Id']) {
    config.headers['X-Correlation-Id'] = `corr-fe-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }
  return config;
});

// Intercept 401s for automatic token refresh
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('postpulse_refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const response = await axios.post('/api/auth/refresh', { refreshToken });
        const { accessToken, refreshToken } = response.data;
        localStorage.setItem('postpulse_access_token', accessToken);
        if (refreshToken) localStorage.setItem('postpulse_refresh_token', refreshToken);
        apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('postpulse_access_token');
        localStorage.removeItem('postpulse_refresh_token');
        localStorage.removeItem('postpulse_user');
        window.dispatchEvent(new CustomEvent('auth:expired'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Modular API services strictly following REST contract
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post<{ accessToken: string; refreshToken: string; user: User }>('/auth/login', credentials),
  register: (data: { name: string; email: string; password: string; department?: string }) =>
    apiClient.post<{ accessToken: string; refreshToken: string; user: User }>('/auth/register', data),
  logout: () => {
    const refreshToken = localStorage.getItem('postpulse_refresh_token');
    return apiClient.post('/auth/logout', { refreshToken });
  },
  getCurrentUser: () => apiClient.get<User>('/auth/me'),
};

export const postsApi = {
  getPosts: (params?: { page?: number; size?: number; sort?: string; status?: string; platform?: string; search?: string }) =>
    apiClient.get<{ content: Post[]; totalElements: number; totalPages: number; number: number }>('/posts', { params }),
  getPost: (id: string) => apiClient.get<Post>(`/posts/${id}`),
  createPost: (postData: Partial<Post>) => apiClient.post<Post>('/posts', postData),
  updatePost: (id: string, postData: Partial<Post>) => apiClient.put<Post>(`/posts/${id}`, postData),
  deletePost: (id: string) => apiClient.delete(`/posts/${id}`),
  publishPost: (id: string) => apiClient.post<Post>(`/posts/${id}/publish`),
};

export const draftsApi = {
  getDrafts: (params?: { search?: string; platform?: string; sort?: string }) =>
    apiClient.get<{ drafts: Draft[]; totalCount: number }>('/drafts', { params }),
  getDraft: (id: string) => apiClient.get<Draft>(`/drafts/${id}`),
  createDraft: (data: Partial<Draft>) => apiClient.post<Draft>('/drafts', data),
  updateDraft: (id: string, data: Partial<Draft>) => apiClient.put<Draft>(`/drafts/${id}`, data),
  deleteDraft: (id: string) => apiClient.delete(`/drafts/${id}`),
  duplicateDraft: (id: string) => apiClient.post<Draft>(`/drafts/${id}/duplicate`),
};

export const calendarApi = {
  getEvents: (params?: { startDate?: string; endDate?: string; platform?: string; status?: string }) =>
    apiClient.get<{ events: CalendarEventItem[]; totalCount: number }>('/calendar', { params }),
  schedulePost: (data: { content: string; platforms: string[]; scheduledTime: string; media?: any[]; hashtags?: string[]; links?: string[] }) =>
    apiClient.post<Post>('/calendar/schedule', data),
  rescheduleEvent: (id: string, scheduledTime: string) =>
    apiClient.put<Post>(`/calendar/${id}`, { scheduledTime }),
  cancelEvent: (id: string) => apiClient.delete(`/calendar/${id}`),
};

export const platformsApi = {
  getPlatforms: () =>
    apiClient.get<{ platforms: SocialPlatformConfig[]; connectedAccounts: ConnectedAccount[] }>('/platforms'),
  connectPlatform: (platformId: string, data?: { accountName?: string; handle?: string }) =>
    apiClient.post<ConnectedAccount>(`/platforms/${platformId}/connect`, data),
  disconnectPlatform: (platformId: string) => apiClient.post(`/platforms/${platformId}/disconnect`),
};

export const analyticsApi = {
  getOverview: () => apiClient.get<any>('/analytics/overview'),
  getPlatforms: () => apiClient.get<any>('/analytics/platforms'),
  getEngagement: () => apiClient.get<any>('/analytics/engagement'),
};

export const usersApi = {
  getUsers: () => apiClient.get<{ users: User[] }>('/users'),
  updateUserRole: (id: string, role: UserRole) => apiClient.put<User>(`/users/${id}`, { role }),
  inviteUser: (data: { name: string; email: string; role: UserRole; department?: string }) =>
    apiClient.post<User>('/users', data),
  getAuditLogs: (limit = 100) => apiClient.get<{ logs: AuditLogItem[]; totalCount: number }>('/users/audit-logs', { params: { limit } }),
  getNotifications: () => apiClient.get<{ notifications: NotificationItem[] }>('/users/notifications'),
  markNotificationRead: (id: string) => apiClient.put(`/users/notifications/${id}/read`),
};

export const kafkaApi = {
  getEvents: (topic?: string, limit = 50) =>
    apiClient.get<{ messages: KafkaEventItem[]; totalReturned: number }>('/kafka/events', { params: { topic, limit } }),
  getTopics: () => apiClient.get<{ topics: any[] }>('/kafka/topics'),
  replayDlqMessage: (eventId: string) => apiClient.post(`/kafka/replay/${eventId}`),
  getCacheStats: () => apiClient.get<any>('/kafka/cache/stats'),
  clearCache: () => apiClient.post('/kafka/cache/clear'),
};
