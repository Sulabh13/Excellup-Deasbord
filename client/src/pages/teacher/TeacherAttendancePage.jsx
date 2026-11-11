import { useState, useEffect, useCallback } from 'react'
import { attendanceService, batchService } from '../../services'
import { CheckCircle, XCircle, Clock, CheckSquare } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TeacherAttendancePage() {
  const [batches, setBatches] = useState([])
  const [batchId, setBatchId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({}) // { studentId: 'present'|'absent'|'late' }
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [existingRecord, setExistingRecord] = useState(false)

  useEffect(() => { batchService.getAll().then(r => setBatches(r.data.data || [])) }, [])

  const loadBatchData = useCallback(async () => {
    if (!batchId || !date) return
    setLoading(true)
    try {
      const [stuRes, attRes] = await Promise.all([
        batchService.getStudents(batchId),
        attendanceService.getByBatchDate(batchId, date),
      ])
      const stuList = stuRes.data.data || []
      setStudents(stuList)
      const records = attRes.data.data?.records || []
      if (records.length > 0) {
        setExistingRecord(true)
        const map = {}
        records.forEach(r => { map[r.student._id] = r.status })
        setAttendance(map)
      } else {
        setExistingRecord(false)
        const def = {}
        stuList.forEach(s => { def[s._id] = 'present' })
        setAttendance(def)
      }
    } catch { toast.error('Failed to load batch data') }
    finally { setLoading(false) }
  }, [batchId, date])

  useEffect(() => { loadBatchData() }, [loadBatchData])

  const markAll = (status) => {
    const updated = {}
    students.forEach(s => { updated[s._id] = status })
    setAttendance(updated)
  }

  const setStatus = (sid, status) => setAttendance(prev => ({ ...prev, [sid]: status }))

  const handleSave = async () => {
    if (!batchId) return toast.error('Select a batch')
    setSaving(true)
    try {
      const records = students.map(s => ({ studentId: s._id, status: attendance[s._id] || 'absent' }))
      await attendanceService.mark({ batchId, date, records })
      toast.success(existingRecord ? 'Attendance updated!' : 'Attendance saved!')
      setExistingRecord(true)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save attendance') }
    finally { setSaving(false) }
  }

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
  const counts = { present: 0, absent: 0, late: 0 }
  students.forEach(s => { const st = attendance[s._id] || 'absent'; counts[st]++ })

  const statusBtn = (sid, status, label, icon, activeClass) => (
    <button
      onClick={() => setStatus(sid, status)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${attendance[sid] === status ? activeClass : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
    >{icon}{label}</button>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
        {existingRecord && <p className="text-amber-600 text-sm mt-1">⚠️ Attendance already marked for this date. You can update it.</p>}
      </div>

      {/* Controls */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <select className="input-field" value={batchId} onChange={e => setBatchId(e.target.value)}>
            <option value="">Select Batch *</option>
            {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
          <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} max={new Date().toISOString().slice(0,10)} />
        </div>
      </div>

      {batchId && students.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-green-700">{counts.present}</p><p className="text-sm text-green-600">Present</p></div>
            <div className="bg-red-50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-red-700">{counts.absent}</p><p className="text-sm text-red-600">Absent</p></div>
            <div className="bg-yellow-50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-yellow-700">{counts.late}</p><p className="text-sm text-yellow-600">Late</p></div>
          </div>

          {/* Bulk actions + search */}
          <div className="card p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => markAll('present')} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                  <CheckSquare className="w-4 h-4" /> All Present
                </button>
                <button onClick={() => markAll('absent')} className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                  <XCircle className="w-4 h-4" /> All Absent
                </button>
              </div>
              <input className="input-field max-w-xs" placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {/* Student list */}
          <div className="card p-0 overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 skeleton rounded-xl" />)}</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map((s, idx) => (
                  <div key={s._id} className={`flex items-center gap-4 px-5 py-4 ${attendance[s._id] === 'present' ? 'bg-green-50/30' : attendance[s._id] === 'absent' ? 'bg-red-50/30' : 'bg-yellow-50/30'}`}>
                    <span className="text-sm text-gray-400 w-6 flex-shrink-0">{idx + 1}.</span>
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">{s.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.studentId}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {statusBtn(s._id, 'present', 'Present', <CheckCircle className="w-3.5 h-3.5" />, 'bg-green-600 text-white')}
                      {statusBtn(s._id, 'absent', 'Absent', <XCircle className="w-3.5 h-3.5" />, 'bg-red-600 text-white')}
                      {statusBtn(s._id, 'late', 'Late', <Clock className="w-3.5 h-3.5" />, 'bg-yellow-500 text-white')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button onClick={handleSave} disabled={saving} className="btn-primary px-8 py-3 text-base">
              {saving ? 'Saving...' : existingRecord ? 'Update Attendance' : 'Save Attendance'}
            </button>
          </div>
        </>
      )}

      {batchId && !loading && students.length === 0 && (
        <div className="card text-center py-10 text-gray-400">No students enrolled in this batch</div>
      )}
    </div>
  )
}

