import { useState, useEffect } from 'react'
import { attemptService } from '../../services'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, MinusCircle, Award, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TestResultPage() {
  const { attemptId } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [questions, setQuestions] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (attemptId === 'all') { navigate('/student/tests'); return }
    attemptService.getResult(attemptId)
      .then(r => { setResult(r.data.data?.attempt); setQuestions(r.data.data?.questions) })
      .catch(() => { toast.error('Failed to load result'); navigate('/student/tests') })
      .finally(() => setLoading(false))
  }, [attemptId, navigate])

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
  if (!result) return null

  const pct = result.percentage || 0
  const passed = result.isPassed
  const answered = result.answers?.length || 0
  const correct = result.answers?.filter(a => a.isCorrect).length || 0
  const incorrect = result.answers?.filter(a => !a.isCorrect && a.selectedOption !== undefined && a.selectedOption !== null).length || 0
  const unanswered = answered - correct - incorrect

  // SVG circle progress
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Result banner */}
      <div className={`rounded-2xl p-6 text-white ${passed ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-red-600 to-red-700'}`}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Circular progress */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="12" />
              <circle cx="64" cy="64" r={radius} fill="none" stroke="white" strokeWidth="12"
                strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{pct.toFixed(0)}%</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              {passed ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              <h1 className="text-2xl font-bold">{passed ? 'Congratulations! You Passed!' : 'Better Luck Next Time'}</h1>
            </div>
            <p className="text-white/80">{result.test?.title}</p>
            <p className="text-white/70 text-sm mt-1">
              Submitted: {result.submitTime ? new Date(result.submitTime).toLocaleString('en-IN') : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          ['Obtained Marks', `${result.obtainedMarks} / ${result.totalMarks}`, 'bg-primary-50 text-primary-700'],
          ['Correct', correct, 'bg-green-50 text-green-700'],
          ['Incorrect', incorrect, 'bg-red-50 text-red-700'],
          ['Unanswered', unanswered, 'bg-gray-100 text-gray-600'],
        ].map(([label, val, cls]) => (
          <div key={label} className={`rounded-xl p-4 text-center ${cls}`}>
            <p className="text-xl font-bold">{val}</p>
            <p className="text-sm font-medium mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Answer Review */}
      {questions && questions.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Answer Review</h2>
          {questions.map((q, idx) => {
            const myAns = result.answers?.find(a => a.question?.toString() === q._id.toString())
            const correctOptIdx = q.options.findIndex(o => o.isCorrect)
            const selectedIdx = myAns?.selectedOption
            const isCorrect = myAns?.isCorrect
            const isUnanswered = selectedIdx === undefined || selectedIdx === null

            return (
              <div key={q._id} className={`card border-l-4 ${isCorrect ? 'border-l-green-500' : isUnanswered ? 'border-l-gray-300' : 'border-l-red-500'}`}>
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">{idx + 1}</span>
                  <p className="font-medium text-gray-900">{q.questionText}</p>
                  <div className="ml-auto flex-shrink-0">
                    {isCorrect ? <CheckCircle className="w-5 h-5 text-green-500" /> : isUnanswered ? <MinusCircle className="w-5 h-5 text-gray-400" /> : <XCircle className="w-5 h-5 text-red-500" />}
                  </div>
                </div>
                <div className="space-y-1.5 ml-10">
                  {q.options.map((opt, i) => (
                    <div key={i} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${i === correctOptIdx ? 'bg-green-50 text-green-700 font-medium' : i === selectedIdx && !isCorrect ? 'bg-red-50 text-red-700' : 'text-gray-500'}`}>
                      <span className="font-semibold w-5">{String.fromCharCode(65 + i)}.</span>
                      {opt.text}
                      {i === correctOptIdx && <span className="ml-auto text-xs text-green-600 font-medium">✓ Correct</span>}
                      {i === selectedIdx && i !== correctOptIdx && <span className="ml-auto text-xs text-red-600 font-medium">✗ Your answer</span>}
                    </div>
                  ))}
                </div>
                {q.explanation && <p className="text-xs text-blue-600 italic ml-10 mt-2 p-2 bg-blue-50 rounded-lg">💡 {q.explanation}</p>}
                <p className="text-xs text-gray-400 ml-10 mt-2">Marks: {myAns?.marksAwarded ?? 0} / {q.marks}</p>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card text-center py-8 text-gray-400">
          <Award className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Answer review will be available once the teacher publishes results.</p>
        </div>
      )}

      <button onClick={() => navigate('/student/tests')} className="btn-secondary flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Tests
      </button>
    </div>
  )
}

