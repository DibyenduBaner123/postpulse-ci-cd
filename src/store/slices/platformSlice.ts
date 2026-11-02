import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { SocialPlatformConfig, ConnectedAccount } from '../../types';
import { platformsApi } from '../../services/api';

interface PlatformState {
  platforms: SocialPlatformConfig[];
  connectedAccounts: ConnectedAccount[];
  isLoading: boolean;
  error: string | null;
}

const initialState: PlatformState = {
  platforms: [],
  connectedAccounts: [],
  isLoading: false,
  error: null,
};

export const fetchPlatforms = createAsyncThunk('platforms/fetchPlatforms', async (_, { rejectWithValue }) => {
  try {
    const response = await platformsApi.getPlatforms();
    return response.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load platforms');
  }
});

export const connectSocialAccount = createAsyncThunk(
  'platforms/connectSocialAccount',
  async ({ platformId, accountName, handle }: { platformId: string; accountName?: string; handle?: string }, { rejectWithValue }) => {
    try {
      const response = await platformsApi.connectPlatform(platformId, { accountName, handle });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to connect platform');
    }
  }
);

export const disconnectSocialAccount = createAsyncThunk(
  'platforms/disconnectSocialAccount',
  async (platformId: string, { rejectWithValue }) => {
    try {
      await platformsApi.disconnectPlatform(platformId);
      return platformId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to disconnect platform');
    }
  }
);

const platformSlice = createSlice({
  name: 'platforms',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlatforms.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPlatforms.fulfilled, (state, action) => {
        state.isLoading = false;
        state.platforms = action.payload.platforms;
        state.connectedAccounts = action.payload.connectedAccounts;
      })
      .addCase(fetchPlatforms.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(connectSocialAccount.fulfilled, (state, action) => {
        state.connectedAccounts.push(action.payload);
      })
      .addCase(disconnectSocialAccount.fulfilled, (state, action) => {
        state.connectedAccounts = state.connectedAccounts.filter((a) => a.platformId !== action.payload);
      });
  },
});

export default platformSlice.reducer;
