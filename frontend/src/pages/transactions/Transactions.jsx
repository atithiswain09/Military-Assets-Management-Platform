import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Clock, Loader2 } from 'lucide-react';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import { Select } from '../../components/common/Input';
import { fetchTransactions } from '../../services/api';
import { BASES } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';
import { searchFilter, paginate, getActionColor } from '../../utils/helpers';

const actionTypes = [
  'Asset Purchased', 'Asset Transferred', 'Asset Assigned',
  'Asset Returned', 'Expense Added', 'Asset Updated',
  'Asset Retired', 'Transfer Approved', 'Assignment Created',
];

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [baseFilter, setBaseFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'timeline'
  const perPage = 10;

  useEffect(() => {
    const loadTx = async () => {
      setLoading(true);
      try {
        const data = await fetchTransactions();
        setTransactions(data);
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
      } finally {
        setLoading(false);
      }
    };
    loadTx();
  }, []);

  const filteredData = useMemo(() => {
    let result = transactions;
    result = searchFilter(result, search, ['id', 'action', 'asset', 'assetId', 'user', 'base', 'details']);
    if (actionFilter) result = result.filter((t) => t.action === actionFilter);
    if (baseFilter) result = result.filter((t) => t.base === baseFilter);
    return result;
  }, [transactions, search, actionFilter, baseFilter]);

  const paginatedData = paginate(filteredData, currentPage, perPage);

  const columns = [
    { key: 'id', label: 'Transaction ID', minWidth: '100px', render: (val) => <span className="font-mono text-xs text-navy-700 font-medium">{val}</span> },
    { key: 'action', label: 'Action', minWidth: '150px', render: (val) => (
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full shrink-0 ${getActionColor(val)}`} />
        <span className="font-medium text-sm text-slate-800">{val}</span>
      </div>
    )},
    { key: 'asset', label: 'Asset', minWidth: '200px', render: (val, row) => (
      <div>
        <p className="text-sm text-slate-800">{val}</p>
        <p className="text-xs text-slate-500 font-mono">{row.assetId}</p>
      </div>
    )},
    { key: 'user', label: 'User', minWidth: '140px' },
    { key: 'base', label: 'Base', minWidth: '120px' },
    { key: 'previousState', label: 'Previous', minWidth: '120px', render: (val) => val ? <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{val}</span> : <span className="text-slate-300">—</span> },
    { key: 'newState', label: 'New State', minWidth: '140px', render: (val) => val ? <span className="text-xs text-navy-700 bg-navy-50 px-2 py-0.5 rounded font-medium">{val}</span> : <span className="text-slate-300">—</span> },
    { key: 'date', label: 'Timestamp', minWidth: '160px', render: (val) => <span className="text-xs text-slate-600">{formatDateTime(val)}</span> },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Audit Trail</h2>
          <p className="text-sm text-slate-500">{filteredData.length} transaction records</p>
        </div>
        <div className="flex gap-2">
          <Button variant={viewMode === 'table' ? 'primary' : 'secondary'} size="sm" onClick={() => setViewMode('table')}>Table</Button>
          <Button variant={viewMode === 'timeline' ? 'primary' : 'secondary'} size="sm" icon={Clock} onClick={() => setViewMode('timeline')}>Timeline</Button>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search transactions..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:bg-white transition-all" />
          </div>
          <Button variant={showFilters ? 'primary' : 'secondary'} icon={Filter} onClick={() => setShowFilters(!showFilters)}>Filters</Button>
        </div>
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Action Type" value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">All Actions</option>
              {actionTypes.map((a) => <option key={a} value={a}>{a}</option>)}
            </Select>
            <Select label="Base" value={baseFilter} onChange={(e) => { setBaseFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">All Bases</option>
              {BASES.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
            </Select>
          </div>
        )}
      </div>

      {/* Table view */}
      {viewMode === 'table' && (
        <div className="card overflow-hidden">
          <Table columns={columns} data={paginatedData.data} />
          <div className="px-4 pb-4">
            <Pagination currentPage={paginatedData.currentPage} totalPages={paginatedData.totalPages} totalItems={paginatedData.totalItems} perPage={perPage} onPageChange={setCurrentPage} />
          </div>
        </div>
      )}

      {/* Timeline view */}
      {viewMode === 'timeline' && (
        <div className="card p-6">
          <div className="space-y-0">
            {filteredData.map((txn, idx) => (
              <div key={txn.id} className="flex gap-4 pb-6 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full shrink-0 mt-1.5 ${getActionColor(txn.action)}`} />
                  {idx < filteredData.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{txn.action}</p>
                      <p className="text-sm text-slate-700 mt-0.5">{txn.asset}</p>
                      <p className="text-xs text-slate-500 mt-1">{txn.details}</p>
                      <p className="text-xs text-slate-400 mt-1.5">by {txn.user} · {txn.base}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate-500">{formatDateTime(txn.date)}</p>
                      <p className="text-2xs text-slate-400 font-mono mt-0.5">{txn.id}</p>
                      {txn.previousState && txn.newState && (
                        <div className="mt-2 text-xs">
                          <span className="text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{txn.previousState}</span>
                          <span className="mx-1 text-slate-300">→</span>
                          <span className="text-navy-700 bg-navy-50 px-1.5 py-0.5 rounded font-medium">{txn.newState}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
