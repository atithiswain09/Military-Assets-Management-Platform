import React from 'react';
import { cn } from '../../utils/helpers';

const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendLabel, onClick, color = 'navy' }) => {
  const colorClasses = {
    navy: 'bg-navy-50 text-navy-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    violet: 'bg-violet-50 text-violet-600',
    slate: 'bg-slate-100 text-slate-600',
    sky: 'bg-sky-50 text-sky-600',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'card p-5 transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:border-slate-300'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'text-xs font-semibold',
                  trend >= 0 ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
              {trendLabel && (
                <span className="text-xs text-slate-400">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', colorClasses[color])}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
