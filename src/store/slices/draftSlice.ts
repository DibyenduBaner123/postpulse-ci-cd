import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Draft, SocialPlatformId } from '../../types';
import { draftsApi } from '../../services/api';

interface DraftState {
  drafts: Draft[];
  currentDraft: Draft | null;
  isLoading: boolean;
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt: string | null;
  error: string | null;
  searchQuery: string;
  platformFilter: SocialPlatformId | 'ALL';
  sortBy: 'updatedAt,desc' | 'updatedAt,asc' | 'createdAt,desc' | 'createdAt,asc';
}

const initialState: DraftState = {
  drafts: [],
  currentDraft: null,
  isLoading: false,
  autoSaveStatus: 'idle',
  lastSavedAt: null,
  error: null,
  searchQuery: '',
  platformFilter: 'ALL',
  sortBy: 'updatedAt,desc',
};

export const fetchDrafts = createAsyncThunk('drafts/fetchDrafts', async (_, { getState, rejectWithValue }) => {
  try {
    const state = (getState() as any).drafts as DraftState;
    const response = await draftsApi.getDrafts({
      search: state.searchQuery || undefined,
      platform: state.platformFilter !== 'ALL' ? state.platformFilter : undefined,
      sort: state.sortBy,
    });
    return response.data.drafts;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch drafts');
  }
});

export const saveNewDraft = createAsyncThunk('drafts/saveNewDraft', async (draftData: Partial<Draft>, { rejectWithValue }) => {
  try {
    const response = await draftsApi.createDraft(draftData);
    return response.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to save draft');
  }
});

export const updateExistingDraft = createAsyncThunk(
  'drafts/updateExistingDraft',
  async ({ id, data }: { id: string; data: Partial<Draft> }, { rejectWithValue }) => {
    try {
      const response = await draftsApi.updateDraft(id, data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update draft');
    }
  }
);

export const autoSaveDraftThunk = createAsyncThunk(
  'drafts/autoSaveDraft',
  async ({ id, data }: { id?: string; data: Partial<Draft> }, { rejectWithValue }) => {
    try {
      if (id) {
        const response = await draftsApi.updateDraft(id, data);
        return response.data;
      } else {
        const response = await draftsApi.createDraft(data);
        return response.data;
      }
    } catch (err: any) {
      return rejectWithValue('Auto-save failed');
    }
  }
);

export const deleteDraftThunk = createAsyncThunk('drafts/deleteDraft', async (id: string, { rejectWithValue }) => {
  try {
    await draftsApi.deleteDraft(id);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to delete draft');
  }
});

export const duplicateDraftThunk = createAsyncThunk('drafts/duplicateDraft', async (id: string, { rejectWithValue }) => {
  try {
    const response = await draftsApi.duplicateDraft(id);
    return response.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.message || 'Failed to duplicate draft');
  }
});

const draftSlice = createSlice({
  name: 'drafts',
  initialState,
  reducers: {
    setCurrentDraft: (state, action) => {
      state.currentDraft = action.payload;
    },
    clearCurrentDraft: (state) => {
      state.currentDraft = null;
    },
    setDraftSearch: (state, action) => {
      state.searchQuery = action.payload;
    },
    setDraftPlatformFilter: (state, action) => {
      state.platformFilter = action.payload;
    },
    setDraftSort: (state, action) => {
      state.sortBy = action.payload;
    },
    resetAutoSaveStatus: (state) => {
      state.autoSaveStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchDrafts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchDrafts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.drafts = action.payload;
      })
      .addCase(fetchDrafts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Save New
      .addCase(saveNewDraft.fulfilled, (state, action) => {
        state.drafts.unshift(action.payload);
        state.currentDraft = action.payload;
        state.autoSaveStatus = 'saved';
        state.lastSavedAt = new Date().toISOString();
      })
      // Update
      .addCase(updateExistingDraft.fulfilled, (state, action) => {
        const index = state.drafts.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.drafts[index] = action.payload;
        }
        state.currentDraft = action.payload;
        state.autoSaveStatus = 'saved';
        state.lastSavedAt = new Date().toISOString();
      })
      // Auto-save
      .addCase(autoSaveDraftThunk.pending, (state) => {
        state.autoSaveStatus = 'saving';
      })
      .addCase(autoSaveDraftThunk.fulfilled, (state, action) => {
        state.autoSaveStatus = 'saved';
        state.lastSavedAt = new Date().toISOString();
        state.currentDraft = action.payload;
        const index = state.drafts.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.drafts[index] = action.payload;
        } else {
          state.drafts.unshift(action.payload);
        }
      })
      .addCase(autoSaveDraftThunk.rejected, (state) => {
        state.autoSaveStatus = 'error';
      })
      // Delete
      .addCase(deleteDraftThunk.fulfilled, (state, action) => {
        state.drafts = state.drafts.filter((d) => d.id !== action.payload);
        if (state.currentDraft?.id === action.payload) {
          state.currentDraft = null;
        }
      })
      // Duplicate
      .addCase(duplicateDraftThunk.fulfilled, (state, action) => {
        state.drafts.unshift(action.payload);
      });
  },
});

export const {
  setCurrentDraft,
  clearCurrentDraft,
  setDraftSearch,
  setDraftPlatformFilter,
  setDraftSort,
  resetAutoSaveStatus,
} = draftSlice.actions;

export default draftSlice.reducer;
