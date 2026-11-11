import { useState, useEffect } from 'react'
import { dashboardService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, TestTube2, FileText, Megaphone } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

const COLORS = ['#10B981', '#EF4444', '#F59E0B']

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardService.getStudentDashboard()
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="card skeleton h-24" />)}</div>
    </div>
  )

  const att = data?.attendance || {}
  const pieData = [
    { name: 'Present', value: att.present || 0 },
    { name: 'Absent', value: att.total - att.present - att.late || 0 },
    { name: 'Late', value: att.late || 0 },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-green-100 text-sm">{data?.profile?.course?.name} • {data?.enrollment?.batch?.name || 'No batch assigned'}</p>
        <p className="text-green-100 text-xs mt-1">Student ID: {user?.studentId || '—'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0"><ClipboardList className="w-6 h-6 text-green-600" /></div>
          <div><p className="text-xs text-gray-500">Attendance</p><p className="text-2xl font-bold text-gray-900">{att.percentage || 0}%</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0"><TestTube2 className="w-6 h-6 text-primary-600" /></div>
          <div><p className="text-xs text-gray-500">Active Tests</p><p className="text-2xl font-bold text-gray-900">{data?.activeTests?.length || 0}</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0"><FileText className="w-6 h-6 text-blue-600" /></div>
          <div><p className="text-xs text-gray-500">Study Materials</p><p className="text-2xl font-bold text-gray-900">{data?.recentMaterials?.length || 0}</p></div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Attendance pie */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Attendance Overview</h3>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart><Pie data={pieData} innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-sm text-gray-600">{d.name}: <span className="font-semibold">{d.value}</span></span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-gray-400 text-sm">No attendance data</p>}
        </div>

        {/* Upcoming Tests */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Upcoming Tests</h3>
          <div className="space-y-3">
            {data?.upcomingTests?.length > 0 ? data.upcomingTests.map(t => (
              <div key={t._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0"><TestTube2 className="w-4 h-4 text-primary-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate text-sm">{t.title}</p>
                  <p className="text-xs text-gray-400">{t.duration} min • {new Date(t.startTime).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            )) : <p className="text-gray-400 text-sm">No upcoming tests</p>}
          </div>
        </div>

        {/* Recent Materials */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Study Materials</h3>
          <div className="space-y-3">
            {data?.recentMaterials?.length > 0 ? data.recentMaterials.map(m => (
              <div key={m._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-blue-600" /></div>
                <div className="min-w-0 flex-1"><p className="font-medium text-gray-900 truncate text-sm">{m.title}</p><p className="text-xs text-gray-400">{m.subject?.name}</p></div>
                {m.fileUrl && <a href={m.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-primary-600 hover:underline flex-shrink-0">View</a>}
              </div>
            )) : <p className="text-gray-400 text-sm">No materials yet</p>}
          </div>
        </div>

        {/* Announcements */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Announcements</h3>
          <div className="space-y-3">
            {data?.announcements?.length > 0 ? data.announcements.map(a => (
              <div key={a._id} className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-start gap-2">
                  <Megaphone className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{a.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.content}</p>
                  </div>
                </div>
              </div>
            )) : <p className="text-gray-400 text-sm">No announcements</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

