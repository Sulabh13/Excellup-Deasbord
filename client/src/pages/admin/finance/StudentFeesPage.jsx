import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { financeService, courseService, batchService, studentService } from '../../../services'
import Modal from '../../../components/ui/Modal'
import SearchInput from '../../../components/ui/SearchInput'
import FeeReceiptModal from '../../../components/finance/FeeReceiptModal'
import { useForm } from 'react-hook-form'
import {
  CreditCard, Search, Filter, Eye, Plus, Calendar,
  CheckCircle, Clock, AlertCircle, FileText, Download
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function StudentFeesPage() {
  const [studentFees, setStudentFees] = useState([])
  const [courses, setCourses] = useState([])
  const [batches, setBatches] = useState([])
  const [allStudents, setAllStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Modals
  const [assignModal, setAssignModal] = useState({ open: false, data: null })
  const [viewModal, setViewModal] = useState({ open: false, data: null, history: [] })
  const [payModal, setPayModal] = useState({ open: false, fee: null })
  const [receiptModal, setReceiptModal] = useState({ open: false, payment: null })

  const assignForm = useForm()
  const payForm = useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const [sfRes, cRes, bRes, stRes] = await Promise.all([
        financeService.getAllStudentFees({ search, course: courseFilter, paymentStatus: statusFilter }),
        courseService.getAll(),
        batchService.getAll(),
        studentService.getAll({ limit: 100 }),
      ])
      setStudentFees(sfRes.data.data.studentFees || [])
      setCourses(cRes.data.data || [])
      setBatches(bRes.data.data || [])
      setAllStudents(stRes.data.data?.students || [])
    } catch {
      toast.error('Failed to load student fees')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [search, courseFilter, statusFilter])

  // Open Assign / Edit Fee Modal
  const openAssignModal = (existing = null) => {
    assignForm.reset()
    if (existing) {
      assignForm.setValue('studentId', existing.student?._id || existing.student)
      assignForm.setValue('courseId', existing.course?._id || existing.course)
      assignForm.setValue('batchId', existing.batch?._id || existing.batch || '')
      assignForm.setValue('totalCourseFees', existing.totalCourseFees)
      assignForm.setValue('discount', existing.discount || 0)
      assignForm.setValue('installmentsCount', existing.installmentSchedule?.length || 2)
      assignForm.setValue('dueDate', existing.dueDate ? existing.dueDate.split('T')[0] : '')
      assignForm.setValue('remarks', existing.remarks || '')
      setAssignModal({ open: true, data: existing })
    } else {
      assignForm.setValue('installmentsCount', 2)
      assignForm.setValue('discount', 0)
      setAssignModal({ open: true, data: null })
    }
  }

  const onAssignSubmit = async (formData) => {
    try {
      await financeService.assignStudentFee(formData)
      toast.success('Fee assigned successfully!')
      setAssignModal({ open: false, data: null })
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign fee')
    }
  }

  // Open View Fee Details
  const openView = async (fee) => {
    try {
      const res = await financeService.getStudentFeeById(fee.student?._id || fee.student)
      setViewModal({ open: true, data: res.data.data.feeRecord, history: res.data.data.paymentHistory || [] })
    } catch {
      toast.error('Failed to fetch fee details')
    }
  }

  // Open Quick Pay Modal
  const openPay = (fee) => {
    payForm.reset()
    payForm.setValue('studentId', fee.student?._id || fee.student)
    payForm.setValue('courseId', fee.course?._id || fee.course)
    payForm.setValue('amount', fee.remainingBalance)
    payForm.setValue('paymentMode', 'UPI')
    setPayModal({ open: true, fee })
  }

  const onPaySubmit = async (formData) => {
    try {
      const res = await financeService.collectPayment(formData)
      toast.success('Payment recorded successfully!')
      setPayModal({ open: false, fee: null })
      setReceiptModal({ open: true, payment: res.data.data.payment })
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment collection failed')
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return <span className="badge badge-green">Paid</span>
      case 'Partially Paid':
        return <span className="badge badge-blue">Partially Paid</span>
      case 'Overdue':
        return <span className="badge badge-red">Overdue</span>
      default:
        return <span className="badge badge-yellow">Pending</span>
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Fee Management</h1>
          <p className="text-gray-500 text-sm">Track individual course fees, discounts, and payment balances</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => openAssignModal()} className="btn-primary flex items-center gap-2 self-start">
            <Plus className="w-4 h-4" /> Assign Course Fee
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search student by name or ID..." />
        </div>
        <select
          className="input-field w-auto"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
        >
          <option value="">All Courses</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <select
          className="input-field w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Paid">Paid</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Pending">Pending</option>
          <option value="Overdue">Overdue</option>
        </select>
      </div>

      {/* Fees Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4 text-right">Total Fees</th>
                <th className="py-3 px-4 text-right">Discount</th>
                <th className="py-3 px-4 text-right">Final Payable</th>
                <th className="py-3 px-4 text-right text-emerald-600">Paid</th>
                <th className="py-3 px-4 text-right text-rose-600">Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={9} className="p-4"><div className="h-6 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : studentFees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-gray-400">
                    No fee records found. Click "Assign Course Fee" to set up fees for students.
                  </td>
                </tr>
              ) : (
                studentFees.map((fee) => (
                  <tr key={fee._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {fee.student?.name?.[0] || 'S'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 leading-tight">{fee.student?.name}</p>
                          <p className="text-[11px] text-gray-400 font-mono">{fee.student?.studentId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700 text-xs font-medium">{fee.course?.name}</td>
                    <td className="py-3 px-4 text-right text-gray-800">₹{fee.totalCourseFees?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right text-gray-400">₹{fee.discount?.toLocaleString('en-IN') || 0}</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">₹{fee.finalPayable?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">₹{fee.amountPaid?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">₹{fee.remainingBalance?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(fee.paymentStatus)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openView(fee)}
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
                          title="View Fee Breakdown"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {fee.remainingBalance > 0 && (
                          <button
                            onClick={() => openPay(fee)}
                            className="btn-primary py-1 px-2.5 text-xs flex items-center gap-1"
                            title="Collect Payment"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Pay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign / Edit Fee Modal */}
      <Modal
        isOpen={assignModal.open}
        onClose={() => setAssignModal({ open: false, data: null })}
        title={assignModal.data ? 'Update Student Fee' : 'Assign Course Fee to Student'}
        size="md"
      >
        <form onSubmit={assignForm.handleSubmit(onAssignSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Student *</label>
            <select
              {...assignForm.register('studentId', { required: 'Select student' })}
              className="input-field"
              disabled={!!assignModal.data}
            >
              <option value="">Choose Student</option>
              {allStudents.map((st) => (
                <option key={st.user?._id || st._id} value={st.user?._id || st._id}>
                  {st.user?.name || st.name} ({st.user?.studentId || st.studentId || st.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
              <select
                {...assignForm.register('courseId', { required: 'Select course' })}
                className="input-field"
              >
                <option value="">Select Course</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch (Optional)</label>
              <select {...assignForm.register('batchId')} className="input-field">
                <option value="">Select Batch</option>
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Course Fees (₹) *</label>
              <input
                type="number"
                {...assignForm.register('totalCourseFees', { required: 'Total fee required' })}
                className="input-field"
                placeholder="e.g. 9000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount / Scholarship (₹)</label>
              <input
                type="number"
                {...assignForm.register('discount')}
                className="input-field"
                placeholder="0"
                defaultValue={0}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Installments Count</label>
              <select {...assignForm.register('installmentsCount')} className="input-field">
                <option value={1}>1 (Full Payment)</option>
                <option value={2}>2 Installments</option>
                <option value={3}>3 Installments</option>
                <option value={4}>4 Installments</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Due Date</label>
              <input type="date" {...assignForm.register('dueDate')} className="input-field" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks / Scholarship Note</label>
            <input {...assignForm.register('remarks')} className="input-field" placeholder="e.g. Early admission discount" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setAssignModal({ open: false, data: null })} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Fee Record</button>
          </div>
        </form>
      </Modal>

      {/* Collect Fee Modal */}
      <Modal
        isOpen={payModal.open}
        onClose={() => setPayModal({ open: false, fee: null })}
        title="Collect Fee Payment"
        size="md"
      >
        <form onSubmit={payForm.handleSubmit(onPaySubmit)} className="space-y-4">
          <div className="bg-primary-50 p-3 rounded-xl border border-primary-100 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-gray-900">{payModal.fee?.student?.name}</p>
              <p className="text-gray-500">{payModal.fee?.course?.name}</p>
            </div>
            <div className="text-right">
              <span className="text-gray-400">Balance:</span>
              <p className="font-bold text-red-600 text-sm">₹{payModal.fee?.remainingBalance?.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount (₹) *</label>
            <input
              type="number"
              {...payForm.register('amount', { required: 'Payment amount required' })}
              className="input-field text-lg font-bold text-primary-700"
              max={payModal.fee?.remainingBalance}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
              <select {...payForm.register('paymentMode', { required: true })} className="input-field">
                <option value="UPI">UPI (GPay / PhonePe)</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Card">Debit / Credit Card</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID (Optional)</label>
              <input {...payForm.register('transactionId')} className="input-field" placeholder="UPI Ref / Txn ID" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Notes</label>
            <input {...payForm.register('notes')} className="input-field" placeholder="Notes or remarks..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setPayModal({ open: false, fee: null })} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Confirm & Generate Receipt</button>
          </div>
        </form>
      </Modal>

      {/* View Fee Details Modal */}
      <Modal
        isOpen={viewModal.open}
        onClose={() => setViewModal({ open: false, data: null, history: [] })}
        title="Student Fee & Installment Details"
        size="lg"
      >
        <div className="space-y-5">
          {viewModal.data && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-gray-400">Total Course Fees</span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">₹{viewModal.data.totalCourseFees?.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className="text-gray-400">Discount Given</span>
                  <p className="font-bold text-gray-600 text-sm mt-0.5">₹{viewModal.data.discount?.toLocaleString('en-IN') || 0}</p>
                </div>
                <div>
                  <span className="text-gray-400">Total Paid</span>
                  <p className="font-bold text-emerald-600 text-sm mt-0.5">₹{viewModal.data.amountPaid?.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className="text-gray-400">Remaining Balance</span>
                  <p className="font-bold text-rose-600 text-sm mt-0.5">₹{viewModal.data.remainingBalance?.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Installment Schedule */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-800 text-sm">Installment Schedule</h4>
                <div className="overflow-hidden border border-gray-100 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 text-gray-700 font-semibold">
                      <tr>
                        <th className="p-2.5">Installment</th>
                        <th className="p-2.5 text-right">Amount</th>
                        <th className="p-2.5">Due Date</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {viewModal.data.installmentSchedule?.map((inst, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-2.5 font-medium text-gray-800">Installment #{inst.installmentNo}</td>
                          <td className="p-2.5 text-right font-bold text-gray-900">₹{inst.amount?.toLocaleString('en-IN')}</td>
                          <td className="p-2.5 text-gray-500">{new Date(inst.dueDate).toLocaleDateString('en-IN')}</td>
                          <td className="p-2.5 text-center">{getStatusBadge(inst.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment History & Receipts */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-800 text-sm">Payment History & Receipts</h4>
                {viewModal.history?.length === 0 ? (
                  <p className="text-xs text-gray-400 italic p-3 border border-dashed rounded-lg">No payment transactions recorded yet.</p>
                ) : (
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden text-xs">
                    {viewModal.history?.map((pay) => (
                      <div key={pay._id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                        <div>
                          <p className="font-mono font-bold text-primary-700">{pay.receiptNumber}</p>
                          <p className="text-gray-400 text-[11px] mt-0.5">{new Date(pay.paymentDate).toLocaleDateString('en-IN')} • {pay.paymentMode}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900 text-sm">₹{pay.amountPaid?.toLocaleString('en-IN')}</span>
                          <button
                            onClick={() => {
                              setViewModal({ open: false, data: null, history: [] })
                              setReceiptModal({ open: true, payment: pay })
                            }}
                            className="btn-secondary py-1 px-2.5 text-xs flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" /> Receipt
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Fee Receipt Printable Modal */}
      <FeeReceiptModal
        isOpen={receiptModal.open}
        onClose={() => setReceiptModal({ open: false, payment: null })}
        payment={receiptModal.payment}
      />
    </div>
  )
}
