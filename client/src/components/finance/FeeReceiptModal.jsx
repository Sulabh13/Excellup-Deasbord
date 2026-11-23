import { useRef } from 'react'
import Modal from '../ui/Modal'
import { Printer, Download, CheckCircle, GraduationCap } from 'lucide-react'

export default function FeeReceiptModal({ isOpen, onClose, payment }) {
  const receiptRef = useRef()

  if (!payment) return null

  const handlePrint = () => {
    window.print()
  }

  const p = payment
  const s = p.student || {}
  const c = p.course || {}
  const dateStr = p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) : '—'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Receipt" size="lg">
      <div className="space-y-6">
        {/* Printable Area */}
        <div
          ref={receiptRef}
          id="printable-receipt"
          className="bg-white border-2 border-primary-200 rounded-2xl p-6 sm:p-8 space-y-6 text-gray-800 shadow-sm print:m-0 print:border-none print:p-4"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-gray-100 pb-5 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center text-white flex-shrink-0">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">
                  EXCELLUP CODING CLASSES
                </h2>
                <p className="text-xs sm:text-sm font-medium text-gray-500">
                  Main Road, Balaghat, Madhya Pradesh – 481001
                </p>
                <p className="text-xs text-primary-600 font-semibold">
                  Contact: +91 98765 43210 | info@excellup.com
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right bg-primary-50 px-3 py-2 rounded-xl border border-primary-100">
              <span className="text-[10px] uppercase font-bold text-primary-700 tracking-wider">Receipt No</span>
              <p className="font-mono font-bold text-primary-900 text-sm sm:text-base">{p.receiptNumber || 'EXC-REC-0000'}</p>
              <p className="text-xs text-gray-500">{dateStr}</p>
            </div>
          </div>

          {/* Student Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl text-xs sm:text-sm">
            <div>
              <p className="text-gray-400 font-medium">Student Name</p>
              <p className="font-bold text-gray-900 mt-0.5">{s.name || 'Student'}</p>
            </div>
            <div>
              <p className="text-gray-400 font-medium">Student ID</p>
              <p className="font-mono font-bold text-primary-700 mt-0.5">{s.studentId || '—'}</p>
            </div>
            <div>
              <p className="text-gray-400 font-medium">Course</p>
              <p className="font-bold text-gray-900 mt-0.5">{c.name || '—'}</p>
            </div>
            <div>
              <p className="text-gray-400 font-medium">Payment Mode</p>
              <p className="font-semibold text-gray-900 mt-0.5">{p.paymentMode} {p.transactionId ? `(${p.transactionId})` : ''}</p>
            </div>
          </div>

          {/* Fee Table */}
          <div className="overflow-hidden border border-gray-200 rounded-xl">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                <tr>
                  <td className="py-2.5 px-4 text-gray-700">Course Fees (Final Payable)</td>
                  <td className="py-2.5 px-4 text-right text-gray-900 font-semibold">₹{(p.amountPaid + (p.remainingBalance || 0) + (p.previousPaid || 0)).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-gray-500">Previously Paid</td>
                  <td className="py-2.5 px-4 text-right text-gray-600">₹{(p.previousPaid || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr className="bg-primary-50/60 font-bold">
                  <td className="py-3 px-4 text-primary-900 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-green-600 inline" /> Current Payment Received
                  </td>
                  <td className="py-3 px-4 text-right text-primary-700 text-base">₹{p.amountPaid?.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-gray-500">Remaining Balance</td>
                  <td className="py-2.5 px-4 text-right text-red-600 font-semibold">₹{(p.remainingBalance || 0).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes & Footer Signatures */}
          <div className="flex flex-col sm:flex-row items-end justify-between pt-4 gap-6">
            <div className="text-xs text-gray-500 max-w-xs space-y-1">
              <p className="font-semibold text-gray-700">Terms & Notes:</p>
              <p>• Fees once paid are non-refundable & non-transferable.</p>
              <p>• Computer-generated authentic receipt for Excellup Coding Classes.</p>
              {p.notes && <p className="italic text-gray-600 font-medium mt-1">Note: {p.notes}</p>}
            </div>

            <div className="text-center sm:text-right flex flex-col items-center sm:items-end">
              <div className="w-36 border-b-2 border-dashed border-gray-400 mb-1" />
              <p className="text-xs font-bold text-gray-800">Authorized Signature</p>
              <p className="text-[11px] text-gray-400">Excellup Coding Classes</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn-primary flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </div>
    </Modal>
  )
}
