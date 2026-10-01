// Application-wide constants

export const ROLES = {
  ADMIN: 'Admin',
  BASE_COMMANDER: 'Base Commander',
  LOGISTICS_OFFICER: 'Logistics Officer',
};

export const ASSET_STATUSES = {
  ACTIVE: 'Active',
  ASSIGNED: 'Assigned',
  IN_STORAGE: 'In Storage',
  IN_TRANSIT: 'In Transit',
  MAINTENANCE: 'Maintenance',
  RETIRED: 'Retired',
  DECOMMISSIONED: 'Decommissioned',
};

export const TRANSFER_STATUSES = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  IN_TRANSIT: 'In Transit',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const PURCHASE_STATUSES = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  RECEIVED: 'Received',
  CANCELLED: 'Cancelled',
};

export const ASSIGNMENT_STATUSES = {
  ACTIVE: 'Active',
  RETURNED: 'Returned',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
};

export const EXPENSE_STATUSES = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PAID: 'Paid',
};

export const ASSET_TYPES = [
  'Vehicle',
  'Weapon',
  'Communication',
  'Electronics',
  'Medical',
  'Engineering',
  'Aviation',
  'Maritime',
  'Ammunition',
  'Support',
];

export const ASSET_CATEGORIES = [
  'Armored Vehicle',
  'Transport Vehicle',
  'Utility Vehicle',
  'Assault Rifle',
  'Sidearm',
  'Heavy Weapon',
  'Radio System',
  'Satellite Equipment',
  'Night Vision',
  'Surveillance',
  'Medical Kit',
  'Field Hospital Equipment',
  'Generator',
  'Construction Equipment',
  'Helicopter',
  'Fixed Wing',
  'Patrol Boat',
  'Ammunition Supply',
  'Field Supply',
];

export const EXPENSE_TYPES = [
  'Maintenance',
  'Repair',
  'Fuel',
  'Ammunition',
  'Upgrade',
  'Insurance',
  'Storage',
  'Transportation',
  'Training',
  'Miscellaneous',
];

export const BASES = [
  { id: 'BASE-001', name: 'Fort Sentinel', location: 'Northern Region', status: 'Active' },
  { id: 'BASE-002', name: 'Camp Ironclad', location: 'Eastern Region', status: 'Active' },
  { id: 'BASE-003', name: 'Outpost Vanguard', location: 'Western Region', status: 'Active' },
  { id: 'BASE-004', name: 'Base Thunderbolt', location: 'Southern Region', status: 'Active' },
  { id: 'BASE-005', name: 'HQ Command Center', location: 'Central Region', status: 'Active' },
  { id: 'BASE-006', name: 'Camp Resolute', location: 'Coastal Region', status: 'Active' },
];

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: {
    dashboard: true,
    assets: { view: true, create: true, edit: true, delete: true, assign: true, transfer: true },
    purchases: { view: true, create: true, edit: true, approve: true },
    transfers: { view: true, create: true, edit: true, approve: true },
    assignments: { view: true, create: true, edit: true },
    expenses: { view: true, create: true, edit: true, approve: true },
    transactions: { view: true },
    users: { view: true, create: true, edit: true, delete: true },
    reports: { view: true, export: true },
    settings: { view: true, edit: true },
  },
  [ROLES.BASE_COMMANDER]: {
    dashboard: true,
    assets: { view: true, create: false, edit: true, delete: false, assign: true, transfer: true },
    purchases: { view: true, create: false, edit: false, approve: false },
    transfers: { view: true, create: true, edit: false, approve: true },
    assignments: { view: true, create: true, edit: true },
    expenses: { view: true, create: false, edit: false, approve: false },
    transactions: { view: true },
    users: { view: false, create: false, edit: false, delete: false },
    reports: { view: true, export: true },
    settings: { view: true, edit: false },
  },
  [ROLES.LOGISTICS_OFFICER]: {
    dashboard: true,
    assets: { view: true, create: false, edit: false, delete: false, assign: false, transfer: true },
    purchases: { view: true, create: true, edit: true, approve: false },
    transfers: { view: true, create: true, edit: true, approve: false },
    assignments: { view: true, create: false, edit: false },
    expenses: { view: true, create: true, edit: true, approve: false },
    transactions: { view: true },
    users: { view: false, create: false, edit: false, delete: false },
    reports: { view: true, export: false },
    settings: { view: true, edit: false },
  },
};

export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
  { key: 'assets', label: 'Assets', path: '/assets', icon: 'Package' },
  { key: 'purchases', label: 'Purchases', path: '/purchases', icon: 'ShoppingCart' },
  { key: 'transfers', label: 'Transfers', path: '/transfers', icon: 'ArrowLeftRight' },
  { key: 'assignments', label: 'Assignments', path: '/assignments', icon: 'UserCheck' },
  { key: 'expenses', label: 'Expenditures', path: '/expenses', icon: 'Receipt' },
  { key: 'transactions', label: 'Transactions', path: '/transactions', icon: 'FileText' },
  { key: 'users', label: 'Users & Roles', path: '/users', icon: 'Users' },
  { key: 'reports', label: 'Reports', path: '/reports', icon: 'BarChart3' },
  { key: 'settings', label: 'Settings', path: '/settings', icon: 'Settings' },
];
