import { useState, useEffect } from 'react'
import { attendanceService, batchService } from '../../services'
import { Download } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AttendancePage() {
  const [batches, setBatches] = useState([])
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ batchId: '', date: new Date().toISOString().slice(0, 10) })

  useEffect(() => { batchService.getAll().then(r => setBatches(r.data.data || [])) }, [])

  const fetchAttendance = async () => {
    if (!filters.batchId || !filters.date) return
    setLoading(true)
    try {
      const r = await attendanceService.getByBatchDate(filters.batchId, filters.date)
      setRecords(r.data.data?.records || [])
      setSummary(r.data.data?.summary || null)
    } catch { toast.error('Failed to load attendance') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (filters.batchId && filters.date) fetchAttendance() }, [filters])

  const handleExport = async () => {
    try {
      const r = await attendanceService.exportCSV({ batchId: filters.batchId })
      const url = URL.createObjectURL(new Blob([r.data]))
      const a = document.createElement('a'); a.href = url; a.download = 'attendance.csv'; a.click()
    } catch { toast.error('Export failed') }
  }

  const statusColor = { present: 'badge-green', absent: 'badge-red', late: 'badge-yellow' }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <button onClick={handleExport} disabled={!filters.batchId} className="btn-secondary flex items-center gap-2 self-start disabled:opacity-50">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <select className="input-field" value={filters.batchId} onChange={e => setFilters(f => ({ ...f, batchId: e.target.value }))}>
            <option value="">Select Batch</option>
            {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
          <input type="date" className="input-field" value={filters.date} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))} />
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[['Total', summary.total, 'bg-gray-100 text-gray-700'], ['Present', summary.present, 'bg-green-100 text-green-700'], ['Absent', summary.absent, 'bg-red-100 text-red-700'], ['Late', summary.late, 'bg-yellow-100 text-yellow-700']].map(([label, val, cls]) => (
            <div key={label} className={`rounded-xl p-4 text-center ${cls}`}>
              <p className="text-2xl font-bold">{val}</p>
              <p className="text-sm font-medium">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Student</th>
                <th className="table-header hidden sm:table-cell">Student ID</th>
                <th className="table-header">Status</th>
                <th className="table-header hidden md:table-cell">Remark</th>
                <th className="table-header hidden md:table-cell">Marked By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={5}><div className="h-8 skeleton m-4" /></td></tr>)
                : !filters.batchId
                  ? <tr><td colSpan={5} className="text-center py-10 text-gray-400">Select a batch and date to view attendance</td></tr>
                  : records.length === 0
                    ? <tr><td colSpan={5} className="text-center py-10 text-gray-400">No attendance records for this date</td></tr>
                    : records.map(r => (
                      <tr key={r._id} className="hover:bg-gray-50/50">
                        <td className="table-cell font-medium text-gray-900">{r.student?.name}</td>
                        <td className="table-cell hidden sm:table-cell font-mono text-xs text-gray-500">{r.student?.studentId}</td>
                        <td className="table-cell"><span className={`badge ${statusColor[r.status]}`}>{r.status}</span></td>
                        <td className="table-cell hidden md:table-cell text-gray-500">{r.remark || '—'}</td>
                        <td className="table-cell hidden md:table-cell text-gray-500">{r.markedBy?.name || '—'}</td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

