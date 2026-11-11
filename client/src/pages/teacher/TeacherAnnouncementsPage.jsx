import { useState, useEffect, useCallback } from 'react'
import { announcementService } from '../../services'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useForm } from 'react-hook-form'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const priorityColors = { high: 'badge-red', medium: 'badge-yellow', low: 'badge-blue' }

export default function TeacherAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ type: null, data: null })
  const [confirmDelete, setConfirmDelete] = useState(null)
  const { register, handleSubmit, reset, setValue } = useForm()

  const fetchAnn = useCallback(async () => {
    setLoading(true)
    try { const r = await announcementService.getAll(); setAnnouncements(r.data.data || []) }
    catch { } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAnn() }, [fetchAnn])

  const openEdit = (a) => {
    setModal({ type: 'edit', data: a })
    setValue('title', a.title); setValue('content', a.content)
    setValue('priority', a.priority); setValue('targetRole', a.targetRole)
  }
  const closeModal = () => { setModal({ type: null, data: null }); reset() }

  const onSubmit = async (data) => {
    try {
      if (modal.type === 'add') { await announcementService.create(data); toast.success('Created!') }
      else { await announcementService.update(modal.data._id, data); toast.success('Updated!') }
      closeModal(); fetchAnn()
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
  }
  const handleDelete = async () => {
    try { await announcementService.delete(confirmDelete); toast.success('Deleted'); setConfirmDelete(null); fetchAnn() }
    catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
        <button onClick={() => { reset(); setModal({ type: 'add', data: null }) }} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />New</button>
      </div>
      <div className="space-y-4">
        {loading ? [...Array(3)].map((_, i) => <div key={i} className="card skeleton h-24" />) :
          announcements.length === 0 ? <div className="card text-center py-10 text-gray-400">No announcements</div> :
          announcements.map(a => (
            <div key={a._id} className="card flex gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`badge ${priorityColors[a.priority]}`}>{a.priority}</span>
                  <span className="badge badge-purple">{a.targetRole}</span>
                </div>
                <h3 className="font-semibold text-gray-900">{a.title}</h3>
                <p className="text-gray-500 text-sm mt-1 line-clamp-2">{a.content}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(a.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(a)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setConfirmDelete(a._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
      </div>
      <Modal isOpen={modal.type === 'add' || modal.type === 'edit'} onClose={closeModal} title={modal.type === 'add' ? 'New Announcement' : 'Edit Announcement'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Title *</label><input {...register('title', { required: true })} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Content *</label><textarea {...register('content', { required: true })} rows={4} className="input-field" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
              <select {...register('targetRole')} className="input-field"><option value="student">Students</option><option value="all">All</option></select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select {...register('priority')} className="input-field"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} title="Delete" message="Delete this announcement?" />
    </div>
  )
}

