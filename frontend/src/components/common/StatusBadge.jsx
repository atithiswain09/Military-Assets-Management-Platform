import React from 'react';
import { cn, getStatusColor } from '../../utils/helpers';

const StatusBadge = ({ status, size = 'sm', className = '' }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        size === 'xs' && 'px-2 py-0.5 text-2xs',
        size === 'sm' && 'px-2.5 py-0.5 text-xs',
        size === 'md' && 'px-3 py-1 text-sm',
        getStatusColor(status),
        className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full mr-1.5',
          status === 'Active' && 'bg-emerald-500',
          status === 'Assigned' && 'bg-blue-500',
          status === 'In Storage' && 'bg-slate-400',
          status === 'In Transit' && 'bg-amber-500',
          status === 'Maintenance' && 'bg-orange-500',
          status === 'Retired' && 'bg-red-500',
          status === 'Pending' && 'bg-yellow-500',
          status === 'Approved' && 'bg-emerald-500',
          status === 'Completed' && 'bg-blue-500',
          status === 'Cancelled' && 'bg-red-400',
          status === 'Received' && 'bg-emerald-500',
          status === 'Returned' && 'bg-slate-400',
          status === 'Overdue' && 'bg-red-500',
          status === 'Rejected' && 'bg-red-400',
          status === 'Paid' && 'bg-emerald-500',
          status === 'Decommissioned' && 'bg-gray-400'
        )}
      />
      {status}
    </span>
  );
};

export default StatusBadge;
