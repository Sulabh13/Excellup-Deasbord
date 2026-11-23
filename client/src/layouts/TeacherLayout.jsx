import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Layers, Users, ClipboardList, Upload,
  FileText, PlusCircle, TestTube2, BarChart2, Megaphone,
  User, LogOut, Menu, X, Bell, ChevronDown, GraduationCap, Video
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', path: '/teacher', icon: LayoutDashboard, end: true },
  { label: 'My Batches', path: '/teacher/batches', icon: Layers },
  { label: 'Student List', path: '/teacher/students', icon: Users },
  { label: 'Attendance', path: '/teacher/attendance', icon: ClipboardList },
  { label: 'Online Courses (LMS)', path: '/teacher/lms/courses', icon: Video },
  { label: 'Assignments & Grading', path: '/teacher/lms/assignments', icon: FileText },
  { label: 'Upload Notes', path: '/teacher/notes/upload', icon: Upload },
  { label: 'Study Materials', path: '/teacher/materials', icon: FileText },
  { label: 'Create Test', path: '/teacher/tests/create', icon: PlusCircle },
  { label: 'Manage Tests', path: '/teacher/tests', icon: TestTube2 },
  { label: 'Student Results', path: '/teacher/results', icon: BarChart2 },
  { label: 'Announcements', path: '/teacher/announcements', icon: Megaphone },
  { label: 'Profile', path: '/teacher/profile', icon: User },
]

export default function TeacherLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => { await logout(); navigate('/login') }

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-100 shadow-sm flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Excellup</p>
            <p className="text-xs text-gray-400">Teacher Portal</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="px-4 py-2">
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Teacher Panel</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.end} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${isActive ? 'bg-blue-50 text-blue-700 font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <item.icon className="w-4 h-4 flex-shrink-0" />{item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gray-50">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">{user?.name?.[0]?.toUpperCase() || 'T'}</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 z-10 flex-shrink-0">
          <button className="lg:hidden p-2 text-gray-400 hover:text-gray-600" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-800">Teacher Portal • Excellup Coding Classes</p>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
