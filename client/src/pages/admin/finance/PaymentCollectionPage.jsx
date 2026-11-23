import { useState, useEffect } from 'react'
import { financeService, studentService } from '../../../services'
import FeeReceiptModal from '../../../components/finance/FeeReceiptModal'
import { useForm } from 'react-hook-form'
import { CreditCard, CheckCircle, Search, AlertCircle, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PaymentCollectionPage() {
  const [students, setStudents] = useState([])
  const [selectedFee, setSelectedFee] = useState(null)
  const [loading, setLoading] = useState(false)
  const [receiptModal, setReceiptModal] = useState({ open: false, payment: null })

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      paymentMode: 'UPI',
      paymentDate: new Date().toISOString().split('T')[0],
    },
  })

  const selectedStudentId = watch('studentId')

  useEffect(() => {
    studentService.getAll({ limit: 200 }).then((res) => {
      setStudents(res.data.data?.students || [])
    })
  }, [])

  useEffect(() => {
    if (selectedStudentId) {
      financeService.getStudentFeeById(selectedStudentId)
        .then((res) => {
          const fee = res.data.data.feeRecord
          setSelectedFee(fee)
          if (fee) {
            setValue('amount', fee.remainingBalance)
          } else {
            setValue('amount', 0)
          }
        })
        .catch(() => setSelectedFee(null))
    } else {
      setSelectedFee(null)
    }
  }, [selectedStudentId])

  const onSubmit = async (data) => {
    if (!selectedFee) {
      toast.error('No fee record found for this student. Please assign course fee first.')
      return
    }

    setLoading(true)
    try {
      const res = await financeService.collectPayment({
        studentId: data.studentId,
        courseId: selectedFee.course?._id || selectedFee.course,
        amount: Number(data.amount),
        paymentMode: data.paymentMode,
        transactionId: data.transactionId,
        notes: data.notes,
        paymentDate: data.paymentDate,
      })
      toast.success('Fee collected successfully!')
      setReceiptModal({ open: true, payment: res.data.data.payment })
      reset()
      setSelectedFee(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment collection failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fee Collection Counter</h1>
        <p className="text-gray-500 text-sm">Record student cash, UPI, or bank fee payments and issue authentic receipts</p>
      </div>

      <div className="card p-6 sm:p-8 space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Select Student */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Select Student *</label>
            <select
              {...register('studentId', { required: 'Please select student' })}
              className="input-field text-base"
            >
              <option value="">Search & Select Student...</option>
              {students.map((st) => (
                <option key={st.user?._id || st._id} value={st.user?._id || st._id}>
                  {st.user?.name || st.name} ({st.user?.studentId || st.studentId || st.email})
                </option>
              ))}
            </select>
          </div>

          {/* Student Fee Account Status Preview */}
          {selectedStudentId && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              {selectedFee ? (
                <>
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <div>
                      <span className="text-xs text-gray-400">Course</span>
                      <p className="font-bold text-gray-900 text-sm">{selectedFee.course?.name}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400">Status</span>
                      <p className="font-bold text-primary-700 text-sm">{selectedFee.paymentStatus}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-lg border">
                      <span className="text-gray-400">Final Fees</span>
                      <p className="font-bold text-gray-900 text-sm">₹{selectedFee.finalPayable?.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border">
                      <span className="text-gray-400">Paid So Far</span>
                      <p className="font-bold text-emerald-600 text-sm">₹{selectedFee.amountPaid?.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg border">
                      <span className="text-gray-400">Remaining Due</span>
                      <p className="font-bold text-rose-600 text-sm">₹{selectedFee.remainingBalance?.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-amber-700 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>No fee has been assigned to this student yet. Go to "Student Fees" to set course fee.</span>
                </div>
              )}
            </div>
          )}

          {/* Payment Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Collection Amount (₹) *</label>
              <input
                type="number"
                {...register('amount', { required: 'Amount required', min: 1 })}
                className="input-field text-xl font-black text-primary-700"
                placeholder="Enter amount"
                max={selectedFee?.remainingBalance}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Date *</label>
              <input
                type="date"
                {...register('paymentDate', { required: true })}
                className="input-field"
              />
            </div>
          </div>

          {/* Payment Mode & Txn ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Mode *</label>
              <select {...register('paymentMode', { required: true })} className="input-field">
                <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                <option value="Cash">Cash (Office Counter)</option>
                <option value="Bank Transfer">Bank Transfer (IMPS / NEFT)</option>
                <option value="Card">Debit / Credit Card</option>
                <option value="Other">Other Mode</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Transaction ID / Reference</label>
              <input
                {...register('transactionId')}
                className="input-field font-mono text-sm"
                placeholder="e.g. UPI-9988776655"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Notes / Remarks</label>
            <input
              {...register('notes')}
              className="input-field"
              placeholder="e.g. Received 2nd installment for MERN stack course"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !selectedFee || selectedFee.remainingBalance <= 0}
              className="w-full btn-primary py-3 text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
            >
              <CreditCard className="w-5 h-5" /> Collect Payment & Print Receipt
            </button>
          </div>
        </form>
      </div>

      <FeeReceiptModal
        isOpen={receiptModal.open}
        onClose={() => setReceiptModal({ open: false, payment: null })}
        payment={receiptModal.payment}
      />
    </div>
  )
}
