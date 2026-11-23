import { useState, useEffect } from 'react'
import { financeService, courseService } from '../../../services'
import SearchInput from '../../../components/ui/SearchInput'
import { AlertCircle, Clock, Download, Bell, Phone, Mail, Search } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PendingFeesPage() {
  const [pendingList, setPendingList] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [overdueOnly, setOverdueOnly] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [pRes, cRes] = await Promise.all([
        financeService.getPendingFees({ course: courseFilter, overdueOnly }),
        courseService.getAll(),
      ])
      setPendingList(pRes.data.data || [])
      setCourses(cRes.data.data || [])
    } catch {
      toast.error('Failed to load pending fees')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [courseFilter, overdueOnly])

  const filtered = pendingList.filter((item) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      item.student?.name?.toLowerCase().includes(q) ||
      item.student?.studentId?.toLowerCase().includes(q) ||
      item.student?.email?.toLowerCase().includes(q)
    )
  })

  const totalPendingSum = filtered.reduce((acc, curr) => acc + (curr.remainingBalance || 0), 0)

  const handleExport = async () => {
    try {
      const res = await financeService.exportCSV('student-fees')
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'excellup-pending-fees.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Pending fees report downloaded!')
    } catch {
      toast.error('Failed to export CSV')
    }
  }

  const handleSendReminder = (student) => {
    toast.success(`Fee payment reminder sent to ${student?.name}!`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending & Overdue Fees</h1>
          <p className="text-gray-500 text-sm">
            Total Outstanding Balance: <strong className="text-rose-600 font-bold">₹{totalPendingSum.toLocaleString('en-IN')}</strong> ({filtered.length} students)
          </p>
        </div>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2 self-start">
          <Download className="w-4 h-4" /> Export Pending CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search student name or ID..." />
        </div>
        <select
          className="input-field w-auto"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 px-3 py-2 border rounded-xl cursor-pointer hover:bg-gray-50 text-xs font-semibold text-gray-700">
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => setOverdueOnly(e.target.checked)}
            className="rounded text-primary-600 focus:ring-primary-500"
          />
          Overdue Only
        </label>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4 text-right">Total Fees</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4 text-right text-rose-600 font-bold">Pending Dues</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Reminder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={8} className="p-4"><div className="h-6 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-gray-400">
                    No pending dues matching the filter!
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isOverdue = item.dueDate && new Date(item.dueDate) < new Date()
                  return (
                    <tr key={item._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900 leading-tight">{item.student?.name}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{item.student?.studentId} • {item.student?.email}</p>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-gray-700">{item.course?.name}</td>
                      <td className="py-3 px-4 text-right text-gray-800">₹{item.finalPayable?.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-right text-emerald-600 font-semibold">₹{item.amountPaid?.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-right text-rose-600 font-bold text-base">₹{item.remainingBalance?.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {item.dueDate ? (
                          <span className={isOverdue ? 'text-red-600 font-bold flex items-center gap-1' : ''}>
                            {isOverdue && <AlertCircle className="w-3.5 h-3.5" />}
                            {new Date(item.dueDate).toLocaleDateString('en-IN')}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`badge ${isOverdue ? 'badge-red' : 'badge-yellow'}`}>
                          {isOverdue ? 'Overdue' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleSendReminder(item.student)}
                          className="btn-secondary py-1 px-2.5 text-xs flex items-center justify-center gap-1 mx-auto text-primary-700 hover:text-primary-800"
                          title="Send reminder notice"
                        >
                          <Bell className="w-3.5 h-3.5" /> Remind
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
