import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { lmsService, teacherService, batchService } from '../../../services'
import Modal from '../../../components/ui/Modal'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import SearchInput from '../../../components/ui/SearchInput'
import { useForm } from 'react-hook-form'
import {
  Plus, Pencil, Trash2, Eye, PlayCircle, BookOpen,
  Users, CheckCircle2, Video
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AllCoursesPage() {
  const [courses, setCourses] = useState([])
  const [categories, setCategories] = useState([])
  const [teachers, setTeachers] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [modal, setModal] = useState({ open: false, mode: 'create', data: null })
  const [confirmDelete, setConfirmDelete] = useState(null)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const [cRes, catRes, tRes, bRes] = await Promise.all([
        lmsService.getAllCourses({ search, category: categoryFilter, level: levelFilter }),
        lmsService.getCategories(),
        teacherService.getAll(),
        batchService.getAll(),
      ])
      setCourses(cRes.data.data.courses || [])
      setCategories(catRes.data.data || [])
      setTeachers(tRes.data.data?.teachers || tRes.data.data || [])
      setBatches(bRes.data.data || [])
    } catch {
      toast.error('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [search, categoryFilter, levelFilter])

  const openCreate = () => {
    reset()
    setValue('status', 'published')
    setValue('level', 'Beginner')
    setValue('duration', '20 hours')
    setValue('price', 0)
    setModal({ open: true, mode: 'create', data: null })
  }

  const openEdit = (course) => {
    reset()
    setValue('title', course.title)
    setValue('description', course.description)
    setValue('thumbnail', course.thumbnail)
    setValue('category', course.category?._id || course.category)
    setValue('level', course.level)
    setValue('teacher', course.teacher?._id || course.teacher)
    setValue('duration', course.duration)
    setValue('price', course.price)
    setValue('status', course.status)
    setModal({ open: true, mode: 'edit', data: course })
  }

  const onSubmit = async (data) => {
    try {
      if (modal.mode === 'create') {
        await lmsService.createCourse(data)
        toast.success('Course created successfully!')
      } else {
        await lmsService.updateCourse(modal.data._id, data)
        toast.success('Course updated successfully!')
      }
      setModal({ open: false, mode: 'create', data: null })
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save course')
    }
  }

  const handleDelete = async () => {
    try {
      await lmsService.deleteCourse(confirmDelete)
      toast.success('Course deleted')
      setConfirmDelete(null)
      loadData()
    } catch {
      toast.error('Failed to delete course')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Online Courses</h1>
          <p className="text-gray-500 text-sm">{courses.length} total online video courses</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Add New Course
        </button>
      </div>

      {/* Filters Bar */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search courses by title..." />
        </div>
        <select
          className="input-field w-auto"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <select
          className="input-field w-auto"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
        >
          <option value="">All Levels</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </div>

      {/* Course Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary-500" />
          <h3 className="text-base font-semibold text-gray-700">No online courses found</h3>
          <p className="text-sm text-gray-400 mt-1">Get started by creating your first online video course.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course._id}
              className="card p-0 overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 border border-gray-100 group"
            >
              <div className="h-44 bg-gray-900 relative overflow-hidden">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary-900/60 text-white font-bold">
                    <Video className="w-12 h-12 text-primary-400" />
                  </div>
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider text-white ${course.status === 'published' ? 'bg-emerald-600' : 'bg-amber-600'}`}>
                    {course.status}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-sm">
                    {course.level}
                  </span>
                </div>
                <div className="absolute bottom-3 right-3 bg-white/95 text-gray-900 font-extrabold text-xs px-2.5 py-1 rounded-lg shadow">
                  {course.price > 0 ? `₹${course.price.toLocaleString('en-IN')}` : 'FREE'}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[11px] font-bold text-primary-600 uppercase tracking-wider">
                    {course.category?.name || course.categoryName}
                  </span>
                  <h3 className="text-base font-bold text-gray-900 mt-1 line-clamp-2 hover:text-primary-600 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {course.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-[10px]">
                      {course.teacher?.name?.[0] || 'T'}
                    </div>
                    <span className="font-medium text-gray-700">{course.teacher?.name || 'Instructor'}</span>
                  </div>
                  <span>{course.duration}</span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Link
                    to={`/admin/lms/courses/${course._id}`}
                    className="flex-1 btn-primary py-2 text-xs flex items-center justify-center gap-1.5"
                  >
                    <PlayCircle className="w-3.5 h-3.5" /> Manage Lectures
                  </Link>
                  <button
                    onClick={() => openEdit(course)}
                    className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-gray-200"
                    title="Edit Course"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(course._id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-gray-200"
                    title="Delete Course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Course Modal */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, mode: 'create', data: null })}
        title={modal.mode === 'create' ? 'Create New Online Course' : 'Edit Course Details'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Title *</label>
              <input
                {...register('title', { required: 'Course title is required' })}
                className="input-field"
                placeholder="e.g. Complete Full Stack MERN Bootcamp 2026"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Description</label>
              <textarea
                {...register('description')}
                className="input-field min-h-[80px]"
                placeholder="What students will learn in this course..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select {...register('category')} className="input-field">
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Level</label>
                <select {...register('level')} className="input-field">
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="All Levels">All Levels</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Teacher</label>
                <select {...register('teacher')} className="input-field">
                  <option value="">Select Teacher</option>
                  {teachers.map((t) => (
                    <option key={t.user?._id || t._id} value={t.user?._id || t._id}>
                      {t.user?.name || t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input {...register('duration')} className="input-field" placeholder="e.g. 30 hours" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹, 0 for Free)</label>
                <input type="number" {...register('price')} className="input-field" placeholder="0" min="0" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail Image URL</label>
                <input {...register('thumbnail')} className="input-field" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Status</label>
                <select {...register('status')} className="input-field">
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setModal({ open: false, mode: 'create', data: null })}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              {modal.mode === 'create' ? 'Create Course' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Online Course"
        message="Are you sure you want to delete this course? All associated modules, lectures, and student progress will be permanently deleted."
      />
    </div>
  )
}
