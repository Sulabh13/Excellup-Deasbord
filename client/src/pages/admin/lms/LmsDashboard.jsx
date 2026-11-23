import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { lmsService } from '../../../services'
import {
  BookOpen, Users, Video, Award, CheckCircle, Plus,
  ArrowRight, PlayCircle, FileText, Layers, TrendingUp
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function LmsDashboard() {
  const [stats, setStats] = useState(null)
  const [recentCourses, setRecentCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, coursesRes] = await Promise.all([
          lmsService.getStats(),
          lmsService.getAllCourses({ limit: 4 }),
        ])
        setStats(statsRes.data.data)
        setRecentCourses(coursesRes.data.data.courses || [])
      } catch {
        toast.error('Failed to load LMS statistics')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Online Courses', value: stats?.totalCourses || 0, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Enrolled Students', value: stats?.totalEnrolledStudents || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Video Lectures', value: stats?.totalLectures || 0, icon: Video, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Avg Course Completion', value: `${stats?.avgCompletion || 0}%`, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Online Learning Management (LMS)</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage online video courses, chapters, lectures, and assignments</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/lms/courses/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Course
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c, i) => (
          <div key={i} className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center ${c.color} flex-shrink-0`}>
              <c.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{c.label}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{c.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/lms/courses" className="card p-5 hover:border-primary-300 transition-all group flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">Course Management</h4>
            <p className="text-xs text-gray-500 mt-1">Publish, edit video lectures, pricing, and assigned teachers.</p>
          </div>
        </Link>
        <Link to="/admin/lms/assignments" className="card p-5 hover:border-primary-300 transition-all group flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Online Assignments</h4>
            <p className="text-xs text-gray-500 mt-1">Review student task submissions, grade marks, and give feedback.</p>
          </div>
        </Link>
        <Link to="/admin/lms/categories" className="card p-5 hover:border-primary-300 transition-all group flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">Categories & Topics</h4>
            <p className="text-xs text-gray-500 mt-1">Organize curriculum domains: Web Dev, Python, Data Science.</p>
          </div>
        </Link>
      </div>

      {/* Recent Courses List */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-lg">Active Online Courses</h3>
          <Link to="/admin/lms/courses" className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
            View All Courses <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentCourses.map((course) => (
            <Link
              key={course._id}
              to={`/admin/lms/courses/${course._id}`}
              className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all group flex flex-col bg-white"
            >
              <div className="h-36 bg-gray-100 relative overflow-hidden">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 font-bold">
                    <PlayCircle className="w-10 h-10" />
                  </div>
                )}
                <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-gray-800 shadow-sm">
                  {course.level}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-primary-600 uppercase tracking-wide">
                    {course.category?.name || course.categoryName}
                  </span>
                  <h4 className="font-bold text-gray-900 text-sm mt-1 line-clamp-2 leading-snug group-hover:text-primary-600 transition-colors">
                    {course.title}
                  </h4>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                  <span>{course.duration}</span>
                  <span className="font-bold text-gray-900">
                    {course.price > 0 ? `₹${course.price.toLocaleString('en-IN')}` : 'Free'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
