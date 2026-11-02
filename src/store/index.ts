import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

import authReducer from './slices/authSlice';
import postReducer from './slices/postSlice';
import draftReducer from './slices/draftSlice';
import platformReducer from './slices/platformSlice';
import calendarReducer from './slices/calendarSlice';
import notificationReducer from './slices/notificationSlice';
import analyticsReducer from './slices/analyticsSlice';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postReducer,
    drafts: draftReducer,
    platforms: platformReducer,
    calendar: calendarReducer,
    notifications: notificationReducer,
    analytics: analyticsReducer,
    users: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
