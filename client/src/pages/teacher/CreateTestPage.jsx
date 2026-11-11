import { useState, useEffect } from 'react'
import { testService, questionService, batchService, subjectService } from '../../services'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const STEPS = ['Test Details', 'Add Questions', 'Review & Publish']

export default function CreateTestPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [testId, setTestId] = useState(null)
  const [test, setTest] = useState(null)
  const [questions, setQuestions] = useState([])
  const [batches, setBatches] = useState([])
  const [subjects, setSubjects] = useState([])
  const [saving, setSaving] = useState(false)
  const [correctOption, setCorrectOption] = useState(0)
  const { register, handleSubmit, formState: { errors }, watch } = useForm()
  const { register: regQ, handleSubmit: hsQ, reset: resetQ } = useForm()

  useEffect(() => {
    batchService.getAll().then(r => setBatches(r.data.data || []))
    subjectService.getAll().then(r => setSubjects(r.data.data || []))
  }, [])

  // Step 1: Save test details
  const onSaveTest = async (data) => {
    setSaving(true)
    try {
      const payload = {
        ...data,
        duration: Number(data.duration),
        totalMarks: Number(data.totalMarks),
        passingPercentage: Number(data.passingPercentage) || 40,
        negativeMarkValue: Number(data.negativeMarkValue) || 0,
        status: 'draft',
      }
      const res = testId
        ? await testService.update(testId, payload)
        : await testService.create(payload)
      const saved = res.data.data
      setTestId(saved._id); setTest(saved)
      toast.success('Test details saved!'); setStep(1)
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving test') }
    finally { setSaving(false) }
  }

  // Step 2: Add question
  const onAddQuestion = async (data) => {
    const options = [0,1,2,3].map(i => ({ text: data[`option_${i}`] || '', isCorrect: i === correctOption }))
    if (options.some(o => !o.text)) return toast.error('All 4 options required')
    setSaving(true)
    try {
      await questionService.add(testId, { questionText: data.questionText, options, explanation: data.explanation, marks: Number(data.marks) || 1 })
      const qRes = await questionService.getByTest(testId)
      setQuestions(qRes.data.data || [])
      toast.success('Question added!'); resetQ(); setCorrectOption(0)
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
    finally { setSaving(false) }
  }

  // Step 3: Publish
  const handlePublish = async (status) => {
    setSaving(true)
    try {
      await testService.update(testId, { status })
      toast.success(status === 'scheduled' ? 'Test scheduled!' : 'Saved as draft')
      navigate('/teacher/tests')
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  const negativeMarking = watch('negativeMarking')

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">Create MCQ Test</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {i < step ? <CheckCircle className="w-5 h-5" /> : i + 1}
            </div>
            <span className={`text-sm font-medium ${i === step ? 'text-primary-600' : 'text-gray-500'}`}>{s}</span>
            {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300" />}
          </div>
        ))}
      </div>

      {/* STEP 1: Test Details */}
      {step === 0 && (
        <div className="card">
          <form onSubmit={handleSubmit(onSaveTest)} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Title *</label>
                <input {...register('title', { required: 'Required' })} className="input-field" placeholder="e.g. Python Basics — Week 1 Quiz" />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch *</label>
                <select {...register('batchId', { required: 'Required' })} className="input-field">
                  <option value="">Select batch</option>
                  {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <select {...register('subjectId', { required: 'Required' })} className="input-field">
                  <option value="">Select subject</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
                <input type="number" {...register('duration', { required: 'Required', min: 1 })} className="input-field" placeholder="30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks *</label>
                <input type="number" {...register('totalMarks', { required: 'Required', min: 1 })} className="input-field" placeholder="50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Questions *</label>
                <input type="number" {...register('totalQuestions', { required: 'Required', min: 1 })} className="input-field" placeholder="25" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passing Percentage</label>
                <input type="number" {...register('passingPercentage')} className="input-field" defaultValue={40} placeholder="40" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                <input type="datetime-local" {...register('startTime', { required: 'Required' })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                <input type="datetime-local" {...register('endTime', { required: 'Required' })} className="input-field" />
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <input type="checkbox" {...register('negativeMarking')} id="neg" className="w-4 h-4" />
                <label htmlFor="neg" className="text-sm text-gray-700">Enable Negative Marking</label>
                {negativeMarking && (
                  <input type="number" step="0.25" {...register('negativeMarkValue')} className="input-field w-24" placeholder="0.25" />
                )}
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" {...register('shuffleQuestions')} id="shq" className="w-4 h-4" />
                <label htmlFor="shq" className="text-sm text-gray-700">Shuffle Questions</label>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                <textarea {...register('instructions')} rows={3} className="input-field" placeholder="Add test instructions for students..." />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 px-8">
                {saving ? 'Saving...' : 'Save & Continue'} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: Add Questions */}
      {step === 1 && testId && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-sm">{questions.length} question{questions.length !== 1 ? 's' : ''} added</p>
            <button onClick={() => setStep(2)} className="btn-primary flex items-center gap-2">
              Finish <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-5">Add a Question</h3>
            <form onSubmit={hsQ(onAddQuestion)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                <textarea {...regQ('questionText', { required: 'Required' })} rows={3} className="input-field" placeholder="Type your question..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Options (click radio to mark correct)</label>
                <div className="space-y-2">
                  {[0,1,2,3].map(i => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${correctOption === i ? 'border-green-400 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                      <input type="radio" checked={correctOption === i} onChange={() => setCorrectOption(i)} className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="font-semibold text-gray-600 w-5 flex-shrink-0">{String.fromCharCode(65+i)}.</span>
                      <input {...regQ(`option_${i}`)} className="flex-1 bg-transparent outline-none text-sm" placeholder={`Option ${String.fromCharCode(65+i)}`} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                  <input type="number" {...regQ('marks')} defaultValue={1} min={1} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                  <input {...regQ('explanation')} className="input-field" placeholder="Optional explanation..." />
                </div>
              </div>
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? 'Adding...' : '+ Add Question'}
              </button>
            </form>
          </div>
          {questions.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Added Questions ({questions.length})</h3>
              <div className="space-y-3">
                {questions.map((q, i) => (
                  <div key={q._id} className="bg-gray-50 rounded-xl p-4">
                    <p className="font-medium text-gray-900 text-sm"><span className="text-primary-600 mr-2">Q{i+1}.</span>{q.questionText}</p>
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {q.options.map((o, j) => (
                        <span key={j} className={`text-xs px-2 py-1 rounded ${o.isCorrect ? 'bg-green-100 text-green-700 font-medium' : 'text-gray-500'}`}>
                          {String.fromCharCode(65+j)}. {o.text}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Review & Publish */}
      {step === 2 && test && (
        <div className="card space-y-5">
          <h3 className="font-semibold text-gray-900">Review & Publish</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[['Title', test.title], ['Batch', test.batchId], ['Duration', test.duration + ' minutes'], ['Total Marks', test.totalMarks], ['Questions Added', questions.length], ['Passing %', test.passingPercentage + '%']].map(([k,v]) => (
              <div key={k} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400">{k}</p>
                <p className="font-semibold text-gray-900">{v}</p>
              </div>
            ))}
          </div>
          {questions.length === 0 && <p className="text-amber-600 bg-amber-50 rounded-xl p-4 text-sm">⚠️ No questions added. Add at least one question before publishing.</p>}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2"><ChevronLeft className="w-4 h-4" />Back to Questions</button>
            <button onClick={() => handlePublish('draft')} disabled={saving} className="btn-secondary flex-1">Save as Draft</button>
            <button onClick={() => handlePublish('scheduled')} disabled={saving || questions.length === 0} className="btn-primary flex-1">
              {saving ? 'Publishing...' : 'Schedule & Publish'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

