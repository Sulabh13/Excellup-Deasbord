import { useState, useEffect, useCallback } from 'react'
import { materialService, batchService, subjectService } from '../../services'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import SearchInput from '../../components/ui/SearchInput'
import { Plus, Trash2, Download, FileText, Video } from 'lucide-react'
import toast from 'react-hot-toast'

const fileIcon = type => type === 'video' ? <Video className="w-4 h-4 text-red-500" /> : <FileText className="w-4 h-4 text-blue-500" />

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [batches, setBatches] = useState([])
  const [subjects, setSubjects] = useState([])
  const [filters, setFilters] = useState({ batchId: '', subjectId: '' })
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ title: '', description: '', batchId: '', subjectId: '', topic: '', chapter: '', tags: '', videoUrl: '', file: null })

  const fetchMaterials = useCallback(async () => {
    setLoading(true)
    try {
      const r = await materialService.getAll({ ...filters, search })
      setMaterials(r.data.data || [])
    } catch { toast.error('Failed to load materials') }
    finally { setLoading(false) }
  }, [filters, search])

  useEffect(() => { fetchMaterials() }, [fetchMaterials])
  useEffect(() => {
    batchService.getAll().then(r => setBatches(r.data.data || []))
    subjectService.getAll().then(r => setSubjects(r.data.data || []))
  }, [])

  const handleUpload = async (e) => {
    e.preventDefault()
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v && k !== 'file') fd.append(k, v) })
      if (form.file) fd.append('file', form.file)
      await materialService.upload(fd)
      toast.success('Material uploaded!'); setModal(false); fetchMaterials()
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed') }
  }

  const handleDelete = async () => {
    try { await materialService.delete(confirmDelete); toast.success('Deleted'); setConfirmDelete(null); fetchMaterials() }
    catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Study Materials</h1>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />Upload Material</button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Search materials..." /></div>
          <select className="input-field w-auto" value={filters.batchId} onChange={e => setFilters(f => ({ ...f, batchId: e.target.value }))}>
            <option value="">All Batches</option>
            {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
          <select className="input-field w-auto" value={filters.subjectId} onChange={e => setFilters(f => ({ ...f, subjectId: e.target.value }))}>
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Title</th><th className="table-header hidden sm:table-cell">Subject</th>
                <th className="table-header hidden md:table-cell">Batch</th>
                <th className="table-header hidden lg:table-cell">Teacher</th>
                <th className="table-header hidden lg:table-cell">Date</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? [...Array(4)].map((_, i) => <tr key={i}><td colSpan={6}><div className="h-8 skeleton m-4" /></td></tr>)
                : materials.map(m => (
                  <tr key={m._id} className="hover:bg-gray-50/50">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        {fileIcon(m.fileType)}
                        <div><p className="font-medium text-gray-900">{m.title}</p><p className="text-xs text-gray-400">{m.topic}</p></div>
                      </div>
                    </td>
                    <td className="table-cell hidden sm:table-cell text-gray-500">{m.subject?.name || '—'}</td>
                    <td className="table-cell hidden md:table-cell text-gray-500">{m.batch?.name || '—'}</td>
                    <td className="table-cell hidden lg:table-cell text-gray-500">{m.uploadedBy?.name || '—'}</td>
                    <td className="table-cell hidden lg:table-cell text-gray-500 text-xs">{new Date(m.createdAt).toLocaleDateString('en-IN')}</td>
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

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Upload Study Material" size="md">
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-field" placeholder="Material title" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch *</label>
              <select required value={form.batchId} onChange={e => setForm(f => ({ ...f, batchId: e.target.value }))} className="input-field">
                <option value="">Select batch</option>
                {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <select required value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))} className="input-field">
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
              <input value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} className="input-field" placeholder="Topic name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chapter</label>
              <input value={form.chapter} onChange={e => setForm(f => ({ ...f, chapter: e.target.value }))} className="input-field" placeholder="Chapter name" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
              <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png" onChange={e => setForm(f => ({ ...f, file: e.target.files[0] }))} className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Video URL (optional)</label>
              <input type="url" value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} className="input-field" placeholder="https://youtube.com/..." />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Upload</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} title="Delete Material" message="Delete this study material?" />
    </div>
  )
}

