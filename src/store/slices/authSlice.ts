import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, UserRole } from '../../types';
import { authApi } from '../../services/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem('postpulse_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialToken = localStorage.getItem('postpulse_access_token');
const initialStoredUser = getStoredUser();

const initialState: AuthState = {
  user: initialStoredUser,
  accessToken: initialToken,
  isAuthenticated: Boolean(initialToken && initialStoredUser),
  isLoading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      const { accessToken, refreshToken, user } = response.data;
      localStorage.setItem('postpulse_access_token', accessToken);
      localStorage.setItem('postpulse_refresh_token', refreshToken);
      localStorage.setItem('postpulse_user', JSON.stringify(user));
      return { accessToken, user };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (data: { name: string; email: string; password: string; department?: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.register(data);
      const { accessToken, refreshToken, user } = response.data;
      localStorage.setItem('postpulse_access_token', accessToken);
      localStorage.setItem('postpulse_refresh_token', refreshToken);
      localStorage.setItem('postpulse_user', JSON.stringify(user));
      return { accessToken, user };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed');
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await authApi.logout();
  } catch {
    // Ignore error on logout
  } finally {
    localStorage.removeItem('postpulse_access_token');
    localStorage.removeItem('postpulse_refresh_token');
    localStorage.removeItem('postpulse_user');
  }
});

export const switchRoleDemo = createAsyncThunk(
  'auth/switchRoleDemo',
  async (role: UserRole, { dispatch }) => {
    // Quick demo login matching seeded users
    const emailMap: Record<UserRole, string> = {
      ADMIN: 'admin@postpulse.io',
      MANAGER: 'manager@postpulse.io',
      EDITOR: 'editor@postpulse.io',
      VIEWER: 'viewer@postpulse.io',
    };
    return dispatch(loginUser({ email: emailMap[role], password: 'Pulse123!' })).unwrap();
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<{ user: User; accessToken: string }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearAuthError, setCredentials } = authSlice.actions;
export default authSlice.reducer;
