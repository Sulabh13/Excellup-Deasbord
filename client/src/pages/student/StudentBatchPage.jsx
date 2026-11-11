import { useState, useEffect } from 'react'
import { batchService, studentService } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { Layers, Users, Calendar, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StudentBatchPage() {
  const { user } = useAuth()
  const [batch, setBatch] = useState(null)
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?._id) return
    const fetchBatchData = async () => {
      try {
        const r = await studentService.getById(user._id)
        const batchId = r.data?.data?.profile?.batch?._id || r.data?.data?.profile?.batch
        if (!batchId) {
          setLoading(false)
          return
        }
        const [bRes, sRes] = await Promise.all([
          batchService.getById(batchId),
          batchService.getStudents(batchId),
        ])
        setBatch(bRes.data?.data)
        setStudents(sRes.data?.data || [])
      } catch (err) {
        console.error(err)
        toast.error('Failed to load batch')
      } finally {
        setLoading(false)
      }
    }
    fetchBatchData()
  }, [user?._id])

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" /></div>
  if (!batch) return <div className="card text-center py-10 text-gray-400"><Layers className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>No batch assigned yet</p></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">My Batch</h1>
      <div className="card">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center"><Layers className="w-6 h-6 text-green-600" /></div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{batch.name}</h2>
            <p className="text-gray-400 font-mono text-sm">{batch.batchCode}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          {[
            ['Course', batch.course?.name || '—', Layers],
            ['Teacher', batch.teacher?.name || '—', User],
            ['Schedule', batch.schedule || '—', Calendar],
            ['Start Date', batch.startDate ? new Date(batch.startDate).toLocaleDateString('en-IN') : '—'],
            ['End Date', batch.endDate ? new Date(batch.endDate).toLocaleDateString('en-IN') : '—'],
            ['Students', students.length, Users],
          ].map(([k, v]) => (
            <div key={k} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">{k}</p>
              <p className="font-semibold text-gray-900 mt-0.5">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Classmates ({students.length})</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {students.map(s => (
            <div key={s._id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm flex-shrink-0">{s.name[0]}</div>
              <div className="min-w-0"><p className="font-medium text-gray-900 text-sm truncate">{s.name}</p><p className="text-xs text-gray-400">{s.studentId}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

