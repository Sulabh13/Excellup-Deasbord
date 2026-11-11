import { useRef, useState } from 'react'
import { Upload, X, FileText, Image, Film } from 'lucide-react'

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileIcon = (type) => {
  if (type.startsWith('image/')) return Image
  if (type.startsWith('video/')) return Film
  return FileText
}

const FileUpload = ({
  accept = '*',
  maxSize = 10 * 1024 * 1024, // 10MB default
  onFileSelect,
  multiple = false,
}) => {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState([])
  const [error, setError] = useState('')

  const validateFiles = (fileList) => {
    const valid = []
    const errors = []
    Array.from(fileList).forEach((file) => {
      if (file.size > maxSize) {
        errors.push(`${file.name}: File too large (max ${formatBytes(maxSize)})`)
      } else {
        valid.push(file)
      }
    })
    return { valid, errors }
  }

  const handleFiles = (fileList) => {
    setError('')
    const { valid, errors } = validateFiles(fileList)
    if (errors.length) {
      setError(errors.join(', '))
      return
    }
    setFiles(multiple ? valid : [valid[0]])
    onFileSelect && onFileSelect(multiple ? valid : valid[0])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleInputChange = (e) => {
    if (e.target.files.length) handleFiles(e.target.files)
  }

  const removeFile = (idx) => {
    const updated = files.filter((_, i) => i !== idx)
    setFiles(updated)
    onFileSelect && onFileSelect(multiple ? updated : null)
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
          dragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-200 bg-gray-50 hover:border-primary-400 hover:bg-primary-50'
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
          <Upload className="w-6 h-6 text-primary-600" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">
            Drag & drop or <span className="text-primary-600">browse</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Max size: {formatBytes(maxSize)} · {accept !== '*' ? accept : 'All files'}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, idx) => {
            const FileIcon = getFileIcon(file.type)
            return (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
              >
                <FileIcon className="w-5 h-5 text-primary-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeFile(idx) }}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default FileUpload
