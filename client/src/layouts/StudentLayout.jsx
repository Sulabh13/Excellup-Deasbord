import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, User, Layers, ClipboardList, FileText,
  TestTube2, BarChart2, Megaphone, LogOut, Menu, X, Bell, ChevronDown, GraduationCap,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', path: '/student', icon: LayoutDashboard, end: true },
  { label: 'My Profile', path: '/student/profile', icon: User },
  { label: 'My Batch', path: '/student/batch', icon: Layers },
  { label: 'Attendance', path: '/student/attendance', icon: ClipboardList },
  { label: 'Study Notes', path: '/student/notes', icon: FileText },
  { label: 'Online Tests', path: '/student/tests', icon: TestTube2 },
  { label: 'My Results', path: '/student/results/all', icon: BarChart2 },
  { label: 'Announcements', path: '/student/announcements', icon: Megaphone },
]

export default function StudentLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = async () => { await logout(); navigate('/login') }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 shadow-sm flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0"><GraduationCap className="w-5 h-5 text-white" /></div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Excellup</p>
            <p className="text-xs text-gray-400">Student Portal</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="px-4 py-2">
          <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md">Student Panel</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.end} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <item.icon className="w-4 h-4 flex-shrink-0" />{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gray-50">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm flex-shrink-0">{user?.name?.[0]?.toUpperCase() || 'S'}</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.studentId || user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-4 shadow-sm">
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5 text-gray-600" /></button>
          <div className="flex-1" />
          <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500"><Bell className="w-5 h-5" /></button>
          <div className="relative">
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100">
              <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-xs">{user?.name?.[0]?.toUpperCase() || 'S'}</div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                <button onClick={() => { setDropdownOpen(false); navigate('/student/profile') }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Profile</button>
                <hr className="my-1 border-gray-100" />
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><LogOut className="w-4 h-4" />Logout</button>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6"><Outlet /></main>
      </div>
    </div>
  )
}

