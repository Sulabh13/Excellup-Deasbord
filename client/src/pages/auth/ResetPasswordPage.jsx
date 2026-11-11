import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { authService } from '../../services'
import { GraduationCap, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState({ pass: false, confirm: false })
  const { register, handleSubmit, watch, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await authService.resetPassword(token, data.password)
      toast.success('Password reset successfully!')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may be expired.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-primary-100 rounded-2xl items-center justify-center mb-4">
            <GraduationCap className="w-7 h-7 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          <p className="text-gray-500 text-sm mt-1">Create a new secure password</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
              <div className="relative">
                <input type={show.pass ? 'text' : 'password'} {...register('password', { required: 'Password required', minLength: { value: 6, message: 'Min 6 chars' } })} className="input-field pr-10" placeholder="New password" />
                <button type="button" onClick={() => setShow(s => ({ ...s, pass: !s.pass }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {show.pass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input type={show.confirm ? 'text' : 'password'} {...register('confirmPassword', { required: 'Please confirm', validate: v => v === watch('password') || 'Passwords do not match' })} className="input-field pr-10" placeholder="Confirm password" />
                <button type="button" onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary py-2.5">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <Link to="/login" className="block text-center text-sm text-gray-500 hover:text-gray-700">Back to Login</Link>
          </form>
        </div>
      </div>
    </div>
  )
}

