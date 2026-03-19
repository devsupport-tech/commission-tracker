import { TrendingUp, TrendingDown } from 'lucide-react';

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default'
}) {
  const valueColors = {
    default: 'text-gray-900',
    success: 'text-green-500',
    danger: 'text-red-500',
    warning: 'text-orange-500',
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={`text-3xl font-semibold mt-2 ${valueColors[variant]}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="text-gray-400">
              <Icon className="w-5 h-5" />
            </div>
          )}
          {trend === 'up' && <TrendingUp className="w-5 h-5 text-green-500" />}
          {trend === 'down' && <TrendingDown className="w-5 h-5 text-red-500" />}
        </div>
      </div>
    </div>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-b border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, icon: Icon }) {
  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-5 h-5 text-gray-400" />}
      <h3 className="font-semibold text-gray-900">{children}</h3>
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}
