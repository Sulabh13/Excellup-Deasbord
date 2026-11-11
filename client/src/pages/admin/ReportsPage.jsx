import { useState } from 'react'
import { reportService } from '../../services'
import { Download } from 'lucide-react'
import toast from 'react-hot-toast'

const tabs = ['Attendance', 'Test Results']

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [attFilters, setAttFilters] = useState({ type: 'daily', date: new Date().toISOString().slice(0, 10), month: new Date().getMonth() + 1, year: new Date().getFullYear() })
  const [loading, setLoading] = useState(false)

  const handleExportExcel = async () => {
    setLoading(true)
    try {
      const r = await reportService.exportAttendanceExcel(attFilters)
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      const a = document.createElement('a'); a.href = url; a.download = 'attendance-report.xlsx'; a.click()
      toast.success('Downloaded!')
    } catch { toast.error('Export failed') }
    finally { setLoading(false) }
  }

  const handleExportResultsCSV = async () => {
    setLoading(true)
    try {
      const r = await reportService.exportResultsCSV({})
      const url = URL.createObjectURL(new Blob([r.data], { type: 'text/csv' }))
      const a = document.createElement('a'); a.href = url; a.download = 'results.csv'; a.click()
      toast.success('Downloaded!')
    } catch { toast.error('Export failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">Reports & Exports</h1>
      <div className="flex border-b border-gray-200">
        {tabs.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${i === activeTab ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Attendance Reports</h3>
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                <select className="input-field" value={attFilters.type} onChange={e => setAttFilters(f => ({ ...f, type: e.target.value }))}>
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="student">Student-wise</option>
                  <option value="batch">Batch-wise</option>
                </select>
              </div>
              {attFilters.type === 'daily' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" className="input-field" value={attFilters.date} onChange={e => setAttFilters(f => ({ ...f, date: e.target.value }))} />
                </div>
              )}
              {(attFilters.type === 'monthly' || attFilters.type === 'batch') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                    <select className="input-field" value={attFilters.month} onChange={e => setAttFilters(f => ({ ...f, month: e.target.value }))}>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{new Date(2024, m - 1).toLocaleString('en-IN', { month: 'long' })}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input type="number" className="input-field" value={attFilters.year} onChange={e => setAttFilters(f => ({ ...f, year: e.target.value }))} />
                  </div>
                </>
              )}
            </div>
            <button onClick={handleExportExcel} disabled={loading} className="btn-primary flex items-center gap-2">
              <Download className="w-4 h-4" /> {loading ? 'Exporting...' : 'Export to Excel (.xlsx)'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Test Result Reports</h3>
          <p className="text-gray-500 text-sm mb-4">Export all test results as a CSV file.</p>
          <button onClick={handleExportResultsCSV} disabled={loading} className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" /> {loading ? 'Exporting...' : 'Export Results CSV'}
          </button>
        </div>
      )}
    </div>
  )
}

