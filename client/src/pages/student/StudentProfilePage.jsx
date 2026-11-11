import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useState } from 'react'

export default function StudentProfilePage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('profile')
  const { register, handleSubmit, reset, watch } = useForm()

  const onPassword = async (data) => {
    try {
      await authService.changePassword({ currentPassword: data.current, newPassword: data.newPass })
      toast.success('Password changed!'); reset()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
      <div className="flex border-b border-gray-200">
        {['profile', 'password'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'}`}>
            {t === 'profile' ? 'Profile Details' : 'Change Password'}
          </button>
        ))}
      </div>
      {tab === 'profile' && (
        <div className="card">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-2xl font-bold">{user?.name?.[0]}</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-gray-500 text-sm font-mono">{user?.studentId}</p>
              <span className="badge badge-green mt-1">Student</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[['Name', user?.name], ['Email', user?.email], ['Student ID', user?.studentId || '—'], ['Role', 'Student']].map(([k, v]) => (
              <div key={k} className="bg-gray-50 rounded-xl p-4"><p className="text-xs text-gray-400">{k}</p><p className="font-medium text-gray-900 mt-1">{v}</p></div>
            ))}
          </div>
        </div>
      )}
      {tab === 'password' && (
        <div className="card max-w-md">
          <form onSubmit={handleSubmit(onPassword)} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label><input type="password" {...register('current', { required: true })} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">New Password</label><input type="password" {...register('newPass', { required: true, minLength: 6 })} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label><input type="password" {...register('confirm', { validate: v => v === watch('newPass') || 'Must match' })} className="input-field" /></div>
            <button type="submit" className="btn-primary">Change Password</button>
          </form>
        </div>
      )}
    </div>
  )
}

