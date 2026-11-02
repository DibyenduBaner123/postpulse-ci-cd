import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsApi } from '../../services/api';

interface AnalyticsState {
  metrics: {
    totalPosts: number;
    publishedPosts: number;
    scheduledPosts: number;
    draftPosts: number;
    failedPosts: number;
    connectedAccountsCount: number;
    totalReach: number;
    impressions: number;
    engagementRate: string;
    totalEngagements: number;
  };
  weeklyActivity: Array<{ day: string; scheduled: number; published: number }>;
  engagementTrends: Array<{ date: string; impressions: number; engagements: number; clicks: number }>;
  platformBreakdown: Array<{
    platform: string;
    name: string;
    postsCount: number;
    impressions: number;
    engagementRate: string;
    reach: number;
    followers: number;
  }>;
  isLoading: boolean;
  fromCache: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  metrics: {
    totalPosts: 0,
    publishedPosts: 0,
    scheduledPosts: 0,
    draftPosts: 0,
    failedPosts: 0,
    connectedAccountsCount: 0,
    totalReach: 0,
    impressions: 0,
    engagementRate: '0%',
    totalEngagements: 0,
  },
  weeklyActivity: [],
  engagementTrends: [],
  platformBreakdown: [],
  isLoading: false,
  fromCache: false,
  error: null,
};

export const fetchAnalyticsOverview = createAsyncThunk('analytics/fetchOverview', async (_, { rejectWithValue }) => {
  try {
    const response = await analyticsApi.getOverview();
    return response.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch analytics');
  }
});

export const fetchPlatformAnalytics = createAsyncThunk('analytics/fetchPlatforms', async (_, { rejectWithValue }) => {
  try {
    const response = await analyticsApi.getPlatforms();
    return response.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch platform analytics');
  }
});

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalyticsOverview.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAnalyticsOverview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.metrics = action.payload.metrics;
        state.weeklyActivity = action.payload.weeklyActivity;
        state.engagementTrends = action.payload.engagementTrends;
        state.fromCache = action.payload.fromCache;
      })
      .addCase(fetchAnalyticsOverview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPlatformAnalytics.fulfilled, (state, action) => {
        state.platformBreakdown = action.payload.platformBreakdown;
      });
  },
});

export default analyticsSlice.reducer;
