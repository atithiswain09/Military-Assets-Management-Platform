import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, ShieldCheck, UserCheck, Warehouse,
  ShoppingCart, ArrowLeftRight, DollarSign, MapPin, Loader2,
} from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import { AssetBarChart, AssetPieChart, TrendAreaChart, MovementLineChart } from '../components/dashboard/AssetChart';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import ActivityTimeline from '../components/dashboard/ActivityTimeline';
import { fetchDashboardData, fetchPurchases, fetchTransfers } from '../services/api';
import { formatCurrency, formatNumber } from '../utils/formatters';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [recentTransfers, setRecentTransfers] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [dbData, purchases, transfers] = await Promise.all([
          fetchDashboardData(),
          fetchPurchases({ limit: 5 }),
          fetchTransfers({ limit: 5 }),
        ]);
        if (dbData) setDashboardData(dbData);
        if (purchases) setRecentPurchases(purchases);
        if (transfers) setRecentTransfers(transfers);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const statsData = dashboardData?.stats || {
    totalAssets: 0,
    activeAssets: 0,
    assignedAssets: 0,
    inStorage: 0,
    totalPurchases: 0,
    totalTransfers: 0,
    totalExpenditure: 0,
    activeBases: 0,
  };

  const chartInfo = dashboardData?.chartData || {
    assetStatusDistribution: [],
    assetsByBase: [],
    purchaseTrends: [],
    expenditureTrends: [],
    assetMovement: [],
    assetsByType: [],
  };

  const transactions = dashboardData?.recentTransactions || [];

  const stats = [
    { title: 'Total Assets', value: formatNumber(statsData.totalAssets), icon: Package, color: 'navy', onClick: () => navigate('/assets') },
    { title: 'Active Assets', value: formatNumber(statsData.activeAssets), icon: ShieldCheck, color: 'emerald', trend: 5.2, trendLabel: 'vs last month' },
    { title: 'Assets Assigned', value: formatNumber(statsData.assignedAssets), icon: UserCheck, color: 'blue', onClick: () => navigate('/assignments') },
    { title: 'Assets in Storage', value: formatNumber(statsData.inStorage), icon: Warehouse, color: 'slate' },
    { title: 'Total Purchases', value: formatNumber(statsData.totalPurchases), icon: ShoppingCart, color: 'violet', onClick: () => navigate('/purchases') },
    { title: 'Total Transfers', value: formatNumber(statsData.totalTransfers), icon: ArrowLeftRight, color: 'sky', onClick: () => navigate('/transfers') },
    { title: 'Total Expenditure', value: formatCurrency(statsData.totalExpenditure), icon: DollarSign, color: 'amber', onClick: () => navigate('/expenses') },
    { title: 'Active Bases', value: formatNumber(statsData.activeBases), icon: MapPin, color: 'emerald' },
  ];

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-navy-600" />
        <span className="ml-3 text-slate-600 font-medium">Loading operational metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Operational Overview</h2>
        <p className="text-sm text-slate-500 mt-1">Real-time asset and logistics summary across all bases</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AssetPieChart
          data={chartInfo.assetStatusDistribution}
          title="Asset Status Distribution"
        />
        <AssetBarChart
          data={chartInfo.assetsByBase}
          title="Assets by Base"
          dataKey="assets"
          nameKey="name"
        />
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TrendAreaChart
          data={chartInfo.purchaseTrends}
          title="Purchase Trends (6 months)"
          formatter={(v) => formatCurrency(v)}
          color="#2563eb"
        />
        <MovementLineChart
          data={chartInfo.assetMovement}
          title="Asset Movement Activity"
        />
      </div>

      {/* Charts row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AssetPieChart
          data={chartInfo.assetsByType}
          title="Assets by Category"
        />
        <TrendAreaChart
          data={chartInfo.expenditureTrends}
          title="Expenditure Trends (6 months)"
          formatter={(v) => formatCurrency(v)}
          color="#d97706"
        />
      </div>

      {/* Recent activity section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentTransactions transactions={transactions} />
        <ActivityTimeline activities={transactions} />
      </div>

      {/* Recent operations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Purchases */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Recent Purchases</h3>
            <button
              onClick={() => navigate('/purchases')}
              className="text-xs text-navy-600 hover:text-navy-800 font-medium"
            >
              View all →
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentPurchases.length === 0 ? (
              <p className="p-4 text-xs text-slate-400">No purchases found.</p>
            ) : (
              recentPurchases.slice(0, 4).map((p) => (
                <div key={p.id} className="px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{p.asset}</p>
                      <p className="text-xs text-slate-500">{p.vendor} · {p.base}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(p.totalCost)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transfers */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Recent Transfers</h3>
            <button
              onClick={() => navigate('/transfers')}
              className="text-xs text-navy-600 hover:text-navy-800 font-medium"
            >
              View all →
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentTransfers.length === 0 ? (
              <p className="p-4 text-xs text-slate-400">No transfers found.</p>
            ) : (
              recentTransfers.slice(0, 4).map((t) => (
                <div key={t.id} className="px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{t.asset}</p>
                      <p className="text-xs text-slate-500">{t.sourceBase} → {t.destinationBase}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      t.status === 'Completed' ? 'bg-blue-50 text-blue-700' :
                      t.status === 'In Transit' ? 'bg-amber-50 text-amber-700' :
                      t.status === 'Pending' ? 'bg-yellow-50 text-yellow-700' :
                      t.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{t.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
