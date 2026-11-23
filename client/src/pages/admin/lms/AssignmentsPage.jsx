import { useState, useEffect } from 'react'
import { lmsService, batchService } from '../../../services'
import Modal from '../../../components/ui/Modal'
import { useForm } from 'react-hook-form'
import { Plus, FileText, Calendar, CheckCircle2, Clock, Eye, Award } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([])
  const [courses, setCourses] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [createModal, setCreateModal] = useState(false)
  const [submissionsModal, setSubmissionsModal] = useState({ open: false, data: null })
  const [evaluateModal, setEvaluateModal] = useState({ open: false, submission: null })

  const createForm = useForm()
  const evaluateForm = useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const [aRes, cRes, bRes] = await Promise.all([
        lmsService.getAllAssignments(),
        lmsService.getAllCourses(),
        batchService.getAll(),
      ])
      setAssignments(aRes.data.data || [])
      setCourses(cRes.data.data.courses || [])
      setBatches(bRes.data.data || [])
    } catch {
      toast.error('Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const onCreateSubmit = async (formData) => {
    try {
      await lmsService.createAssignment(formData)
      toast.success('Assignment created!')
      setCreateModal(false)
      createForm.reset()
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating assignment')
    }
  }

  const openSubmissions = async (assignment) => {
    try {
      const res = await lmsService.getAssignmentById(assignment._id)
      setSubmissionsModal({ open: true, data: res.data.data })
    } catch {
      toast.error('Failed to load submissions')
    }
  }

  const openEvaluate = (sub) => {
    evaluateForm.reset()
    evaluateForm.setValue('marksObtained', sub.marksObtained || '')
    evaluateForm.setValue('feedback', sub.feedback || '')
    evaluateForm.setValue('status', sub.status || 'Evaluated')
    setEvaluateModal({ open: true, submission: sub })
  }

  const onEvaluateSubmit = async (formData) => {
    try {
      await lmsService.evaluateSubmission(evaluateModal.submission._id, formData)
      toast.success('Evaluation saved!')
      setEvaluateModal({ open: false, submission: null })
      if (submissionsModal.data) {
        openSubmissions(submissionsModal.data.assignment)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save evaluation')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Online Assignments</h1>
          <p className="text-gray-500 text-sm">Create practice tasks, evaluate submissions, and grade students</p>
        </div>
        <button onClick={() => setCreateModal(true)} className="btn-primary flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Create Assignment
        </button>
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
          <h3 className="text-base font-semibold text-gray-700">No assignments created yet</h3>
          <p className="text-sm text-gray-400 mt-1">Add tasks for your courses or batches.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((asg) => (
            <div key={asg._id} className="card p-5 flex flex-col justify-between hover:shadow-lg transition-all space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                  {asg.course?.title || 'Course Task'}
                </span>
                <h3 className="font-bold text-gray-900 text-base">{asg.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2">{asg.instructions}</p>
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 font-medium text-amber-700">
                    <Calendar className="w-3.5 h-3.5" /> Due: {new Date(asg.deadline).toLocaleDateString('en-IN')}
                  </span>
                  <span className="font-bold text-gray-700">Max Marks: {asg.maxMarks}</span>
                </div>
                <button
                  onClick={() => openSubmissions(asg)}
                  className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-4 h-4" /> View Student Submissions
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create Course Assignment" size="md">
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Course *</label>
            <select {...createForm.register('course', { required: 'Course required' })} className="input-field">
              <option value="">Select Course</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Title *</label>
            <input {...createForm.register('title', { required: 'Title required' })} className="input-field" placeholder="e.g. Build Todo List in React" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
            <textarea {...createForm.register('instructions')} className="input-field min-h-[80px]" placeholder="Requirements, rubric and guidelines..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Marks</label>
              <input type="number" {...createForm.register('maxMarks')} className="input-field" defaultValue={50} min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline Date *</label>
              <input type="date" {...createForm.register('deadline', { required: 'Deadline required' })} className="input-field" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setCreateModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Create Assignment</button>
          </div>
        </form>
      </Modal>

      {/* Submissions Modal */}
      <Modal
        isOpen={submissionsModal.open}
        onClose={() => setSubmissionsModal({ open: false, data: null })}
        title={`Submissions: ${submissionsModal.data?.assignment?.title || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          {submissionsModal.data?.submissions?.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-400">No students have submitted this assignment yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
              {submissionsModal.data?.submissions?.map((sub) => (
                <div key={sub._id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{sub.student?.name}</h4>
                    <p className="text-xs text-gray-400 font-mono">{sub.student?.studentId} • {new Date(sub.submittedAt).toLocaleDateString('en-IN')}</p>
                    {sub.submissionText && <p className="text-xs text-gray-600 mt-1 italic line-clamp-1">"{sub.submissionText}"</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sub.status === 'Evaluated' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {sub.status} {sub.marksObtained !== null ? `(${sub.marksObtained} Marks)` : ''}
                    </span>
                    <button onClick={() => openEvaluate(sub)} className="btn-secondary py-1 text-xs flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> Grade
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Evaluate Modal */}
      <Modal
        isOpen={evaluateModal.open}
        onClose={() => setEvaluateModal({ open: false, submission: null })}
        title="Grade Assignment Submission"
      >
        <form onSubmit={evaluateForm.handleSubmit(onEvaluateSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marks Obtained *</label>
            <input
              type="number"
              {...evaluateForm.register('marksObtained', { required: 'Marks required' })}
              className="input-field"
              placeholder="e.g. 45"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Feedback</label>
            <textarea
              {...evaluateForm.register('feedback')}
              className="input-field"
              placeholder="Great work, clean structure..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setEvaluateModal({ open: false, submission: null })} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Grade</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
