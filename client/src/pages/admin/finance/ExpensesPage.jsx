import { useState, useEffect } from 'react'
import { financeService } from '../../../services'
import Modal from '../../../components/ui/Modal'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import SearchInput from '../../../components/ui/SearchInput'
import { useForm } from 'react-hook-form'
import {
  Plus, Pencil, Trash2, TrendingDown, Calendar,
  Download, Filter, Tag, DollarSign, PieChart
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([])
  const [stats, setStats] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null })
  const [confirmDelete, setConfirmDelete] = useState(null)

  const { register, handleSubmit, reset, setValue } = useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const [expRes, statRes, catRes] = await Promise.all([
        financeService.getAllExpenses({ search, category: categoryFilter }),
        financeService.getExpenseStats(),
        financeService.getExpenseCategories(),
      ])
      setExpenses(expRes.data.data.expenses || [])
      setStats(statRes.data.data)
      setCategories(catRes.data.data || [])
    } catch {
      toast.error('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [search, categoryFilter])

  const openAdd = () => {
    reset()
    setValue('category', categories[0] || 'Rent')
    setValue('paymentMode', 'Cash')
    setValue('expenseDate', new Date().toISOString().split('T')[0])
    setModal({ open: true, mode: 'create', data: null })
  }

  const openEdit = (exp) => {
    reset()
    setValue('title', exp.title)
    setValue('category', exp.category)
    setValue('amount', exp.amount)
    setValue('expenseDate', exp.expenseDate ? exp.expenseDate.split('T')[0] : '')
    setValue('paymentMode', exp.paymentMode)
    setValue('paidTo', exp.paidTo)
    setValue('description', exp.description)
    setModal({ open: true, mode: 'edit', data: exp })
  }

  const onSubmit = async (data) => {
    try {
      if (modal.mode === 'create') {
        await financeService.createExpense(data)
        toast.success('Expense recorded!')
      } else {
        await financeService.updateExpense(modal.data._id, data)
        toast.success('Expense updated!')
      }
      setModal({ open: false, mode: 'create', data: null })
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save expense')
    }
  }

  const handleDelete = async () => {
    try {
      await financeService.deleteExpense(confirmDelete)
      toast.success('Expense deleted')
      setConfirmDelete(null)
      loadData()
    } catch {
      toast.error('Failed to delete expense')
    }
  }

  const handleExport = async () => {
    try {
      const res = await financeService.exportCSV('expenses')
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'excellup-expenses.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Expenses exported to CSV!')
    } catch {
      toast.error('Export failed')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coaching Expenses</h1>
          <p className="text-gray-500 text-sm">Track rent, bills, teacher honorariums, and operational expenditures</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Today's Expenses</p>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">₹{(stats?.today || 0).toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">This Month</p>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">₹{(stats?.thisMonth || 0).toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total All Time</p>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">₹{(stats?.total || 0).toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Top Category</p>
            <h3 className="text-base font-bold text-gray-900 mt-1 truncate">{stats?.highestCategory || 'None'}</h3>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search expense title, vendor..." />
        </div>
        <select
          className="input-field w-auto"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Title / Purpose</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Paid To</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="p-4"><div className="h-6 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-gray-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-gray-900">{exp.title}</p>
                      {exp.description && <p className="text-xs text-gray-400 line-clamp-1">{exp.description}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="badge badge-purple text-[11px]">{exp.category}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600 text-base">
                      ₹{exp.amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {new Date(exp.expenseDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-700 font-medium">{exp.paidTo || '—'}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">{exp.paymentMode}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEdit(exp)}
                          className="p-1.5 text-gray-400 hover:text-primary-600 rounded"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(exp._id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, mode: 'create', data: null })}
        title={modal.mode === 'create' ? 'Record Coaching Expense' : 'Edit Expense Record'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expense Title / Item *</label>
            <input
              {...register('title', { required: 'Title is required' })}
              className="input-field"
              placeholder="e.g. Office Electricity Bill"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select {...register('category', { required: true })} className="input-field">
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
              <input
                type="number"
                {...register('amount', { required: 'Amount required', min: 1 })}
                className="input-field font-bold text-rose-600"
                placeholder="1000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expense Date</label>
              <input type="date" {...register('expenseDate')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
              <select {...register('paymentMode')} className="input-field">
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paid To (Vendor / Person)</label>
            <input {...register('paidTo')} className="input-field" placeholder="e.g. Gupta Book Depot" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description / Bill Notes</label>
            <textarea {...register('description')} className="input-field min-h-[60px]" placeholder="Details of expense..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal({ open: false, mode: 'create', data: null })} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Expense</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record? This will update profit and loss statistics."
      />
    </div>
  )
}
