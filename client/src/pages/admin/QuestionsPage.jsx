import { useState, useEffect, useCallback } from 'react'
import { questionService, testService } from '../../services'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Plus, Pencil, Trash2, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function QuestionsPage() {
  const { testId } = useParams()
  const navigate = useNavigate()
  const [test, setTest] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ type: null, data: null })
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [correctOption, setCorrectOption] = useState(0)
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [tRes, qRes] = await Promise.all([testService.getById(testId), questionService.getByTest(testId)])
      setTest(tRes.data.data)
      setQuestions(qRes.data.data || [])
    } catch { toast.error('Failed to load questions') }
    finally { setLoading(false) }
  }, [testId])

  useEffect(() => { fetchData() }, [fetchData])

  const openAdd = () => {
    reset()
    setCorrectOption(0)
    setModal({ type: 'add', data: null })
  }

  const openEdit = (q) => {
    setModal({ type: 'edit', data: q })
    setValue('questionText', q.questionText)
    setValue('explanation', q.explanation || '')
    setValue('marks', q.marks || 1)
    q.options.forEach((o, i) => setValue(`option_${i}`, o.text))
    setCorrectOption(q.options.findIndex(o => o.isCorrect))
  }

  const closeModal = () => { setModal({ type: null, data: null }); reset(); setCorrectOption(0) }

  const buildPayload = (data) => ({
    test: testId,
    testId: testId,
    questionText: data.questionText,
    explanation: data.explanation,
    marks: Number(data.marks) || 1,
    options: [0, 1, 2, 3].map(i => ({ text: data[`option_${i}`] || '', isCorrect: i === correctOption })),
  })

  const onSubmit = async (data) => {
    if (!data.option_0 || !data.option_1 || !data.option_2 || !data.option_3) {
      return toast.error('All 4 options are required')
    }
    try {
      if (modal.type === 'add') { await questionService.add(testId, buildPayload(data)); toast.success('Question added!') }
      else { await questionService.update(modal.data._id, buildPayload(data)); toast.success('Updated!') }
      closeModal(); fetchData()
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
  }

  const handleDelete = async () => {
    try { await questionService.delete(confirmDelete); toast.success('Deleted'); setConfirmDelete(null); fetchData() }
    catch { toast.error('Failed') }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-secondary flex items-center gap-2 self-start">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Manage Questions</h1>
          {test && <p className="text-gray-500 text-sm">{test.title} — {questions.length}/{test.totalQuestions} questions</p>}
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Add Question
        </button>
      </div>

      {/* Progress bar */}
      {test && (
        <div className="card p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Questions Added</span>
            <span className="font-semibold text-gray-900">{questions.length} / {test.totalQuestions}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (questions.length / (test.totalQuestions || 1)) * 100)}%` }} />
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? [...Array(3)].map((_, i) => <div key={i} className="card skeleton h-32" />)
          : questions.length === 0
            ? (
              <div className="card text-center py-10 text-gray-400">
                <Plus className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>No questions yet. Click "Add Question" to start.</p>
              </div>
            )
            : questions.map((q, idx) => (
              <div key={q._id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-7 h-7 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">{idx + 1}</span>
                      <p className="font-medium text-gray-900">{q.questionText}</p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2 ml-9">
                      {q.options.map((o, i) => (
                        <div key={i} className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg ${o.isCorrect ? 'bg-green-50 text-green-700 font-medium' : 'bg-gray-50 text-gray-600'}`}>
                          {o.isCorrect && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                          <span className="font-medium mr-1">{String.fromCharCode(65 + i)}.</span>
                          {o.text}
                        </div>
                      ))}
                    </div>
                    {q.explanation && <p className="text-xs text-blue-600 mt-2 ml-9 italic">💡 {q.explanation}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-xs font-medium text-gray-500">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(q)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setConfirmDelete(q._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
      </div>

      <Modal isOpen={modal.type === 'add' || modal.type === 'edit'} onClose={closeModal} title={modal.type === 'add' ? 'Add Question' : 'Edit Question'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question Text *</label>
            <textarea {...register('questionText', { required: 'Required' })} rows={3} className="input-field" placeholder="Enter your question..." />
            {errors.questionText && <p className="text-red-500 text-xs mt-1">{errors.questionText.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Options (select the correct answer)</label>
            <div className="space-y-3">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${correctOption === i ? 'border-green-400 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                  <input type="radio" name="correctOption" checked={correctOption === i} onChange={() => setCorrectOption(i)} className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="font-semibold text-gray-600 w-5 flex-shrink-0">{String.fromCharCode(65 + i)}.</span>
                  <input {...register(`option_${i}`, { required: `Option ${String.fromCharCode(65 + i)} required` })} className="flex-1 bg-transparent outline-none text-sm" placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                  {correctOption === i && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                </div>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
              <input type="number" {...register('marks')} defaultValue={1} min={1} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (optional)</label>
              <input {...register('explanation')} className="input-field" placeholder="Explain the correct answer" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Question</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={handleDelete} title="Delete Question" message="Delete this question?" />
    </div>
  )
}

