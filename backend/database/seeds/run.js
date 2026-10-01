/**
 * AssetFlow Seed Data
 * Creates realistic fictional data for all tables.
 */
const { pool } = require('../../src/config/db');
const { hashPassword } = require('../../src/utils/password');
const logger = require('../../src/utils/logger');

const seed = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ──────────────────────────────────────────────
    // 1. ROLES
    // ──────────────────────────────────────────────
    const roles = [
      { name: 'ADMIN', description: 'Full system access. Manages all users, assets, and operations across all bases.' },
      { name: 'BASE_COMMANDER', description: 'Manages operations within their assigned base. Can approve transfers and assignments.' },
      { name: 'LOGISTICS_OFFICER', description: 'Handles day-to-day asset logistics — purchases, assignments, transfers, and expense recording.' },
    ];

    const roleIds = {};
    for (const role of roles) {
      const result = await client.query(
        `INSERT INTO roles (name, description) VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET description = $2
         RETURNING id, name`,
        [role.name, role.description]
      );
      roleIds[result.rows[0].name] = result.rows[0].id;
    }
    logger.info('Roles seeded');

    // ──────────────────────────────────────────────
    // 2. BASES
    // ──────────────────────────────────────────────
    const bases = [
      { name: 'Fort Alpha', code: 'FA-001', location: 'Northern Region, Sector 7', status: 'ACTIVE' },
      { name: 'Camp Bravo', code: 'CB-002', location: 'Eastern Region, Sector 3', status: 'ACTIVE' },
      { name: 'Outpost Charlie', code: 'OC-003', location: 'Western Region, Sector 12', status: 'ACTIVE' },
    ];

    const baseIds = {};
    for (const base of bases) {
      const result = await client.query(
        `INSERT INTO bases (name, code, location, status) VALUES ($1, $2, $3, $4)
         ON CONFLICT (code) DO UPDATE SET name = $1, location = $3, status = $4
         RETURNING id, code`,
        [base.name, base.code, base.location, base.status]
      );
      baseIds[result.rows[0].code] = result.rows[0].id;
    }
    logger.info('Bases seeded');

    // ──────────────────────────────────────────────
    // 3. USERS
    // ──────────────────────────────────────────────
    const password = await hashPassword('password123');

    const users = [
      { name: 'Admin User', email: 'admin@assetflow.mil', employeeId: 'EMP-001', roleId: roleIds.ADMIN, baseId: null },
      { name: 'Col. James Mitchell', email: 'mitchell@assetflow.mil', employeeId: 'EMP-002', roleId: roleIds.BASE_COMMANDER, baseId: baseIds['FA-001'] },
      { name: 'Col. Sarah Chen', email: 'chen@assetflow.mil', employeeId: 'EMP-003', roleId: roleIds.BASE_COMMANDER, baseId: baseIds['CB-002'] },
      { name: 'Lt. Marcus Brown', email: 'brown@assetflow.mil', employeeId: 'EMP-004', roleId: roleIds.LOGISTICS_OFFICER, baseId: baseIds['FA-001'] },
      { name: 'Lt. Emily Davis', email: 'davis@assetflow.mil', employeeId: 'EMP-005', roleId: roleIds.LOGISTICS_OFFICER, baseId: baseIds['CB-002'] },
      { name: 'Sgt. Robert Wilson', email: 'wilson@assetflow.mil', employeeId: 'EMP-006', roleId: roleIds.LOGISTICS_OFFICER, baseId: baseIds['OC-003'] },
    ];

    const userIds = {};
    for (const user of users) {
      const result = await client.query(
        `INSERT INTO users (name, email, password_hash, employee_id, role_id, base_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
         ON CONFLICT (email) DO UPDATE SET name = $1, password_hash = $3
         RETURNING id, email`,
        [user.name, user.email, password, user.employeeId, user.roleId, user.baseId]
      );
      userIds[result.rows[0].email] = result.rows[0].id;
    }
    logger.info('Users seeded');

    // ──────────────────────────────────────────────
    // 4. ASSETS
    // ──────────────────────────────────────────────
    const assets = [
      { assetCode: 'AST-VEH-001', name: 'HMMWV M1151', category: 'Vehicle', assetType: 'Tactical Vehicle', serialNumber: 'VEH-SN-20240001', status: 'ACTIVE', baseId: baseIds['FA-001'], purchaseValue: 220000 },
      { assetCode: 'AST-VEH-002', name: 'LMTV M1078', category: 'Vehicle', assetType: 'Transport Vehicle', serialNumber: 'VEH-SN-20240002', status: 'IN_STORAGE', baseId: baseIds['FA-001'], purchaseValue: 185000 },
      { assetCode: 'AST-COM-001', name: 'AN/PRC-152A Radio', category: 'Communications', assetType: 'Handheld Radio', serialNumber: 'COM-SN-20240001', status: 'ASSIGNED', baseId: baseIds['FA-001'], purchaseValue: 12500 },
      { assetCode: 'AST-COM-002', name: 'AN/PRC-117G Radio', category: 'Communications', assetType: 'Manpack Radio', serialNumber: 'COM-SN-20240002', status: 'ACTIVE', baseId: baseIds['CB-002'], purchaseValue: 32000 },
      { assetCode: 'AST-WPN-001', name: 'Night Vision Goggles AN/PVS-14', category: 'Optics', assetType: 'Night Vision', serialNumber: 'OPT-SN-20240001', status: 'IN_STORAGE', baseId: baseIds['CB-002'], purchaseValue: 3200 },
      { assetCode: 'AST-MED-001', name: 'Field Medical Kit MK-7', category: 'Medical', assetType: 'Medical Equipment', serialNumber: 'MED-SN-20240001', status: 'ACTIVE', baseId: baseIds['OC-003'], purchaseValue: 4500 },
      { assetCode: 'AST-GEN-001', name: 'MEP-831A Generator 3kW', category: 'Power', assetType: 'Generator', serialNumber: 'GEN-SN-20240001', status: 'MAINTENANCE', baseId: baseIds['OC-003'], purchaseValue: 18000 },
      { assetCode: 'AST-IT-001', name: 'Toughbook CF-33', category: 'IT Equipment', assetType: 'Laptop', serialNumber: 'IT-SN-20240001', status: 'ACTIVE', baseId: baseIds['FA-001'], purchaseValue: 4200 },
      { assetCode: 'AST-IT-002', name: 'Satellite Phone Iridium 9575', category: 'Communications', assetType: 'Satellite Phone', serialNumber: 'COM-SN-20240003', status: 'IN_STORAGE', baseId: baseIds['CB-002'], purchaseValue: 1800 },
      { assetCode: 'AST-VEH-003', name: 'M-ATV MRAP', category: 'Vehicle', assetType: 'Armored Vehicle', serialNumber: 'VEH-SN-20240003', status: 'RETIRED', baseId: baseIds['OC-003'], purchaseValue: 470000 },
    ];

    const assetIds = {};
    for (const asset of assets) {
      const result = await client.query(
        `INSERT INTO assets (asset_code, name, category, asset_type, serial_number, status, current_base_id, purchase_date, purchase_value)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (asset_code) DO UPDATE SET name = $2, status = $6
         RETURNING id, asset_code`,
        [asset.assetCode, asset.name, asset.category, asset.assetType, asset.serialNumber,
         asset.status, asset.baseId, '2024-01-15', asset.purchaseValue]
      );
      assetIds[result.rows[0].asset_code] = result.rows[0].id;
    }
    logger.info('Assets seeded');

    // ──────────────────────────────────────────────
    // 5. PURCHASES
    // ──────────────────────────────────────────────
    const purchases = [
      { purchaseNumber: 'PUR-20240115-SEED01', assetId: assetIds['AST-VEH-001'], quantity: 1, vendor: 'AM General LLC', purchaseDate: '2024-01-15', unitPrice: 220000, totalAmount: 220000, baseId: baseIds['FA-001'], createdBy: userIds['admin@assetflow.mil'] },
      { purchaseNumber: 'PUR-20240115-SEED02', assetId: assetIds['AST-COM-001'], quantity: 5, vendor: 'L3Harris Technologies', purchaseDate: '2024-02-10', unitPrice: 12500, totalAmount: 62500, baseId: baseIds['FA-001'], createdBy: userIds['brown@assetflow.mil'] },
      { purchaseNumber: 'PUR-20240310-SEED03', assetId: assetIds['AST-MED-001'], quantity: 10, vendor: 'North American Rescue', purchaseDate: '2024-03-10', unitPrice: 4500, totalAmount: 45000, baseId: baseIds['OC-003'], createdBy: userIds['wilson@assetflow.mil'] },
      { purchaseNumber: 'PUR-20240420-SEED04', assetId: assetIds['AST-IT-001'], quantity: 3, vendor: 'Panasonic Corporation', purchaseDate: '2024-04-20', unitPrice: 4200, totalAmount: 12600, baseId: baseIds['FA-001'], createdBy: userIds['brown@assetflow.mil'] },
    ];

    const purchaseIds = {};
    for (const p of purchases) {
      const result = await client.query(
        `INSERT INTO purchases (purchase_number, asset_id, quantity, vendor, purchase_date, unit_price, total_amount, base_id, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'COMPLETED', $9)
         ON CONFLICT (purchase_number) DO NOTHING
         RETURNING id, purchase_number`,
        [p.purchaseNumber, p.assetId, p.quantity, p.vendor, p.purchaseDate, p.unitPrice, p.totalAmount, p.baseId, p.createdBy]
      );
      if (result.rows[0]) {
        purchaseIds[result.rows[0].purchase_number] = result.rows[0].id;
      }
    }
    logger.info('Purchases seeded');

    // ──────────────────────────────────────────────
    // 6. TRANSFERS
    // ──────────────────────────────────────────────
    const transfers = [
      {
        transferNumber: 'TRF-20240501-SEED01',
        assetId: assetIds['AST-IT-002'],
        sourceBaseId: baseIds['CB-002'],
        destinationBaseId: baseIds['FA-001'],
        requestedBy: userIds['chen@assetflow.mil'],
        reason: 'Satellite communication equipment needed for upcoming field exercise',
        transferDate: '2024-05-01',
        status: 'PENDING',
      },
      {
        transferNumber: 'TRF-20240315-SEED02',
        assetId: assetIds['AST-VEH-002'],
        sourceBaseId: baseIds['FA-001'],
        destinationBaseId: baseIds['OC-003'],
        requestedBy: userIds['mitchell@assetflow.mil'],
        reason: 'Transport vehicle required for supply operations at outpost',
        transferDate: '2024-03-15',
        status: 'COMPLETED',
        completedAt: '2024-03-20',
        approvedBy: userIds['admin@assetflow.mil'],
      },
    ];

    for (const t of transfers) {
      await client.query(
        `INSERT INTO transfers (transfer_number, asset_id, source_base_id, destination_base_id, requested_by, approved_by, reason, transfer_date, status, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (transfer_number) DO NOTHING`,
        [t.transferNumber, t.assetId, t.sourceBaseId, t.destinationBaseId, t.requestedBy,
         t.approvedBy || null, t.reason, t.transferDate, t.status, t.completedAt || null]
      );
    }
    logger.info('Transfers seeded');

    // ──────────────────────────────────────────────
    // 7. ASSIGNMENTS
    // ──────────────────────────────────────────────
    const assignments = [
      {
        assetId: assetIds['AST-COM-001'],
        userId: userIds['brown@assetflow.mil'],
        baseId: baseIds['FA-001'],
        assignedBy: userIds['mitchell@assetflow.mil'],
        assignedAt: '2024-04-01',
        status: 'ACTIVE',
        notes: 'Assigned for field communications during Operation Sentinel',
      },
      {
        assetId: assetIds['AST-IT-001'],
        userId: userIds['mitchell@assetflow.mil'],
        baseId: baseIds['FA-001'],
        assignedBy: userIds['admin@assetflow.mil'],
        assignedAt: '2024-02-15',
        expectedReturnAt: '2024-08-15',
        returnedAt: '2024-07-20',
        status: 'RETURNED',
        notes: 'Returned after quarterly review period',
      },
    ];

    for (const a of assignments) {
      await client.query(
        `INSERT INTO assignments (asset_id, user_id, base_id, assigned_by, assigned_at, expected_return_at, returned_at, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [a.assetId, a.userId, a.baseId, a.assignedBy, a.assignedAt,
         a.expectedReturnAt || null, a.returnedAt || null, a.status, a.notes || null]
      );
    }
    logger.info('Assignments seeded');

    // ──────────────────────────────────────────────
    // 8. EXPENSES
    // ──────────────────────────────────────────────
    const expenses = [
      { expenseNumber: 'EXP-20240601-SEED01', assetId: assetIds['AST-VEH-001'], baseId: baseIds['FA-001'], expenseType: 'MAINTENANCE', description: 'Quarterly engine maintenance and oil change', amount: 2500, expenseDate: '2024-06-01', recordedBy: userIds['brown@assetflow.mil'] },
      { expenseNumber: 'EXP-20240701-SEED02', assetId: assetIds['AST-GEN-001'], baseId: baseIds['OC-003'], expenseType: 'REPAIR', description: 'Generator alternator replacement', amount: 4800, expenseDate: '2024-07-01', recordedBy: userIds['wilson@assetflow.mil'] },
      { expenseNumber: 'EXP-20240815-SEED03', assetId: assetIds['AST-COM-002'], baseId: baseIds['CB-002'], expenseType: 'UPGRADE', description: 'Firmware upgrade and antenna replacement', amount: 1200, expenseDate: '2024-08-15', recordedBy: userIds['davis@assetflow.mil'] },
    ];

    for (const e of expenses) {
      await client.query(
        `INSERT INTO expenses (expense_number, asset_id, base_id, expense_type, description, amount, expense_date, recorded_by, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'RECORDED')
         ON CONFLICT (expense_number) DO NOTHING`,
        [e.expenseNumber, e.assetId, e.baseId, e.expenseType, e.description, e.amount, e.expenseDate, e.recordedBy]
      );
    }
    logger.info('Expenses seeded');

    // ──────────────────────────────────────────────
    // 9. TRANSACTIONS (Audit)
    // ──────────────────────────────────────────────
    const transactions = [
      { transactionType: 'ASSET_CREATED', assetId: assetIds['AST-VEH-001'], userId: userIds['admin@assetflow.mil'], baseId: baseIds['FA-001'], description: 'Asset HMMWV M1151 created' },
      { transactionType: 'ASSET_PURCHASED', assetId: assetIds['AST-VEH-001'], userId: userIds['admin@assetflow.mil'], baseId: baseIds['FA-001'], description: 'HMMWV M1151 purchased from AM General LLC' },
      { transactionType: 'ASSET_ASSIGNED', assetId: assetIds['AST-COM-001'], userId: userIds['brown@assetflow.mil'], baseId: baseIds['FA-001'], description: 'AN/PRC-152A Radio assigned to Lt. Marcus Brown' },
      { transactionType: 'ASSET_TRANSFER_REQUESTED', assetId: assetIds['AST-IT-002'], userId: userIds['chen@assetflow.mil'], baseId: baseIds['CB-002'], description: 'Transfer request for Satellite Phone to Fort Alpha' },
      { transactionType: 'EXPENSE_ADDED', assetId: assetIds['AST-VEH-001'], userId: userIds['brown@assetflow.mil'], baseId: baseIds['FA-001'], description: 'Maintenance expense recorded for HMMWV M1151' },
      { transactionType: 'ASSET_RETURNED', assetId: assetIds['AST-IT-001'], userId: userIds['mitchell@assetflow.mil'], baseId: baseIds['FA-001'], description: 'Toughbook CF-33 returned by Col. James Mitchell' },
      { transactionType: 'ASSET_RETIRED', assetId: assetIds['AST-VEH-003'], userId: userIds['admin@assetflow.mil'], baseId: baseIds['OC-003'], description: 'M-ATV MRAP retired from service' },
    ];

    for (const tx of transactions) {
      await client.query(
        `INSERT INTO transactions (transaction_type, asset_id, user_id, base_id, description)
         VALUES ($1, $2, $3, $4, $5)`,
        [tx.transactionType, tx.assetId, tx.userId, tx.baseId, tx.description]
      );
    }
    logger.info('Transactions seeded');

    await client.query('COMMIT');
    logger.info('All seed data inserted successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Seed failed', err);
    throw err;
  } finally {
    client.release();
  }
};

// Run seed if executed directly
if (require.main === module) {
  const env = require('../../src/config/env');
  const seedMongoData = require('../migrations/migrate-pg-to-mongo');

  if (env.mongodbUri && !env.mongodbUri.includes('your_mongodb_atlas_connection_string')) {
    logger.info('Detected MONGODB_URI. Seeding MongoDB Atlas...');
    seedMongoData()
      .then(() => process.exit(0))
      .catch((err) => {
        logger.error('Seed error:', err);
        process.exit(1);
      });
  } else {
    seed()
      .then(() => {
        logger.info('Seeding complete');
        process.exit(0);
      })
      .catch((err) => {
        logger.error('Seed error', err);
        process.exit(1);
      });
  }
}

module.exports = seed;
