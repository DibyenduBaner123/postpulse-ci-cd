import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { User, AuditLogItem, UserRole } from '../../types';
import { usersApi } from '../../services/api';

interface UserState {
  users: User[];
  auditLogs: AuditLogItem[];
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  users: [],
  auditLogs: [],
  isLoading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk('users/fetchUsers', async (_, { rejectWithValue }) => {
  try {
    const response = await usersApi.getUsers();
    return response.data.users;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch team users');
  }
});

export const updateUserRole = createAsyncThunk(
  'users/updateUserRole',
  async ({ id, role }: { id: string; role: UserRole }, { rejectWithValue }) => {
    try {
      const response = await usersApi.updateUserRole(id, role);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update user role');
    }
  }
);

export const inviteNewUser = createAsyncThunk(
  'users/inviteNewUser',
  async (data: { name: string; email: string; role: UserRole; department?: string }, { rejectWithValue }) => {
    try {
      const response = await usersApi.inviteUser(data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to invite user');
    }
  }
);

export const fetchAuditLogs = createAsyncThunk('users/fetchAuditLogs', async (limit: number = 50, { rejectWithValue }) => {
  try {
    const response = await usersApi.getAuditLogs(limit);
    return response.data.logs;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch audit logs');
  }
});

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      })
      .addCase(inviteNewUser.fulfilled, (state, action) => {
        state.users.push(action.payload);
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.auditLogs = action.payload;
      });
  },
});

export default userSlice.reducer;
