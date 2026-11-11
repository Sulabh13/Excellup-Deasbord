import { useState, useEffect, useCallback } from 'react'
import { batchService } from '../../services'
import SearchInput from '../../components/ui/SearchInput'
import { GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StudentListPage() {
  const [batches, setBatches] = useState([])
  const [batchId, setBatchId] = useState('')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { batchService.getAll().then(r => setBatches(r.data.data || [])) }, [])

  useEffect(() => {
    if (!batchId) return
    setLoading(true)
    batchService.getStudents(batchId)
      .then(r => setStudents(r.data.data || []))
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoading(false))
  }, [batchId])

  const filtered = students.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.studentId?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">Student List</h1>
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <select className="input-field w-auto" value={batchId} onChange={e => setBatchId(e.target.value)}>
            <option value="">Select Batch</option>
            {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
          <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Search students..." /></div>
        </div>
      </div>
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">#</th>
                <th className="table-header">Student</th>
                <th className="table-header hidden sm:table-cell">Student ID</th>
                <th className="table-header hidden md:table-cell">Email</th>
                <th className="table-header">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? [...Array(5)].map((_, i) => <tr key={i}><td colSpan={5}><div className="h-10 skeleton m-3" /></td></tr>)
                : !batchId
                  ? <tr><td colSpan={5} className="text-center py-10 text-gray-400">Select a batch to view students</td></tr>
                  : filtered.length === 0
                    ? <tr><td colSpan={5} className="text-center py-10 text-gray-400"><GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" />No students found</td></tr>
                    : filtered.map((s, i) => (
                      <tr key={s._id} className="hover:bg-gray-50/50">
                        <td className="table-cell text-gray-400 w-12">{i + 1}</td>
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">{s.name[0]}</div>
                            <p className="font-medium text-gray-900">{s.name}</p>
                          </div>
                        </td>
                        <td className="table-cell hidden sm:table-cell font-mono text-xs text-gray-500">{s.studentId || '—'}</td>
                        <td className="table-cell hidden md:table-cell text-gray-500">{s.email}</td>
                        <td className="table-cell">{s.isActive ? <span className="badge badge-green">Active</span> : <span className="badge badge-red">Inactive</span>}</td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

