import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, Eye, ArrowRight, Check, CheckCircle2, XCircle } from 'lucide-react';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Input, { Select, Textarea } from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Drawer from '../../components/common/Drawer';
import { ConfirmDialog } from '../../components/common/Modal';
import { fetchTransfers, fetchAssets } from '../../services/api';
import { transferApi } from '../../api/transferApi';
import { BASES, TRANSFER_STATUSES } from '../../utils/constants';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { searchFilter, paginate } from '../../utils/helpers';
import { useAuth } from '../../hooks/useAuth';

const Transfers = () => {
  const { hasPermission, user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [baseFilter, setBaseFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [toast, setToast] = useState(null);
  const [formError, setFormError] = useState('');
  const perPage = 10;

  // Transfer form fields
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [destinationBaseId, setDestinationBaseId] = useState('');
  const [reason, setReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [tData, aData] = await Promise.all([
        fetchTransfers(),
        fetchAssets(),
      ]);
      setTransfers(tData);
      setAvailableAssets(aData);
    } catch (err) {
      console.error('Failed to load transfers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    let result = transfers;
    result = searchFilter(result, search, ['id', 'transferNumber', 'asset', 'assetType', 'sourceBase', 'destinationBase', 'requestedBy']);
    if (statusFilter) result = result.filter((t) => t.status === statusFilter);
    if (baseFilter) result = result.filter((t) => t.sourceBase === baseFilter || t.destinationBase === baseFilter);
    return result;
  }, [transfers, search, statusFilter, baseFilter]);

  const paginatedData = paginate(filteredData, currentPage, perPage);

  const handleSubmitTransfer = () => {
    if (!selectedAssetId || !destinationBaseId || !reason) {
      setFormError('Please complete all required fields.');
      return;
    }
    setFormError('');
    setShowConfirm(true);
  };

  const handleConfirmTransfer = async () => {
    setFormLoading(true);
    setFormError('');
    try {
      const targetAsset = availableAssets.find((a) => a.id === selectedAssetId || a.assetCode === selectedAssetId);
      const targetBase = BASES.find((b) => b.id === destinationBaseId || b.name === destinationBaseId) || BASES[0];

      if (!targetAsset) throw new Error('Asset not found');

      const payload = {
        asset_id: targetAsset.id,
        source_base_id: targetAsset.baseId || BASES[0].id,
        destination_base_id: targetBase.id,
        reason,
        transfer_date: new Date().toISOString().split('T')[0],
      };

      const res = await transferApi.createTransfer(payload);
      if (res?.success) {
        setShowConfirm(false);
        setShowForm(false);
        setFormStep(1);
        setSelectedAssetId('');
        setDestinationBaseId('');
        setReason('');
        setToast('Transfer request submitted successfully!');
        loadData();
        setTimeout(() => setToast(null), 3000);
      } else {
        setFormError(res?.message || 'Failed to submit transfer request');
      }
    } catch (err) {
      setFormError(err.message || 'Error submitting transfer');
    } finally {
      setFormLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await transferApi.approveTransfer(id);
      if (res?.success) {
        setToast('Transfer approved!');
        loadData();
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      alert(err.message || 'Failed to approve transfer');
    }
  };

  const handleComplete = async (id) => {
    try {
      const res = await transferApi.completeTransfer(id);
      if (res?.success) {
        setToast('Transfer completed!');
        loadData();
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      alert(err.message || 'Failed to complete transfer');
    }
  };

  const handleCancel = async (id) => {
    try {
      const res = await transferApi.cancelTransfer(id);
      if (res?.success) {
        setToast('Transfer cancelled!');
        loadData();
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel transfer');
    }
  };

  const columns = [
    { key: 'id', label: 'Transfer ID', minWidth: '100px', render: (val) => <span className="font-mono text-xs text-navy-700 font-medium">{val}</span> },
    { key: 'asset', label: 'Asset', minWidth: '200px', render: (val, row) => (
      <div>
        <p className="font-medium text-slate-900 text-sm">{val}</p>
        <p className="text-xs text-slate-500">{row.assetType}</p>
      </div>
    )},
    { key: 'sourceBase', label: 'Source', minWidth: '130px' },
    { key: 'destinationBase', label: 'Destination', minWidth: '130px' },
    { key: 'requestedBy', label: 'Requested By', minWidth: '130px', render: (val) => <span className="text-slate-600">{val}</span> },
    { key: 'transferDate', label: 'Date', minWidth: '100px', render: (val) => formatDate(val) },
    { key: 'status', label: 'Status', minWidth: '110px', render: (val) => <StatusBadge status={val} /> },
    { key: 'actions', label: '', sortable: false, minWidth: '50px', render: (_, row) => (
      <button onClick={(e) => { e.stopPropagation(); setSelectedTransfer(row); }} className="p-1.5 rounded-md text-slate-400 hover:text-navy-600 hover:bg-navy-50 transition-colors">
        <Eye size={15} />
      </button>
    )},
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {toast && <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg animate-slide-in text-sm font-medium">{toast}</div>}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Transfers</h2>
          <p className="text-sm text-slate-500">{filteredData.length} transfer records</p>
        </div>
        {hasPermission('transfers', 'create') && (
          <Button icon={Plus} onClick={() => { setShowForm(true); setFormStep(1); }}>New Transfer</Button>
        )}
      </div>

      {/* Search and filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search transfers..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:bg-white transition-all" />
          </div>
          <Button variant={showFilters ? 'primary' : 'secondary'} icon={Filter} onClick={() => setShowFilters(!showFilters)}>Filters</Button>
        </div>
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">All Statuses</option>
              {Object.values(TRANSFER_STATUSES).map((s) => <option key={s} value={s}>{s}</option>)}
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
        <Table columns={columns} data={paginatedData.data} onRowClick={(row) => setSelectedTransfer(row)} />
        <div className="px-4 pb-4">
          <Pagination currentPage={paginatedData.currentPage} totalPages={paginatedData.totalPages} totalItems={paginatedData.totalItems} perPage={perPage} onPageChange={setCurrentPage} />
        </div>
      </div>

      {/* Transfer Form Modal — Multi-step workflow */}
      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setFormStep(1); }} title="Initiate Asset Transfer" size="lg" footer={
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">Step {formStep} of 3</p>
          <div className="flex gap-3">
            {formStep > 1 && <Button variant="secondary" onClick={() => setFormStep(formStep - 1)}>Back</Button>}
            {formStep < 3 ? (
              <Button onClick={() => setFormStep(formStep + 1)}>Continue</Button>
            ) : (
              <Button onClick={handleSubmitTransfer}>Submit Transfer</Button>
            )}
          </div>
        </div>
      }>
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                step <= formStep ? 'bg-navy-700 text-white' : 'bg-slate-100 text-slate-400'
              }`}>{step}</div>
              {step < 3 && <div className={`flex-1 h-0.5 ${step < formStep ? 'bg-navy-700' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        {formStep === 1 && (
          <div className="space-y-4">
            <h4 className="font-medium text-slate-800">Select Asset to Transfer</h4>
            <Select
              label="Asset to Transfer"
              required
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
            >
              <option value="">Select asset</option>
              {availableAssets.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.assetCode || a.id}) — {a.base}</option>
              ))}
            </Select>
          </div>
        )}
        {formStep === 2 && (
          <div className="space-y-4">
            <h4 className="font-medium text-slate-800">Destination Base</h4>
            <Select
              label="Destination Base"
              required
              value={destinationBaseId}
              onChange={(e) => setDestinationBaseId(e.target.value)}
            >
              <option value="">Select destination base</option>
              {BASES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>
        )}
        {formStep === 3 && (
          <div className="space-y-4">
            <h4 className="font-medium text-slate-800">Reason & Confirmation</h4>
            <Textarea
              label="Reason for Transfer"
              required
              placeholder="Provide justification for this transfer..."
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            {formError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {formError}
              </div>
            )}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h5 className="text-sm font-medium text-slate-700 mb-2">Transfer Summary</h5>
              <p className="text-xs text-slate-500">Please review the transfer details before submitting. The transfer will require approval before processing.</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Transfer Confirmation */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmTransfer}
        title="Confirm Transfer Request"
        message="Are you sure you want to submit this transfer request? It will be routed for approval."
        confirmText="Submit Transfer"
        variant="info"
        loading={formLoading}
      />

      {/* Transfer Details Drawer */}
      <Drawer isOpen={!!selectedTransfer} onClose={() => setSelectedTransfer(null)} title="Transfer Details" width="lg">
        {selectedTransfer && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{selectedTransfer.asset}</h3>
                <p className="text-sm text-slate-500 font-mono">{selectedTransfer.id}</p>
              </div>
              <StatusBadge status={selectedTransfer.status} size="md" />
            </div>

            {/* Transfer flow visual */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
              <div className="text-center flex-1">
                <p className="text-xs text-slate-500">Source</p>
                <p className="text-sm font-semibold text-slate-800">{selectedTransfer.sourceBase}</p>
              </div>
              <ArrowRight size={20} className="text-navy-600 shrink-0" />
              <div className="text-center flex-1">
                <p className="text-xs text-slate-500">Destination</p>
                <p className="text-sm font-semibold text-slate-800">{selectedTransfer.destinationBase}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><p className="text-xs text-slate-500">Asset Type</p><p className="text-sm font-medium">{selectedTransfer.assetType}</p></div>
              <div className="space-y-1"><p className="text-xs text-slate-500">Requested By</p><p className="text-sm font-medium">{selectedTransfer.requestedBy}</p></div>
              <div className="space-y-1"><p className="text-xs text-slate-500">Transfer Date</p><p className="text-sm font-medium">{formatDate(selectedTransfer.transferDate)}</p></div>
              <div className="space-y-1"><p className="text-xs text-slate-500">Timestamp</p><p className="text-sm font-medium">{formatDateTime(selectedTransfer.timestamp)}</p></div>
              <div className="space-y-1 col-span-2"><p className="text-xs text-slate-500">Reason</p><p className="text-sm text-slate-600">{selectedTransfer.reason}</p></div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Transfers;
