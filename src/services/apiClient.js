import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': import.meta.env.VITE_API_KEY,
  },
})

export function getApiError(error) {
  return error.response?.data?.message || error.response?.data?.error || error.message || 'Something went wrong. Please try again.'
}