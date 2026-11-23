import { useState, useEffect } from 'react'
import { financeService } from '../../services'
import FeeReceiptModal from '../../components/finance/FeeReceiptModal'
import {
  CreditCard, CheckCircle, Clock, AlertCircle, FileText,
  Printer, Calendar, Layers, ShieldAlert
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function StudentFeesViewPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [receiptModal, setReceiptModal] = useState({ open: false, payment: null })

  useEffect(() => {
    financeService.getMyFees()
      .then((res) => {
        setData(res.data.data)
      })
      .catch(() => toast.error('Failed to load fee details'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const { feeRecord, paymentHistory = [] } = data || {}

  if (!feeRecord) {
    return (
      <div className="card p-12 text-center text-gray-400 space-y-3">
        <CreditCard className="w-12 h-12 mx-auto text-primary-400 opacity-40" />
        <h3 className="text-lg font-bold text-gray-700">No Fee Record Assigned</h3>
        <p className="text-xs text-gray-400 max-w-sm mx-auto">
          Your course fee details have not been assigned yet. Please contact the Excellup Coding Classes office.
        </p>
      </div>
    )
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Fees & Receipts</h1>
        <p className="text-gray-500 text-sm">Review your course fee payments, upcoming installments, and download receipts</p>
      </div>

      {/* 4 Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Course Fees</span>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">₹{feeRecord.finalPayable?.toLocaleString('en-IN')}</h3>
          {feeRecord.discount > 0 && (
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
              Includes ₹{feeRecord.discount.toLocaleString('en-IN')} Scholarship
            </span>
          )}
        </div>

        <div className="card p-5">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Amount Paid</span>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">₹{feeRecord.amountPaid?.toLocaleString('en-IN')}</h3>
          <span className="text-[11px] text-gray-400 mt-1 block">Cleared so far</span>
        </div>

        <div className="card p-5">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Remaining Due</span>
          <h3 className="text-2xl font-bold text-rose-600 mt-1">₹{feeRecord.remainingBalance?.toLocaleString('en-IN')}</h3>
          <span className="text-[11px] text-gray-400 mt-1 block">Outstanding balance</span>
        </div>

        <div className="card p-5">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment Status</span>
          <div className="mt-2">{getStatusBadge(feeRecord.paymentStatus)}</div>
          {feeRecord.dueDate && (
            <span className="text-[11px] text-gray-400 mt-1.5 block">
              Due Date: {new Date(feeRecord.dueDate).toLocaleDateString('en-IN')}
            </span>
          )}
        </div>
      </div>

      {/* Installment Schedule */}
      <div className="card p-6 space-y-4">
        <h3 className="font-bold text-gray-900 text-base">Installment Payment Schedule</h3>
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Installment</th>
                <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                <th className="py-2.5 px-4">Due Date</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {feeRecord.installmentSchedule?.map((inst, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-bold text-gray-800">Installment #{inst.installmentNo}</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">₹{inst.amount?.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-gray-500">{new Date(inst.dueDate).toLocaleDateString('en-IN')}</td>
                  <td className="py-3 px-4 text-center">{getStatusBadge(inst.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History & Authentic Receipts */}
      <div className="card p-6 space-y-4">
        <h3 className="font-bold text-gray-900 text-base">Payment History & Authentic Receipts</h3>

        {paymentHistory.length === 0 ? (
          <p className="p-6 text-center text-xs text-gray-400 italic">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Receipt Number</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-4">Payment Mode</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {paymentHistory.map((pay) => (
                  <tr key={pay._id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-primary-700">{pay.receiptNumber}</td>
                    <td className="py-3 px-4 text-gray-500">{new Date(pay.paymentDate).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">₹{pay.amountPaid?.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-gray-600">{pay.paymentMode} {pay.transactionId ? `(${pay.transactionId})` : ''}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setReceiptModal({ open: true, payment: pay })}
                        className="btn-primary py-1 px-3 text-xs flex items-center justify-center gap-1.5 mx-auto"
                      >
                        <FileText className="w-3.5 h-3.5" /> Download / Print Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <FeeReceiptModal
        isOpen={receiptModal.open}
        onClose={() => setReceiptModal({ open: false, payment: null })}
        payment={receiptModal.payment}
      />
    </div>
  )
}
