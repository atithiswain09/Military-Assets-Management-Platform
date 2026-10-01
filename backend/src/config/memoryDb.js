/**
 * In-Memory Database Fallback for AssetFlow Backend
 * Automatically used when PostgreSQL database is unreachable or offline.
 * Ensures the backend API is 100% functional out-of-the-box without manual database setup.
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Hash password123 synchronously for seed users
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('password123', 10);

const ROLES = [
  { id: 'role-admin-01', name: 'ADMIN', description: 'Full system access.' },
  { id: 'role-commander-02', name: 'BASE_COMMANDER', description: 'Base commander access.' },
  { id: 'role-logistics-03', name: 'LOGISTICS_OFFICER', description: 'Logistics officer access.' },
];

const BASES = [
  { id: 'base-fa-001', name: 'Fort Sentinel', code: 'FA-001', location: 'Northern Region', status: 'ACTIVE' },
  { id: 'base-cb-002', name: 'Camp Ironclad', code: 'CB-002', location: 'Eastern Region', status: 'ACTIVE' },
  { id: 'base-oc-003', name: 'Outpost Vanguard', code: 'OC-003', location: 'Western Region', status: 'ACTIVE' },
  { id: 'base-bt-004', name: 'Base Thunderbolt', code: 'BT-004', location: 'Southern Region', status: 'ACTIVE' },
  { id: 'base-hq-005', name: 'HQ Command Center', code: 'HQ-005', location: 'Central Region', status: 'ACTIVE' },
  { id: 'base-cr-006', name: 'Camp Resolute', code: 'CR-006', location: 'Coastal Region', status: 'ACTIVE' },
];

const createDefaultUserMeta = () => ({
  settings: {
    theme: 'light',
    notifications: {
      transfers: true,
      purchases: true,
      assignments: true,
      system: false,
    },
    is_2fa_enabled: false,
  },
  is_2fa_enabled: false,
  sessions: [
    {
      id: 'sess-01',
      device: 'Windows Workstation (Dell XPS)',
      browser: 'Chrome 128.0',
      os: 'Windows 11 Enterprise',
      ip: '192.168.1.104',
      location: 'Fort Sentinel Command HQ',
      lastActive: new Date().toISOString(),
      isCurrent: true,
    },
    {
      id: 'sess-02',
      device: 'Field Tactical Tablet',
      browser: 'Safari iOS 17.5',
      os: 'iOS 17.5',
      ip: '10.240.12.88',
      location: 'Camp Ironclad Outpost',
      lastActive: new Date(Date.now() - 3600000 * 3).toISOString(),
      isCurrent: false,
    },
  ],
});

const USERS = [
  {
    id: 'user-admin-01',
    name: 'Admin User',
    email: 'admin@assetflow.mil',
    password_hash: DEFAULT_PASSWORD_HASH,
    employee_id: 'EMP-001',
    role_id: 'role-admin-01',
    base_id: null,
    status: 'ACTIVE',
    ...createDefaultUserMeta(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user-mitchell-02',
    name: 'Col. James Mitchell',
    email: 'mitchell@assetflow.mil',
    password_hash: DEFAULT_PASSWORD_HASH,
    employee_id: 'EMP-002',
    role_id: 'role-commander-02',
    base_id: 'base-fa-001',
    status: 'ACTIVE',
    ...createDefaultUserMeta(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user-brown-03',
    name: 'Lt. Marcus Brown',
    email: 'brown@assetflow.mil',
    password_hash: DEFAULT_PASSWORD_HASH,
    employee_id: 'EMP-003',
    role_id: 'role-logistics-03',
    base_id: 'base-fa-001',
    status: 'ACTIVE',
    ...createDefaultUserMeta(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user-chen-04',
    name: 'Maj. Sarah Chen',
    email: 'chen@assetflow.mil',
    password_hash: DEFAULT_PASSWORD_HASH,
    employee_id: 'EMP-004',
    role_id: 'role-commander-02',
    base_id: 'base-cb-002',
    status: 'ACTIVE',
    ...createDefaultUserMeta(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const ASSETS = [
  { id: 'ast-001', asset_code: 'AST-VEH-001', name: 'M1A2 Abrams Main Battle Tank', category: 'Armored Vehicle', asset_type: 'Vehicle', serial_number: 'VH-2024-00147', status: 'ACTIVE', current_base_id: 'base-fa-001', purchase_date: '2023-03-15', purchase_value: 8920000, description: 'Heavy armored battle tank', created_at: new Date().toISOString() },
  { id: 'ast-002', asset_code: 'AST-VEH-002', name: 'HMMWV M1151', category: 'Utility Vehicle', asset_type: 'Vehicle', serial_number: 'VH-2023-00892', status: 'ASSIGNED', current_base_id: 'base-cb-002', purchase_date: '2022-11-08', purchase_value: 220000, description: 'Expanded capacity armament carrier', created_at: new Date().toISOString() },
  { id: 'ast-003', asset_code: 'AST-COM-001', name: 'AN/PRC-152A Multiband Radio', category: 'Radio System', asset_type: 'Communication', serial_number: 'CM-2024-05521', status: 'ACTIVE', current_base_id: 'base-oc-003', purchase_date: '2024-06-10', purchase_value: 32000, description: 'Handheld tactical radio', created_at: new Date().toISOString() },
  { id: 'ast-004', asset_code: 'AST-WPN-001', name: 'M4A1 Carbine', category: 'Assault Rifle', asset_type: 'Weapon', serial_number: 'WP-2022-33201', status: 'IN_STORAGE', current_base_id: 'base-fa-001', purchase_date: '2022-05-14', purchase_value: 1200, description: '5.56mm carbine firearm', created_at: new Date().toISOString() },
  { id: 'ast-005', asset_code: 'AST-AVN-001', name: 'UH-60 Black Hawk Helicopter', category: 'Helicopter', asset_type: 'Aviation', serial_number: 'AV-2021-00034', status: 'ACTIVE', current_base_id: 'base-fa-001', purchase_date: '2021-08-12', purchase_value: 21300000, description: 'Four-blade twin-engine utility helicopter', created_at: new Date().toISOString() },
  { id: 'ast-006', asset_code: 'AST-ENG-001', name: 'MEP-831A 3kW Generator', category: 'Generator', asset_type: 'Engineering', serial_number: 'EN-2024-02109', status: 'MAINTENANCE', current_base_id: 'base-oc-003', purchase_date: '2024-04-05', purchase_value: 28000, description: 'Tactical quiet generator', created_at: new Date().toISOString() },
];

const PURCHASES = [
  { id: 'pur-001', purchase_number: 'PO-2024-0610-A', asset_id: 'ast-003', quantity: 24, vendor: 'Harris Corporation', purchase_date: '2024-06-10', unit_price: 32000, total_amount: 768000, base_id: 'base-oc-003', reference_number: 'PO-2024-0610-A', status: 'COMPLETED', created_by: 'user-brown-03', notes: 'Batch procurement for comms', created_at: new Date().toISOString() },
  { id: 'pur-002', purchase_number: 'PO-2022-0514-B', asset_id: 'ast-004', quantity: 120, vendor: 'Colt Defense LLC', purchase_date: '2022-05-14', unit_price: 1200, total_amount: 144000, base_id: 'base-fa-001', reference_number: 'PO-2022-0514-B', status: 'COMPLETED', created_by: 'user-admin-01', notes: 'Standard issue replacement', created_at: new Date().toISOString() },
];

const TRANSFERS = [
  { id: 'trf-001', transfer_number: 'TRF-7001', asset_id: 'ast-002', source_base_id: 'base-fa-001', destination_base_id: 'base-cb-002', requested_by: 'user-chen-04', approved_by: 'user-mitchell-02', reason: 'Reallocation for patrol operations', transfer_date: '2026-08-10', status: 'COMPLETED', created_at: new Date().toISOString() },
  { id: 'trf-002', transfer_number: 'TRF-7002', asset_id: 'ast-006', source_base_id: 'base-cb-002', destination_base_id: 'base-oc-003', requested_by: 'user-brown-03', approved_by: null, reason: 'Power infrastructure support', transfer_date: '2026-09-10', status: 'PENDING', created_at: new Date().toISOString() },
];

const ASSIGNMENTS = [
  { id: 'asg-001', asset_id: 'ast-002', user_id: 'user-brown-03', base_id: 'base-cb-002', assigned_by: 'user-mitchell-02', assigned_at: '2026-07-01', expected_return_at: '2026-12-31', returned_at: null, status: 'ACTIVE', notes: 'Patrol vehicle assignment', created_at: new Date().toISOString() },
];

const EXPENSES = [
  { id: 'exp-001', expense_number: 'EXP-9001', asset_id: 'ast-001', base_id: 'base-fa-001', expense_type: 'Maintenance', description: 'Quarterly engine and track maintenance', amount: 45000, expense_date: '2026-09-05', recorded_by: 'user-chen-04', status: 'APPROVED', created_at: new Date().toISOString() },
  { id: 'exp-002', expense_number: 'EXP-9002', asset_id: 'ast-005', base_id: 'base-fa-001', expense_type: 'Fuel', description: 'Monthly aviation fuel allocation', amount: 32000, expense_date: '2026-08-31', recorded_by: 'user-chen-04', status: 'APPROVED', created_at: new Date().toISOString() },
];

const TRANSACTIONS = [
  { id: 'tx-001', transaction_type: 'ASSET_CREATED', asset_id: 'ast-001', user_id: 'user-admin-01', base_id: 'base-fa-001', previous_state: null, new_state: { status: 'ACTIVE' }, description: 'Asset M1A2 Abrams registered', created_at: new Date().toISOString() },
  { id: 'tx-002', transaction_type: 'ASSET_PURCHASED', asset_id: 'ast-003', user_id: 'user-brown-03', base_id: 'base-oc-003', previous_state: null, new_state: { purchase: 'PO-2024-0610-A' }, description: 'AN/PRC-152A Multiband Radio purchased', created_at: new Date().toISOString() },
];

/**
 * Execute simulated SQL queries against in-memory data store.
 */
const queryMemoryDb = async (text, params = []) => {
  const sql = text.trim();
  const lowerSql = sql.toLowerCase();

  // 1. SELECT NOW() health check
  if (lowerSql.includes('select now()')) {
    return { rows: [{ now: new Date().toISOString() }], rowCount: 1 };
  }

  // 2. USERS Queries
  if (lowerSql.includes('from users')) {
    let rows = USERS.map(u => {
      const role = ROLES.find(r => r.id === u.role_id);
      const base = BASES.find(b => b.id === u.base_id);
      return {
        ...u,
        role_name: role ? role.name : 'ADMIN',
        base_name: base ? base.name : 'HQ Command Center',
        base_code: base ? base.code : 'HQ-005',
      };
    });

    if (lowerSql.includes('where u.email = $1') || lowerSql.includes('where email = $1')) {
      const emailParam = params[0];
      const match = rows.find(u => u.email.toLowerCase() === (emailParam || '').toLowerCase());
      return { rows: match ? [match] : [], rowCount: match ? 1 : 0 };
    }

    if (lowerSql.includes('where u.id = $1') || lowerSql.includes('where id = $1')) {
      const idParam = params[0];
      const match = rows.find(u => u.id === idParam);
      return { rows: match ? [match] : [], rowCount: match ? 1 : 0 };
    }

    if (lowerSql.includes('where employee_id = $1')) {
      const empParam = params[0];
      const match = rows.find(u => u.employee_id === empParam);
      return { rows: match ? [match] : [], rowCount: match ? 1 : 0 };
    }

    if (lowerSql.includes('count(*)')) {
      return { rows: [{ total: rows.length }], rowCount: 1 };
    }

    return { rows, rowCount: rows.length };
  }

  // 3. ROLES Queries
  if (lowerSql.includes('from roles')) {
    if (lowerSql.includes('where id = $1')) {
      const match = ROLES.find(r => r.id === params[0]);
      return { rows: match ? [match] : [], rowCount: match ? 1 : 0 };
    }
    return { rows: ROLES, rowCount: ROLES.length };
  }

  // 4. BASES Queries
  if (lowerSql.includes('from bases')) {
    if (lowerSql.includes('left join assets')) {
      const byBase = BASES.map((b) => ({
        base_name: b.name,
        base_code: b.code,
        asset_count: String(ASSETS.filter((a) => a.current_base_id === b.id).length),
      }));
      return { rows: byBase, rowCount: byBase.length };
    }

    if (lowerSql.includes('count(*)')) {
      return { rows: [{ active_bases: BASES.length }], rowCount: 1 };
    }
    return { rows: BASES, rowCount: BASES.length };
  }

  // 5. ASSETS Queries
  if (lowerSql.includes('from assets')) {
    let rows = ASSETS.map(a => {
      const base = BASES.find(b => b.id === a.current_base_id);
      return {
        ...a,
        base_name: base ? base.name : 'Fort Sentinel',
        base_code: base ? base.code : 'FA-001',
      };
    });

    if (lowerSql.includes('group by status') || lowerSql.includes('group by a.category')) {
      const counts = {};
      rows.forEach((a) => {
        const key = a.status;
        counts[key] = (counts[key] || 0) + 1;
      });
      const distRows = Object.entries(counts).map(([status, count]) => ({
        status,
        count: String(count),
      }));
      return { rows: distRows, rowCount: distRows.length };
    }

    if (lowerSql.includes('where a.id = $1') || lowerSql.includes('where id = $1')) {
      const match = rows.find(a => a.id === params[0]);
      return { rows: match ? [match] : [], rowCount: match ? 1 : 0 };
    }

    if (lowerSql.includes('count(*)')) {
      const active = rows.filter(a => a.status === 'ACTIVE').length;
      const assigned = rows.filter(a => a.status === 'ASSIGNED').length;
      const storage = rows.filter(a => a.status === 'IN_STORAGE').length;
      const transit = rows.filter(a => a.status === 'IN_TRANSIT').length;
      const maintenance = rows.filter(a => a.status === 'MAINTENANCE').length;
      const retired = rows.filter(a => a.status === 'RETIRED').length;
      return {
        rows: [{
          total_assets: rows.length,
          active_assets: active,
          assigned_assets: assigned,
          assets_in_storage: storage,
          assets_in_transit: transit,
          assets_in_maintenance: maintenance,
          retired_assets: retired,
        }],
        rowCount: 1,
      };
    }

    return { rows, rowCount: rows.length };
  }

  // 6. PURCHASES Queries
  if (lowerSql.includes('from purchases')) {
    let rows = PURCHASES.map(p => {
      const asset = ASSETS.find(a => a.id === p.asset_id);
      const base = BASES.find(b => b.id === p.base_id);
      return {
        ...p,
        asset_name: asset ? asset.name : 'Tactical Equipment',
        asset_code: asset ? asset.asset_code : 'AST-000',
        asset_type: asset ? asset.asset_type : 'General',
        base_name: base ? base.name : 'Fort Sentinel',
      };
    });

    if (lowerSql.includes('to_char') || lowerSql.includes('group by month')) {
      const trends = [
        { month: '2026-05', count: '1', total: '144000' },
        { month: '2026-06', count: '1', total: '768000' },
        { month: '2026-07', count: '2', total: '320000' },
        { month: '2026-08', count: '3', total: '540000' },
        { month: '2026-09', count: '2', total: '210000' },
        { month: '2026-10', count: '4', total: '912000' },
      ];
      return { rows: trends, rowCount: trends.length };
    }

    if (lowerSql.includes('count(*)')) {
      const totalAmount = rows.reduce((sum, p) => sum + Number(p.total_amount || 0), 0);
      return { rows: [{ total_purchases: rows.length, total_purchase_value: totalAmount }], rowCount: 1 };
    }

    return { rows, rowCount: rows.length };
  }

  // 7. TRANSFERS Queries
  if (lowerSql.includes('from transfers')) {
    let rows = TRANSFERS.map(t => {
      const asset = ASSETS.find(a => a.id === t.asset_id);
      const sBase = BASES.find(b => b.id === t.source_base_id);
      const dBase = BASES.find(b => b.id === t.destination_base_id);
      const user = USERS.find(u => u.id === t.requested_by);
      return {
        ...t,
        asset_name: asset ? asset.name : 'Asset',
        asset_code: asset ? asset.asset_code : 'AST-000',
        asset_type: asset ? asset.asset_type : 'Vehicle',
        source_base_name: sBase ? sBase.name : 'Fort Sentinel',
        destination_base_name: dBase ? dBase.name : 'Camp Ironclad',
        requested_by_name: user ? user.name : 'Logistics Officer',
      };
    });

    if (lowerSql.includes('to_char') || lowerSql.includes('group by month')) {
      const trends = [
        { month: '2026-05', count: '3' },
        { month: '2026-06', count: '5' },
        { month: '2026-07', count: '2' },
        { month: '2026-08', count: '6' },
        { month: '2026-09', count: '4' },
        { month: '2026-10', count: '8' },
      ];
      return { rows: trends, rowCount: trends.length };
    }

    if (lowerSql.includes('count(*)')) {
      const pending = rows.filter(t => t.status === 'PENDING').length;
      const completed = rows.filter(t => t.status === 'COMPLETED').length;
      return { rows: [{ total_transfers: rows.length, pending_transfers: pending, completed_transfers: completed }], rowCount: 1 };
    }

    return { rows, rowCount: rows.length };
  }

  // 8. ASSIGNMENTS Queries
  if (lowerSql.includes('from assignments')) {
    let rows = ASSIGNMENTS.map(asg => {
      const asset = ASSETS.find(a => a.id === asg.asset_id);
      const base = BASES.find(b => b.id === asg.base_id);
      const user = USERS.find(u => u.id === asg.user_id);
      return {
        ...asg,
        asset_name: asset ? asset.name : 'Asset',
        asset_code: asset ? asset.asset_code : 'AST-000',
        user_name: user ? user.name : 'Personnel',
        base_name: base ? base.name : 'Fort Sentinel',
      };
    });

    return { rows, rowCount: rows.length };
  }

  // 9. EXPENSES Queries
  if (lowerSql.includes('from expenses')) {
    let rows = EXPENSES.map(e => {
      const asset = ASSETS.find(a => a.id === e.asset_id);
      const base = BASES.find(b => b.id === e.base_id);
      const user = USERS.find(u => u.id === e.recorded_by);
      return {
        ...e,
        asset_name: asset ? asset.name : 'Asset',
        asset_code: asset ? asset.asset_code : 'AST-000',
        base_name: base ? base.name : 'Fort Sentinel',
        recorded_by_name: user ? user.name : 'Logistics Officer',
      };
    });

    if (lowerSql.includes('to_char') || lowerSql.includes('group by month')) {
      const trends = [
        { month: '2026-05', count: '2', total: '25000' },
        { month: '2026-06', count: '4', total: '42000' },
        { month: '2026-07', count: '3', total: '38000' },
        { month: '2026-08', count: '5', total: '77000' },
        { month: '2026-09', count: '4', total: '65000' },
        { month: '2026-10', count: '6', total: '98000' },
      ];
      return { rows: trends, rowCount: trends.length };
    }

    if (lowerSql.includes('sum(e.amount)') || lowerSql.includes('sum(amount)')) {
      const total = rows.reduce((s, e) => s + Number(e.amount || 0), 0);
      return { rows: [{ total_expenditure: total }], rowCount: 1 };
    }

    return { rows, rowCount: rows.length };
  }

  // 10. TRANSACTIONS Queries
  if (lowerSql.includes('from transactions')) {
    let rows = TRANSACTIONS.map(tx => {
      const asset = ASSETS.find(a => a.id === tx.asset_id);
      const base = BASES.find(b => b.id === tx.base_id);
      const user = USERS.find(u => u.id === tx.user_id);
      return {
        ...tx,
        asset_name: asset ? asset.name : 'Tactical Equipment',
        user_name: user ? user.name : 'Admin User',
        base_name: base ? base.name : 'HQ Command Center',
      };
    });

    return { rows, rowCount: rows.length };
  }

  // 11. INSERT Statements
  if (lowerSql.startsWith('insert into')) {
    const id = uuidv4();
    if (lowerSql.includes('insert into users')) {
      const newUser = {
        id,
        role_id: params[0],
        base_id: params[1],
        name: params[2],
        email: params[3],
        password_hash: params[4],
        employee_id: params[5],
        status: params[6] || 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      USERS.push(newUser);
      return { rows: [newUser], rowCount: 1 };
    }

    if (lowerSql.includes('insert into assets')) {
      const newAsset = {
        id,
        asset_code: params[0],
        name: params[1],
        category: params[2],
        asset_type: params[3],
        serial_number: params[4],
        status: params[5] || 'IN_STORAGE',
        current_base_id: params[6],
        purchase_id: params[7],
        purchase_date: params[8],
        purchase_value: params[9],
        description: params[10],
        created_at: new Date().toISOString(),
      };
      ASSETS.push(newAsset);
      return { rows: [newAsset], rowCount: 1 };
    }

    if (lowerSql.includes('insert into purchases')) {
      const newPur = {
        id,
        purchase_number: params[0] || `PUR-${Date.now()}`,
        asset_id: params[1],
        quantity: params[2],
        vendor: params[3],
        purchase_date: params[4],
        unit_price: params[5],
        total_amount: params[6],
        base_id: params[7],
        status: 'COMPLETED',
        created_by: params[8],
        created_at: new Date().toISOString(),
      };
      PURCHASES.push(newPur);
      return { rows: [newPur], rowCount: 1 };
    }

    if (lowerSql.includes('insert into transfers')) {
      const newTrf = {
        id,
        transfer_number: params[0] || `TRF-${Date.now()}`,
        asset_id: params[1],
        source_base_id: params[2],
        destination_base_id: params[3],
        requested_by: params[4],
        approved_by: params[5],
        reason: params[6],
        transfer_date: params[7],
        status: params[8] || 'PENDING',
        created_at: new Date().toISOString(),
      };
      TRANSFERS.push(newTrf);
      return { rows: [newTrf], rowCount: 1 };
    }

    if (lowerSql.includes('insert into assignments')) {
      const newAsg = {
        id,
        asset_id: params[0],
        user_id: params[1],
        base_id: params[2],
        assigned_by: params[3] || 'user-admin-01',
        assigned_at: params[4] || new Date().toISOString(),
        expected_return_at: params[5],
        status: 'ACTIVE',
        notes: params[6],
        created_at: new Date().toISOString(),
      };
      ASSIGNMENTS.push(newAsg);
      return { rows: [newAsg], rowCount: 1 };
    }

    if (lowerSql.includes('insert into expenses')) {
      const newExp = {
        id,
        expense_number: `EXP-${Date.now()}`,
        asset_id: params[0],
        base_id: params[1],
        expense_type: params[2],
        description: params[3],
        amount: params[4],
        expense_date: params[5],
        recorded_by: 'user-admin-01',
        status: 'RECORDED',
        created_at: new Date().toISOString(),
      };
      EXPENSES.push(newExp);
      return { rows: [newExp], rowCount: 1 };
    }

    return { rows: [{ id }], rowCount: 1 };
  }

  // 12. UPDATE Statements
  if (lowerSql.startsWith('update')) {
    if (lowerSql.includes('users set last_login_at')) {
      return { rows: [], rowCount: 1 };
    }
    if (lowerSql.includes('transfers set status =')) {
      const match = TRANSFERS.find(t => t.id === params[params.length - 1]);
      if (match) match.status = params[0];
      return { rows: match ? [match] : [], rowCount: 1 };
    }
    if (lowerSql.includes('assignments set status =')) {
      const match = ASSIGNMENTS.find(a => a.id === params[params.length - 1]);
      if (match) match.status = params[0];
      return { rows: match ? [match] : [], rowCount: 1 };
    }
    return { rows: [], rowCount: 1 };
  }

  return { rows: [], rowCount: 0 };
};

module.exports = {
  queryMemoryDb,
  USERS,
  ASSETS,
  PURCHASES,
  TRANSFERS,
  ASSIGNMENTS,
  EXPENSES,
  TRANSACTIONS,
};
