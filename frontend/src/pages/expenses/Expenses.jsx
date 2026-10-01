import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, Eye, DollarSign, Loader2 } from 'lucide-react';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Input, { Select, Textarea } from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Drawer from '../../components/common/Drawer';
import { fetchExpenses, fetchAssets } from '../../services/api';
import { expenseApi } from '../../api/expenseApi';
import { BASES, EXPENSE_TYPES, EXPENSE_STATUSES } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { searchFilter, paginate } from '../../utils/helpers';
import { useAuth } from '../../hooks/useAuth';

const Expenses = () => {
  const { hasPermission } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [baseFilter, setBaseFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [formError, setFormError] = useState('');
  const perPage = 10;

  // Form input states
  const [formData, setFormData] = useState({
    assetId: '',
    expenseType: EXPENSE_TYPES[0],
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [expData, astData] = await Promise.all([
        fetchExpenses(),
        fetchAssets(),
      ]);
      setExpenses(expData);
      setAvailableAssets(astData);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    let result = expenses;
    result = searchFilter(result, search, ['id', 'asset', 'assetId', 'expenseType', 'description', 'base', 'recordedBy']);
    if (typeFilter) result = result.filter((e) => e.expenseType === typeFilter);
    if (statusFilter) result = result.filter((e) => e.status === statusFilter);
    if (baseFilter) result = result.filter((e) => e.base === baseFilter);
    return result;
  }, [expenses, search, typeFilter, statusFilter, baseFilter]);

  const paginatedData = paginate(filteredData, currentPage, perPage);
  const totalExpenditure = filteredData.reduce((sum, e) => sum + (e.amount || 0), 0);
  const approvedTotal = filteredData.filter((e) => e.status === 'Approved' || e.status === 'Paid' || e.status === 'Recorded').reduce((sum, e) => sum + (e.amount || 0), 0);
  const pendingTotal = filteredData.filter((e) => e.status === 'Pending').reduce((sum, e) => sum + (e.amount || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const targetAsset = availableAssets.find((a) => a.id === formData.assetId || a.assetCode === formData.assetId);
      if (!targetAsset) throw new Error('Selected asset was not found');

      const payload = {
        asset_id: targetAsset.id,
        base_id: targetAsset.baseId || BASES[0].id,
        expense_type: formData.expenseType,
        description: formData.description,
        amount: parseFloat(formData.amount),
        expense_date: formData.expenseDate,
      };

      const res = await expenseApi.createExpense(payload);
      if (res?.success) {
        setShowForm(false);
        setToast('Expense recorded successfully!');
        loadData();
        setTimeout(() => setToast(null), 3000);
      } else {
        setFormError(res?.message || 'Failed to record expense');
      }
    } catch (err) {
      setFormError(err.message || 'Error recording expense');
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'Expense ID', minWidth: '100px', render: (val) => <span className="font-mono text-xs text-navy-700 font-medium">{val}</span> },
    { key: 'asset', label: 'Asset', minWidth: '200px', render: (val, row) => (
      <div>
        <p className="font-medium text-slate-900 text-sm">{val}</p>
        <p className="text-xs text-slate-500 font-mono">{row.assetId}</p>
      </div>
    )},
    { key: 'expenseType', label: 'Type', minWidth: '100px' },
    { key: 'description', label: 'Description', minWidth: '200px', render: (val) => <span className="text-slate-600 text-xs">{val}</span> },
    { key: 'amount', label: 'Amount', minWidth: '110px', render: (val) => <span className="font-semibold text-slate-900">{formatCurrency(val)}</span> },
    { key: 'date', label: 'Date', minWidth: '100px', render: (val) => formatDate(val) },
    { key: 'base', label: 'Base', minWidth: '120px' },
    { key: 'status', label: 'Status', minWidth: '90px', render: (val) => <StatusBadge status={val} /> },
    { key: 'actions', label: '', sortable: false, minWidth: '50px', render: (_, row) => (
      <button onClick={(e) => { e.stopPropagation(); setSelectedExpense(row); }} className="p-1.5 rounded-md text-slate-400 hover:text-navy-600 hover:bg-navy-50 transition-colors">
        <Eye size={15} />
      </button>
    )},
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {toast && <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg animate-slide-in text-sm font-medium">{toast}</div>}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><DollarSign size={18} className="text-amber-600" /></div>
            <div><p className="text-sm text-slate-500">Total Expenditure</p><p className="text-xl font-bold text-slate-900">{formatCurrency(totalExpenditure)}</p></div>
          </div>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Approved / Paid</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(approvedTotal)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500">Pending</p>
          <p className="text-xl font-bold text-yellow-600 mt-1">{formatCurrency(pendingTotal)}</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Expenditures</h2>
          <p className="text-sm text-slate-500">{filteredData.length} expense records</p>
        </div>
        {hasPermission('expenses', 'create') && (
          <Button icon={Plus} onClick={() => setShowForm(true)}>Record Expense</Button>
        )}
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search expenses..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:bg-white transition-all" />
          </div>
          <Button variant={showFilters ? 'primary' : 'secondary'} icon={Filter} onClick={() => setShowFilters(!showFilters)}>Filters</Button>
        </div>
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select label="Expense Type" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">All Types</option>
              {EXPENSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Select label="Status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">All</option>
              {Object.values(EXPENSE_STATUSES).map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select label="Base" value={baseFilter} onChange={(e) => { setBaseFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">All Bases</option>
              {BASES.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
            </Select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <Table columns={columns} data={paginatedData.data} onRowClick={(row) => setSelectedExpense(row)} />
        <div className="px-4 pb-4">
          <Pagination currentPage={paginatedData.currentPage} totalPages={paginatedData.totalPages} totalItems={paginatedData.totalItems} perPage={perPage} onPageChange={setCurrentPage} />
        </div>
      </div>

      {/* Expense Form */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Record Expense" size="lg" footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button loading={formLoading} onClick={handleSubmit}>Record Expense</Button>
        </div>
      }>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Asset"
            required
            value={formData.assetId}
            onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
          >
            <option value="">Select asset</option>
            {availableAssets.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.assetCode || a.id})</option>
            ))}
          </Select>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Expense Type"
              required
              value={formData.expenseType}
              onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })}
            >
              <option value="">Select type</option>
              {EXPENSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Input
              label="Amount ($)"
              type="number"
              required
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
            <Input
              label="Date"
              type="date"
              required
              value={formData.expenseDate}
              onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
            />
          </div>
          <Textarea
            label="Description"
            required
            placeholder="Describe the expense..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {formError}
            </div>
          )}
        </form>
      </Modal>

      {/* Detail Drawer */}
      <Drawer isOpen={!!selectedExpense} onClose={() => setSelectedExpense(null)} title="Expense Details" width="lg">
        {selectedExpense && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{selectedExpense.asset}</h3>
                <p className="text-sm text-slate-500 font-mono">{selectedExpense.id}</p>
              </div>
              <StatusBadge status={selectedExpense.status} size="md" />
            </div>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-center">
              <p className="text-sm text-amber-700">Expense Amount</p>
              <p className="text-2xl font-bold text-amber-800">{formatCurrency(selectedExpense.amount)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><p className="text-xs text-slate-500">Asset ID</p><p className="text-sm font-medium font-mono">{selectedExpense.assetId}</p></div>
              <div className="space-y-1"><p className="text-xs text-slate-500">Type</p><p className="text-sm font-medium">{selectedExpense.expenseType}</p></div>
              <div className="space-y-1"><p className="text-xs text-slate-500">Date</p><p className="text-sm font-medium">{formatDate(selectedExpense.date)}</p></div>
              <div className="space-y-1"><p className="text-xs text-slate-500">Base</p><p className="text-sm font-medium">{selectedExpense.base}</p></div>
              <div className="space-y-1"><p className="text-xs text-slate-500">Recorded By</p><p className="text-sm font-medium">{selectedExpense.recordedBy}</p></div>
              <div className="space-y-1 col-span-2"><p className="text-xs text-slate-500">Description</p><p className="text-sm text-slate-600">{selectedExpense.description}</p></div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Expenses;
