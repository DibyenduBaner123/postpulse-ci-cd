import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { NotificationItem } from '../../types';
import { usersApi } from '../../services/api';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  toasts: ToastMessage[];
  unreadCount: number;
}

const initialState: NotificationState = {
  notifications: [],
  toasts: [],
  unreadCount: 0,
};

export const fetchNotifications = createAsyncThunk('notifications/fetchNotifications', async () => {
  const response = await usersApi.getNotifications();
  return response.data.notifications;
});

export const markAsRead = createAsyncThunk('notifications/markAsRead', async (id: string) => {
  await usersApi.markNotificationRead(id);
  return id;
});

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addToast: (state, action: PayloadAction<Omit<ToastMessage, 'id'> & { id?: string }>) => {
      const id = action.payload.id || `toast_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      state.toasts.push({ ...action.payload, id });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter((n) => !n.read).length;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const item = state.notifications.find((n) => n.id === action.payload);
        if (item && !item.read) {
          item.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });
  },
});

export const { addToast, removeToast } = notificationSlice.actions;
export default notificationSlice.reducer;
