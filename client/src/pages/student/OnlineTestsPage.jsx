import { useState, useEffect } from 'react'
import { testService, attemptService } from '../../services'
import { useNavigate } from 'react-router-dom'
import { TestTube2, Clock, Award, ChevronRight, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const tabs = ['Active', 'Upcoming', 'Completed']

export default function OnlineTestsPage() {
  const navigate = useNavigate()
  const [tests, setTests] = useState([])
  const [myAttempts, setMyAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    Promise.all([testService.getAll({}), attemptService.getMyAttempts({})])
      .then(([tRes, aRes]) => { setTests(tRes.data.data || []); setMyAttempts(aRes.data.data || []) })
      .catch(() => toast.error('Failed to load tests'))
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()
  const attemptedTestIds = myAttempts.filter(a => a.status !== 'in-progress').map(a => a.test?._id?.toString())

  const active = tests.filter(t => new Date(t.startTime) <= now && new Date(t.endTime) >= now && t.status !== 'draft')
  const upcoming = tests.filter(t => new Date(t.startTime) > now && t.status !== 'draft')
  const completed = myAttempts.filter(a => a.status !== 'in-progress')

  const getAttemptForTest = (testId) => myAttempts.find(a => a.test?._id?.toString() === testId.toString())

  const tabTests = [active, upcoming, completed]

  const formatDuration = (mins) => mins >= 60 ? `${Math.floor(mins/60)}h ${mins%60}m` : `${mins} min`

  const renderTestCard = (item, tabIdx) => {
    if (tabIdx === 2) {
      // Completed tab: show attempt data
      const a = item
      return (
        <div key={a._id} className="card flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900">{a.test?.title || 'Test'}</h3>
            <div className="flex flex-wrap gap-3 mt-1">
              <span className="text-xs text-gray-500 flex items-center gap-1"><Award className="w-3.5 h-3.5" />{a.obtainedMarks}/{a.totalMarks} marks</span>
              <span className="text-xs text-gray-500">{a.percentage?.toFixed(1)}%</span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {a.isPassed ? <span className="badge badge-green">Pass</span> : <span className="badge badge-red">Fail</span>}
            <button onClick={() => navigate(`/student/results/${a._id}`)} className="btn-secondary text-sm py-1.5 flex items-center gap-1">
              View Result <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )
    }

    const t = item
    const isAttempted = attemptedTestIds.includes(t._id.toString())
    const attempt = getAttemptForTest(t._id)
    const isActive = tabIdx === 0

    return (
      <div key={t._id} className={`card flex flex-col sm:flex-row sm:items-center gap-4 ${isAttempted ? 'opacity-75' : ''}`}>
        <div className={`w-12 h-12 ${isActive ? 'bg-green-100' : 'bg-blue-100'} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <TestTube2 className={`w-6 h-6 ${isActive ? 'text-green-600' : 'text-blue-600'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{t.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{t.subject?.name}</p>
          <div className="flex flex-wrap gap-3 mt-1.5">
            <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDuration(t.duration)}</span>
            <span className="text-xs text-gray-500 flex items-center gap-1"><Award className="w-3.5 h-3.5" />{t.totalMarks} marks</span>
            {!isActive && <span className="text-xs text-blue-600">{new Date(t.startTime).toLocaleDateString('en-IN')} {new Date(t.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
          </div>
        </div>
        <div className="flex-shrink-0">
          {isActive && !isAttempted && (
            <button onClick={() => navigate(`/student/tests/${t._id}/instructions`)} className="btn-primary flex items-center gap-2">
              Start Test <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {isActive && isAttempted && (
            <button onClick={() => navigate(`/student/results/${attempt._id}`)} className="btn-secondary text-sm">View Result</button>
          )}
          {!isActive && <span className="badge badge-blue">Upcoming</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">Online Tests</h1>
      <div className="flex border-b border-gray-200">
        {tabs.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${i === activeTab ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab}
            <span className="ml-1.5 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
              {i === 2 ? completed.length : i === 0 ? active.length : upcoming.length}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? [...Array(3)].map((_, i) => <div key={i} className="card skeleton h-24" />)
          : tabTests[activeTab].length === 0
            ? (
              <div className="card text-center py-12 text-gray-400">
                <TestTube2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No {tabs[activeTab].toLowerCase()} tests</p>
              </div>
            )
            : tabTests[activeTab].map(item => renderTestCard(item, activeTab))}
      </div>
    </div>
  )
}

