/**
 * Normalization utilities for transforming backend responses to frontend state format
 * and converting frontend input to backend request payloads.
 */

export const formatStatus = (status) => {
  if (!status) return 'Active';
  const statusMap = {
    ACTIVE: 'Active',
    IN_STORAGE: 'In Storage',
    ASSIGNED: 'Assigned',
    IN_TRANSIT: 'In Transit',
    MAINTENANCE: 'Maintenance',
    RETIRED: 'Retired',
    PENDING: 'Pending',
    APPROVED: 'Approved',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    RECEIVED: 'Received',
    RECORDED: 'Recorded',
    RETURNED: 'Returned',
    OVERDUE: 'Overdue',
    REJECTED: 'Rejected',
    PAID: 'Paid',
    DECOMMISSIONED: 'Decommissioned',
    SUSPENDED: 'Suspended',
    INACTIVE: 'Inactive',
  };
  return statusMap[status.toUpperCase()] || status;
};

export const toBackendStatus = (status) => {
  if (!status) return 'ACTIVE';
  return status.toUpperCase().replace(/\s+/g, '_');
};

export const normalizeAsset = (asset) => {
  if (!asset) return null;
  return {
    id: asset.id,
    assetCode: asset.asset_code,
    name: asset.name,
    type: asset.asset_type,
    category: asset.category || 'General',
    serialNumber: asset.serial_number,
    base: asset.base_name || 'HQ Base',
    baseId: asset.current_base_id,
    status: formatStatus(asset.status),
    rawStatus: asset.status,
    purchaseDate: asset.purchase_date,
    purchaseValue: asset.purchase_value ? parseFloat(asset.purchase_value) : 0,
    description: asset.description || '',
    assignedTo: asset.assigned_to_user_id || null,
    assignedPersonnel: asset.assigned_personnel_name || null,
  };
};

export const normalizePurchase = (p) => {
  if (!p) return null;
  return {
    id: p.id,
    purchaseNumber: p.purchase_number,
    asset: p.asset_name || p.asset_code || 'Asset',
    assetId: p.asset_id,
    assetType: p.asset_type || 'General',
    category: p.category || 'General',
    quantity: p.quantity,
    purchaseDate: p.purchase_date,
    unitPrice: p.unit_price ? parseFloat(p.unit_price) : 0,
    totalCost: p.total_amount ? parseFloat(p.total_amount) : 0,
    vendor: p.vendor,
    base: p.base_name || 'Fort Sentinel',
    baseId: p.base_id,
    reference: p.reference_number || p.purchase_number,
    status: formatStatus(p.status),
    notes: p.notes || '',
  };
};

export const normalizeTransfer = (t) => {
  if (!t) return null;
  return {
    id: t.id,
    transferNumber: t.transfer_number,
    asset: t.asset_name || t.asset_code || 'Asset',
    assetId: t.asset_id,
    assetType: t.asset_type || 'General',
    sourceBase: t.source_base_name || 'Fort Alpha',
    sourceBaseId: t.source_base_id,
    destinationBase: t.destination_base_name || 'Camp Bravo',
    destinationBaseId: t.destination_base_id,
    requestedBy: t.requested_by_name || 'Officer',
    transferDate: t.transfer_date || t.created_at,
    status: formatStatus(t.status),
    reason: t.reason || '',
    timestamp: t.created_at,
  };
};

export const normalizeAssignment = (a) => {
  if (!a) return null;
  return {
    id: a.id,
    asset: a.asset_name || a.asset_code || 'Asset',
    assetId: a.asset_id,
    personnel: a.user_name || 'Officer',
    personnelId: a.user_id,
    base: a.base_name || 'Fort Sentinel',
    baseId: a.base_id,
    assignmentDate: a.assigned_at,
    expectedReturn: a.expected_return_at,
    returnedAt: a.returned_at,
    status: formatStatus(a.status),
    notes: a.notes || '',
  };
};

export const normalizeExpense = (e) => {
  if (!e) return null;
  return {
    id: e.id,
    expenseNumber: e.expense_number,
    asset: e.asset_name || e.asset_code || 'Asset',
    assetId: e.asset_id,
    expenseType: e.expense_type,
    description: e.description || '',
    amount: e.amount ? parseFloat(e.amount) : 0,
    date: e.expense_date,
    base: e.base_name || 'Base',
    baseId: e.base_id,
    recordedBy: e.recorded_by_name || 'Logistics Officer',
    status: formatStatus(e.status),
  };
};

export const normalizeTransaction = (tx) => {
  if (!tx) return null;
  const actionMap = {
    ASSET_CREATED: 'Asset Created',
    ASSET_UPDATED: 'Asset Updated',
    ASSET_PURCHASED: 'Asset Purchased',
    ASSET_TRANSFER_REQUESTED: 'Asset Transfer Requested',
    ASSET_TRANSFERRED: 'Asset Transferred',
    ASSET_ASSIGNED: 'Asset Assigned',
    ASSET_RETURNED: 'Asset Returned',
    EXPENSE_ADDED: 'Expense Added',
    ASSET_RETIRED: 'Asset Retired',
  };
  return {
    id: tx.id,
    action: actionMap[tx.transaction_type] || tx.transaction_type,
    asset: tx.asset_name || 'Asset',
    assetId: tx.asset_id,
    user: tx.user_name || 'System User',
    base: tx.base_name || 'HQ Command',
    date: tx.created_at,
    previousState: tx.previous_state ? JSON.stringify(tx.previous_state) : null,
    newState: tx.new_state ? JSON.stringify(tx.new_state) : null,
    details: tx.description || 'Transaction logged',
  };
};

export const normalizeUser = (u) => {
  if (!u) return null;
  const roleMap = {
    ADMIN: 'Admin',
    BASE_COMMANDER: 'Base Commander',
    LOGISTICS_OFFICER: 'Logistics Officer',
  };
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    employeeId: u.employee_id,
    role: roleMap[u.role_name] || u.role_name || 'User',
    roleId: u.role_id,
    base: u.base_name || 'All Bases (HQ)',
    baseId: u.base_id,
    status: formatStatus(u.status),
    lastLogin: u.last_login_at,
    createdAt: u.created_at,
  };
};
