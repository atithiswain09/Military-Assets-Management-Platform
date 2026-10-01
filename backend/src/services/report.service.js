const db = require('../config/db');
const { Asset } = require('../models/asset.model');
const { Purchase } = require('../models/purchase.model');
const { Transfer } = require('../models/transfer.model');
const { Expense } = require('../models/expense.model');
const { Transaction } = require('../models/transaction.model');
const { Assignment } = require('../models/assignment.model');
const { Base } = require('../models/base.model');

/**
 * Report service — Aggregation & Metrics.
 * Supports both MongoDB Atlas Aggregations & PostgreSQL raw SQL fallback.
 */

const getDashboardStats = async (scopedBaseId) => {
  if (db.isMongoAvailable) {
    const assetMatch = scopedBaseId ? { current_base_id: scopedBaseId } : {};
    const purchaseMatch = scopedBaseId ? { base_id: scopedBaseId } : {};
    const transferMatch = scopedBaseId ? { $or: [{ source_base_id: scopedBaseId }, { destination_base_id: scopedBaseId }] } : {};
    const expenseMatch = scopedBaseId ? { base_id: scopedBaseId } : {};
    const txMatch = scopedBaseId ? { base_id: scopedBaseId } : {};

    const [
      totalAssets,
      activeAssets,
      assignedAssets,
      assetsInStorage,
      assetsInTransit,
      assetsInMaintenance,
      retiredAssets,
    ] = await Promise.all([
      Asset.countDocuments(assetMatch),
      Asset.countDocuments({ ...assetMatch, status: 'ACTIVE' }),
      Asset.countDocuments({ ...assetMatch, status: 'ASSIGNED' }),
      Asset.countDocuments({ ...assetMatch, status: 'IN_STORAGE' }),
      Asset.countDocuments({ ...assetMatch, status: 'IN_TRANSIT' }),
      Asset.countDocuments({ ...assetMatch, status: 'MAINTENANCE' }),
      Asset.countDocuments({ ...assetMatch, status: 'RETIRED' }),
    ]);

    const totalPurchases = await Purchase.countDocuments(purchaseMatch);
    const purchaseValAgg = await Purchase.aggregate([
      { $match: purchaseMatch },
      { $group: { _id: null, total: { $sum: '$total_amount' } } },
    ]);
    const totalPurchaseValue = purchaseValAgg[0]?.total || 0;

    const totalTransfers = await Transfer.countDocuments(transferMatch);
    const pendingTransfers = await Transfer.countDocuments({ ...transferMatch, status: 'PENDING' });
    const completedTransfers = await Transfer.countDocuments({ ...transferMatch, status: 'COMPLETED' });

    const expenseValAgg = await Expense.aggregate([
      { $match: expenseMatch },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalExpenditure = expenseValAgg[0]?.total || 0;

    const activeBases = await Base.countDocuments({ status: 'ACTIVE' });

    // Asset distribution by status
    const assetDistAgg = await Asset.aggregate([
      { $match: assetMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const assetDistribution = assetDistAgg.map((item) => ({ status: item._id, count: item.count }));

    // Assets by category
    const assetsCatAgg = await Asset.aggregate([
      { $match: assetMatch },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const assetsByCategory = assetsCatAgg.map((item) => ({ category: item._id || 'Unassigned', count: item.count }));

    // Assets by Base
    const allBases = await Base.find({ status: 'ACTIVE' }).lean();
    const assetsByBaseMap = {};
    for (const b of allBases) {
      if (!scopedBaseId || b._id === scopedBaseId) {
        assetsByBaseMap[b._id] = { base_name: b.name, base_code: b.code, asset_count: 0 };
      }
    }
    const assetsByBaseAgg = await Asset.aggregate([
      { $match: assetMatch },
      { $group: { _id: '$current_base_id', count: { $sum: 1 } } },
    ]);
    for (const item of assetsByBaseAgg) {
      if (assetsByBaseMap[item._id]) {
        assetsByBaseMap[item._id].asset_count = item.count;
      }
    }
    const assetsByBase = Object.values(assetsByBaseMap);

    // Purchase Trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const purchaseTrendAgg = await Purchase.aggregate([
      { $match: { ...purchaseMatch, purchase_date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$purchase_date' } },
          count: { $sum: 1 },
          total: { $sum: '$total_amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const purchaseTrend = purchaseTrendAgg.map((item) => ({ month: item._id, count: item.count, total: item.total }));

    // Movement Trend (last 6 months)
    const movementTrendAgg = await Transfer.aggregate([
      { $match: { ...transferMatch, created_at: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$created_at' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const movementTrend = movementTrendAgg.map((item) => ({ month: item._id, count: item.count }));

    // Expenditure Trend (last 6 months)
    const expenditureTrendAgg = await Expense.aggregate([
      { $match: { ...expenseMatch, expense_date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$expense_date' } },
          count: { $sum: 1 },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const expenditureTrend = expenditureTrendAgg.map((item) => ({ month: item._id, count: item.count, total: item.total }));

    // Recent Transactions
    const recentTxDocs = await Transaction.find(txMatch)
      .populate('asset_id')
      .populate('user_id')
      .populate('base_id')
      .sort({ created_at: -1 })
      .limit(10);

    const recentTransactions = recentTxDocs.map((tx) => {
      const doc = tx.toObject();
      const asset = doc.asset_id && typeof doc.asset_id === 'object' ? doc.asset_id : null;
      const user = doc.user_id && typeof doc.user_id === 'object' ? doc.user_id : null;
      const base = doc.base_id && typeof doc.base_id === 'object' ? doc.base_id : null;
      return {
        ...doc,
        id: doc._id,
        asset_name: asset ? asset.name : null,
        asset_code: asset ? asset.asset_code : null,
        user_name: user ? user.name : null,
        base_name: base ? base.name : null,
      };
    });

    return {
      totalAssets,
      activeAssets,
      assignedAssets,
      assetsInStorage,
      assetsInTransit,
      assetsInMaintenance,
      retiredAssets,
      totalPurchases,
      totalPurchaseValue,
      totalTransfers,
      pendingTransfers,
      completedTransfers,
      totalExpenditure,
      activeBases,
      assetDistribution,
      assetsByCategory,
      assetsByBase,
      purchaseTrend,
      movementTrend,
      expenditureTrend,
      recentTransactions,
    };
  }

  // PostgreSQL fallback
  const baseFilter = scopedBaseId ? 'WHERE current_base_id = $1' : '';
  const baseFilterPurchase = scopedBaseId ? 'WHERE p.base_id = $1' : '';
  const baseFilterTransfer = scopedBaseId ? 'WHERE (t.source_base_id = $1 OR t.destination_base_id = $1)' : '';
  const baseFilterExpense = scopedBaseId ? 'WHERE e.base_id = $1' : '';
  const baseFilterTx = scopedBaseId ? 'WHERE tx.base_id = $1' : '';
  const params = scopedBaseId ? [scopedBaseId] : [];

  const assetStats = await db.query(`
    SELECT
      COUNT(*) as total_assets,
      COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_assets,
      COUNT(*) FILTER (WHERE status = 'ASSIGNED') as assigned_assets,
      COUNT(*) FILTER (WHERE status = 'IN_STORAGE') as assets_in_storage,
      COUNT(*) FILTER (WHERE status = 'IN_TRANSIT') as assets_in_transit,
      COUNT(*) FILTER (WHERE status = 'MAINTENANCE') as assets_in_maintenance,
      COUNT(*) FILTER (WHERE status = 'RETIRED') as retired_assets
    FROM assets ${baseFilter}
  `, params);

  const purchaseStats = await db.query(`
    SELECT COUNT(*) as total_purchases, COALESCE(SUM(p.total_amount), 0) as total_purchase_value
    FROM purchases p ${baseFilterPurchase}
  `, params);

  const transferStats = await db.query(`
    SELECT COUNT(*) as total_transfers,
      COUNT(*) FILTER (WHERE t.status = 'PENDING') as pending_transfers,
      COUNT(*) FILTER (WHERE t.status = 'COMPLETED') as completed_transfers
    FROM transfers t ${baseFilterTransfer}
  `, params);

  const expenseStats = await db.query(`
    SELECT COALESCE(SUM(e.amount), 0) as total_expenditure
    FROM expenses e ${baseFilterExpense}
  `, params);

  const baseStats = await db.query(`SELECT COUNT(*) as active_bases FROM bases WHERE status = 'ACTIVE'`);
  const assetDistribution = await db.query(`SELECT status, COUNT(*) as count FROM assets ${baseFilter} GROUP BY status ORDER BY count DESC`, params);
  const assetsByCategory = await db.query(`SELECT category, COUNT(*) as count FROM assets ${baseFilter} GROUP BY category ORDER BY count DESC`, params);

  const assetsByBase = await db.query(`
    SELECT b.name as base_name, b.code as base_code, COUNT(a.id) as asset_count
    FROM bases b LEFT JOIN assets a ON a.current_base_id = b.id
    ${scopedBaseId ? 'WHERE b.id = $1' : ''}
    GROUP BY b.id, b.name, b.code ORDER BY asset_count DESC
  `, params);

  const purchaseTrend = await db.query(`
    SELECT TO_CHAR(p.purchase_date, 'YYYY-MM') as month,
      COUNT(*) as count, COALESCE(SUM(p.total_amount), 0) as total
    FROM purchases p
    ${baseFilterPurchase}
    ${scopedBaseId ? 'AND' : 'WHERE'} p.purchase_date >= NOW() - INTERVAL '6 months'
    GROUP BY month ORDER BY month
  `, params);

  const movementTrend = await db.query(`
    SELECT TO_CHAR(t.created_at, 'YYYY-MM') as month, COUNT(*) as count
    FROM transfers t
    ${baseFilterTransfer}
    ${scopedBaseId ? 'AND' : 'WHERE'} t.created_at >= NOW() - INTERVAL '6 months'
    GROUP BY month ORDER BY month
  `, params);

  const expenditureTrend = await db.query(`
    SELECT TO_CHAR(e.expense_date, 'YYYY-MM') as month,
      COUNT(*) as count, COALESCE(SUM(e.amount), 0) as total
    FROM expenses e
    ${baseFilterExpense}
    ${scopedBaseId ? 'AND' : 'WHERE'} e.expense_date >= NOW() - INTERVAL '6 months'
    GROUP BY month ORDER BY month
  `, params);

  const recentTransactions = await db.query(`
    SELECT tx.*, a.name as asset_name, a.asset_code, u.name as user_name, b.name as base_name
    FROM transactions tx
    LEFT JOIN assets a ON tx.asset_id = a.id
    LEFT JOIN users u ON tx.user_id = u.id
    LEFT JOIN bases b ON tx.base_id = b.id
    ${baseFilterTx}
    ORDER BY tx.created_at DESC LIMIT 10
  `, params);

  const stats = assetStats.rows[0];
  const pStats = purchaseStats.rows[0];
  const tStats = transferStats.rows[0];
  const eStats = expenseStats.rows[0];

  return {
    totalAssets: parseInt(stats.total_assets, 10),
    activeAssets: parseInt(stats.active_assets, 10),
    assignedAssets: parseInt(stats.assigned_assets, 10),
    assetsInStorage: parseInt(stats.assets_in_storage, 10),
    assetsInTransit: parseInt(stats.assets_in_transit, 10),
    assetsInMaintenance: parseInt(stats.assets_in_maintenance, 10),
    retiredAssets: parseInt(stats.retired_assets, 10),
    totalPurchases: parseInt(pStats.total_purchases, 10),
    totalPurchaseValue: parseFloat(pStats.total_purchase_value),
    totalTransfers: parseInt(tStats.total_transfers, 10),
    pendingTransfers: parseInt(tStats.pending_transfers, 10),
    completedTransfers: parseInt(tStats.completed_transfers, 10),
    totalExpenditure: parseFloat(eStats.total_expenditure),
    activeBases: parseInt(baseStats.rows[0].active_bases, 10),
    assetDistribution: assetDistribution.rows,
    assetsByCategory: assetsByCategory.rows,
    assetsByBase: assetsByBase.rows,
    purchaseTrend: purchaseTrend.rows,
    movementTrend: movementTrend.rows,
    expenditureTrend: expenditureTrend.rows,
    recentTransactions: recentTransactions.rows,
  };
};

const getAssetReport = async (scopedBaseId) => {
  if (db.isMongoAvailable) {
    const match = scopedBaseId ? { current_base_id: scopedBaseId } : {};
    const agg = await Asset.aggregate([
      { $match: match },
      {
        $group: {
          _id: { category: '$category', asset_type: '$asset_type', status: '$status' },
          count: { $sum: 1 },
          total_value: { $sum: '$purchase_value' },
        },
      },
      { $sort: { count: -1 } },
    ]);
    return agg.map((i) => ({
      category: i._id.category,
      asset_type: i._id.asset_type,
      status: i._id.status,
      count: i.count,
      total_value: i.total_value,
    }));
  }
  const params = scopedBaseId ? [scopedBaseId] : [];
  const baseFilter = scopedBaseId ? 'WHERE a.current_base_id = $1' : '';
  const result = await db.query(`
    SELECT a.category, a.asset_type, a.status,
      COUNT(*) as count, COALESCE(SUM(a.purchase_value), 0) as total_value
    FROM assets a ${baseFilter}
    GROUP BY a.category, a.asset_type, a.status
    ORDER BY count DESC
  `, params);
  return result.rows;
};

const getPurchaseReport = async (scopedBaseId) => {
  if (db.isMongoAvailable) {
    const match = scopedBaseId ? { base_id: scopedBaseId } : {};
    const agg = await Purchase.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            month: { $dateToString: { format: '%Y-%m', date: '$purchase_date' } },
            vendor: '$vendor',
          },
          count: { $sum: 1 },
          total_amount: { $sum: '$total_amount' },
        },
      },
      { $sort: { '_id.month': -1, total_amount: -1 } },
    ]);
    return agg.map((i) => ({
      month: i._id.month,
      vendor: i._id.vendor,
      count: i.count,
      total_amount: i.total_amount,
    }));
  }
  const params = scopedBaseId ? [scopedBaseId] : [];
  const baseFilter = scopedBaseId ? 'WHERE p.base_id = $1' : '';
  const result = await db.query(`
    SELECT TO_CHAR(p.purchase_date, 'YYYY-MM') as month,
      p.vendor, COUNT(*) as count,
      COALESCE(SUM(p.total_amount), 0) as total_amount
    FROM purchases p ${baseFilter}
    GROUP BY month, p.vendor ORDER BY month DESC, total_amount DESC
  `, params);
  return result.rows;
};

const getTransferReport = async (scopedBaseId) => {
  if (db.isMongoAvailable) {
    const match = scopedBaseId ? { $or: [{ source_base_id: scopedBaseId }, { destination_base_id: scopedBaseId }] } : {};
    const agg = await Transfer.aggregate([
      { $match: match },
      {
        $group: {
          _id: { status: '$status', source: '$source_base_id', dest: '$destination_base_id' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);
    const bases = await Base.find().lean();
    const baseMap = Object.fromEntries(bases.map((b) => [b._id, b.name]));

    return agg.map((i) => ({
      status: i._id.status,
      count: i.count,
      source_base: baseMap[i._id.source] || null,
      destination_base: baseMap[i._id.dest] || null,
    }));
  }
  const params = scopedBaseId ? [scopedBaseId] : [];
  const baseFilter = scopedBaseId ? 'WHERE (t.source_base_id = $1 OR t.destination_base_id = $1)' : '';
  const result = await db.query(`
    SELECT t.status, COUNT(*) as count,
      sb.name as source_base, db.name as destination_base
    FROM transfers t
    LEFT JOIN bases sb ON t.source_base_id = sb.id
    LEFT JOIN bases db ON t.destination_base_id = db.id
    ${baseFilter}
    GROUP BY t.status, sb.name, db.name ORDER BY count DESC
  `, params);
  return result.rows;
};

const getAssignmentReport = async (scopedBaseId) => {
  if (db.isMongoAvailable) {
    const match = scopedBaseId ? { base_id: scopedBaseId } : {};
    const agg = await Assignment.aggregate([
      { $match: match },
      { $group: { _id: { status: '$status', base_id: '$base_id' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const bases = await Base.find().lean();
    const baseMap = Object.fromEntries(bases.map((b) => [b._id, b.name]));

    return agg.map((i) => ({
      status: i._id.status,
      count: i.count,
      base_name: baseMap[i._id.base_id] || null,
    }));
  }
  const params = scopedBaseId ? [scopedBaseId] : [];
  const baseFilter = scopedBaseId ? 'WHERE asg.base_id = $1' : '';
  const result = await db.query(`
    SELECT asg.status, COUNT(*) as count,
      b.name as base_name
    FROM assignments asg
    LEFT JOIN bases b ON asg.base_id = b.id
    ${baseFilter}
    GROUP BY asg.status, b.name ORDER BY count DESC
  `, params);
  return result.rows;
};

const getExpenseReport = async (scopedBaseId) => {
  if (db.isMongoAvailable) {
    const match = scopedBaseId ? { base_id: scopedBaseId } : {};
    const agg = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: { expense_type: '$expense_type', base_id: '$base_id' },
          count: { $sum: 1 },
          total_amount: { $sum: '$amount' },
        },
      },
      { $sort: { total_amount: -1 } },
    ]);
    const bases = await Base.find().lean();
    const baseMap = Object.fromEntries(bases.map((b) => [b._id, b.name]));

    return agg.map((i) => ({
      expense_type: i._id.expense_type,
      count: i.count,
      total_amount: i.total_amount,
      base_name: baseMap[i._id.base_id] || null,
    }));
  }
  const params = scopedBaseId ? [scopedBaseId] : [];
  const baseFilter = scopedBaseId ? 'WHERE e.base_id = $1' : '';
  const result = await db.query(`
    SELECT e.expense_type, COUNT(*) as count,
      COALESCE(SUM(e.amount), 0) as total_amount,
      b.name as base_name
    FROM expenses e
    LEFT JOIN bases b ON e.base_id = b.id
    ${baseFilter}
    GROUP BY e.expense_type, b.name ORDER BY total_amount DESC
  `, params);
  return result.rows;
};

const getMovementReport = async (scopedBaseId) => {
  if (db.isMongoAvailable) {
    const match = scopedBaseId ? { base_id: scopedBaseId } : {};
    const agg = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            transaction_type: '$transaction_type',
            month: { $dateToString: { format: '%Y-%m', date: '$created_at' } },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': -1, count: -1 } },
    ]);
    return agg.map((i) => ({
      transaction_type: i._id.transaction_type,
      month: i._id.month,
      count: i.count,
    }));
  }
  const params = scopedBaseId ? [scopedBaseId] : [];
  const baseFilter = scopedBaseId ? 'WHERE tx.base_id = $1' : '';
  const result = await db.query(`
    SELECT tx.transaction_type, COUNT(*) as count,
      TO_CHAR(tx.created_at, 'YYYY-MM') as month
    FROM transactions tx
    ${baseFilter}
    GROUP BY tx.transaction_type, month ORDER BY month DESC, count DESC
  `, params);
  return result.rows;
};

module.exports = {
  getDashboardStats,
  getAssetReport,
  getPurchaseReport,
  getTransferReport,
  getAssignmentReport,
  getExpenseReport,
  getMovementReport,
};
