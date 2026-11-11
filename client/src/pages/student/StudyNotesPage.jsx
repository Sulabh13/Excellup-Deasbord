import { useState, useEffect, useCallback } from 'react'
import { materialService, subjectService } from '../../services'
import SearchInput from '../../components/ui/SearchInput'
import { FileText, Video, Download, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StudyNotesPage() {
  const [materials, setMaterials] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subjectId, setSubjectId] = useState('')

  const fetchMaterials = useCallback(async () => {
    setLoading(true)
    try { const r = await materialService.getAll({ subjectId, search }); setMaterials(r.data.data || []) }
    catch { toast.error('Failed') }
    finally { setLoading(false) }
  }, [subjectId, search])

  useEffect(() => { fetchMaterials() }, [fetchMaterials])
  useEffect(() => { subjectService.getAll().then(r => setSubjects(r.data.data || [])) }, [])

  const fileTypeIcon = (m) => m.videoUrl && !m.fileUrl
    ? <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0"><Video className="w-5 h-5 text-red-500" /></div>
    : <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5 text-blue-500" /></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">Study Materials</h1>
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1"><SearchInput value={search} onChange={setSearch} placeholder="Search by title, topic..." /></div>
          <select className="input-field w-auto" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="card skeleton h-32" />)}</div>
      ) : materials.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No study materials available yet</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map(m => (
            <div key={m._id} className="card hover:shadow-card-hover transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                {fileTypeIcon(m)}
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{m.title}</h3>
                  <p className="text-xs text-gray-400">{m.subject?.name}</p>
                </div>
              </div>
              {m.topic && <p className="text-xs text-gray-500 mb-1">📌 {m.topic}{m.chapter ? ` • ${m.chapter}` : ''}</p>}
              {m.description && <p className="text-xs text-gray-400 line-clamp-2 mb-3">{m.description}</p>}
              {m.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {m.tags.slice(0, 3).map(tag => <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">{tag}</span>)}
                </div>
              )}
              <div className="flex gap-2 mt-auto pt-2 border-t border-gray-50">
                {m.fileUrl && (
                  <a href={m.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium">
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                )}
                {m.videoUrl && (
                  <a href={m.videoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium">
                    <ExternalLink className="w-3.5 h-3.5" /> Watch Video
                  </a>
                )}
              </div>
              <p className="text-xs text-gray-300 mt-2">{new Date(m.createdAt).toLocaleDateString('en-IN')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

