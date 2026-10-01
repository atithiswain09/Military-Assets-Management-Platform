import React, { useState, useEffect } from 'react';
import { Download, Filter, BarChart3, Package, ShoppingCart, ArrowLeftRight, UserCheck, DollarSign, TrendingUp, Loader2 } from 'lucide-react';
import { Select } from '../../components/common/Input';
import Button from '../../components/common/Button';
import { AssetBarChart, AssetPieChart, TrendAreaChart, MovementLineChart } from '../../components/dashboard/AssetChart';
import { fetchDashboardData, fetchAssets, fetchPurchases, fetchTransfers, fetchAssignments, fetchExpenses } from '../../services/api';
import { BASES, ASSET_TYPES } from '../../utils/constants';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';

const reportTabs = [
  { key: 'summary', label: 'Asset Summary', icon: Package },
  { key: 'distribution', label: 'Distribution', icon: BarChart3 },
  { key: 'purchases', label: 'Purchases', icon: ShoppingCart },
  { key: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
  { key: 'assignments', label: 'Assignments', icon: UserCheck },
  { key: 'expenditure', label: 'Expenditure', icon: DollarSign },
  { key: 'movement', label: 'Movement', icon: TrendingUp },
];

const Reports = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [dateRange, setDateRange] = useState('6m');
  const [baseFilter, setBaseFilter] = useState('');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const [dbStats, setDbStats] = useState(null);
  const [assets, setAssets] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        const [dashData, aData, pData, tData, asgData, expData] = await Promise.all([
          fetchDashboardData(),
          fetchAssets(),
          fetchPurchases(),
          fetchTransfers(),
          fetchAssignments(),
          fetchExpenses(),
        ]);
        if (dashData) setDbStats(dashData);
        if (aData) setAssets(aData);
        if (pData) setPurchases(pData);
        if (tData) setTransfers(tData);
        if (asgData) setAssignments(asgData);
        if (expData) setExpenses(expData);
      } catch (err) {
        console.error('Failed to load report data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, []);

  const handleExport = (format) => {
    setToast(`Generating ${format.toUpperCase()} report...`);
    setTimeout(() => setToast(null), 2000);
  };

  const totalPurchaseValue = purchases.reduce((sum, p) => sum + (p.totalCost || 0), 0);
  const totalExpenseValue = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-4 animate-fade-in">
      {toast && <div className="fixed top-20 right-6 z-50 bg-navy-700 text-white px-4 py-3 rounded-lg shadow-lg animate-slide-in text-sm font-medium">{toast}</div>}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reports</h2>
          <p className="text-sm text-slate-500">Analytics and operational reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={Download} size="sm" onClick={() => handleExport('csv')}>CSV</Button>
          <Button variant="outline" icon={Download} size="sm" onClick={() => handleExport('pdf')}>PDF</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select label="Date Range" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
            <option value="all">All Time</option>
          </Select>
          <Select label="Base" value={baseFilter} onChange={(e) => setBaseFilter(e.target.value)}>
            <option value="">All Bases</option>
            {BASES.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
          </Select>
          <Select label="Asset Type">
            <option value="">All Types</option>
            {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
      </div>

      {/* Report tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {reportTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-navy-700 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report content */}
      {loading ? (
        <div className="card p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-navy-600" size={24} />
          <p className="text-sm font-medium">Loading report analytics...</p>
        </div>
      ) : (
        <>
          {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4"><p className="text-sm text-slate-500">Total Assets</p><p className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(assets.length)}</p></div>
            <div className="card p-4"><p className="text-sm text-slate-500">Active Assets</p><p className="text-2xl font-bold text-emerald-600 mt-1">{formatNumber(assets.filter(a => a.status === 'Active').length)}</p></div>
            <div className="card p-4"><p className="text-sm text-slate-500">Total Procurement Value</p><p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalPurchaseValue)}</p></div>
            <div className="card p-4"><p className="text-sm text-slate-500">Total Expenditure</p><p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(totalExpenseValue)}</p></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AssetPieChart data={dbStats?.chartData?.assetStatusDistribution || []} title="Asset Status Distribution" />
            <AssetBarChart data={dbStats?.chartData?.assetsByBase || []} title="Assets by Base" dataKey="assets" />
          </div>
          {/* Summary table */}
          <div className="card overflow-hidden">
            <div className="card-header"><h3 className="text-sm font-semibold text-slate-700">Asset Inventory Summary</h3></div>
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Count</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Active</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Assigned</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Value</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {ASSET_TYPES.filter((t) => assets.some((a) => a.type === t)).map((type) => {
                  const typeAssets = assets.filter((a) => a.type === type);
                  return (
                    <tr key={type} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{type}</td>
                      <td className="px-4 py-3 text-slate-600">{typeAssets.length}</td>
                      <td className="px-4 py-3 text-slate-600">{typeAssets.filter((a) => a.status === 'Active').length}</td>
                      <td className="px-4 py-3 text-slate-600">{typeAssets.filter((a) => a.status === 'Assigned').length}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{formatCurrency(typeAssets.reduce((s, a) => s + (a.purchaseValue || 0), 0))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'distribution' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AssetPieChart data={dbStats?.chartData?.assetsByType || []} title="Assets by Category" />
          <AssetBarChart data={dbStats?.chartData?.assetsByBase || []} title="Assets by Base" dataKey="assets" />
          <AssetPieChart data={dbStats?.chartData?.assetStatusDistribution || []} title="Assets by Status" />
        </div>
      )}

      {activeTab === 'purchases' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-4"><p className="text-sm text-slate-500">Total Purchases</p><p className="text-2xl font-bold text-slate-900 mt-1">{purchases.length}</p></div>
            <div className="card p-4"><p className="text-sm text-slate-500">Total Value</p><p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalPurchaseValue)}</p></div>
            <div className="card p-4"><p className="text-sm text-slate-500">Pending Orders</p><p className="text-2xl font-bold text-yellow-600 mt-1">{purchases.filter((p) => p.status === 'Pending').length}</p></div>
          </div>
          <TrendAreaChart data={dbStats?.chartData?.purchaseTrends || []} title="Purchase Value Trends" formatter={(v) => formatCurrency(v)} color="#2563eb" />
        </div>
      )}

      {activeTab === 'transfers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="card p-4"><p className="text-sm text-slate-500">Total</p><p className="text-2xl font-bold text-slate-900 mt-1">{transfers.length}</p></div>
            <div className="card p-4"><p className="text-sm text-slate-500">Completed</p><p className="text-2xl font-bold text-blue-600 mt-1">{transfers.filter((t) => t.status === 'Completed').length}</p></div>
            <div className="card p-4"><p className="text-sm text-slate-500">In Transit</p><p className="text-2xl font-bold text-amber-600 mt-1">{transfers.filter((t) => t.status === 'In Transit').length}</p></div>
            <div className="card p-4"><p className="text-sm text-slate-500">Pending</p><p className="text-2xl font-bold text-yellow-600 mt-1">{transfers.filter((t) => t.status === 'Pending').length}</p></div>
          </div>
          <MovementLineChart data={dbStats?.chartData?.assetMovement || []} title="Transfer & Assignment Activity" />
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-4"><p className="text-sm text-slate-500">Total Assignments</p><p className="text-2xl font-bold text-slate-900 mt-1">{assignments.length}</p></div>
            <div className="card p-4"><p className="text-sm text-slate-500">Active</p><p className="text-2xl font-bold text-emerald-600 mt-1">{assignments.filter((a) => a.status === 'Active').length}</p></div>
            <div className="card p-4"><p className="text-sm text-slate-500">Overdue</p><p className="text-2xl font-bold text-red-600 mt-1">{assignments.filter((a) => a.status === 'Overdue').length}</p></div>
          </div>
        </div>
      )}

      {activeTab === 'expenditure' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-4"><p className="text-sm text-slate-500">Total Expenditure</p><p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totalExpenseValue)}</p></div>
            <div className="card p-4"><p className="text-sm text-slate-500">Approved</p><p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(expenses.filter((e) => e.status === 'Approved' || e.status === 'Paid' || e.status === 'Recorded').reduce((s, e) => s + (e.amount || 0), 0))}</p></div>
            <div className="card p-4"><p className="text-sm text-slate-500">Pending</p><p className="text-2xl font-bold text-yellow-600 mt-1">{formatCurrency(expenses.filter((e) => e.status === 'Pending').reduce((s, e) => s + (e.amount || 0), 0))}</p></div>
          </div>
          <TrendAreaChart data={dbStats?.chartData?.expenditureTrends || []} title="Expenditure Trends" formatter={(v) => formatCurrency(v)} color="#d97706" />
        </div>
      )}

      {activeTab === 'movement' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-4">
              <p className="text-sm text-slate-500">Transfers Executed</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(transfers.length)}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-slate-500">Active Assignments</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{formatNumber(assignments.length)}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-slate-500">Assets In Transit</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {formatNumber(transfers.filter((t) => t.status === 'In Transit' || t.status === 'PENDING').length)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MovementLineChart data={dbStats?.chartData?.assetMovement || []} title="Asset Movement Over Time" />
            <TrendAreaChart data={dbStats?.chartData?.purchaseTrends || []} title="Procurement Activity" formatter={(v) => formatCurrency(v)} color="#273c6b" />
          </div>

          {/* Movement Log Table */}
          <div className="card overflow-hidden">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Recent Movement Log</h3>
            </div>
            {transfers.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No movement data available</div>
            ) : (
              <div className="table-wrapper">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Transfer #</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Asset</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">From Base</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">To Base</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transfers.slice(0, 10).map((t) => (
                      <tr key={t.id || t.transfer_number} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{t.transferNumber || t.transfer_number || t.id}</td>
                        <td className="px-4 py-3 text-slate-600">{t.assetName || t.asset_name || t.assetId || t.asset_id}</td>
                        <td className="px-4 py-3 text-slate-600">{t.sourceBaseName || t.source_base_name || t.sourceBaseId || 'Base HQ'}</td>
                        <td className="px-4 py-3 text-slate-600">{t.destinationBaseName || t.destination_base_name || t.destinationBaseId || 'Forward Post'}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(t.transferDate || t.transfer_date || t.created_at)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              t.status === 'Completed' || t.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : t.status === 'In Transit' || t.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {t.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default Reports;
