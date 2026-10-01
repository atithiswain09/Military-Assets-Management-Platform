/**
 * AssetFlow Database Migration
 * Creates all tables in dependency order with proper constraints, indexes, and checks.
 */
const { pool } = require('../../src/config/db');
const logger = require('../../src/utils/logger');

const migration = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Enable uuid-ossp extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // ──────────────────────────────────────────────
    // 1. ROLES
    // ──────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // ──────────────────────────────────────────────
    // 2. BASES
    // ──────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS bases (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        location TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // ──────────────────────────────────────────────
    // 3. USERS
    // ──────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        role_id UUID NOT NULL REFERENCES roles(id),
        base_id UUID REFERENCES bases(id),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        employee_id VARCHAR(100) NOT NULL UNIQUE,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
        last_login_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // ──────────────────────────────────────────────
    // 4. ASSETS
    // ──────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        asset_code VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        asset_type VARCHAR(100) NOT NULL,
        serial_number VARCHAR(255) NOT NULL UNIQUE,
        status VARCHAR(20) NOT NULL DEFAULT 'IN_STORAGE' CHECK (status IN ('ACTIVE', 'IN_STORAGE', 'ASSIGNED', 'IN_TRANSIT', 'MAINTENANCE', 'RETIRED')),
        current_base_id UUID NOT NULL REFERENCES bases(id),
        purchase_id UUID,
        purchase_date DATE,
        purchase_value NUMERIC(15,2) CHECK (purchase_value >= 0),
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // ──────────────────────────────────────────────
    // 5. PURCHASES
    // ──────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        purchase_number VARCHAR(100) NOT NULL UNIQUE,
        asset_id UUID REFERENCES assets(id),
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        vendor VARCHAR(255) NOT NULL,
        purchase_date DATE NOT NULL,
        unit_price NUMERIC(15,2) NOT NULL CHECK (unit_price >= 0),
        total_amount NUMERIC(15,2) NOT NULL CHECK (total_amount >= 0),
        base_id UUID NOT NULL REFERENCES bases(id),
        reference_number VARCHAR(100),
        status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
        notes TEXT,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // ──────────────────────────────────────────────
    // 6. TRANSFERS
    // ──────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS transfers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        transfer_number VARCHAR(100) NOT NULL UNIQUE,
        asset_id UUID NOT NULL REFERENCES assets(id),
        source_base_id UUID NOT NULL REFERENCES bases(id),
        destination_base_id UUID NOT NULL REFERENCES bases(id),
        requested_by UUID NOT NULL REFERENCES users(id),
        approved_by UUID REFERENCES users(id),
        reason TEXT NOT NULL,
        transfer_date DATE,
        completed_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CHECK (source_base_id != destination_base_id)
      )
    `);

    // ──────────────────────────────────────────────
    // 7. ASSIGNMENTS
    // ──────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        asset_id UUID NOT NULL REFERENCES assets(id),
        user_id UUID NOT NULL REFERENCES users(id),
        base_id UUID NOT NULL REFERENCES bases(id),
        assigned_by UUID NOT NULL REFERENCES users(id),
        assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        expected_return_at TIMESTAMP WITH TIME ZONE,
        returned_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RETURNED', 'CANCELLED')),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // ──────────────────────────────────────────────
    // 8. EXPENSES
    // ──────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        expense_number VARCHAR(100) NOT NULL UNIQUE,
        asset_id UUID NOT NULL REFERENCES assets(id),
        base_id UUID NOT NULL REFERENCES bases(id),
        expense_type VARCHAR(100) NOT NULL,
        description TEXT,
        amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
        expense_date DATE NOT NULL,
        recorded_by UUID NOT NULL REFERENCES users(id),
        status VARCHAR(20) NOT NULL DEFAULT 'RECORDED' CHECK (status IN ('RECORDED', 'APPROVED', 'CANCELLED')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // ──────────────────────────────────────────────
    // 9. TRANSACTIONS (Audit Trail)
    // ──────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
          'ASSET_CREATED', 'ASSET_UPDATED', 'ASSET_PURCHASED',
          'ASSET_TRANSFER_REQUESTED', 'ASSET_TRANSFERRED',
          'ASSET_ASSIGNED', 'ASSET_RETURNED',
          'EXPENSE_ADDED', 'ASSET_RETIRED'
        )),
        asset_id UUID REFERENCES assets(id),
        user_id UUID REFERENCES users(id),
        base_id UUID REFERENCES bases(id),
        reference_id UUID,
        reference_type VARCHAR(50),
        previous_state JSONB,
        new_state JSONB,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // ──────────────────────────────────────────────
    // 10. INDEXES
    // ──────────────────────────────────────────────

    // Users indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_base_id ON users(base_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)');

    // Assets indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_assets_asset_code ON assets(asset_code)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_assets_serial_number ON assets(serial_number)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_assets_current_base_id ON assets(current_base_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_assets_asset_type ON assets(asset_type)');

    // Purchases indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_purchases_purchase_number ON purchases(purchase_number)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases(purchase_date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_purchases_base_id ON purchases(base_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_purchases_asset_id ON purchases(asset_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status)');

    // Transfers indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_transfers_transfer_number ON transfers(transfer_number)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_transfers_asset_id ON transfers(asset_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_transfers_source_base_id ON transfers(source_base_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_transfers_destination_base_id ON transfers(destination_base_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status)');

    // Assignments indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_assignments_asset_id ON assignments(asset_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON assignments(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_assignments_base_id ON assignments(base_id)');

    // Expenses indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_expenses_asset_id ON expenses(asset_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_expenses_base_id ON expenses(base_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_expenses_expense_type ON expenses(expense_type)');

    // Transactions indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_asset_id ON transactions(asset_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_base_id ON transactions(base_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_transaction_type ON transactions(transaction_type)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_transactions_reference_id ON transactions(reference_id)');

    await client.query('COMMIT');
    logger.info('Database migration completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Database migration failed', err);
    throw err;
  } finally {
    client.release();
  }
};

// Run migration if executed directly
if (require.main === module) {
  migration()
    .then(() => {
      logger.info('Migration finished');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Migration error', err);
      process.exit(1);
    });
}

module.exports = migration;
