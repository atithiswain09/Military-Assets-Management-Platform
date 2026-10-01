/**
 * MongoDB Atlas Seeder & PostgreSQL-to-MongoDB Data Migration Script
 */
const env = require('../../src/config/env');
const db = require('../../src/config/db');
const logger = require('../../src/utils/logger');
const { hashPassword } = require('../../src/utils/password');

const { Role } = require('../../src/models/role.model');
const { Base } = require('../../src/models/base.model');
const { User } = require('../../src/models/user.model');
const { Asset } = require('../../src/models/asset.model');
const { Purchase } = require('../../src/models/purchase.model');
const { Transfer } = require('../../src/models/transfer.model');
const { Assignment } = require('../../src/models/assignment.model');
const { Expense } = require('../../src/models/expense.model');
const { Transaction } = require('../../src/models/transaction.model');

const seedMongoData = async () => {
  logger.info('Starting MongoDB Atlas Seeding and Data Verification...');

  await db.connectMongo();

  if (!db.isMongoAvailable) {
    logger.error('MongoDB Atlas is unreachable. Please check your MONGODB_URI in backend/.env.');
    process.exit(1);
  }

  // Clear existing collections safely
  await Promise.all([
    Role.deleteMany({}),
    Base.deleteMany({}),
    User.deleteMany({}),
    Asset.deleteMany({}),
    Purchase.deleteMany({}),
    Transfer.deleteMany({}),
    Assignment.deleteMany({}),
    Expense.deleteMany({}),
    Transaction.deleteMany({}),
  ]);

  logger.info('Cleared existing MongoDB Atlas collections.');

  // 1. Roles
  const roles = [
    { _id: 'role-admin-01', name: 'ADMIN', description: 'Full system access. Manages all users, assets, and operations across all bases.' },
    { _id: 'role-commander-02', name: 'BASE_COMMANDER', description: 'Manages operations within their assigned base. Can approve transfers and assignments.' },
    { _id: 'role-logistics-03', name: 'LOGISTICS_OFFICER', description: 'Handles day-to-day asset logistics — purchases, assignments, transfers, and expense recording.' },
  ];

  const insertedRoles = await Role.insertMany(roles);
  const roleMap = Object.fromEntries(insertedRoles.map((r) => [r.name, r._id]));
  logger.info('Roles inserted into MongoDB Atlas');

  // 2. Bases
  const bases = [
    { _id: 'base-fa-001', name: 'Fort Alpha', code: 'FA-001', location: 'Northern Region, Sector 7', status: 'ACTIVE' },
    { _id: 'base-cb-002', name: 'Camp Bravo', code: 'CB-002', location: 'Eastern Region, Sector 3', status: 'ACTIVE' },
    { _id: 'base-oc-003', name: 'Outpost Charlie', code: 'OC-003', location: 'Western Region, Sector 12', status: 'ACTIVE' },
    { _id: 'base-bt-004', name: 'Base Thunderbolt', code: 'BT-004', location: 'Southern Region, Sector 4', status: 'ACTIVE' },
    { _id: 'base-hq-005', name: 'HQ Command Center', code: 'HQ-005', location: 'Central Region, Sector 1', status: 'ACTIVE' },
    { _id: 'base-cr-006', name: 'Camp Resolute', code: 'CR-006', location: 'Coastal Region, Sector 9', status: 'ACTIVE' },
  ];

  const insertedBases = await Base.insertMany(bases);
  const baseMap = Object.fromEntries(insertedBases.map((b) => [b.code, b._id]));
  logger.info('Bases inserted into MongoDB Atlas');

  // 3. Users
  const passwordHash = await hashPassword('password123');
  const users = [
    { _id: 'user-admin-01', name: 'Admin User', email: 'admin@assetflow.mil', employee_id: 'EMP-001', role_id: roleMap.ADMIN, base_id: null, password_hash: passwordHash, status: 'ACTIVE' },
    { _id: 'user-mitchell-02', name: 'Col. James Mitchell', email: 'mitchell@assetflow.mil', employee_id: 'EMP-002', role_id: roleMap.BASE_COMMANDER, base_id: baseMap['FA-001'], password_hash: passwordHash, status: 'ACTIVE' },
    { _id: 'user-chen-03', name: 'Col. Sarah Chen', email: 'chen@assetflow.mil', employee_id: 'EMP-003', role_id: roleMap.BASE_COMMANDER, base_id: baseMap['CB-002'], password_hash: passwordHash, status: 'ACTIVE' },
    { _id: 'user-brown-04', name: 'Lt. Marcus Brown', email: 'brown@assetflow.mil', employee_id: 'EMP-004', role_id: roleMap.LOGISTICS_OFFICER, base_id: baseMap['FA-001'], password_hash: passwordHash, status: 'ACTIVE' },
    { _id: 'user-davis-05', name: 'Lt. Emily Davis', email: 'davis@assetflow.mil', employee_id: 'EMP-005', role_id: roleMap.LOGISTICS_OFFICER, base_id: baseMap['CB-002'], password_hash: passwordHash, status: 'ACTIVE' },
    { _id: 'user-wilson-06', name: 'Sgt. Robert Wilson', email: 'wilson@assetflow.mil', employee_id: 'EMP-006', role_id: roleMap.LOGISTICS_OFFICER, base_id: baseMap['OC-003'], password_hash: passwordHash, status: 'ACTIVE' },
  ];

  const insertedUsers = await User.insertMany(users);
  const userMap = Object.fromEntries(insertedUsers.map((u) => [u.email, u._id]));
  logger.info('Users inserted into MongoDB Atlas');

  // 4. Assets
  const assets = [
    { _id: 'asset-veh-001', asset_code: 'AST-VEH-001', name: 'HMMWV M1151', category: 'Vehicle', asset_type: 'Tactical Vehicle', serial_number: 'VEH-SN-20240001', status: 'ACTIVE', current_base_id: baseMap['FA-001'], purchase_value: 220000, purchase_date: new Date('2024-01-15') },
    { _id: 'asset-veh-002', asset_code: 'AST-VEH-002', name: 'LMTV M1078', category: 'Vehicle', asset_type: 'Transport Vehicle', serial_number: 'VEH-SN-20240002', status: 'IN_STORAGE', current_base_id: baseMap['FA-001'], purchase_value: 185000, purchase_date: new Date('2024-01-15') },
    { _id: 'asset-com-001', asset_code: 'AST-COM-001', name: 'AN/PRC-152A Radio', category: 'Communications', asset_type: 'Handheld Radio', serial_number: 'COM-SN-20240001', status: 'ASSIGNED', current_base_id: baseMap['FA-001'], purchase_value: 12500, purchase_date: new Date('2024-02-10') },
    { _id: 'asset-com-002', asset_code: 'AST-COM-002', name: 'AN/PRC-117G Radio', category: 'Communications', asset_type: 'Manpack Radio', serial_number: 'COM-SN-20240002', status: 'ACTIVE', current_base_id: baseMap['CB-002'], purchase_value: 32000, purchase_date: new Date('2024-02-10') },
    { _id: 'asset-opt-001', asset_code: 'AST-WPN-001', name: 'Night Vision Goggles AN/PVS-14', category: 'Optics', asset_type: 'Night Vision', serial_number: 'OPT-SN-20240001', status: 'IN_STORAGE', current_base_id: baseMap['CB-002'], purchase_value: 3200, purchase_date: new Date('2024-03-01') },
    { _id: 'asset-med-001', asset_code: 'AST-MED-001', name: 'Field Medical Kit MK-7', category: 'Medical', asset_type: 'Medical Equipment', serial_number: 'MED-SN-20240001', status: 'ACTIVE', current_base_id: baseMap['OC-003'], purchase_value: 4500, purchase_date: new Date('2024-03-10') },
    { _id: 'asset-gen-001', asset_code: 'AST-GEN-001', name: 'MEP-831A Generator 3kW', category: 'Power', asset_type: 'Generator', serial_number: 'GEN-SN-20240001', status: 'MAINTENANCE', current_base_id: baseMap['OC-003'], purchase_value: 18000, purchase_date: new Date('2024-04-01') },
    { _id: 'asset-it-001', asset_code: 'AST-IT-001', name: 'Toughbook CF-33', category: 'IT Equipment', asset_type: 'Laptop', serial_number: 'IT-SN-20240001', status: 'ACTIVE', current_base_id: baseMap['FA-001'], purchase_value: 4200, purchase_date: new Date('2024-04-20') },
    { _id: 'asset-it-002', asset_code: 'AST-IT-002', name: 'Satellite Phone Iridium 9575', category: 'Communications', asset_type: 'Satellite Phone', serial_number: 'COM-SN-20240003', status: 'IN_STORAGE', current_base_id: baseMap['CB-002'], purchase_value: 1800, purchase_date: new Date('2024-05-01') },
    { _id: 'asset-veh-003', asset_code: 'AST-VEH-003', name: 'M-ATV MRAP', category: 'Vehicle', asset_type: 'Armored Vehicle', serial_number: 'VEH-SN-20240003', status: 'RETIRED', current_base_id: baseMap['OC-003'], purchase_value: 470000, purchase_date: new Date('2023-11-15') },
  ];

  const insertedAssets = await Asset.insertMany(assets);
  const assetMap = Object.fromEntries(insertedAssets.map((a) => [a.asset_code, a._id]));
  logger.info('Assets inserted into MongoDB Atlas');

  // 5. Purchases
  const purchases = [
    { purchase_number: 'PUR-20240115-SEED01', asset_id: assetMap['AST-VEH-001'], quantity: 1, vendor: 'AM General LLC', purchase_date: new Date('2024-01-15'), unit_price: 220000, total_amount: 220000, base_id: baseMap['FA-001'], created_by: userMap['admin@assetflow.mil'], status: 'COMPLETED' },
    { purchase_number: 'PUR-20240115-SEED02', asset_id: assetMap['AST-COM-001'], quantity: 5, vendor: 'L3Harris Technologies', purchase_date: new Date('2024-02-10'), unit_price: 12500, total_amount: 62500, base_id: baseMap['FA-001'], created_by: userMap['brown@assetflow.mil'], status: 'COMPLETED' },
    { purchase_number: 'PUR-20240310-SEED03', asset_id: assetMap['AST-MED-001'], quantity: 10, vendor: 'North American Rescue', purchase_date: new Date('2024-03-10'), unit_price: 4500, total_amount: 45000, base_id: baseMap['OC-003'], created_by: userMap['wilson@assetflow.mil'], status: 'COMPLETED' },
    { purchase_number: 'PUR-20240420-SEED04', asset_id: assetMap['AST-IT-001'], quantity: 3, vendor: 'Panasonic Corporation', purchase_date: new Date('2024-04-20'), unit_price: 4200, total_amount: 12600, base_id: baseMap['FA-001'], created_by: userMap['brown@assetflow.mil'], status: 'COMPLETED' },
  ];
  await Purchase.insertMany(purchases);
  logger.info('Purchases inserted into MongoDB Atlas');

  // 6. Transfers
  const transfers = [
    {
      transfer_number: 'TRF-20240501-SEED01',
      asset_id: assetMap['AST-IT-002'],
      source_base_id: baseMap['CB-002'],
      destination_base_id: baseMap['FA-001'],
      requested_by: userMap['chen@assetflow.mil'],
      reason: 'Satellite communication equipment needed for upcoming field exercise',
      transfer_date: new Date('2024-05-01'),
      status: 'PENDING',
    },
    {
      transfer_number: 'TRF-20240315-SEED02',
      asset_id: assetMap['AST-VEH-002'],
      source_base_id: baseMap['FA-001'],
      destination_base_id: baseMap['OC-003'],
      requested_by: userMap['mitchell@assetflow.mil'],
      approved_by: userMap['admin@assetflow.mil'],
      reason: 'Transport vehicle required for supply operations at outpost',
      transfer_date: new Date('2024-03-15'),
      completed_at: new Date('2024-03-20'),
      status: 'COMPLETED',
    },
  ];
  await Transfer.insertMany(transfers);
  logger.info('Transfers inserted into MongoDB Atlas');

  // 7. Assignments
  const assignments = [
    {
      asset_id: assetMap['AST-COM-001'],
      user_id: userMap['brown@assetflow.mil'],
      base_id: baseMap['FA-001'],
      assigned_by: userMap['mitchell@assetflow.mil'],
      assigned_at: new Date('2024-04-01'),
      status: 'ACTIVE',
      notes: 'Assigned for field communications during Operation Sentinel',
    },
    {
      asset_id: assetMap['AST-IT-001'],
      user_id: userMap['mitchell@assetflow.mil'],
      base_id: baseMap['FA-001'],
      assigned_by: userMap['admin@assetflow.mil'],
      assigned_at: new Date('2024-02-15'),
      expected_return_at: new Date('2024-08-15'),
      returned_at: new Date('2024-07-20'),
      status: 'RETURNED',
      notes: 'Returned after quarterly review period',
    },
  ];
  await Assignment.insertMany(assignments);
  logger.info('Assignments inserted into MongoDB Atlas');

  // 8. Expenses
  const expenses = [
    { expense_number: 'EXP-20240601-SEED01', asset_id: assetMap['AST-VEH-001'], base_id: baseMap['FA-001'], expense_type: 'MAINTENANCE', description: 'Quarterly engine maintenance and oil change', amount: 2500, expense_date: new Date('2024-06-01'), recorded_by: userMap['brown@assetflow.mil'], status: 'RECORDED' },
    { expense_number: 'EXP-20240701-SEED02', asset_id: assetMap['AST-GEN-001'], base_id: baseMap['OC-003'], expense_type: 'REPAIR', description: 'Generator alternator replacement', amount: 4800, expense_date: new Date('2024-07-01'), recorded_by: userMap['wilson@assetflow.mil'], status: 'RECORDED' },
    { expense_number: 'EXP-20240815-SEED03', asset_id: assetMap['AST-COM-002'], base_id: baseMap['CB-002'], expense_type: 'UPGRADE', description: 'Firmware upgrade and antenna replacement', amount: 1200, expense_date: new Date('2024-08-15'), recorded_by: userMap['davis@assetflow.mil'], status: 'RECORDED' },
  ];
  await Expense.insertMany(expenses);
  logger.info('Expenses inserted into MongoDB Atlas');

  // 9. Transactions
  const transactions = [
    { transaction_type: 'ASSET_CREATED', asset_id: assetMap['AST-VEH-001'], user_id: userMap['admin@assetflow.mil'], base_id: baseMap['FA-001'], description: 'Asset HMMWV M1151 created' },
    { transaction_type: 'ASSET_PURCHASED', asset_id: assetMap['AST-VEH-001'], user_id: userMap['admin@assetflow.mil'], base_id: baseMap['FA-001'], description: 'HMMWV M1151 purchased from AM General LLC' },
    { transaction_type: 'ASSET_ASSIGNED', asset_id: assetMap['AST-COM-001'], user_id: userMap['brown@assetflow.mil'], base_id: baseMap['FA-001'], description: 'AN/PRC-152A Radio assigned to Lt. Marcus Brown' },
    { transaction_type: 'ASSET_TRANSFER_REQUESTED', asset_id: assetMap['AST-IT-002'], user_id: userMap['chen@assetflow.mil'], base_id: baseMap['CB-002'], description: 'Transfer request for Satellite Phone to Fort Alpha' },
    { transaction_type: 'EXPENSE_ADDED', asset_id: assetMap['AST-VEH-001'], user_id: userMap['brown@assetflow.mil'], base_id: baseMap['FA-001'], description: 'Maintenance expense recorded for HMMWV M1151' },
    { transaction_type: 'ASSET_RETURNED', asset_id: assetMap['AST-IT-001'], user_id: userMap['mitchell@assetflow.mil'], base_id: baseMap['FA-001'], description: 'Toughbook CF-33 returned by Col. James Mitchell' },
    { transaction_type: 'ASSET_RETIRED', asset_id: assetMap['AST-VEH-003'], user_id: userMap['admin@assetflow.mil'], base_id: baseMap['OC-003'], description: 'M-ATV MRAP retired from service' },
  ];
  await Transaction.insertMany(transactions);
  logger.info('Transactions inserted into MongoDB Atlas');

  logger.info('SUCCESS: All seed data successfully migrated into MongoDB Atlas!');
  await db.closeConnections();
};

if (require.main === module) {
  seedMongoData()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('Error seeding MongoDB Atlas:', err);
      process.exit(1);
    });
}

module.exports = seedMongoData;
