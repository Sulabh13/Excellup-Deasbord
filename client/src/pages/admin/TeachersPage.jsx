import { useState, useEffect, useCallback } from 'react'
import { teacherService, subjectService, batchService } from '../../services'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import Pagination from '../../components/ui/Pagination'
import SearchInput from '../../components/ui/SearchInput'
import { useForm } from 'react-hook-form'
import { Plus, Eye, Pencil, Trash2, Users } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ type: null, data: null })
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [subjects, setSubjects] = useState([])
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  const fetchTeachers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await teacherService.getAll({ page, limit: 10, search })
      setTeachers(res.data.data || [])
      setTotal(res.data.total || 0)
    } catch { toast.error('Failed to load teachers') }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { fetchTeachers() }, [fetchTeachers])
  useEffect(() => { subjectService.getAll().then(r => setSubjects(r.data.data || [])) }, [])

  const openEdit = (t) => {
    setModal({ type: 'edit', data: t })
    setValue('name', t.name); setValue('email', t.email)
    setValue('phone', t.profile?.phone || ''); setValue('qualification', t.profile?.qualification || '')
    setValue('experience', t.profile?.experience || '')
  }
  const closeModal = () => { setModal({ type: null, data: null }); reset() }

  const onSubmit = async (data) => {
    try {
      if (modal.type === 'add') { await teacherService.create(data); toast.success('Teacher created!') }
      else { await teacherService.update(modal.data._id, data); toast.success('Teacher updated!') }
      closeModal(); fetchTeachers()
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving teacher') }
  }

  const handleDelete = async () => {
    try { await teacherService.delete(confirmDelete); toast.success('Teacher deleted'); setConfirmDelete(null); fetchTeachers() }
    catch { toast.error('Failed to delete') }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
          <p className="text-gray-500 text-sm">{total} total teachers</p>
        </div>
        <button onClick={() => { reset(); setModal({ type: 'add', data: null }) }} className="btn-primary flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Add Teacher
        </button>
      </div>

      <div className="card p-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search teachers..." />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">Teacher</th>
                <th className="table-header hidden sm:table-cell">Phone</th>
                <th className="table-header hidden md:table-cell">Qualification</th>
                <th className="table-header hidden lg:table-cell">Experience</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? [...Array(4)].map((_, i) => <tr key={i}><td colSpan={6}><div className="h-8 skeleton m-4" /></td></tr>)
                : teachers.length === 0
                  ? <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400"><Users className="w-10 h-10 mx-auto mb-2 opacity-30" />No teachers found</td></tr>
                  : teachers.map(t => (
                    <tr key={t._id} className="hover:bg-gray-50/50">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">{t.name[0]}</div>
                          <div><p className="font-medium text-gray-900">{t.name}</p><p className="text-xs text-gray-400">{t.email}</p></div>
                        </div>
                      </td>
                      <td className="table-cell hidden sm:table-cell text-gray-500">{t.profile?.phone || '—'}</td>
                      <td className="table-cell hidden md:table-cell text-gray-500">{t.profile?.qualification || '—'}</td>
                      <td className="table-cell hidden lg:table-cell text-gray-500">{t.profile?.experience || '—'}</td>
                      <td className="table-cell">{t.isActive ? <span className="badge badge-green">Active</span> : <span className="badge badge-red">Inactive</span>}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setModal({ type: 'view', data: t })} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => openEdit(t)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setConfirmDelete(t._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {total > 10 && <div className="p-4 border-t border-gray-100"><Pagination currentPage={page} totalPages={Math.ceil(total / 10)} onPageChange={setPage} /></div>}
      </div>

      <Modal isOpen={modal.type === 'add' || modal.type === 'edit'} onClose={closeModal} title={modal.type === 'add' ? 'Add Teacher' : 'Edit Teacher'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input {...register('name', { required: 'Required' })} className="input-field" placeholder="Teacher name" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" {...register('email', { required: 'Required' })} className="input-field" placeholder="email@example.com" />
            </div>
            {modal.type === 'add' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input type="password" {...register('password', { required: 'Required', minLength: { value: 6, message: 'Min 6 chars' } })} className="input-field" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input {...register('phone')} className="input-field" placeholder="Phone" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
              <input {...register('qualification')} className="input-field" placeholder="e.g. B.Tech CS" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
              <input {...register('experience')} className="input-field" placeholder="e.g. 3 years" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">{modal.type === 'add' ? 'Create' : 'Update'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modal.type === 'view'} onClose={closeModal} title="Teacher Profile">
        {modal.data && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-bold">{modal.data.name[0]}</div>
              <div><h3 className="font-bold text-gray-900 text-lg">{modal.data.name}</h3><p className="text-gray-500 text-sm">{modal.data.email}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['Phone', modal.data.profile?.phone || '—'], ['Qualification', modal.data.profile?.qualification || '—'], ['Experience', modal.data.profile?.experience || '—'], ['Status', modal.data.isActive ? 'Active' : 'Inactive']].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-400">{k}</p><p className="text-gray-900">{v}</p></div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} title="Delete Teacher" message="Delete this teacher? This cannot be undone." />
    </div>
  )
}

