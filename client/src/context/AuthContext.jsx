import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('excellup_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('excellup_token')
    if (!token) return

    authService.getMe()
      .then(res => {
        const u = res.data.data?.user || res.data.data
        if (u) {
          setUser(u)
          localStorage.setItem('excellup_user', JSON.stringify(u))
        }
      })
      .catch(() => {
        localStorage.removeItem('excellup_token')
        localStorage.removeItem('excellup_user')
        setUser(null)
      })
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

