import { useState, useEffect, useRef, useCallback } from 'react'
import { attemptService } from '../../services'
import { useParams, useNavigate, useBeforeUnload } from 'react-router-dom'
import { Flag, ChevronLeft, ChevronRight, Send } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TestAttemptPage() {
  const { testId } = useParams()
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState(null)
  const [questions, setQuestions] = useState([])
  const [test, setTest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({}) // { questionId: optionIndex }
  const [flagged, setFlagged] = useState({}) // { questionId: bool }
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const timerRef = useRef(null)
  const autoSaveRef = useRef(null)

  // Warn before leaving
  useBeforeUnload(useCallback(() => 'Test is in progress. Answers are auto-saved.', []))

  useEffect(() => {
    attemptService.start(testId)
      .then(r => {
        const { attempt: att, questions: qs, test: t } = r.data.data
        setAttempt(att); setQuestions(qs); setTest(t)
        // Restore saved answers
        const savedMap = {}
        att.answers?.forEach(a => { if (a.selectedOption !== undefined && a.selectedOption !== null) savedMap[a.question] = a.selectedOption })
        setAnswers(savedMap)
        // Calculate time left
        const deadline = Math.min(
          new Date(att.startTime).getTime() + t.duration * 60000,
          new Date(t.endTime).getTime()
        )
        setTimeLeft(Math.max(0, Math.floor((deadline - Date.now()) / 1000)))
      })
      .catch(err => { toast.error(err.response?.data?.message || 'Failed to start test'); navigate('/student/tests') })
      .finally(() => setLoading(false))
  }, [testId, navigate])

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0 || !attempt) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleAutoSubmit(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [attempt])

  // Auto-save every 30s
  useEffect(() => {
    if (!attempt) return
    autoSaveRef.current = setInterval(() => { doSave() }, 30000)
    return () => clearInterval(autoSaveRef.current)
  }, [attempt, answers])

  const doSave = async () => {
    if (!attempt) return
    try {
      const payload = Object.entries(answers).map(([question, selectedOption]) => ({ question, selectedOption }))
      await attemptService.saveAnswers(attempt._id, payload)
    } catch {}
  }

  const handleAutoSubmit = async () => {
    if (!attempt || submitting) return
    setSubmitting(true)
    try {
      await doSave()
      await attemptService.submit(attempt._id)
      toast.success('Time up! Test auto-submitted.')
      navigate(`/student/results/${attempt._id}`)
    } catch { toast.error('Auto-submit failed') }
    finally { setSubmitting(false) }
  }

  const handleSubmit = async () => {
    setShowConfirm(false)
    setSubmitting(true)
    clearInterval(timerRef.current)
    clearInterval(autoSaveRef.current)
    try {
      await doSave()
      const payload = Object.entries(answers).map(([question, selectedOption]) => ({ question, selectedOption }))
      await attemptService.submit(attempt._id)
      toast.success('Test submitted successfully!')
      navigate(`/student/results/${attempt._id}`)
    } catch (err) { toast.error(err.response?.data?.message || 'Submit failed'); setSubmitting(false) }
  }

  const selectAnswer = (optIdx) => {
    const qId = questions[currentIdx]?._id
    if (!qId) return
    setAnswers(prev => ({ ...prev, [qId]: optIdx }))
  }

  const toggleFlag = (qId) => setFlagged(prev => ({ ...prev, [qId]: !prev[qId] }))

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  }

  const getQStatus = (q, idx) => {
    if (idx === currentIdx) return 'current'
    if (flagged[q._id]) return 'flagged'
    if (answers[q._id] !== undefined) return 'answered'
    return 'unanswered'
  }

  const qStatusColors = {
    current: 'bg-primary-600 text-white',
    answered: 'bg-green-500 text-white',
    flagged: 'bg-orange-400 text-white',
    unanswered: 'bg-white text-gray-600 border border-gray-200',
  }

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#F8FAFC]">
      <div className="text-center"><div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" /><p className="text-gray-500">Starting test...</p></div>
    </div>
  )

  const currentQ = questions[currentIdx]
  const answered = Object.keys(answers).filter(id => answers[id] !== undefined).length
  const isLowTime = timeLeft < 300 // 5 minutes

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div>
          <h1 className="font-bold text-gray-900 text-sm truncate max-w-xs">{test?.title}</h1>
          <p className="text-xs text-gray-400">{test?.subject?.name}</p>
        </div>
        <div className={`px-4 py-2 rounded-xl font-mono font-bold text-lg ${isLowTime ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-primary-50 text-primary-600'}`}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Question panel */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {currentQ && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                  <button onClick={() => toggleFlag(currentQ._id)} className={`flex items-center gap-1.5 text-sm px-3 py-1 rounded-lg transition-colors ${flagged[currentQ._id] ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-100'}`}>
                    <Flag className="w-4 h-4" /> {flagged[currentQ._id] ? 'Flagged' : 'Flag'}
                  </button>
                </div>
                <p className="text-gray-900 font-medium text-base leading-relaxed mb-6">{currentQ.questionText}</p>
                <div className="space-y-3">
                  {currentQ.options?.map((opt, i) => (
                    <button key={i} onClick={() => selectAnswer(i)}
                      className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${answers[currentQ._id] === i ? 'border-primary-500 bg-primary-50' : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${answers[currentQ._id] === i ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span className="text-gray-900 text-sm">{opt.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}
                  className="btn-secondary flex items-center gap-2 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                {currentIdx < questions.length - 1 ? (
                  <button onClick={() => setCurrentIdx(i => i + 1)} className="btn-primary flex items-center gap-2">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={() => setShowConfirm(true)} className="bg-green-600 hover:bg-green-700 text-white btn-primary flex items-center gap-2">
                    <Send className="w-4 h-4" /> Submit Test
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right panel: question grid */}
        <div className="hidden lg:flex w-72 bg-white border-l border-gray-100 flex-col p-4">
          <div className="mb-4">
            <div className="text-xs font-semibold text-gray-500 mb-2">Progress</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
              <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${(answered / questions.length) * 100}%` }} />
            </div>
            <div className="text-xs text-gray-400">{answered}/{questions.length} answered</div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-1 mb-4 text-xs">
            {[['bg-primary-600', 'Current'], ['bg-green-500', 'Answered'], ['bg-orange-400', 'Flagged'], ['bg-white border border-gray-200', 'Unanswered']].map(([cls, label]) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${cls}`} /><span className="text-gray-500">{label}</span>
              </div>
            ))}
          </div>

          {/* Question grid */}
          <div className="grid grid-cols-5 gap-1.5 overflow-y-auto flex-1">
            {questions.map((q, i) => (
              <button key={q._id} onClick={() => setCurrentIdx(i)}
                className={`aspect-square rounded-lg text-xs font-semibold transition-all ${qStatusColors[getQStatus(q, i)]}`}>
                {i + 1}
              </button>
            ))}
          </div>

          <button onClick={() => setShowConfirm(true)} className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> Submit Test
          </button>
        </div>
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-gray-900 text-lg mb-2">Submit Test?</h3>
            <div className="text-sm text-gray-500 space-y-1 mb-5">
              <p>Answered: <span className="font-semibold text-gray-900">{answered}</span></p>
              <p>Unanswered: <span className="font-semibold text-gray-900">{questions.length - answered}</span></p>
              <p>Flagged: <span className="font-semibold text-gray-900">{Object.values(flagged).filter(Boolean).length}</span></p>
            </div>
            <p className="text-sm text-amber-600 bg-amber-50 rounded-xl p-3 mb-5">Once submitted, you cannot change your answers.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="btn-secondary flex-1">Continue Test</button>
              <button onClick={handleSubmit} disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex-1 disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

