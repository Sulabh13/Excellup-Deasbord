import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { financeService } from '../../../services'
import {
  DollarSign, TrendingUp, TrendingDown, Clock, CreditCard,
  Plus, ArrowRight, Download, Calendar, Layers, CheckCircle2, AlertCircle
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Legend, LineChart, Line, CartesianGrid
} from 'recharts'
import toast from 'react-hot-toast'

export default function FinanceDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await financeService.getDashboardStats()
        setData(res.data.data)
      } catch {
        toast.error('Failed to load financial statistics')
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const { cards = {}, monthlyTrend = [], courseWise = [] } = data || {}

  const statCards = [
    { label: 'Total Fees Expected', value: `₹${(cards.totalFeesExpected || 0).toLocaleString('en-IN')}`, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Total Fees Collected', value: `₹${(cards.totalFeesCollected || 0).toLocaleString('en-IN')}`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Pending Fees', value: `₹${(cards.totalPendingFees || 0).toLocaleString('en-IN')}`, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: "Today's Collection", value: `₹${(cards.todayCollection || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: "This Month's Collection", value: `₹${(cards.thisMonthCollection || 0).toLocaleString('en-IN')}`, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Expenses', value: `₹${(cards.totalExpenses || 0).toLocaleString('en-IN')}`, icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Net Income (Cash In)', value: `₹${(cards.netIncome || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    {
      label: 'Net Profit / Loss',
      value: `₹${(cards.netProfit || 0).toLocaleString('en-IN')}`,
      icon: TrendingUp,
      color: cards.netProfit >= 0 ? 'text-green-600' : 'text-red-600',
      bg: cards.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coaching Finance & Accounts</h1>
          <p className="text-gray-500 text-sm">Real-time fee collection, expenses, pending dues, and profit & loss</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/finance/collect" className="btn-primary flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Collect Fee
          </Link>
          <Link to="/admin/finance/expenses" className="btn-secondary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Expense
          </Link>
        </div>
      </div>

      {/* 8 Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c, i) => (
          <div key={i} className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center ${c.color} flex-shrink-0`}>
              <c.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{c.label}</p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{c.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Nav Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link to="/admin/finance/students" className="card p-4 text-center hover:border-primary-300 transition-colors">
          <p className="text-xs text-gray-500">Manage</p>
          <p className="font-bold text-gray-900 text-sm mt-0.5">Student Fees</p>
        </Link>
        <Link to="/admin/finance/pending" className="card p-4 text-center hover:border-primary-300 transition-colors">
          <p className="text-xs text-gray-500">Track</p>
          <p className="font-bold text-amber-700 text-sm mt-0.5">Pending & Overdue</p>
        </Link>
        <Link to="/admin/finance/structures" className="card p-4 text-center hover:border-primary-300 transition-colors">
          <p className="text-xs text-gray-500">Setup</p>
          <p className="font-bold text-gray-900 text-sm mt-0.5">Fee Structures</p>
        </Link>
        <Link to="/admin/finance/reports" className="card p-4 text-center hover:border-primary-300 transition-colors">
          <p className="text-xs text-gray-500">Export</p>
          <p className="font-bold text-primary-700 text-sm mt-0.5">P&L & Reports</p>
        </Link>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Income vs Expense Chart */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Monthly Income vs Expenses</h3>
              <p className="text-xs text-gray-400">Cash received vs institute expenditures (Past 6 Months)</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="income" name="Fee Collection (Income)" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill="#F43F5E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course-wise Fee Collection */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Course-wise Revenue Breakdown</h3>
              <p className="text-xs text-gray-400">Collected vs remaining balance per course</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseWise} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="courseName" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="collected" name="Collected" fill="#10B981" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#F59E0B" stackId="a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
