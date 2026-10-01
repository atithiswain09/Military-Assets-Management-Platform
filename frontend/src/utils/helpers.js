// General helper functions

/**
 * Classname concatenation helper — merges conditional classes
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Debounce function for search inputs
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

/**
 * Get status color classes
 */
export const getStatusColor = (status) => {
  const colors = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Assigned: 'bg-blue-50 text-blue-700 border-blue-200',
    'In Storage': 'bg-slate-50 text-slate-600 border-slate-200',
    'In Transit': 'bg-amber-50 text-amber-700 border-amber-200',
    Maintenance: 'bg-orange-50 text-orange-700 border-orange-200',
    Retired: 'bg-red-50 text-red-700 border-red-200',
    Decommissioned: 'bg-gray-100 text-gray-500 border-gray-200',
    Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Completed: 'bg-blue-50 text-blue-700 border-blue-200',
    Cancelled: 'bg-red-50 text-red-600 border-red-200',
    Received: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Returned: 'bg-slate-50 text-slate-600 border-slate-200',
    Overdue: 'bg-red-50 text-red-700 border-red-200',
    Rejected: 'bg-red-50 text-red-600 border-red-200',
    Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return colors[status] || 'bg-slate-50 text-slate-600 border-slate-200';
};

/**
 * Get action color for transaction timeline
 */
export const getActionColor = (action) => {
  const colors = {
    'Asset Purchased': 'bg-emerald-500',
    'Asset Transferred': 'bg-blue-500',
    'Asset Assigned': 'bg-indigo-500',
    'Asset Returned': 'bg-slate-500',
    'Expense Added': 'bg-amber-500',
    'Asset Updated': 'bg-sky-500',
    'Asset Retired': 'bg-red-500',
    'Transfer Approved': 'bg-teal-500',
    'Assignment Created': 'bg-violet-500',
  };
  return colors[action] || 'bg-slate-400';
};

/**
 * Paginate an array
 */
export const paginate = (items, page, perPage = 10) => {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  return {
    data: items.slice(start, end),
    totalPages: Math.ceil(items.length / perPage),
    totalItems: items.length,
    currentPage: page,
  };
};

/**
 * Sort array by key
 */
export const sortBy = (arr, key, direction = 'asc') => {
  return [...arr].sort((a, b) => {
    const valA = a[key];
    const valB = b[key];
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Filter array by search term across multiple keys
 */
export const searchFilter = (items, searchTerm, keys) => {
  if (!searchTerm) return items;
  const term = searchTerm.toLowerCase();
  return items.filter((item) =>
    keys.some((key) => {
      const val = item[key];
      return val && String(val).toLowerCase().includes(term);
    })
  );
};

/**
 * Deep clone an object
 */
export const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};
