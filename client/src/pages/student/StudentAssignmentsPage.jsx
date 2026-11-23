import { useState, useEffect } from 'react'
import { lmsService } from '../../services'
import Modal from '../../components/ui/Modal'
import { useForm } from 'react-hook-form'
import { FileText, Calendar, CheckCircle2, Clock, Upload, Award } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitModal, setSubmitModal] = useState({ open: false, assignment: null })

  const { register, handleSubmit, reset } = useForm()

  const loadAssignments = async () => {
    setLoading(true)
    try {
      const res = await lmsService.getAllAssignments()
      setAssignments(res.data.data || [])
    } catch {
      toast.error('Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssignments()
  }, [])

  const openSubmit = (asg) => {
    reset()
    if (asg.mySubmission) {
      reset({ submissionText: asg.mySubmission.submissionText })
    }
    setSubmitModal({ open: true, assignment: asg })
  }

  const onSubmit = async (data) => {
    try {
      await lmsService.submitAssignment(submitModal.assignment._id, data)
      toast.success('Assignment submitted successfully!')
      setSubmitModal({ open: false, assignment: null })
      loadAssignments()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assignments & Tasks</h1>
        <p className="text-gray-500 text-sm">Submit your homework and practical coding assignments for evaluation</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary-500" />
          <h3 className="text-base font-semibold text-gray-700">No pending assignments</h3>
          <p className="text-sm text-gray-400 mt-1">You are all caught up on your course coursework!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((asg) => {
            const sub = asg.mySubmission
            const isSubmitted = !!sub
            const isEvaluated = sub?.status === 'Evaluated'

            return (
              <div key={asg._id} className="card p-5 flex flex-col justify-between hover:shadow-lg transition-all space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                      {asg.course?.title || 'Assignment'}
                    </span>
                    {sub ? (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isEvaluated ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                        {sub.status}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        Pending Submission
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-900 text-base">{asg.title}</h3>
                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">{asg.instructions}</p>
                </div>

                {/* Feedback or Grade box */}
                {isEvaluated && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-emerald-800">
                      <span>Score Awarded:</span>
                      <span>{sub.marksObtained} / {asg.maxMarks} Marks</span>
                    </div>
                    {sub.feedback && <p className="text-gray-600 italic">Teacher Feedback: "{sub.feedback}"</p>}
                  </div>
                )}

                <div className="pt-3 border-t border-gray-100 space-y-3 text-xs">
                  <div className="flex items-center justify-between text-gray-500">
                    <span className="flex items-center gap-1 text-amber-700 font-medium">
                      <Calendar className="w-3.5 h-3.5" /> Due: {new Date(asg.deadline).toLocaleDateString('en-IN')}
                    </span>
                    <span className="font-bold text-gray-700">Max: {asg.maxMarks}</span>
                  </div>

                  <button
                    onClick={() => openSubmit(asg)}
                    className={`w-full py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                      isSubmitted
                        ? 'btn-secondary'
                        : 'btn-primary'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" /> {isSubmitted ? 'Edit Submission' : 'Submit Assignment'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Submit Assignment Modal */}
      <Modal
        isOpen={submitModal.open}
        onClose={() => setSubmitModal({ open: false, assignment: null })}
        title={`Submit: ${submitModal.assignment?.title || ''}`}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Your Solution / Answers / Code Links *
            </label>
            <textarea
              {...register('submissionText', { required: 'Please provide submission details or links' })}
              className="input-field min-h-[120px]"
              placeholder="Paste your GitHub repository URL, Google Drive link, or text answer here..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setSubmitModal({ open: false, assignment: null })} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Submit Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
