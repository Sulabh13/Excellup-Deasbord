import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { lmsService } from '../../services'
import {
  BookOpen, PlayCircle, Clock, CheckCircle, Award,
  ArrowRight, Video
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function StudentLearningPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    lmsService.getMyLearning()
      .then((res) => {
        setCourses(res.data.data || [])
      })
      .catch(() => toast.error('Failed to load enrolled courses'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Learning</h1>
          <p className="text-gray-500 text-sm">Access your enrolled online courses, resume lectures, and track completion</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-primary-500" />
          <h3 className="text-base font-semibold text-gray-700">No online courses enrolled</h3>
          <p className="text-sm text-gray-400 mt-1">Contact your institute coordinator to get access to online curriculum.</p>
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
                <div className="absolute top-3 right-3 bg-black/60 text-white font-bold text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                  {course.level}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">
                    {course.category?.name || course.categoryName}
                  </span>
                  <h3 className="font-bold text-gray-900 text-base mt-1 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Instructor: {course.teacher?.name}</p>
                </div>

                {/* Course Completion Progress Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">Course Progress</span>
                    <span className="font-bold text-primary-700">{course.progressPercent || 0}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-600 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${course.progressPercent || 0}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">
                    {course.completedLectures || 0} of {course.totalLectures || 0} lectures completed
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    to={`/student/learning/${course._id}`}
                    className="w-full btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <PlayCircle className="w-4 h-4" /> Continue Learning
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
