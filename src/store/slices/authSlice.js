import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { apiClient, getApiError } from '../../services/apiClient'

function decodeJwtPayload(token) {
  if (!token) return null

  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((character) => `%${`00${character.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    )

    return JSON.parse(json)
  } catch {
    return null
  }
}

const storedUser = (() => {
  try {
    const raw = localStorage.getItem('jashantantra_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
})()

const initialState = {
  user: storedUser,
  token: localStorage.getItem('jashantantra_token') || localStorage.getItem('token'),
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
    localStorage.setItem('token',response.data?.token);
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
      localStorage.removeItem('token')
      localStorage.removeItem('jashantantra_user')
    },
    setUser(state, action) {
      state.user = action.payload
      if (action.payload) {
        localStorage.setItem('jashantantra_user', JSON.stringify(action.payload))
      } else {
        localStorage.removeItem('jashantantra_user')
      }
    },
    updateUser(state, action) {
      state.user = { ...(state.user || {}), ...(action.payload || {}) }
      localStorage.setItem('jashantantra_user', JSON.stringify(state.user))
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => { state.status = 'loading'; state.error = null })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload?.user || action.payload
        if (state.user) localStorage.setItem('jashantantra_user', JSON.stringify(state.user))
      })
      .addCase(registerUser.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload })
      .addCase(loginUser.pending, (state) => { state.status = 'loading'; state.error = null })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.token = action.payload?.token || action.payload?.accessToken || null

        const decodedUser = decodeJwtPayload(state.token)
        const userPayload = action.payload?.user || action.payload || {}

        state.user = {
          ...(typeof userPayload === 'object' ? userPayload : {}),
          ...(decodedUser || {}),
          id: userPayload?.id || decodedUser?.id || decodedUser?._id || decodedUser?.userId || state.user?.id,
          email: userPayload?.email || decodedUser?.email || state.user?.email,
          name: userPayload?.name || decodedUser?.name || state.user?.name,
          role: userPayload?.role || decodedUser?.role || state.user?.role,
        }

        if (state.user) localStorage.setItem('jashantantra_user', JSON.stringify(state.user))
        if (state.token) {
          localStorage.setItem('jashantantra_token', state.token)
          localStorage.setItem('token', state.token)
        }
      })
      .addCase(loginUser.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload })
  },
})

export const { logout, setUser, updateUser } = authSlice.actions
export default authSlice.reducer