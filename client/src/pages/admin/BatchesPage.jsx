import { useState, useEffect, useCallback } from 'react'
import { batchService, courseService, subjectService, teacherService } from '../../services'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useForm } from 'react-hook-form'
import { Plus, Pencil, Trash2, Eye, Users } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BatchesPage() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ type: null, data: null })
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [courses, setCourses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  const fetchBatches = useCallback(async () => {
    setLoading(true)
    try { const r = await batchService.getAll(); setBatches(r.data.data || []) }
    catch { toast.error('Failed to load batches') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchBatches() }, [fetchBatches])
  useEffect(() => {
    courseService.getAll().then(r => setCourses(r.data.data || []))
    subjectService.getAll().then(r => setSubjects(r.data.data || []))
    teacherService.getAll().then(r => setTeachers(r.data.data || []))
  }, [])

  const openEdit = (b) => {
    setModal({ type: 'edit', data: b })
    setValue('name', b.name); setValue('batchCode', b.batchCode)
    setValue('courseId', b.course?._id || ''); setValue('subjectId', b.subject?._id || '')
    setValue('teacherId', b.teacher?._id || ''); setValue('schedule', b.schedule || '')
    setValue('startDate', b.startDate ? b.startDate.slice(0, 10) : '')
    setValue('endDate', b.endDate ? b.endDate.slice(0, 10) : '')
    setValue('maxStudents', b.maxStudents || 30); setValue('description', b.description || '')
  }
  const closeModal = () => { setModal({ type: null, data: null }); reset() }

  const onSubmit = async (data) => {
    try {
      if (modal.type === 'add') { await batchService.create(data); toast.success('Batch created!') }
      else { await batchService.update(modal.data._id, data); toast.success('Updated!') }
      closeModal(); fetchBatches()
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
  }
  const handleDelete = async () => {
    try { await batchService.delete(confirmDelete); toast.success('Deleted'); setConfirmDelete(null); fetchBatches() }
    catch { toast.error('Failed to delete') }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Batches</h1>
        <button onClick={() => { reset(); setModal({ type: 'add', data: null }) }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Batch
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Batch</th><th className="table-header hidden sm:table-cell">Code</th>
                <th className="table-header hidden md:table-cell">Course</th>
                <th className="table-header hidden md:table-cell">Teacher</th>
                <th className="table-header hidden lg:table-cell">Schedule</th>
                <th className="table-header">Status</th><th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? [...Array(3)].map((_, i) => <tr key={i}><td colSpan={7}><div className="h-8 skeleton m-4" /></td></tr>)
                : batches.map(b => (
                  <tr key={b._id} className="hover:bg-gray-50/50">
                    <td className="table-cell font-medium text-gray-900">{b.name}</td>
                    <td className="table-cell hidden sm:table-cell font-mono text-xs text-gray-500">{b.batchCode}</td>
                    <td className="table-cell hidden md:table-cell text-gray-500">{b.course?.name || '—'}</td>
                    <td className="table-cell hidden md:table-cell text-gray-500">{b.teacher?.name || '—'}</td>
                    <td className="table-cell hidden lg:table-cell text-gray-500 text-xs">{b.schedule || '—'}</td>
                    <td className="table-cell">{b.isActive ? <span className="badge badge-green">Active</span> : <span className="badge badge-red">Inactive</span>}</td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => setModal({ type: 'view', data: b })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEdit(b)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setConfirmDelete(b._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal.type === 'add' || modal.type === 'edit'} onClose={closeModal} title={modal.type === 'add' ? 'Create Batch' : 'Edit Batch'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name *</label>
              <input {...register('name', { required: 'Required' })} className="input-field" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Code *</label>
              <input {...register('batchCode', { required: 'Required' })} className="input-field" placeholder="e.g. FSD-E-2024" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
              <select {...register('courseId', { required: 'Required' })} className="input-field">
                <option value="">Select course</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select {...register('subjectId')} className="input-field">
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
              <select {...register('teacherId')} className="input-field">
                <option value="">Select teacher</option>
                {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
              <input {...register('schedule')} className="input-field" placeholder="e.g. Mon-Fri 8:00-10:00 AM" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" {...register('startDate')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" {...register('endDate')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Students</label>
              <input type="number" {...register('maxStudents')} className="input-field" defaultValue={30} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea {...register('description')} rows={2} className="input-field" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Batch</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modal.type === 'view'} onClose={closeModal} title="Batch Details">
        {modal.data && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">{modal.data.name}</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['Code', modal.data.batchCode], ['Course', modal.data.course?.name || '—'], ['Teacher', modal.data.teacher?.name || '—'], ['Schedule', modal.data.schedule || '—'], ['Start', modal.data.startDate ? new Date(modal.data.startDate).toLocaleDateString('en-IN') : '—'], ['End', modal.data.endDate ? new Date(modal.data.endDate).toLocaleDateString('en-IN') : '—'], ['Max Students', modal.data.maxStudents || '—']].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400">{k}</p><p className="text-gray-900">{v}</p></div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} title="Delete Batch" message="Delete this batch?" />
    </div>
  )
}

