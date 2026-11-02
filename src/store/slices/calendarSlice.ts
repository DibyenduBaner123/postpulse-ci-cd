import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CalendarEventItem, SocialPlatformId, PostStatus } from '../../types';
import { calendarApi } from '../../services/api';

interface CalendarState {
  events: CalendarEventItem[];
  selectedDate: string; // ISO date string (e.g. YYYY-MM-DD)
  viewMode: 'month' | 'week' | 'day' | 'list';
  platformFilter: SocialPlatformId | 'ALL';
  statusFilter: PostStatus | 'ALL';
  timezone: string;
  isLoading: boolean;
  error: string | null;
  selectedEvent: CalendarEventItem | null;
}

const initialState: CalendarState = {
  events: [],
  selectedDate: new Date().toISOString().split('T')[0],
  viewMode: 'month',
  platformFilter: 'ALL',
  statusFilter: 'ALL',
  timezone: 'UTC',
  isLoading: false,
  error: null,
  selectedEvent: null,
};

export const fetchCalendarEvents = createAsyncThunk(
  'calendar/fetchCalendarEvents',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as any).calendar as CalendarState;
      const response = await calendarApi.getEvents({
        platform: state.platformFilter !== 'ALL' ? state.platformFilter : undefined,
        status: state.statusFilter !== 'ALL' ? state.statusFilter : undefined,
      });
      return response.data.events;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch calendar events');
    }
  }
);

export const rescheduleCalendarEvent = createAsyncThunk(
  'calendar/rescheduleCalendarEvent',
  async ({ id, scheduledTime }: { id: string; scheduledTime: string }, { rejectWithValue }) => {
    try {
      const response = await calendarApi.rescheduleEvent(id, scheduledTime);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to reschedule event');
    }
  }
);

export const cancelCalendarEvent = createAsyncThunk(
  'calendar/cancelCalendarEvent',
  async (id: string, { rejectWithValue }) => {
    try {
      await calendarApi.cancelEvent(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to cancel event');
    }
  }
);

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    setViewMode: (state, action: PayloadAction<'month' | 'week' | 'day' | 'list'>) => {
      state.viewMode = action.payload;
    },
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
    setCalendarPlatformFilter: (state, action: PayloadAction<SocialPlatformId | 'ALL'>) => {
      state.platformFilter = action.payload;
    },
    setCalendarStatusFilter: (state, action: PayloadAction<PostStatus | 'ALL'>) => {
      state.statusFilter = action.payload;
    },
    setTimezone: (state, action: PayloadAction<string>) => {
      state.timezone = action.payload;
    },
    setSelectedEvent: (state, action: PayloadAction<CalendarEventItem | null>) => {
      state.selectedEvent = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCalendarEvents.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCalendarEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events = action.payload;
      })
      .addCase(fetchCalendarEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(rescheduleCalendarEvent.fulfilled, (state, action) => {
        const index = state.events.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.events[index].start = action.payload.scheduledTime || state.events[index].start;
          state.events[index].end = action.payload.scheduledTime || state.events[index].end;
          state.events[index].status = action.payload.status;
        }
      })
      .addCase(cancelCalendarEvent.fulfilled, (state, action) => {
        const index = state.events.findIndex((e) => e.id === action.payload);
        if (index !== -1) {
          state.events[index].status = 'CANCELLED';
        }
      });
  },
});

export const {
  setViewMode,
  setSelectedDate,
  setCalendarPlatformFilter,
  setCalendarStatusFilter,
  setTimezone,
  setSelectedEvent,
} = calendarSlice.actions;

export default calendarSlice.reducer;
