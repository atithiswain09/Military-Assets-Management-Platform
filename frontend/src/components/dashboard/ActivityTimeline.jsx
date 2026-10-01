import React from 'react';
import { formatDateTime } from '../../utils/formatters';
import { getActionColor } from '../../utils/helpers';

const ActivityTimeline = ({ activities = [] }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-sm font-semibold text-slate-700">Recent Activity</h3>
      </div>
      <div className="px-5 py-4">
        {activities.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-2">No recent activity found.</p>
        ) : (
          <div className="space-y-0">
            {activities.slice(0, 8).map((activity, idx) => (
              <div key={activity.id} className="flex gap-3 pb-4 last:pb-0">
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${getActionColor(activity.action)}`} />
                  {idx < activities.length - 1 && (
                    <div className="w-px flex-1 bg-slate-200 mt-1" />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 pb-1">
                  <p className="text-sm font-medium text-slate-800">{activity.action}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{activity.details}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDateTime(activity.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
