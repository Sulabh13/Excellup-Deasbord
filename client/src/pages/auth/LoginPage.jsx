import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, GraduationCap, BookOpen, Users, Award } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const user = await login(data)
      toast.success(`Welcome back, ${user.name}!`)
      const redirectMap = { admin: '/admin', teacher: '/teacher', student: '/student' }
      navigate(redirectMap[user.role] || '/login', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 flex-col justify-center px-12 py-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-xl">Excellup</h1>
            <p className="text-primary-200 text-sm">Coding Classes</p>
          </div>
        </div>
        <h2 className="text-white text-3xl font-bold mb-3 leading-tight">
          Empowering Education<br />Through Technology
        </h2>
        <p className="text-primary-200 text-base mb-10">
          A complete management system for Excellup Coding Classes, Balaghat, Madhya Pradesh.
        </p>
        <div className="space-y-4">
          {[
            { icon: BookOpen, title: 'Smart Study Materials', desc: 'Upload and access notes, PDFs, and video lectures' },
            { icon: Users, title: 'Complete Attendance', desc: 'Real-time attendance tracking with reports' },
            { icon: Award, title: 'Online Examinations', desc: 'Secure MCQ tests with instant results' },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-4 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p className="text-primary-200 text-xs mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 bg-[#F8FAFC]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Excellup Coding Classes</p>
              <p className="text-xs text-gray-500">Balaghat, Madhya Pradesh</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in to your account</h2>
          <p className="text-gray-500 text-sm mb-8">Use your email or Student ID to continue.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email or Student ID</label>
              <input
                type="text"
                {...register('identifier', { required: 'Email or Student ID is required' })}
                className="input-field"
                placeholder="admin@excellup.com or EXC-2024-001"
              />
              {errors.identifier && <p className="text-red-500 text-xs mt-1">{errors.identifier.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
                  className="input-field pr-10"
                  placeholder="Enter your password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-600" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 text-base">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-purple-50 rounded-xl border border-purple-100">
            <p className="text-xs font-semibold text-purple-700 mb-2">⚡ One-Click Demo Credentials</p>
            <div className="space-y-1.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  const elId = document.querySelector('input[type="text"]');
                  const elPw = document.querySelector('input[name="password"]');
                  if (elId) elId.value = 'admin@excellup.com';
                  if (elPw) elPw.value = 'Admin@123';
                }}
                className="w-full text-left p-1.5 rounded hover:bg-purple-100/70 text-purple-900 font-mono transition-colors"
              >
                🔑 <strong className="font-sans">Admin:</strong> admin@excellup.com / Admin@123
              </button>
              <button
                type="button"
                onClick={() => {
                  const elId = document.querySelector('input[type="text"]');
                  const elPw = document.querySelector('input[name="password"]');
                  if (elId) elId.value = 'teacher@excellup.com';
                  if (elPw) elPw.value = 'Teacher@123';
                }}
                className="w-full text-left p-1.5 rounded hover:bg-purple-100/70 text-purple-900 font-mono transition-colors"
              >
                👩‍🏫 <strong className="font-sans">Teacher:</strong> teacher@excellup.com / Teacher@123
              </button>
              <button
                type="button"
                onClick={() => {
                  const elId = document.querySelector('input[type="text"]');
                  const elPw = document.querySelector('input[name="password"]');
                  if (elId) elId.value = 'student@excellup.com';
                  if (elPw) elPw.value = 'Student@123';
                }}
                className="w-full text-left p-1.5 rounded hover:bg-purple-100/70 text-purple-900 font-mono transition-colors"
              >
                🎓 <strong className="font-sans">Student:</strong> student@excellup.com / Student@123
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            © 2024 Excellup Coding Classes, Balaghat, MP
          </p>
        </div>
      </div>
    </div>
  )
}

