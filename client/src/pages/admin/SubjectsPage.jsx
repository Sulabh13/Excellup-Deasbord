import { useState, useEffect, useCallback } from 'react'
import { subjectService, courseService } from '../../services'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useForm } from 'react-hook-form'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCourse, setFilterCourse] = useState('')
  const [modal, setModal] = useState({ type: null, data: null })
  const [confirmDelete, setConfirmDelete] = useState(null)
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  const fetchSubjects = useCallback(async () => {
    setLoading(true)
    try {
      const r = await subjectService.getAll({ courseId: filterCourse })
      setSubjects(r.data.data || [])
    } catch { toast.error('Failed to load subjects') }
    finally { setLoading(false) }
  }, [filterCourse])

  useEffect(() => { fetchSubjects() }, [fetchSubjects])
  useEffect(() => { courseService.getAll().then(r => setCourses(r.data.data || [])) }, [])

  const openEdit = (s) => {
    setModal({ type: 'edit', data: s })
    setValue('name', s.name); setValue('code', s.code); setValue('description', s.description)
    setValue('courseId', s.course?._id || ''); setValue('isActive', s.isActive)
  }
  const closeModal = () => { setModal({ type: null, data: null }); reset() }

  const onSubmit = async (data) => {
    try {
      if (modal.type === 'add') { await subjectService.create(data); toast.success('Subject created!') }
      else { await subjectService.update(modal.data._id, data); toast.success('Updated!') }
      closeModal(); fetchSubjects()
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
  }
  const handleDelete = async () => {
    try { await subjectService.delete(confirmDelete); toast.success('Deleted'); setConfirmDelete(null); fetchSubjects() }
    catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
        <button onClick={() => { reset(); setModal({ type: 'add', data: null }) }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>
      <div className="card p-4">
        <select className="input-field w-auto" value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
          <option value="">All Courses</option>
          {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Subject</th><th className="table-header">Code</th>
                <th className="table-header hidden sm:table-cell">Course</th>
                <th className="table-header">Status</th><th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? [...Array(3)].map((_, i) => <tr key={i}><td colSpan={5}><div className="h-8 skeleton m-4" /></td></tr>)
                : subjects.map(s => (
                  <tr key={s._id} className="hover:bg-gray-50/50">
                    <td className="table-cell font-medium text-gray-900">{s.name}</td>
                    <td className="table-cell font-mono text-xs text-gray-500">{s.code}</td>
                    <td className="table-cell hidden sm:table-cell text-gray-500">{s.course?.name || '—'}</td>
                    <td className="table-cell">{s.isActive ? <span className="badge badge-green">Active</span> : <span className="badge badge-red">Inactive</span>}</td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setConfirmDelete(s._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={modal.type === 'add' || modal.type === 'edit'} onClose={closeModal} title={modal.type === 'add' ? 'Add Subject' : 'Edit Subject'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label>
              <input {...register('name', { required: 'Required' })} className="input-field" placeholder="e.g. Python Programming" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
              <input {...register('code', { required: 'Required' })} className="input-field" placeholder="e.g. PY-101" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
              <select {...register('courseId', { required: 'Select course' })} className="input-field">
                <option value="">Select course</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea {...register('description')} rows={2} className="input-field" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Subject</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} title="Delete Subject" message="Delete this subject?" />
    </div>
  )
}

