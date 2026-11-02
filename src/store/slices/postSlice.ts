import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Post, PostStatus, SocialPlatformId } from '../../types';
import { postsApi } from '../../services/api';

interface PostState {
  posts: Post[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  isPublishing: boolean;
  error: string | null;
  statusFilter: PostStatus | 'ALL';
  platformFilter: SocialPlatformId | 'ALL';
  searchQuery: string;
}

const initialState: PostState = {
  posts: [],
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  pageSize: 10,
  isLoading: false,
  isPublishing: false,
  error: null,
  statusFilter: 'ALL',
  platformFilter: 'ALL',
  searchQuery: '',
};

export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  async (
    params: { page?: number; size?: number; status?: string; platform?: string; search?: string } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await postsApi.getPosts({
        page: params.page ?? 0,
        size: params.size ?? 10,
        status: params.status && params.status !== 'ALL' ? params.status : undefined,
        platform: params.platform && params.platform !== 'ALL' ? params.platform : undefined,
        search: params.search,
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch posts');
    }
  }
);

export const createNewPost = createAsyncThunk(
  'posts/createNewPost',
  async (postData: Partial<Post>, { rejectWithValue }) => {
    try {
      const response = await postsApi.createPost(postData);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create post');
    }
  }
);

export const publishPostNow = createAsyncThunk(
  'posts/publishPostNow',
  async (postId: string, { rejectWithValue }) => {
    try {
      const response = await postsApi.publishPost(postId);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to publish post');
    }
  }
);

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (postId: string, { rejectWithValue }) => {
    try {
      await postsApi.deletePost(postId);
      return postId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete post');
    }
  }
);

const postSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    setStatusFilter: (state, action) => {
      state.statusFilter = action.payload;
      state.currentPage = 0;
    },
    setPlatformFilter: (state, action) => {
      state.platformFilter = action.payload;
      state.currentPage = 0;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.currentPage = 0;
    },
    setPage: (state, action) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts = action.payload.content;
        state.totalElements = action.payload.totalElements;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.number;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createNewPost.pending, (state) => {
        state.isPublishing = true;
      })
      .addCase(createNewPost.fulfilled, (state, action) => {
        state.isPublishing = false;
        state.posts.unshift(action.payload);
        state.totalElements += 1;
      })
      .addCase(createNewPost.rejected, (state, action) => {
        state.isPublishing = false;
        state.error = action.payload as string;
      })
      .addCase(publishPostNow.fulfilled, (state, action) => {
        const index = state.posts.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter((p) => p.id !== action.payload);
        state.totalElements = Math.max(0, state.totalElements - 1);
      });
  },
});

export const { setStatusFilter, setPlatformFilter, setSearchQuery, setPage } = postSlice.actions;
export default postSlice.reducer;
