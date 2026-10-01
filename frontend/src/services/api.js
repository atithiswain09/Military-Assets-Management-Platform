import { assetApi } from '../api/assetApi';
import { purchaseApi } from '../api/purchaseApi';
import { transferApi } from '../api/transferApi';
import { assignmentApi } from '../api/assignmentApi';
import { expenseApi } from '../api/expenseApi';
import { transactionApi } from '../api/transactionApi';
import { userApi } from '../api/userApi';
import { reportApi } from '../api/reportApi';
import {
  normalizeAsset,
  normalizePurchase,
  normalizeTransfer,
  normalizeAssignment,
  normalizeExpense,
  normalizeTransaction,
  normalizeUser,
  formatStatus,
} from '../utils/normalizers';

// ─── Real Backend API Service Methods ──────────────────────────────

export const fetchAssets = async (params = {}) => {
  try {
    const res = await assetApi.getAssets(params);
    if (res?.success && Array.isArray(res.data)) {
      return res.data.map(normalizeAsset);
    }
    return [];
  } catch (err) {
    console.error('Error fetching assets from backend:', err);
    return [];
  }
};

export const fetchAssetById = async (id) => {
  try {
    const res = await assetApi.getAssetById(id);
    if (res?.success && res.data) {
      return normalizeAsset(res.data);
    }
    return null;
  } catch (err) {
    console.error(`Error fetching asset ${id}:`, err);
    return null;
  }
};

export const fetchPurchases = async (params = {}) => {
  try {
    const res = await purchaseApi.getPurchases(params);
    if (res?.success && Array.isArray(res.data)) {
      return res.data.map(normalizePurchase);
    }
    return [];
  } catch (err) {
    console.error('Error fetching purchases from backend:', err);
    return [];
  }
};

export const fetchTransfers = async (params = {}) => {
  try {
    const res = await transferApi.getTransfers(params);
    if (res?.success && Array.isArray(res.data)) {
      return res.data.map(normalizeTransfer);
    }
    return [];
  } catch (err) {
    console.error('Error fetching transfers from backend:', err);
    return [];
  }
};

export const fetchAssignments = async (params = {}) => {
  try {
    const res = await assignmentApi.getAssignments(params);
    if (res?.success && Array.isArray(res.data)) {
      return res.data.map(normalizeAssignment);
    }
    return [];
  } catch (err) {
    console.error('Error fetching assignments from backend:', err);
    return [];
  }
};

export const fetchExpenses = async (params = {}) => {
  try {
    const res = await expenseApi.getExpenses(params);
    if (res?.success && Array.isArray(res.data)) {
      return res.data.map(normalizeExpense);
    }
    return [];
  } catch (err) {
    console.error('Error fetching expenses from backend:', err);
    return [];
  }
};

export const fetchTransactions = async (params = {}) => {
  try {
    const res = await transactionApi.getTransactions(params);
    if (res?.success && Array.isArray(res.data)) {
      return res.data.map(normalizeTransaction);
    }
    return [];
  } catch (err) {
    console.error('Error fetching transactions from backend:', err);
    return [];
  }
};

export const fetchUsers = async (params = {}) => {
  try {
    const res = await userApi.getUsers(params);
    if (res?.success && Array.isArray(res.data)) {
      return res.data.map(normalizeUser);
    }
    return [];
  } catch (err) {
    console.error('Error fetching users from backend:', err);
    return [];
  }
};

export const fetchDashboardData = async () => {
  try {
    const res = await reportApi.getDashboardStats();
    if (res?.success && res.data) {
      const data = res.data;
      return {
        stats: {
          totalAssets: data.totalAssets || 0,
          activeAssets: data.activeAssets || 0,
          assignedAssets: data.assignedAssets || 0,
          inStorage: data.assetsInStorage || 0,
          totalPurchases: data.totalPurchases || 0,
          totalTransfers: data.totalTransfers || 0,
          totalExpenditure: data.totalExpenditure || 0,
          activeBases: data.activeBases || 0,
        },
        chartData: {
          assetStatusDistribution: (data.assetDistribution || []).map((item) => ({
            name: formatStatus(item.status),
            value: parseInt(item.count, 10),
            color:
              item.status === 'ACTIVE' ? '#059669' :
              item.status === 'ASSIGNED' ? '#2563eb' :
              item.status === 'IN_STORAGE' ? '#64748b' :
              item.status === 'MAINTENANCE' ? '#d97706' :
              item.status === 'IN_TRANSIT' ? '#8b5cf6' : '#dc2626',
          })),
          assetsByBase: (data.assetsByBase || []).map((item) => ({
            name: item.base_name,
            assets: parseInt(item.asset_count, 10),
          })),
          purchaseTrends: (data.purchaseTrend || []).map((item) => ({
            month: item.month,
            amount: parseFloat(item.total),
          })),
          expenditureTrends: (data.expenditureTrend || []).map((item) => ({
            month: item.month,
            amount: parseFloat(item.total),
          })),
          assetMovement: (data.movementTrend || []).map((item) => ({
            month: item.month,
            transfers: parseInt(item.count, 10),
            assignments: Math.max(1, Math.floor(parseInt(item.count, 10) / 2)),
          })),
          assetsByType: (data.assetsByCategory || data.assetDistribution || []).map((item) => ({
            name: item.category || formatStatus(item.status),
            value: parseInt(item.count, 10),
          })),
        },
        recentTransactions: (data.recentTransactions || []).map(normalizeTransaction),
      };
    }
    return null;
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    return null;
  }
};

// ─── Legacy Mock Objects (for synchronous fallback initialization) ─
export const mockAssets = [];
export const mockPurchases = [];
export const mockTransfers = [];
export const mockAssignments = [];
export const mockExpenses = [];
export const mockTransactions = [];
export const mockUsers = [];
export const dashboardStats = {
  totalAssets: 0,
  activeAssets: 0,
  assignedAssets: 0,
  inStorage: 0,
  totalPurchases: 0,
  totalTransfers: 0,
  totalExpenditure: 0,
  activeBases: 0,
};
export const chartData = {
  assetsByType: [],
  assetsByBase: [],
  purchaseTrends: [],
  expenditureTrends: [],
  assetMovement: [],
  assetStatusDistribution: [],
};
