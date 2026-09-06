import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { apiClient, getApiError } from '../../services/apiClient'

const initialState = {
  user: null,
  token: localStorage.getItem('jashantantra_token'),
  status: 'idle',
  error: null,
}

export const registerUser = createAsyncThunk('auth/registerUser', async (userData, { rejectWithValue }) => {
  try {
    const response = await apiClient.post('/create-user', userData)
    return response.data
  } catch (error) {
    return rejectWithValue(getApiError(error))
  }
})

export const loginUser = createAsyncThunk('auth/loginUser', async (credentials, { rejectWithValue }) => {
  try {
    const response = await apiClient.post('/login', credentials)
    return response.data
  } catch (error) {
    return rejectWithValue(getApiError(error))
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      state.token = null
      localStorage.removeItem('jashantantra_token')
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => { state.status = 'loading'; state.error = null })
      .addCase(registerUser.fulfilled, (state, action) => { state.status = 'succeeded'; state.user = action.payload?.user || action.payload })
      .addCase(registerUser.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload })
      .addCase(loginUser.pending, (state) => { state.status = 'loading'; state.error = null })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload?.user || action.payload
        state.token = action.payload?.token || action.payload?.accessToken || null
        if (state.token) localStorage.setItem('jashantantra_token', state.token)
      })
      .addCase(loginUser.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload })
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer