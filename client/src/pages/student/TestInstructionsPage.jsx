import { useState, useEffect } from 'react'
import { testService } from '../../services'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, AlertCircle, CheckSquare } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TestInstructionsPage() {
  const { testId } = useParams()
  const navigate = useNavigate()
  const [test, setTest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    testService.getById(testId)
      .then(r => {
        const payload = r.data?.data
        setTest(payload?.test || payload)
      })
      .catch(() => { toast.error('Test not found'); navigate('/student/tests') })
      .finally(() => setLoading(false))
  }, [testId, navigate])

  const handleStart = () => {
    if (!agreed) return toast.error('Please agree to the instructions')
    navigate(`/student/tests/${testId}/attempt`)
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
  if (!test) return null

  const now = new Date()
  const started = new Date(test.startTime) <= now
  const ended = new Date(test.endTime) < now

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">Test Instructions</h1>

      {/* Test Info */}
      <div className="card">
        <h2 className="font-bold text-gray-900 text-xl mb-1">{test.title}</h2>
        <p className="text-gray-500 text-sm mb-4">{test.description}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            ['Subject', test.subject?.name || '—'],
            ['Duration', test.duration + ' minutes'],
            ['Total Marks', test.totalMarks],
            ['Questions', test.totalQuestions],
            ['Passing', test.passingPercentage + '%'],
            ['Neg. Marking', test.negativeMarking ? `−${test.negativeMarkValue} per wrong` : 'No'],
          ].map(([k, v]) => (
            <div key={k} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">{k}</p>
              <p className="font-semibold text-gray-900 text-sm mt-0.5">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Time */}
      <div className={`rounded-xl p-4 flex items-center gap-3 ${ended ? 'bg-red-50' : started ? 'bg-green-50' : 'bg-blue-50'}`}>
        <Clock className={`w-5 h-5 flex-shrink-0 ${ended ? 'text-red-500' : started ? 'text-green-500' : 'text-blue-500'}`} />
        <div>
          <p className={`font-semibold text-sm ${ended ? 'text-red-700' : started ? 'text-green-700' : 'text-blue-700'}`}>
            {ended ? 'Test has ended' : started ? 'Test is now active' : 'Test not started yet'}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(test.startTime).toLocaleString('en-IN')} — {new Date(test.endTime).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Instructions */}
      {test.instructions && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-gray-900">Instructions</h3>
          </div>
          <div className="text-sm text-gray-600 space-y-1 whitespace-pre-line">
            {test.instructions}
          </div>
        </div>
      )}

      {/* General rules */}
      <div className="card bg-amber-50 border border-amber-100">
        <h3 className="font-semibold text-amber-800 mb-3">General Rules</h3>
        <ul className="text-sm text-amber-700 space-y-1.5">
          <li>• Do not refresh or close the browser during the test.</li>
          <li>• Your answers are auto-saved every 30 seconds.</li>
          <li>• The test will auto-submit when the timer reaches zero.</li>
          <li>• You cannot re-attempt unless allowed by the teacher.</li>
          <li>• All answers are validated and marks calculated on the server.</li>
        </ul>
      </div>

      {/* Agree and Start */}
      <div className="card">
        <label className="flex items-center gap-3 cursor-pointer mb-5">
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="w-5 h-5 text-green-600 rounded" />
          <span className="text-sm text-gray-700">I have read and understood all instructions. I am ready to begin.</span>
        </label>
        <button
          onClick={handleStart}
          disabled={!agreed || !started || ended}
          className="w-full btn-primary py-3 text-base disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <CheckSquare className="w-5 h-5" />
          {ended ? 'Test Ended' : !started ? 'Test Not Started' : 'Start Test Now'}
        </button>
      </div>
    </div>
  )
}

