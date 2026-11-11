import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Layers,
  ClipboardList, FileText, TestTube2, BarChart2, Megaphone,
  Settings, LogOut, Menu, X, Bell, ChevronDown, BookMarked,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Students', path: '/admin/students', icon: GraduationCap },
  { label: 'Teachers', path: '/admin/teachers', icon: Users },
  { label: 'Courses', path: '/admin/courses', icon: BookOpen },
  { label: 'Subjects', path: '/admin/subjects', icon: BookMarked },
  { label: 'Batches', path: '/admin/batches', icon: Layers },
  { label: 'Attendance', path: '/admin/attendance', icon: ClipboardList },
  { label: 'Study Materials', path: '/admin/materials', icon: FileText },
  { label: 'MCQ Tests', path: '/admin/tests', icon: TestTube2 },
  { label: 'Reports', path: '/admin/reports', icon: BarChart2 },
  { label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = async () => { await logout(); navigate('/login') }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 shadow-sm flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">Excellup</p>
            <p className="text-xs text-gray-400 leading-tight">Coding Classes</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-4 py-2">
          <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-md">Admin Panel</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gray-50">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-4 flex-shrink-0 shadow-sm">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1" />
          <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          {/* User dropdown */}
          <div className="relative">
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                <button onClick={() => { setDropdownOpen(false); navigate('/admin/settings') }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Profile & Settings</button>
                <hr className="my-1 border-gray-100" />
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

