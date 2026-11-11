import { TrendingUp, TrendingDown } from 'lucide-react'

const colorMap = {
  purple: {
    icon: 'bg-purple-100 text-purple-600',
    change: { positive: 'text-green-600', negative: 'text-red-500' },
  },
  blue: {
    icon: 'bg-blue-100 text-blue-600',
    change: { positive: 'text-green-600', negative: 'text-red-500' },
  },
  green: {
    icon: 'bg-green-100 text-green-600',
    change: { positive: 'text-green-600', negative: 'text-red-500' },
  },
  orange: {
    icon: 'bg-orange-100 text-orange-600',
    change: { positive: 'text-green-600', negative: 'text-red-500' },
  },
  red: {
    icon: 'bg-red-100 text-red-600',
    change: { positive: 'text-green-600', negative: 'text-red-500' },
  },
  indigo: {
    icon: 'bg-indigo-100 text-indigo-600',
    change: { positive: 'text-green-600', negative: 'text-red-500' },
  },
}

const StatsCard = ({ title, value, icon: Icon, color = 'purple', change, bgColor }) => {
  const colors = colorMap[color] || colorMap.purple
  const isPositive = typeof change === 'number' ? change >= 0 : true

  return (
    <div
      className={`rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow ${
        bgColor || 'bg-white'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
        </div>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors.icon}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {change !== undefined && change !== null && (
        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            isPositive ? colors.change.positive : colors.change.negative
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>
            {isPositive ? '+' : ''}
            {change}% from last month
          </span>
        </div>
      )}
    </div>
  )
}

export default StatsCard
