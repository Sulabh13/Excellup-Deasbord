import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

const SearchInput = ({ value, onChange, placeholder = 'Search...', className = '' }) => {
  const [localValue, setLocalValue] = useState(value || '')
  const debounceRef = useRef(null)

  useEffect(() => {
    setLocalValue(value || '')
  }, [value])

  const handleChange = (e) => {
    const val = e.target.value
    setLocalValue(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onChange(val)
    }, 300)
  }

  const handleClear = () => {
    setLocalValue('')
    clearTimeout(debounceRef.current)
    onChange('')
  }

  useEffect(() => {
    return () => clearTimeout(debounceRef.current)
  }, [])

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white placeholder-gray-400"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export default SearchInput
