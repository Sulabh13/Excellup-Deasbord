import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { lmsService } from '../../services'
import { BookOpen, Video, PlayCircle, Plus, Users, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TeacherOnlineCoursesPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    lmsService.getAllCourses({ teacher: 'me' })
      .then((res) => {
        setCourses(res.data.data.courses || [])
      })
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Online Courses</h1>
          <p className="text-gray-500 text-sm">Upload video lectures, course chapters, and materials for your assigned courses</p>
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
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-500" />
          <h3 className="text-base font-semibold text-gray-700">No online courses assigned</h3>
          <p className="text-sm text-gray-400 mt-1">Once the administrator assigns online courses to you, they will appear here.</p>
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
                  <div className="w-full h-full flex items-center justify-center bg-blue-900/60 text-white font-bold">
                    <Video className="w-12 h-12 text-blue-400" />
                  </div>
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white uppercase tracking-wider">
                    {course.status}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-sm">
                    {course.level}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                    {course.category?.name || course.categoryName}
                  </span>
                  <h3 className="text-base font-bold text-gray-900 mt-1 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {course.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1 font-medium">
                    <Users className="w-3.5 h-3.5" /> {course.enrolledStudents?.length || 0} enrolled
                  </span>
                  <span>{course.duration}</span>
                </div>

                <div className="pt-2">
                  <Link
                    to={`/admin/lms/courses/${course._id}`}
                    className="w-full btn-primary py-2 text-xs flex items-center justify-center gap-1.5"
                  >
                    <PlayCircle className="w-3.5 h-3.5" /> Manage Chapters & Videos
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
