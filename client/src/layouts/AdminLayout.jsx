import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Layers,
  ClipboardList, FileText, TestTube2, BarChart2, Megaphone,
  Settings, LogOut, Menu, X, Bell, ChevronDown, BookMarked,
  Video, CreditCard, DollarSign, AlertCircle, TrendingDown
} from 'lucide-react'

const navSections = [
  {
    title: 'Core Management',
    items: [
      { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
      { label: 'Students', path: '/admin/students', icon: GraduationCap },
      { label: 'Teachers', path: '/admin/teachers', icon: Users },
      { label: 'Courses (Offline)', path: '/admin/courses', icon: BookOpen },
      { label: 'Subjects', path: '/admin/subjects', icon: BookMarked },
      { label: 'Batches', path: '/admin/batches', icon: Layers },
      { label: 'Attendance', path: '/admin/attendance', icon: ClipboardList },
      { label: 'Study Notes', path: '/admin/materials', icon: FileText },
      { label: 'MCQ Tests', path: '/admin/tests', icon: TestTube2 },
      { label: 'Attendance Reports', path: '/admin/reports', icon: BarChart2 },
    ],
  },
  {
    title: 'Online Learning (LMS)',
    items: [
      { label: 'LMS Dashboard', path: '/admin/lms', icon: Video, end: true },
      { label: 'Online Courses', path: '/admin/lms/courses', icon: BookOpen },
      { label: 'Course Categories', path: '/admin/lms/categories', icon: Layers },
      { label: 'Assignments', path: '/admin/lms/assignments', icon: FileText },
    ],
  },
  {
    title: 'Fees & Finance',
    items: [
      { label: 'Finance Dashboard', path: '/admin/finance', icon: DollarSign, end: true },
      { label: 'Student Fees', path: '/admin/finance/students', icon: CreditCard },
      { label: 'Fee Collection', path: '/admin/finance/collect', icon: CreditCard },
      { label: 'Pending & Overdue', path: '/admin/finance/pending', icon: AlertCircle },
      { label: 'Fee Structures', path: '/admin/finance/structures', icon: Layers },
      { label: 'Coaching Expenses', path: '/admin/finance/expenses', icon: TrendingDown },
      { label: 'Financial Reports', path: '/admin/finance/reports', icon: BarChart2 },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
      { label: 'Settings', path: '/admin/settings', icon: Settings },
    ],
  },
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
            <p className="text-xs text-gray-400 leading-tight">Coding Classes, Balaghat</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-4 py-2">
          <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-md">Admin Dashboard</span>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-0.5">
              <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                {section.title}
              </p>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-bold shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 z-10 flex-shrink-0">
          <button className="lg:hidden p-2 text-gray-400 hover:text-gray-600" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-800">Excellup Coding Classes Management System</p>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </header>

        {/* Main page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
