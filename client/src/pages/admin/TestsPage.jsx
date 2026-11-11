import { useState, useEffect, useCallback } from 'react'
import { testService, batchService } from '../../services'
import { useNavigate } from 'react-router-dom'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { Plus, Pencil, Trash2, Eye, BarChart2, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'

const statusColors = { draft: 'badge-yellow', scheduled: 'badge-blue', active: 'badge-green', completed: 'badge-purple' }

export default function TestsPage() {
  const navigate = useNavigate()
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterBatch, setFilterBatch] = useState('')
  const [batches, setBatches] = useState([])
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetchTests = useCallback(async () => {
    setLoading(true)
    try {
      const r = await testService.getAll({ batchId: filterBatch })
      setTests(r.data.data || [])
    } catch { toast.error('Failed to load tests') }
    finally { setLoading(false) }
  }, [filterBatch])

  useEffect(() => { fetchTests() }, [fetchTests])
  useEffect(() => { batchService.getAll().then(r => setBatches(r.data.data || [])) }, [])

  const handlePublish = async (test) => {
    try {
      await testService.publishResult(test._id)
      toast.success(test.isResultPublished ? 'Results hidden' : 'Results published!')
      fetchTests()
    } catch { toast.error('Failed') }
  }

  const handleDelete = async () => {
    try { await testService.delete(confirmDelete); toast.success('Test deleted'); setConfirmDelete(null); fetchTests() }
    catch { toast.error('Failed to delete') }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">MCQ Tests</h1>
        <button onClick={() => navigate('/admin/tests/create')} className="btn-primary flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Create Test
        </button>
      </div>
      <div className="card p-4">
        <select className="input-field w-auto" value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
          <option value="">All Batches</option>
          {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
      </div>
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Test</th><th className="table-header hidden sm:table-cell">Batch</th>
                <th className="table-header hidden md:table-cell">Duration</th>
                <th className="table-header hidden md:table-cell">Marks</th>
                <th className="table-header">Status</th>
                <th className="table-header hidden lg:table-cell">Results</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? [...Array(4)].map((_, i) => <tr key={i}><td colSpan={7}><div className="h-8 skeleton m-4" /></td></tr>)
                : tests.map(t => (
                  <tr key={t._id} className="hover:bg-gray-50/50">
                    <td className="table-cell">
                      <p className="font-medium text-gray-900">{t.title}</p>
                      <p className="text-xs text-gray-400">{t.subject?.name}</p>
                    </td>
                    <td className="table-cell hidden sm:table-cell text-gray-500">{t.batch?.name || '—'}</td>
                    <td className="table-cell hidden md:table-cell text-gray-500">{t.duration} min</td>
                    <td className="table-cell hidden md:table-cell text-gray-500">{t.totalMarks}</td>
                    <td className="table-cell"><span className={`badge ${statusColors[t.status] || 'badge-blue'}`}>{t.status}</span></td>
                    <td className="table-cell hidden lg:table-cell">
                      {t.isResultPublished ? <span className="badge badge-green">Published</span> : <span className="badge badge-yellow">Hidden</span>}
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-1 flex-wrap">
                        <button onClick={() => navigate(`/admin/tests/${t._id}/questions`)} title="Questions" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handlePublish(t)} title="Toggle Results" className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg">
                          {t.isResultPublished ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button onClick={() => setConfirmDelete(t._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} title="Delete Test" message="Delete this test and all its questions and attempts?" />
    </div>
  )
}

