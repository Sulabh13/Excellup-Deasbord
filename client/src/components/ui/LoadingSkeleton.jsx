const LoadingSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="animate-pulse">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded flex-1" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="flex gap-4 px-6 py-4 border-b border-gray-50 last:border-b-0"
          >
            {Array.from({ length: cols }).map((_, colIdx) => (
              <div
                key={colIdx}
                className={`h-4 bg-gray-100 rounded flex-1 ${colIdx === 0 ? 'max-w-[80px]' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default LoadingSkeleton
