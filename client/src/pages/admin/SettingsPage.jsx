import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services'
import { useForm } from 'react-hook-form'
import { User, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

const tabs = ['Profile', 'Security']

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState(0)
  const { register: regProfile, handleSubmit: hsProfile } = useForm({ defaultValues: { name: user?.name, email: user?.email } })
  const { register: regPwd, handleSubmit: hsPwd, reset: resetPwd, watch } = useForm()

  const onProfile = async (data) => {
    try {
      toast.success('Profile updated!')
    } catch { toast.error('Failed') }
  }

  const onPassword = async (data) => {
    try {
      await authService.changePassword({ currentPassword: data.current, newPassword: data.newPass })
      toast.success('Password changed!'); resetPwd()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <div className="flex border-b border-gray-200">
        {tabs.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${i === activeTab ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {i === 0 ? <User className="w-4 h-4" /> : <Lock className="w-4 h-4" />} {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="card max-w-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Admin Profile</h3>
          <form onSubmit={hsProfile(onProfile)} className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold">{user?.name?.[0]}</div>
              <div>
                <p className="font-semibold text-gray-900">{user?.name}</p>
                <p className="text-gray-500 text-sm">{user?.role}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input {...regProfile('name')} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input {...regProfile('email')} className="input-field" disabled />
            </div>
            <button type="submit" className="btn-primary">Save Changes</button>
          </form>
        </div>
      )}

      {activeTab === 1 && (
        <div className="card max-w-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Change Password</h3>
          <form onSubmit={hsPwd(onPassword)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" {...regPwd('current', { required: 'Required' })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" {...regPwd('newPass', { required: 'Required', minLength: { value: 6, message: 'Min 6 chars' } })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" {...regPwd('confirm', { validate: v => v === watch('newPass') || 'Passwords must match' })} className="input-field" />
            </div>
            <button type="submit" className="btn-primary">Change Password</button>
          </form>
        </div>
      )}
    </div>
  )
}

