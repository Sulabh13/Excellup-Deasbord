import { useState, useEffect, useCallback } from 'react'
import { attendanceService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function StudentAttendancePage() {
  const { user } = useAuth()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAttendance = useCallback(async () => {
    setLoading(true)
    try {
      const r = await attendanceService.getStudentAttendance({ studentId: user?._id, month, year })
      const payload = r.data?.data
      const list = payload?.calendarData || payload?.records || (Array.isArray(payload) ? payload : [])
      setRecords(list)
    } catch { toast.error('Failed to load attendance') }
    finally { setLoading(false) }
  }, [user?._id, month, year])

  useEffect(() => { fetchAttendance() }, [fetchAttendance])

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1) }

  // Build calendar
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const recordMap = {}
  records.forEach(r => {
    const d = new Date(r.date).getDate()
    recordMap[d] = r.status
  })

  const present = records.filter(r => r.status === 'present').length
  const absent = records.filter(r => r.status === 'absent').length
  const late = records.filter(r => r.status === 'late').length
  const total = records.length
  const pct = total > 0 ? Math.round(((present + late) / total) * 100) : 0

  const dayColor = (d) => {
    const s = recordMap[d]
    if (!s) return 'bg-gray-50 text-gray-400'
    if (s === 'present') return 'bg-green-100 text-green-700 font-semibold ring-1 ring-green-300'
    if (s === 'absent') return 'bg-red-100 text-red-700 font-semibold ring-1 ring-red-300'
    if (s === 'late') return 'bg-yellow-100 text-yellow-700 font-semibold ring-1 ring-yellow-300'
    return 'bg-gray-50 text-gray-400'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[['Attendance %', pct + '%', 'bg-primary-50 text-primary-700'], ['Present', present, 'bg-green-50 text-green-700'], ['Absent', absent, 'bg-red-50 text-red-700'], ['Late', late, 'bg-yellow-50 text-yellow-700']].map(([k, v, cls]) => (
          <div key={k} className={`rounded-xl p-4 text-center ${cls}`}>
            <p className="text-2xl font-bold">{v}</p>
            <p className="text-sm font-medium mt-1">{k}</p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="card">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
          <h2 className="font-semibold text-gray-900 text-lg">{MONTHS[month - 1]} {year}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" disabled={month === now.getMonth() + 1 && year === now.getFullYear()}>
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>)}
        </div>

        {/* Days */}
        {loading ? <div className="h-48 skeleton rounded-xl" /> : (
          <div className="grid grid-cols-7 gap-1">
            {[...Array(firstDay)].map((_, i) => <div key={`e-${i}`} />)}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1
              return (
                <div key={day} className={`aspect-square flex items-center justify-center rounded-xl text-sm transition-all ${dayColor(day)}`}>
                  {day}
                </div>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-6 justify-center">
          {[['bg-green-200', 'Present'], ['bg-red-200', 'Absent'], ['bg-yellow-200', 'Late'], ['bg-gray-100', 'No record']].map(([bg, label]) => (
            <div key={label} className="flex items-center gap-2"><div className={`w-4 h-4 rounded ${bg}`} /><span className="text-xs text-gray-500">{label}</span></div>
          ))}
        </div>
      </div>

      {/* Records table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-900">Monthly Record</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Date</th>
                <th className="table-header">Day</th>
                <th className="table-header">Status</th>
                <th className="table-header hidden md:table-cell">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={4}><div className="h-10 skeleton m-3" /></td></tr>)
                : records.length === 0 ? <tr><td colSpan={4} className="text-center py-8 text-gray-400">No attendance records for this month</td></tr>
                : [...records].sort((a,b) => new Date(b.date) - new Date(a.date)).map(r => {
                    const d = new Date(r.date)
                    return (
                      <tr key={r._id} className="hover:bg-gray-50/50">
                        <td className="table-cell">{d.toLocaleDateString('en-IN')}</td>
                        <td className="table-cell text-gray-500">{DAYS[d.getDay()]}</td>
                        <td className="table-cell">
                          <span className={`badge ${r.status === 'present' ? 'badge-green' : r.status === 'absent' ? 'badge-red' : 'badge-yellow'}`}>{r.status}</span>
                        </td>
                        <td className="table-cell hidden md:table-cell text-gray-400">{r.remark || '—'}</td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

