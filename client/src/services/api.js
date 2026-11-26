import axios from 'axios'

// Sanitize and auto-format the API URL so trailing slashes or missing '/api' never cause URL mismatch
const formatApiUrl = (url) => {
  if (!url) return 'http://localhost:5000/api'
  let clean = url.trim().replace(/\/+$/, '') // strip trailing slashes
  if (!clean.endsWith('/api')) {
    clean = `${clean}/api`
  }
  return clean
}

const API_BASE_URL = formatApiUrl(import.meta.env.VITE_API_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('excellup_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login if the 401 happened on an authenticated route, NOT on the login request itself
    const isLoginRequest = error.config?.url?.includes('/auth/login')
    const isAlreadyOnLogin = typeof window !== 'undefined' && window.location.pathname === '/login'

    if (error.response?.status === 401 && !isLoginRequest && !isAlreadyOnLogin) {
      localStorage.removeItem('excellup_token')
      localStorage.removeItem('excellup_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
