import { useState, useEffect, useCallback } from 'react'
import { studentService, courseService, batchService } from '../../services'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Pagination from '../../components/ui/Pagination'
import SearchInput from '../../components/ui/SearchInput'
import { useForm } from 'react-hook-form'
import { Plus, Eye, Pencil, Trash2, GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'

const statusBadge = s => s === 'active'
  ? <span className="badge badge-green">Active</span>
  : <span className="badge badge-red">Inactive</span>

export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ batchId: '', courseId: '', status: '' })
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ type: null, data: null }) // type: add|edit|view
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [courses, setCourses] = useState([])
  const [batches, setBatches] = useState([])
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await studentService.getAll({ page, limit: 10, search, ...filters })
      setStudents(res.data.data || [])
      setTotal(res.data.total || 0)
    } catch { toast.error('Failed to load students') }
    finally { setLoading(false) }
  }, [page, search, filters])

  useEffect(() => { fetchStudents() }, [fetchStudents])
  useEffect(() => {
    courseService.getAll().then(r => setCourses(r.data.data || []))
    batchService.getAll().then(r => setBatches(r.data.data || []))
  }, [])

  const openAdd = () => { reset(); setModal({ type: 'add', data: null }) }
  const openEdit = (s) => {
    setModal({ type: 'edit', data: s })
    setValue('name', s.name); setValue('email', s.email); setValue('phone', s.profile?.phone || '')
    setValue('courseId', s.profile?.course?._id || ''); setValue('batchId', s.profile?.batch?._id || '')
    setValue('guardianName', s.profile?.guardianName || ''); setValue('address', s.profile?.address || '')
  }
  const openView = (s) => setModal({ type: 'view', data: s })
  const closeModal = () => setModal({ type: null, data: null })

  const onSubmit = async (data) => {
    try {
      if (modal.type === 'add') {
        await studentService.create(data)
        toast.success('Student created successfully!')
      } else {
        await studentService.update(modal.data._id, data)
        toast.success('Student updated!')
      }
      closeModal(); fetchStudents()
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving student') }
  }

  const handleDelete = async () => {
    try {
      await studentService.delete(confirmDelete)
      toast.success('Student deleted')
      setConfirmDelete(null); fetchStudents()
    } catch { toast.error('Failed to delete') }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 text-sm">{total} total students</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, ID..." /></div>
          <select className="input-field w-auto" value={filters.courseId} onChange={e => setFilters(f => ({ ...f, courseId: e.target.value }))}>
            <option value="">All Courses</option>
            {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select className="input-field w-auto" value={filters.batchId} onChange={e => setFilters(f => ({ ...f, batchId: e.target.value }))}>
            <option value="">All Batches</option>
            {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
          <select className="input-field w-auto" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Student</th>
                <th className="table-header hidden sm:table-cell">Student ID</th>
                <th className="table-header hidden md:table-cell">Batch</th>
                <th className="table-header hidden lg:table-cell">Course</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-8 skeleton w-full" /></td></tr>
                ))
              ) : students.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  No students found
                </td></tr>
              ) : students.map(s => (
                <tr key={s._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
                        {s.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell hidden sm:table-cell font-mono text-xs text-gray-500">{s.studentId || '—'}</td>
                  <td className="table-cell hidden md:table-cell text-gray-500">{s.profile?.batch?.name || '—'}</td>
                  <td className="table-cell hidden lg:table-cell text-gray-500">{s.profile?.course?.name || '—'}</td>
                  <td className="table-cell">{statusBadge(s.isActive ? 'active' : 'inactive')}</td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openView(s)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setConfirmDelete(s._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 10 && (
          <div className="p-4 border-t border-gray-100">
            <Pagination currentPage={page} totalPages={Math.ceil(total / 10)} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modal.type === 'add' || modal.type === 'edit'} onClose={closeModal}
        title={modal.type === 'add' ? 'Add New Student' : 'Edit Student'} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input {...register('name', { required: 'Name required' })} className="input-field" placeholder="Student name" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" {...register('email', { required: 'Email required' })} className="input-field" placeholder="email@example.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            {modal.type === 'add' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input type="password" {...register('password', { required: 'Password required', minLength: { value: 6, message: 'Min 6 chars' } })} className="input-field" placeholder="Password" />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input {...register('phone')} className="input-field" placeholder="Phone number" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
              <select {...register('courseId', { required: 'Course required' })} className="input-field">
                <option value="">Select course</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {errors.courseId && <p className="text-red-500 text-xs mt-1">{errors.courseId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch *</label>
              <select {...register('batchId', { required: 'Batch required' })} className="input-field">
                <option value="">Select batch</option>
                {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
              {errors.batchId && <p className="text-red-500 text-xs mt-1">{errors.batchId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
              <input {...register('guardianName')} className="input-field" placeholder="Guardian name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input {...register('address')} className="input-field" placeholder="Address" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">
              {modal.type === 'add' ? 'Create Student' : 'Update Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={modal.type === 'view'} onClose={closeModal} title="Student Profile">
        {modal.data && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold">
                {modal.data.name?.[0]}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{modal.data.name}</h3>
                <p className="text-gray-500 font-mono text-sm">{modal.data.studentId}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Email', modal.data.email],
                ['Phone', modal.data.profile?.phone || '—'],
                ['Course', modal.data.profile?.course?.name || '—'],
                ['Batch', modal.data.profile?.batch?.name || '—'],
                ['Guardian', modal.data.profile?.guardianName || '—'],
                ['Status', modal.data.isActive ? 'Active' : 'Inactive'],
                ['Enrolled', modal.data.profile?.enrollmentDate ? new Date(modal.data.profile.enrollmentDate).toLocaleDateString('en-IN') : '—'],
                ['Address', modal.data.profile?.address || '—'],
              ].map(([label, value]) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 font-medium">{label}</p>
                  <p className="text-gray-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete}
        title="Delete Student" message="Are you sure you want to delete this student? This action cannot be undone." />
    </div>
  )
}

