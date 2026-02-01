import React from 'react';

export interface StatusBadgeProps {
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'online' | 'offline';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    in_progress: { color: 'bg-blue-100 text-blue-800', label: 'In Progress' },
    completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
    cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' },
    online: { color: 'bg-green-100 text-green-800', label: 'Online' },
    offline: { color: 'bg-red-100 text-red-800', label: 'Offline' }
  };

  const config = statusConfig[status];
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.color} ${sizeStyles}`}>
      {config.label}
    </span>
  );
};
