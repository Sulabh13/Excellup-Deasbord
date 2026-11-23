import { useState, useEffect } from 'react'
import { lmsService } from '../../../services'
import Modal from '../../../components/ui/Modal'
import { useForm } from 'react-hook-form'
import { Plus, Layers, Code, Terminal, Database, Cpu } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CourseCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const { register, handleSubmit, reset } = useForm()

  const loadCategories = async () => {
    setLoading(true)
    try {
      const res = await lmsService.getCategories()
      setCategories(res.data.data || [])
    } catch {
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const onSubmit = async (data) => {
    try {
      await lmsService.createCategory(data)
      toast.success('Category created!')
      setModalOpen(false)
      reset()
      loadCategories()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating category')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Categories</h1>
          <p className="text-gray-500 text-sm">Organize courses by subject and curriculum domain</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-2 self-start">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div key={cat._id} className="card p-5 hover:shadow-md transition-shadow flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{cat.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{cat.description || 'No description'}</p>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Course Category">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
            <input {...register('name', { required: true })} className="input-field" placeholder="e.g. Artificial Intelligence" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea {...register('description')} className="input-field" placeholder="Category description..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Category</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
