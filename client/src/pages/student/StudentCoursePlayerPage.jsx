import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { lmsService } from '../../services'
import {
  ArrowLeft, CheckCircle, PlayCircle, Clock, ChevronRight,
  ChevronLeft, Award, FileText, Download, CheckCircle2
} from 'lucide-react'
import toast from 'react-hot-toast'

// Helper to extract YouTube video embed URL
const getEmbedUrl = (url) => {
  if (!url) return ''
  if (url.includes('youtube.com/embed/')) return url
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11
    ? `https://www.youtube.com/embed/${match[2]}?autoplay=0&rel=0`
    : url
}

export default function StudentCoursePlayerPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [activeLecture, setActiveLecture] = useState(null)
  const [completedIds, setCompletedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  const loadCourse = async () => {
    try {
      const res = await lmsService.getCourseById(id)
      const payload = res.data.data
      setData(payload)
      const compSet = new Set(payload.completedLectureIds || [])
      setCompletedIds(compSet)

      if (payload.lectures?.length > 0) {
        // Find first incomplete lecture, or default to first
        const firstIncomplete = payload.lectures.find((l) => !compSet.has(l._id))
        setActiveLecture(firstIncomplete || payload.lectures[0])
      }
    } catch {
      toast.error('Failed to load course player')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCourse()
  }, [id])

  const handleMarkComplete = async (lectureId) => {
    const isAlready = completedIds.has(lectureId)
    const nextState = !isAlready

    try {
      await lmsService.updateProgress(lectureId, {
        isCompleted: nextState,
        lastWatchedTime: 0,
      })

      const updated = new Set(completedIds)
      if (nextState) {
        updated.add(lectureId)
        toast.success('Lecture marked as completed!')
      } else {
        updated.delete(lectureId)
      }
      setCompletedIds(updated)
    } catch {
      toast.error('Failed to update progress')
    }
  }

  if (loading) {
    return <div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
  }

  const { course, modules = [], lectures = [], assignments = [] } = data || {}
  const totalLectures = lectures.length
  const completedCount = completedIds.size
  const progressPercent = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0

  // Prev / Next calculation
  const currentIndex = lectures.findIndex((l) => l._id === activeLecture?._id)
  const prevLecture = currentIndex > 0 ? lectures[currentIndex - 1] : null
  const nextLecture = currentIndex < lectures.length - 1 ? lectures[currentIndex + 1] : null

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link to="/student/learning" className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-xs font-semibold">
          <ArrowLeft className="w-4 h-4" /> My Enrolled Courses
        </Link>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-500">Progress: <strong>{completedCount}/{totalLectures} ({progressPercent}%)</strong></span>
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      {/* Main Learning Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Video Player & Controls */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-0 overflow-hidden bg-black rounded-2xl aspect-video relative flex items-center justify-center">
            {activeLecture?.videoUrl ? (
              activeLecture.videoType === 'youtube' || activeLecture.videoUrl.includes('youtu') ? (
                <iframe
                  src={getEmbedUrl(activeLecture.videoUrl)}
                  title={activeLecture.title}
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={activeLecture.videoUrl}
                  controls
                  className="w-full h-full object-contain"
                  poster={activeLecture.thumbnail}
                />
              )
            ) : (
              <p className="text-gray-400 text-sm">Select a lecture from the curriculum sidebar to start watching.</p>
            )}
          </div>

          {/* Lecture Info & Navigation Controls */}
          {activeLecture && (
            <div className="card p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wide">
                    {course?.title}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 mt-0.5">{activeLecture.title}</h2>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Duration: {activeLecture.duration}
                  </p>
                </div>
                <button
                  onClick={() => handleMarkComplete(activeLecture._id)}
                  className={`btn py-2 px-4 text-xs font-bold flex items-center gap-2 self-start ${
                    completedIds.has(activeLecture._id)
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'btn-primary'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {completedIds.has(activeLecture._id) ? 'Completed ✓' : 'Mark as Completed'}
                </button>
              </div>

              {/* Description */}
              {activeLecture.description && (
                <p className="text-xs text-gray-600 leading-relaxed">{activeLecture.description}</p>
              )}

              {/* Prev / Next Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  disabled={!prevLecture}
                  onClick={() => setActiveLecture(prevLecture)}
                  className="btn-secondary py-2 text-xs flex items-center gap-1 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous Lecture
                </button>
                <button
                  disabled={!nextLecture}
                  onClick={() => setActiveLecture(nextLecture)}
                  className="btn-primary py-2 text-xs flex items-center gap-1 disabled:opacity-40"
                >
                  Next Lecture <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Course Curriculum Playlist */}
        <div className="space-y-4">
          <div className="card p-4 space-y-3">
            <h3 className="font-bold text-gray-900 text-sm">Course Curriculum</h3>
            <p className="text-xs text-gray-400">{totalLectures} video lessons in this course</p>

            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {lectures.map((lec, idx) => {
                const isActive = activeLecture?._id === lec._id
                const isCompleted = completedIds.has(lec._id)
                return (
                  <div
                    key={lec._id}
                    onClick={() => setActiveLecture(lec)}
                    className={`p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 my-1 ${
                      isActive
                        ? 'bg-primary-50 border border-primary-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <PlayCircle className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold leading-tight line-clamp-2 ${isActive ? 'text-primary-900 font-bold' : 'text-gray-800'}`}>
                        {idx + 1}. {lec.title}
                      </p>
                      <span className="text-[10px] text-gray-400 mt-1 block">{lec.duration}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
