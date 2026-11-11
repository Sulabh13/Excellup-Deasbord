import { useState, useEffect, useCallback } from 'react'
import { materialService, batchService, subjectService } from '../../services'
import { Trash2, Download, FileText, Video, Upload } from 'lucide-react'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import toast from 'react-hot-toast'

export default function UploadNotesPage() {
  const [batches, setBatches] = useState([])
  const [subjects, setSubjects] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', batchId: '', subjectId: '', topic: '', chapter: '', tags: '', videoUrl: '', file: null })

  useEffect(() => {
    batchService.getAll().then(r => setBatches(r.data.data || []))
    subjectService.getAll().then(r => setSubjects(r.data.data || []))
    fetchMaterials()
  }, [])

  const fetchMaterials = useCallback(async () => {
    setLoading(true)
    try { const r = await materialService.getAll({}); setMaterials(r.data.data || []) }
    catch { } finally { setLoading(false) }
  }, [])

  const f = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.type === 'file' ? e.target.files[0] : e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.batchId || !form.subjectId) return toast.error('Title, Batch, and Subject are required')
    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v && k !== 'file') fd.append(k, v) })
      if (form.file) fd.append('file', form.file)
      await materialService.upload(fd)
      toast.success('Material uploaded successfully!')
      setForm({ title: '', description: '', batchId: '', subjectId: '', topic: '', chapter: '', tags: '', videoUrl: '', file: null })
      fetchMaterials()
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed') }
    finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    try { await materialService.delete(confirmDelete); toast.success('Deleted'); setConfirmDelete(null); fetchMaterials() }
    catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">Upload Study Material</h1>

      {/* Upload Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input value={form.title} onChange={f('title')} className="input-field" placeholder="e.g. Python Chapter 1 — Variables and Data Types" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch *</label>
              <select value={form.batchId} onChange={f('batchId')} className="input-field">
                <option value="">Select batch</option>
                {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <select value={form.subjectId} onChange={f('subjectId')} className="input-field">
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
              <input value={form.topic} onChange={f('topic')} className="input-field" placeholder="e.g. Variables" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chapter</label>
              <input value={form.chapter} onChange={f('chapter')} className="input-field" placeholder="e.g. Chapter 1" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={f('description')} rows={2} className="input-field" placeholder="Brief description..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
              <input value={form.tags} onChange={f('tags')} className="input-field" placeholder="python, basics, variables" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Video URL (optional)</label>
              <input type="url" value={form.videoUrl} onChange={f('videoUrl')} className="input-field" placeholder="https://youtube.com/..." />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">File (PDF, DOC, PPT, JPG, PNG — max 10MB)</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-primary-300 transition-colors">
                <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png" onChange={f('file')} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  {form.file ? (
                    <p className="text-sm text-primary-600 font-medium">{form.file.name} ({(form.file.size / 1024 / 1024).toFixed(1)} MB)</p>
                  ) : (
                    <p className="text-sm text-gray-500">Click to select file or drag and drop</p>
                  )}
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="btn-primary px-8 flex items-center gap-2">
              <Upload className="w-4 h-4" /> {submitting ? 'Uploading...' : 'Upload Material'}
            </button>
          </div>
        </form>
      </div>

      {/* My Materials List */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Uploaded Materials</h2>
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Title</th>
                  <th className="table-header hidden sm:table-cell">Subject</th>
                  <th className="table-header hidden md:table-cell">Batch</th>
                  <th className="table-header hidden lg:table-cell">Date</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? [...Array(3)].map((_, i) => <tr key={i}><td colSpan={5}><div className="h-10 skeleton m-3" /></td></tr>)
                  : materials.length === 0
                    ? <tr><td colSpan={5} className="text-center py-8 text-gray-400">No materials uploaded yet</td></tr>
                    : materials.map(m => (
                      <tr key={m._id} className="hover:bg-gray-50/50">
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            {m.fileUrl ? <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" /> : <Video className="w-4 h-4 text-red-500 flex-shrink-0" />}
                            <div><p className="font-medium text-gray-900">{m.title}</p><p className="text-xs text-gray-400">{m.topic}</p></div>
                          </div>
                        </td>
                        <td className="table-cell hidden sm:table-cell text-gray-500">{m.subject?.name || '—'}</td>
                        <td className="table-cell hidden md:table-cell text-gray-500">{m.batch?.name || '—'}</td>
                        <td className="table-cell hidden lg:table-cell text-xs text-gray-400">{new Date(m.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="table-cell">
                          <div className="flex gap-1">
                            {m.fileUrl && <a href={m.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Download className="w-4 h-4" /></a>}
                            <button onClick={() => setConfirmDelete(m._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} title="Delete Material" message="Delete this material?" />
    </div>
  )
}

