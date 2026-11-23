import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { lmsService, studentService } from '../../../services'
import Modal from '../../../components/ui/Modal'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import { useForm } from 'react-hook-form'
import {
  ArrowLeft, Plus, Video, PlayCircle, FolderPlus,
  Trash2, Pencil, Users, FileText, CheckCircle2, Clock
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function CourseDetailPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])

  // Modals
  const [moduleModal, setModuleModal] = useState(false)
  const [lectureModal, setLectureModal] = useState({ open: false, data: null })
  const [enrollModal, setEnrollModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null) // { type: 'module'|'lecture', id }

  const moduleForm = useForm()
  const lectureForm = useForm()
  const enrollForm = useForm()

  const loadCourse = async () => {
    setLoading(true)
    try {
      const res = await lmsService.getCourseById(id)
      setData(res.data.data)
      const stRes = await studentService.getAll({ limit: 100 })
      setStudents(stRes.data.data?.students || [])
    } catch {
      toast.error('Failed to load course details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCourse()
  }, [id])

  // Create Module
  const onModuleSubmit = async (formData) => {
    try {
      await lmsService.createModule({ ...formData, courseId: id })
      toast.success('Module added!')
      setModuleModal(false)
      moduleForm.reset()
      loadCourse()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating module')
    }
  }

  // Create / Edit Lecture
  const openAddLecture = (moduleId = null) => {
    lectureForm.reset()
    lectureForm.setValue('module', moduleId || '')
    lectureForm.setValue('videoType', 'youtube')
    lectureForm.setValue('duration', '15 mins')
    setLectureModal({ open: true, data: null })
  }

  const openEditLecture = (lec) => {
    lectureForm.reset()
    lectureForm.setValue('title', lec.title)
    lectureForm.setValue('videoUrl', lec.videoUrl)
    lectureForm.setValue('videoType', lec.videoType)
    lectureForm.setValue('duration', lec.duration)
    lectureForm.setValue('module', lec.module?._id || lec.module || '')
    lectureForm.setValue('description', lec.description)
    setLectureModal({ open: true, data: lec })
  }

  const onLectureSubmit = async (formData) => {
    try {
      if (lectureModal.data) {
        await lmsService.updateLecture(lectureModal.data._id, formData)
        toast.success('Lecture updated!')
      } else {
        await lmsService.createLecture({ ...formData, course: id })
        toast.success('Lecture added!')
      }
      setLectureModal({ open: false, data: null })
      loadCourse()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving lecture')
    }
  }

  // Enroll Student
  const onEnrollSubmit = async (formData) => {
    try {
      await lmsService.enrollStudent(id, formData.studentId)
      toast.success('Student enrolled successfully!')
      setEnrollModal(false)
      loadCourse()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed')
    }
  }

  // Delete Action
  const handleDelete = async () => {
    try {
      if (confirmDelete.type === 'lecture') {
        await lmsService.deleteLecture(confirmDelete.id)
        toast.success('Lecture deleted')
      } else if (confirmDelete.type === 'module') {
        await lmsService.deleteModule(confirmDelete.id)
        toast.success('Module deleted')
      }
      setConfirmDelete(null)
      loadCourse()
    } catch {
      toast.error('Delete failed')
    }
  }

  if (loading) {
    return <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
  }

  const { course, modules = [], lectures = [], assignments = [] } = data || {}

  // Group lectures by module
  const moduleLecturesMap = {}
  modules.forEach((m) => {
    moduleLecturesMap[m._id] = lectures.filter((l) => (l.module?._id || l.module) === m._id)
  })
  const unassignedLectures = lectures.filter((l) => !l.module)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link to="/admin/lms/courses" className="text-gray-500 hover:text-gray-900 flex items-center gap-1.5 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to All Courses
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => setEnrollModal(true)} className="btn-secondary flex items-center gap-1.5 text-xs">
            <Users className="w-4 h-4" /> Enroll Student
          </button>
          <button onClick={() => setModuleModal(true)} className="btn-secondary flex items-center gap-1.5 text-xs">
            <FolderPlus className="w-4 h-4" /> Add Chapter / Module
          </button>
          <button onClick={() => openAddLecture()} className="btn-primary flex items-center gap-1.5 text-xs">
            <Plus className="w-4 h-4" /> Add Video Lecture
          </button>
        </div>
      </div>

      {/* Course Banner */}
      <div className="card p-6 flex flex-col md:flex-row gap-6 bg-gradient-to-r from-primary-900 to-indigo-900 text-white border-none">
        {course.thumbnail && (
          <img src={course.thumbnail} alt={course.title} className="w-full md:w-56 h-36 rounded-xl object-cover shadow-md" />
        )}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary-500/40 text-primary-200 uppercase tracking-wide">
              {course.category?.name || course.categoryName}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/20 text-white">
              {course.level}
            </span>
          </div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-xs text-primary-100 max-w-2xl line-clamp-2">{course.description}</p>
          <div className="flex items-center gap-6 pt-2 text-xs text-primary-200">
            <span>Instructor: <strong className="text-white">{course.teacher?.name}</strong></span>
            <span>Duration: <strong className="text-white">{course.duration}</strong></span>
            <span>Enrolled: <strong className="text-white">{course.enrolledStudents?.length || 0} students</strong></span>
            <span>Total Lectures: <strong className="text-white">{lectures.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Curriculum & Lectures Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Course Curriculum & Video Lectures</h2>

        {modules.length === 0 && unassignedLectures.length === 0 ? (
          <div className="card p-10 text-center text-gray-400">
            <PlayCircle className="w-10 h-10 mx-auto mb-2 opacity-30 text-primary-600" />
            <p className="font-semibold text-gray-700">No lectures uploaded yet</p>
            <p className="text-xs text-gray-400 mt-1">Start by adding a module or direct video lecture.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {modules.map((mod, idx) => {
              const modLectures = moduleLecturesMap[mod._id] || []
              return (
                <div key={mod._id} className="card p-0 overflow-hidden border border-gray-200">
                  <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{mod.title}</h3>
                      {mod.description && <p className="text-xs text-gray-500">{mod.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openAddLecture(mod._id)}
                        className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Lecture
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ type: 'module', id: mod._id })}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete Module"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {modLectures.length === 0 ? (
                      <p className="p-4 text-xs text-gray-400 italic">No lectures in this module yet.</p>
                    ) : (
                      modLectures.map((lec) => (
                        <div key={lec._id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50">
                          <div className="flex items-center gap-3">
                            <PlayCircle className="w-4 h-4 text-primary-600 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{lec.title}</p>
                              <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {lec.duration}</span>
                                <span className="uppercase text-[10px] font-bold text-gray-500">{lec.videoType}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditLecture(lec)}
                              className="p-1.5 text-gray-400 hover:text-primary-600 rounded"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ type: 'lecture', id: lec._id })}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}

            {/* Unassigned lectures */}
            {unassignedLectures.length > 0 && (
              <div className="card p-0 overflow-hidden border border-gray-200">
                <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900 text-sm">General Video Lectures</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {unassignedLectures.map((lec) => (
                    <div key={lec._id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50">
                      <div className="flex items-center gap-3">
                        <PlayCircle className="w-4 h-4 text-primary-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{lec.title}</p>
                          <span className="text-xs text-gray-400">{lec.duration}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditLecture(lec)} className="p-1.5 text-gray-400 hover:text-primary-600">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setConfirmDelete({ type: 'lecture', id: lec._id })} className="p-1.5 text-gray-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Module Modal */}
      <Modal isOpen={moduleModal} onClose={() => setModuleModal(false)} title="Add Chapter / Module">
        <form onSubmit={moduleForm.handleSubmit(onModuleSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Module Title *</label>
            <input
              {...moduleForm.register('title', { required: 'Title required' })}
              className="input-field"
              placeholder="e.g. Chapter 1: Introduction to Web Design"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea {...moduleForm.register('description')} className="input-field" placeholder="Brief outline of topics covered..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModuleModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Create Module</button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Lecture Modal */}
      <Modal
        isOpen={lectureModal.open}
        onClose={() => setLectureModal({ open: false, data: null })}
        title={lectureModal.data ? 'Edit Video Lecture' : 'Add Video Lecture'}
        size="md"
      >
        <form onSubmit={lectureForm.handleSubmit(onLectureSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lecture Title *</label>
            <input
              {...lectureForm.register('title', { required: 'Title required' })}
              className="input-field"
              placeholder="e.g. Installing React & Node.js"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Video Source Type</label>
            <select {...lectureForm.register('videoType')} className="input-field">
              <option value="youtube">YouTube Video Link</option>
              <option value="external">Direct MP4 / External Video URL</option>
              <option value="upload">Uploaded Video Link</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Video URL *</label>
            <input
              {...lectureForm.register('videoUrl', { required: 'Video URL required' })}
              className="input-field"
              placeholder="e.g. https://www.youtube.com/watch?v=..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Module / Chapter</label>
              <select {...lectureForm.register('module')} className="input-field">
                <option value="">None (General)</option>
                {modules.map((m) => (
                  <option key={m._id} value={m._id}>{m.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <input {...lectureForm.register('duration')} className="input-field" placeholder="e.g. 25 mins" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setLectureModal({ open: false, data: null })} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Lecture</button>
          </div>
        </form>
      </Modal>

      {/* Enroll Student Modal */}
      <Modal isOpen={enrollModal} onClose={() => setEnrollModal(false)} title="Enroll Student in Course">
        <form onSubmit={enrollForm.handleSubmit(onEnrollSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Student *</label>
            <select {...enrollForm.register('studentId', { required: 'Select student' })} className="input-field">
              <option value="">Select registered student</option>
              {students.map((st) => (
                <option key={st.user?._id || st._id} value={st.user?._id || st._id}>
                  {st.user?.name || st.name} ({st.user?.studentId || st.studentId || st.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setEnrollModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Enroll Student</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Content"
        message="Are you sure you want to delete this item? This action cannot be undone."
      />
    </div>
  )
}
