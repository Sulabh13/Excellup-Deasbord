import { useState, useEffect } from 'react'
import { financeService } from '../../../services'
import {
  Download, Printer, FileText, Calendar, DollarSign,
  TrendingUp, TrendingDown, CheckCircle, Layers, ArrowUpRight
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function FinancialReportsPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pnl') // pnl | student | expenses

  useEffect(() => {
    financeService.getDashboardStats().then((res) => {
      setStats(res.data.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const downloadCSV = async (type) => {
    try {
      const res = await financeService.exportCSV(type)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `excellup-${type}-report.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success(`${type} CSV report downloaded!`)
    } catch {
      toast.error('Failed to export CSV')
    }
  }

  const { cards = {}, monthlyTrend = [], courseWise = [] } = stats || {}

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports & Statements</h1>
          <p className="text-gray-500 text-sm">Download official accounting statements, student-wise ledgers, and profit & loss sheets</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print Statement
          </button>
        </div>
      </div>

      {/* Report Categories / Tabs */}
      <div className="flex border-b border-gray-200 gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('pnl')}
          className={`pb-3 border-b-2 transition-colors ${activeTab === 'pnl' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
        >
          Profit & Loss Statement
        </button>
        <button
          onClick={() => setActiveTab('course')}
          className={`pb-3 border-b-2 transition-colors ${activeTab === 'course' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
        >
          Course Revenue Breakdown
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`pb-3 border-b-2 transition-colors ${activeTab === 'monthly' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
        >
          Monthly Trends (Past 6 Mos)
        </button>
      </div>

      {/* Export Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center justify-between bg-primary-50/50 border border-primary-100">
          <div>
            <p className="font-bold text-gray-900 text-sm">Student Fees Ledger</p>
            <p className="text-xs text-gray-500">Every student balance & status</p>
          </div>
          <button onClick={() => downloadCSV('student-fees')} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>

        <div className="card p-4 flex items-center justify-between bg-emerald-50/50 border border-emerald-100">
          <div>
            <p className="font-bold text-gray-900 text-sm">Fee Payment Transactions</p>
            <p className="text-xs text-gray-500">All receipt records & payment modes</p>
          </div>
          <button onClick={() => downloadCSV('payments')} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 text-emerald-700 border-emerald-300">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>

        <div className="card p-4 flex items-center justify-between bg-rose-50/50 border border-rose-100">
          <div>
            <p className="font-bold text-gray-900 text-sm">Expenses Statement</p>
            <p className="text-xs text-gray-500">All expenditures by category</p>
          </div>
          <button onClick={() => downloadCSV('expenses')} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 text-rose-700 border-rose-300">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      {/* Tab 1: P&L Statement */}
      {activeTab === 'pnl' && (
        <div className="card p-6 sm:p-8 space-y-6">
          <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900">Excellup Coding Classes – Profit & Loss Statement</h2>
              <p className="text-xs text-gray-500">Balaghat, Madhya Pradesh • Cumulative Financial Position</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${cards.netProfit >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Status: {cards.netProfit >= 0 ? 'Profitable' : 'Deficit'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income Section */}
            <div className="border border-emerald-200 rounded-2xl p-5 bg-emerald-50/20 space-y-3">
              <h3 className="font-bold text-emerald-800 text-base flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" /> Total Inflows (Collected Cash)
              </h3>
              <div className="space-y-2 text-sm divide-y divide-emerald-100">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Student Course Fees Collected</span>
                  <span className="font-bold text-gray-900">₹{(cards.totalFeesCollected || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Today's Inflow</span>
                  <span className="font-semibold text-emerald-700">₹{(cards.todayCollection || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">This Month's Inflow</span>
                  <span className="font-semibold text-emerald-700">₹{(cards.thisMonthCollection || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-3 font-bold text-base text-emerald-900 border-t-2 border-emerald-200">
                  <span>Gross Cash Inflow</span>
                  <span>₹{(cards.netIncome || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Expense Section */}
            <div className="border border-rose-200 rounded-2xl p-5 bg-rose-50/20 space-y-3">
              <h3 className="font-bold text-rose-800 text-base flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-600" /> Total Outflows (Expenditures)
              </h3>
              <div className="space-y-2 text-sm divide-y divide-rose-100">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Total Recorded Expenses</span>
                  <span className="font-bold text-gray-900">₹{(cards.totalExpenses || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">This Month's Expenses</span>
                  <span className="font-semibold text-rose-700">₹{(cards.thisMonthExpense || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Pending Fees (Not count as cash)</span>
                  <span className="font-semibold text-amber-700">₹{(cards.totalPendingFees || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-3 font-bold text-base text-rose-900 border-t-2 border-rose-200">
                  <span>Total Institute Outflow</span>
                  <span>₹{(cards.totalExpenses || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Profit Summary Box */}
          <div className={`p-6 rounded-2xl text-center border-2 ${cards.netProfit >= 0 ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-300' : 'bg-red-50 border-red-300'}`}>
            <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">Net Institute Profit / Loss</p>
            <h2 className={`text-3xl sm:text-4xl font-black mt-1 ${cards.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              ₹{(cards.netProfit || 0).toLocaleString('en-IN')}
            </h2>
            <p className="text-xs text-gray-500 mt-1">Calculated strictly from collected cash receipts minus all recorded expenses.</p>
          </div>
        </div>
      )}

      {/* Tab 2: Course-wise */}
      {activeTab === 'course' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="p-3.5">Course Name</th>
                <th className="p-3.5 text-center">Enrolled Students</th>
                <th className="p-3.5 text-right">Total Fees Collected</th>
                <th className="p-3.5 text-right text-rose-600">Total Pending Dues</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {courseWise.map((cw, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="p-3.5 font-bold text-gray-900">{cw.courseName}</td>
                  <td className="p-3.5 text-center">{cw.studentsCount} students</td>
                  <td className="p-3.5 text-right font-bold text-emerald-600">₹{cw.collected?.toLocaleString('en-IN')}</td>
                  <td className="p-3.5 text-right font-bold text-rose-600">₹{cw.pending?.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Monthly Trends */}
      {activeTab === 'monthly' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                <th className="p-3.5">Month</th>
                <th className="p-3.5 text-right text-emerald-600">Fee Collections (₹)</th>
                <th className="p-3.5 text-right text-rose-600">Expenses (₹)</th>
                <th className="p-3.5 text-right">Net Profit / Loss (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {monthlyTrend.map((m, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="p-3.5 font-bold text-gray-900">{m.month}</td>
                  <td className="p-3.5 text-right text-emerald-600 font-bold">₹{m.income?.toLocaleString('en-IN')}</td>
                  <td className="p-3.5 text-right text-rose-600 font-bold">₹{m.expense?.toLocaleString('en-IN')}</td>
                  <td className={`p-3.5 text-right font-bold ${m.profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    ₹{m.profit?.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
