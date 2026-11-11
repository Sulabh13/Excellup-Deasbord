import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { authService } from '../../services'
import { GraduationCap, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await authService.forgotPassword(data.email)
      setSent(true)
      toast.success('Reset link sent to your email!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-primary-100 rounded-2xl items-center justify-center mb-4">
            <GraduationCap className="w-7 h-7 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
          <p className="text-gray-500 text-sm mt-1">Enter your email to receive a reset link</p>
        </div>
        <div className="card">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✉️</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Check your email</h3>
              <p className="text-gray-500 text-sm mb-6">We sent a password reset link. It expires in 10 minutes.</p>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2"><ArrowLeft className="w-4 h-4" />Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <input type="email" {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } })}
                  className="input-field" placeholder="your@email.com" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <button type="submit" disabled={loading} className="w-full btn-primary py-2.5">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-4 h-4" />Back to Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

