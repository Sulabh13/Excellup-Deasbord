import { useState, useEffect, useCallback } from 'react'
import { courseService } from '../../services'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useForm } from 'react-hook-form'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ type: null, data: null })
  const [confirmDelete, setConfirmDelete] = useState(null)
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    try { const r = await courseService.getAll(); setCourses(r.data.data || []) }
    catch { toast.error('Failed to load courses') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCourses() }, [fetchCourses])

  const openEdit = (c) => {
    setModal({ type: 'edit', data: c })
    Object.entries(c).forEach(([k, v]) => setValue(k, v))
  }
  const closeModal = () => { setModal({ type: null, data: null }); reset() }

  const onSubmit = async (data) => {
    try {
      if (modal.type === 'add') { await courseService.create(data); toast.success('Course created!') }
      else { await courseService.update(modal.data._id, data); toast.success('Course updated!') }
      closeModal(); fetchCourses()
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
  }

  const handleDelete = async () => {
    try { await courseService.delete(confirmDelete); toast.success('Deleted'); setConfirmDelete(null); fetchCourses() }
    catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
        <button onClick={() => { reset(); setModal({ type: 'add', data: null }) }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Course
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Name</th><th className="table-header">Code</th>
                <th className="table-header hidden sm:table-cell">Duration</th>
                <th className="table-header hidden md:table-cell">Fees</th>
                <th className="table-header">Status</th><th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? [...Array(3)].map((_, i) => <tr key={i}><td colSpan={6}><div className="h-8 skeleton m-4" /></td></tr>)
                : courses.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50/50">
                    <td className="table-cell font-medium text-gray-900">{c.name}</td>
                    <td className="table-cell font-mono text-xs text-gray-500">{c.code}</td>
                    <td className="table-cell hidden sm:table-cell text-gray-500">{c.duration}</td>
                    <td className="table-cell hidden md:table-cell text-gray-500">₹{c.fees?.toLocaleString('en-IN')}</td>
                    <td className="table-cell">{c.isActive ? <span className="badge badge-green">Active</span> : <span className="badge badge-red">Inactive</span>}</td>
                    <td className="table-cell">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setConfirmDelete(c._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal.type === 'add' || modal.type === 'edit'} onClose={closeModal} title={modal.type === 'add' ? 'Add Course' : 'Edit Course'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
              <input {...register('name', { required: 'Required' })} className="input-field" placeholder="e.g. Full Stack Development" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
              <input {...register('code', { required: 'Required' })} className="input-field" placeholder="e.g. FSD-201" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <input {...register('duration')} className="input-field" placeholder="e.g. 6 months" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fees (₹)</label>
              <input type="number" {...register('fees')} className="input-field" placeholder="20000" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea {...register('description')} rows={3} className="input-field" placeholder="Course description" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('isActive')} id="isActive" defaultChecked className="w-4 h-4" />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Course</button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} title="Delete Course" message="Delete this course? All related data may be affected." />
    </div>
  )
}

