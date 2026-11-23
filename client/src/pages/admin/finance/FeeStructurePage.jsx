import { useState, useEffect } from 'react'
import { financeService, courseService } from '../../../services'
import Modal from '../../../components/ui/Modal'
import { useForm } from 'react-hook-form'
import { Plus, Pencil, Layers, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FeeStructurePage() {
  const [structures, setStructures] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const { register, handleSubmit, reset, setValue } = useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const [sRes, cRes] = await Promise.all([
        financeService.getFeeStructures(),
        courseService.getAll(),
      ])
      setStructures(sRes.data.data || [])
      setCourses(cRes.data.data || [])
    } catch {
      toast.error('Failed to load fee structures')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openModal = (struct = null) => {
    reset()
    if (struct) {
      setValue('courseId', struct.course?._id || struct.course)
      setValue('totalFees', struct.totalFees)
      setValue('admissionFee', struct.admissionFee)
      setValue('registrationFee', struct.registrationFee)
      setValue('installmentOptions', struct.installmentOptions)
      setValue('discountPolicy', struct.discountPolicy)
      setValue('notes', struct.notes)
    } else {
      setValue('installmentOptions', 3)
      setValue('admissionFee', 500)
      setValue('registrationFee', 200)
    }
    setModalOpen(true)
  }

  const onSubmit = async (data) => {
    try {
      await financeService.saveFeeStructure(data)
      toast.success('Fee structure saved!')
      setModalOpen(false)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving fee structure')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Fee Structures</h1>
          <p className="text-gray-500 text-sm">Define default fees, installment plans, and admission charges per course</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Define Course Fees
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold text-xs uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Course Name</th>
              <th className="py-3 px-4 text-right">Total Course Fees</th>
              <th className="py-3 px-4 text-right">Admission Fee</th>
              <th className="py-3 px-4 text-center">Installment Options</th>
              <th className="py-3 px-4">Discount Policy</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}><td colSpan={6} className="p-4"><div className="h-6 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
            ) : structures.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-gray-400">
                  No fee structures defined yet. Click "Define Course Fees" to configure your first course plan.
                </td>
              </tr>
            ) : (
              structures.map((st) => (
                <tr key={st._id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-gray-900">{st.courseName || st.course?.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{st.course?.code}</p>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-primary-700 text-base">₹{st.totalFees?.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-right text-gray-600">₹{st.admissionFee?.toLocaleString('en-IN') || 0}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="badge badge-purple">{st.installmentOptions} Installments</span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500 max-w-xs truncate">{st.discountPolicy || '—'}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => openModal(st)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 rounded"
                      title="Edit Plan"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Configure Course Fee Plan" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Course *</label>
            <select {...register('courseId', { required: true })} className="input-field">
              <option value="">Select Course</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Course Fee (₹) *</label>
              <input type="number" {...register('totalFees', { required: true })} className="input-field" placeholder="9000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Installment Options</label>
              <select {...register('installmentOptions')} className="input-field">
                <option value={1}>1 (Full One-Time)</option>
                <option value={2}>2 Installments</option>
                <option value={3}>3 Installments</option>
                <option value={4}>4 Installments</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admission Fee (₹)</label>
              <input type="number" {...register('admissionFee')} className="input-field" placeholder="500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Fee (₹)</label>
              <input type="number" {...register('registrationFee')} className="input-field" placeholder="200" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount / Concession Policy</label>
            <input {...register('discountPolicy')} className="input-field" placeholder="e.g. 5% discount for full payment" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan Notes</label>
            <textarea {...register('notes')} className="input-field min-h-[60px]" placeholder="Additional details..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Structure</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
