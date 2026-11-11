import { useState, useEffect } from 'react'
import { dashboardService } from '../../services'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Layers, Users, TestTube2, ClipboardList, Upload, PlusCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardService.getTeacherDashboard()
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const quickActions = [
    { label: 'Mark Attendance', icon: ClipboardList, path: '/teacher/attendance', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
    { label: 'Upload Notes', icon: Upload, path: '/teacher/notes/upload', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
    { label: 'Create Test', icon: PlusCircle, path: '/teacher/tests/create', color: 'bg-primary-50 text-primary-700 hover:bg-primary-100' },
  ]

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="card skeleton h-24" />)}</div>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}! 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Here's your teaching overview for today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Assigned Batches', value: data?.assignedBatches?.length ?? 0, icon: Layers, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Students', value: data?.totalStudents ?? 0, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Upcoming Tests', value: data?.upcomingTests?.length ?? 0, icon: TestTube2, color: 'text-primary-600', bg: 'bg-primary-50' },
          { label: 'Recent Materials', value: data?.recentMaterials?.length ?? 0, icon: Upload, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(s => (
          <div key={s.label} className="card flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {quickActions.map(a => (
            <button key={a.label} onClick={() => navigate(a.path)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${a.color}`}>
              <a.icon className="w-4 h-4" /> {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Assigned Batches */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">My Batches</h3>
          <div className="space-y-3">
            {data?.assignedBatches?.length > 0 ? data.assignedBatches.map(b => (
              <div key={b._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">{b.name[0]}</div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{b.name}</p>
                  <p className="text-xs text-gray-400">{b.course?.name} • {b.schedule}</p>
                </div>
              </div>
            )) : <p className="text-gray-400 text-sm">No batches assigned</p>}
          </div>
        </div>

        {/* Upcoming Tests */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Upcoming Tests</h3>
          <div className="space-y-3">
            {data?.upcomingTests?.length > 0 ? data.upcomingTests.map(t => (
              <div key={t._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TestTube2 className="w-4 h-4 text-primary-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{t.title}</p>
                  <p className="text-xs text-gray-400">{t.subject?.name}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{new Date(t.startTime).toLocaleDateString('en-IN')}</span>
              </div>
            )) : <p className="text-gray-400 text-sm">No upcoming tests</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

