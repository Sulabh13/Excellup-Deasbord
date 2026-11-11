import { useState, useEffect } from 'react'
import { dashboardService } from '../../services'
import { Users, GraduationCap, Layers, BookOpen, ClipboardList, TestTube2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import toast from 'react-hot-toast'

const StatCard = ({ title, value, icon: Icon, color, bg }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
    </div>
  </div>
)

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardService.getAdminDashboard()
      .then(res => setData(res.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => <div key={i} className="card h-24 skeleton" />)}
      </div>
    </div>
  )

  const enrollmentChart = data?.enrollmentChart?.map(e => ({
    name: months[(e._id.month || 1) - 1],
    enrollments: e.count,
  })) || []

  const batchChart = data?.batchDistribution?.map(b => ({
    name: b.name, students: b.count,
  })) || []

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening at Excellup.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Students" value={data?.totalStudents} icon={GraduationCap} color="text-primary-600" bg="bg-primary-50" />
        <StatCard title="Total Teachers" value={data?.totalTeachers} icon={Users} color="text-blue-600" bg="bg-blue-50" />
        <StatCard title="Batches" value={data?.totalBatches} icon={Layers} color="text-green-600" bg="bg-green-50" />
        <StatCard title="Courses" value={data?.totalCourses} icon={BookOpen} color="text-orange-600" bg="bg-orange-50" />
        <StatCard title="Today's Attendance" value={data?.todayAttendance} icon={ClipboardList} color="text-teal-600" bg="bg-teal-50" />
        <StatCard title="Active Tests" value={data?.activeTests} icon={TestTube2} color="text-rose-600" bg="bg-rose-50" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Monthly Enrollments</h3>
          {enrollmentChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={enrollmentChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="enrollments" stroke="#7C3AED" strokeWidth={2} dot={{ fill: '#7C3AED', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-10">No enrollment data yet</p>}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Batch-wise Students</h3>
          {batchChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={batchChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="students" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-10">No batch data yet</p>}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Students</h3>
          <div className="space-y-3">
            {data?.recentStudents?.length > 0 ? data.recentStudents.map(s => (
              <div key={s._id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
                  {s.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.email}</p>
                </div>
                <span className="ml-auto text-xs text-gray-400 flex-shrink-0">
                  {new Date(s.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            )) : <p className="text-gray-400 text-sm">No students yet</p>}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Tests</h3>
          <div className="space-y-3">
            {data?.recentTests?.length > 0 ? data.recentTests.map(t => (
              <div key={t._id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-semibold text-sm flex-shrink-0">
                  <TestTube2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                  <p className="text-xs text-gray-400">{t.subject?.name}</p>
                </div>
                <span className={`badge text-xs flex-shrink-0 ${
                  t.status === 'active' ? 'badge-green' :
                  t.status === 'draft' ? 'badge-yellow' :
                  t.status === 'completed' ? 'badge-blue' : 'badge-purple'
                }`}>{t.status}</span>
              </div>
            )) : <p className="text-gray-400 text-sm">No tests yet</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

