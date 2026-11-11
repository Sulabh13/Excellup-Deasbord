import { useState, useEffect } from 'react'
import { attemptService, testService } from '../../services'
import { useLocation } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

export default function StudentResultsPage() {
  const loc = useLocation()
  const params = new URLSearchParams(loc.search)
  const initTestId = params.get('testId') || ''
  const [tests, setTests] = useState([])
  const [testId, setTestId] = useState(initTestId)
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { testService.getAll({}).then(r => setTests(r.data.data || [])) }, [])

  useEffect(() => {
    if (!testId) return
    setLoading(true)
    attemptService.getAllAttempts(testId)
      .then(r => setAttempts(r.data.data || []))
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false))
  }, [testId])

  const avg = attempts.length > 0 ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length) : 0
  const highest = attempts.length > 0 ? Math.max(...attempts.map(a => a.percentage)) : 0
  const lowest = attempts.length > 0 ? Math.min(...attempts.map(a => a.percentage)) : 0
  const passed = attempts.filter(a => a.isPassed).length
  const passRate = attempts.length > 0 ? Math.round((passed / attempts.length) * 100) : 0

  const chartData = attempts.map(a => ({ name: a.student?.name?.split(' ')[0] || 'Student', score: Math.round(a.percentage) }))

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">Student Results</h1>
      <div className="card p-4">
        <select className="input-field w-full max-w-sm" value={testId} onChange={e => setTestId(e.target.value)}>
          <option value="">Select a test</option>
          {tests.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
        </select>
      </div>

      {testId && attempts.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[['Average Score', avg + '%', 'bg-blue-50 text-blue-700'], ['Highest', highest + '%', 'bg-green-50 text-green-700'], ['Lowest', lowest + '%', 'bg-red-50 text-red-700'], ['Pass Rate', passRate + '%', 'bg-primary-50 text-primary-700']].map(([label, val, cls]) => (
              <div key={label} className={`rounded-xl p-5 text-center ${cls}`}>
                <p className="text-2xl font-bold">{val}</p>
                <p className="text-sm font-medium mt-1">{label}</p>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Score Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip formatter={v => v + '%'} />
                <Bar dataKey="score" fill="#7C3AED" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Student</th>
                <th className="table-header">Marks</th>
                <th className="table-header">Percentage</th>
                <th className="table-header">Status</th>
                <th className="table-header hidden md:table-cell">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? [...Array(4)].map((_, i) => <tr key={i}><td colSpan={5}><div className="h-10 skeleton m-3" /></td></tr>)
                : !testId
                  ? <tr><td colSpan={5} className="text-center py-10 text-gray-400">Select a test to view results</td></tr>
                  : attempts.length === 0
                    ? <tr><td colSpan={5} className="text-center py-10 text-gray-400">No attempts yet</td></tr>
                    : attempts.map(a => (
                      <tr key={a._id} className="hover:bg-gray-50/50">
                        <td className="table-cell">
                          <p className="font-medium text-gray-900">{a.student?.name}</p>
                          <p className="text-xs text-gray-400">{a.student?.studentId}</p>
                        </td>
                        <td className="table-cell">{a.obtainedMarks} / {a.totalMarks}</td>
                        <td className="table-cell font-semibold">{a.percentage?.toFixed(1)}%</td>
                        <td className="table-cell">{a.isPassed ? <span className="badge badge-green">Pass</span> : <span className="badge badge-red">Fail</span>}</td>
                        <td className="table-cell hidden md:table-cell text-xs text-gray-400">{a.submitTime ? new Date(a.submitTime).toLocaleString('en-IN') : '—'}</td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

