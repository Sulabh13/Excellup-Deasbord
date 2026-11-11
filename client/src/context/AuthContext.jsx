import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('excellup_token')
    const storedUser = localStorage.getItem('excellup_user')
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('excellup_user')
      }
    }
    // Verify token is still valid
    if (token) {
      authService.getMe()
        .then(res => {
          setUser(res.data.data)
          localStorage.setItem('excellup_user', JSON.stringify(res.data.data))
        })
        .catch(() => {
          localStorage.removeItem('excellup_token')
          localStorage.removeItem('excellup_user')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const res = await authService.login(credentials)
    const { token, user: userData } = res.data
    localStorage.setItem('excellup_token', token)
    localStorage.setItem('excellup_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {}
    localStorage.removeItem('excellup_token')
    localStorage.removeItem('excellup_user')
    setUser(null)
    toast.success('Logged out successfully')
  }, [])

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('excellup_user', JSON.stringify(updatedUser))
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

