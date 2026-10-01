import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, Eye, RotateCcw } from 'lucide-react';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Input, { Select, Textarea } from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Drawer from '../../components/common/Drawer';
import { ConfirmDialog } from '../../components/common/Modal';
import { fetchAssignments, fetchAssets, fetchUsers } from '../../services/api';
import { assignmentApi } from '../../api/assignmentApi';
import { BASES, ASSIGNMENT_STATUSES } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import { searchFilter, paginate } from '../../utils/helpers';
import { useAuth } from '../../hooks/useAuth';

const Assignments = () => {
  const { hasPermission } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [baseFilter, setBaseFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [formError, setFormError] = useState('');
  const perPage = 10;

  // Form inputs
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [asgData, astData, usrData] = await Promise.all([
        fetchAssignments(),
        fetchAssets(),
        fetchUsers(),
      ]);
      setAssignments(asgData);
      setAvailableAssets(astData);
      setUsersList(usrData);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    let result = assignments;
    result = searchFilter(result, search, ['id', 'asset', 'assetId', 'personnel', 'personnelId', 'base']);
    if (statusFilter) result = result.filter((a) => a.status === statusFilter);
    if (baseFilter) result = result.filter((a) => a.base === baseFilter);
    return result;
  }, [assignments, search, statusFilter, baseFilter]);

  const paginatedData = paginate(filteredData, currentPage, perPage);

  const handleSubmit = () => {
    if (!selectedAssetId || !selectedUserId) {
      setFormError('Please select both an asset and a user.');
      return;
    }
    setFormError('');
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setFormLoading(true);
    setFormError('');

    try {
      const targetAsset = availableAssets.find((a) => a.id === selectedAssetId || a.assetCode === selectedAssetId);
      const targetUser = usersList.find((u) => u.id === selectedUserId);

      if (!targetAsset || !targetUser) throw new Error('Invalid asset or user selection');

      const payload = {
        asset_id: targetAsset.id,
        user_id: targetUser.id,
        base_id: targetAsset.baseId || BASES[0].id,
        assigned_at: new Date().toISOString().split('T')[0],
        expected_return_at: expectedReturn || null,
        notes,
      };

      const res = await assignmentApi.createAssignment(payload);
      if (res?.success) {
        setShowConfirm(false);
        setShowForm(false);
        setSelectedAssetId('');
        setSelectedUserId('');
        setExpectedReturn('');
        setNotes('');
        setToast('Assignment created successfully!');
        loadData();
        setTimeout(() => setToast(null), 3000);
      } else {
        setFormError(res?.message || 'Failed to create assignment');
      }
    } catch (err) {
      setFormError(err.message || 'Error creating assignment');
    } finally {
      setFormLoading(false);
    }
  };

  const handleReturnAsset = async (id) => {
    try {
      const res = await assignmentApi.returnAssignment(id);
      if (res?.success) {
        setToast('Asset marked as returned!');
        loadData();
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      alert(err.message || 'Failed to return asset');
    }
  };

  const activeCount = filteredData.filter((a) => a.status === 'Active').length;
  const overdueCount = filteredData.filter((a) => a.status === 'Overdue').length;

  const columns = [
    { key: 'id', label: 'ID', minWidth: '100px', render: (val) => <span className="font-mono text-xs text-navy-700 font-medium">{val}</span> },
    { key: 'asset', label: 'Asset', minWidth: '200px', render: (val, row) => (
      <div>
        <p className="font-medium text-slate-900 text-sm">{val}</p>
        <p className="text-xs text-slate-500 font-mono">{row.assetId}</p>
      </div>
    )},
    { key: 'personnel', label: 'Personnel', minWidth: '160px', render: (val, row) => (
      <div>
        <p className="text-sm text-slate-800">{val}</p>
        <p className="text-xs text-slate-500 font-mono">{row.personnelId}</p>
      </div>
    )},
    { key: 'base', label: 'Base', minWidth: '120px' },
    { key: 'assignmentDate', label: 'Assigned', minWidth: '100px', render: (val) => formatDate(val) },
    { key: 'expectedReturn', label: 'Return Date', minWidth: '100px', render: (val) => formatDate(val) },
    { key: 'status', label: 'Status', minWidth: '100px', render: (val) => <StatusBadge status={val} /> },
    { key: 'actions', label: '', sortable: false, minWidth: '50px', render: (_, row) => (
      <button onClick={(e) => { e.stopPropagation(); setSelectedAssignment(row); }} className="p-1.5 rounded-md text-slate-400 hover:text-navy-600 hover:bg-navy-50 transition-colors">
        <Eye size={15} />
      </button>
    )},
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {toast && <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg animate-slide-in text-sm font-medium">{toast}</div>}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4"><p className="text-sm text-slate-500">Total Assignments</p><p className="text-2xl font-bold text-slate-900 mt-1">{filteredData.length}</p></div>
        <div className="card p-4"><p className="text-sm text-slate-500">Active</p><p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p></div>
        <div className="card p-4"><p className="text-sm text-slate-500">Overdue</p><p className="text-2xl font-bold text-red-600 mt-1">{overdueCount}</p></div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Assignments</h2>
          <p className="text-sm text-slate-500">{filteredData.length} records</p>
        </div>
        {hasPermission('assignments', 'create') && (
          <Button icon={Plus} onClick={() => setShowForm(true)}>Assign Asset</Button>
        )}
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search assignments..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:bg-white transition-all" />
          </div>
          <Button variant={showFilters ? 'primary' : 'secondary'} icon={Filter} onClick={() => setShowFilters(!showFilters)}>Filters</Button>
        </div>
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">All</option>
              {Object.values(ASSIGNMENT_STATUSES).map((s) => <option key={s} value={s}>{s}</option>)}
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
        <Table columns={columns} data={paginatedData.data} onRowClick={(row) => setSelectedAssignment(row)} />
        <div className="px-4 pb-4">
          <Pagination currentPage={paginatedData.currentPage} totalPages={paginatedData.totalPages} totalItems={paginatedData.totalItems} perPage={perPage} onPageChange={setCurrentPage} />
        </div>
      </div>

      {/* Assign Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Assign Asset" size="lg" footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Assign Asset</Button>
        </div>
      }>
        <div className="space-y-4">
          <Select
            label="Asset"
            required
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
          >
            <option value="">Select asset</option>
            {availableAssets.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.assetCode || a.id})</option>
            ))}
          </Select>
          <Select
            label="Personnel / User"
            required
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
          >
            <option value="">Select user</option>
            {usersList.map((u) => (
              <option key={u.id} value={u.id}>{u.name} — {u.role} ({u.email})</option>
            ))}
          </Select>
          <Input
            label="Expected Return Date"
            type="date"
            value={expectedReturn}
            onChange={(e) => setExpectedReturn(e.target.value)}
          />
          <Textarea
            label="Assignment Notes"
            placeholder="Reason or assignment notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {formError}
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog isOpen={showConfirm} onClose={() => setShowConfirm(false)} onConfirm={handleConfirm} title="Confirm Assignment" message="Are you sure you want to assign this asset? The asset status will be updated to 'Assigned'." confirmText="Confirm Assignment" variant="info" loading={formLoading} />

      {/* Details Drawer */}
      <Drawer isOpen={!!selectedAssignment} onClose={() => setSelectedAssignment(null)} title="Assignment Details" width="lg">
        {selectedAssignment && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{selectedAssignment.asset}</h3>
                <p className="text-sm text-slate-500 font-mono">{selectedAssignment.id}</p>
              </div>
              <StatusBadge status={selectedAssignment.status} size="md" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><p className="text-xs text-slate-500">Asset ID</p><p className="text-sm font-medium font-mono">{selectedAssignment.assetId}</p></div>
              <div className="space-y-1"><p className="text-xs text-slate-500">Personnel</p><p className="text-sm font-medium">{selectedAssignment.personnel}</p></div>
              <div className="space-y-1"><p className="text-xs text-slate-500">Personnel ID</p><p className="text-sm font-medium font-mono">{selectedAssignment.personnelId}</p></div>
              <div className="space-y-1"><p className="text-xs text-slate-500">Base</p><p className="text-sm font-medium">{selectedAssignment.base}</p></div>
              <div className="space-y-1"><p className="text-xs text-slate-500">Assignment Date</p><p className="text-sm font-medium">{formatDate(selectedAssignment.assignmentDate)}</p></div>
              <div className="space-y-1"><p className="text-xs text-slate-500">Expected Return</p><p className="text-sm font-medium">{formatDate(selectedAssignment.expectedReturn)}</p></div>
              {selectedAssignment.notes && <div className="space-y-1 col-span-2"><p className="text-xs text-slate-500">Notes</p><p className="text-sm text-slate-600">{selectedAssignment.notes}</p></div>}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Assignments;
