
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      Loading...
    </div>
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectMap = {
      admin: '/admin',
      teacher: '/teacher',
      student: '/student'
    }

    return <Navigate to={redirectMap[user.role] || '/login'} replace />
  }

  return children || <Outlet />
}

export const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      Loading...
    </div>
  }

  if (user) {
    const redirectMap = {
      admin: '/admin',
      teacher: '/teacher',
      student: '/student'
    }

    return <Navigate to={redirectMap[user.role] || '/login'} replace />
  }

  return children || <Outlet />
}
