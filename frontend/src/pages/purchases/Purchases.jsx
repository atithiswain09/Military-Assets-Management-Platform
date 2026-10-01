import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, Eye, X, Loader2 } from 'lucide-react';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Input, { Select, Textarea } from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Drawer from '../../components/common/Drawer';
import { fetchPurchases } from '../../services/api';
import { purchaseApi } from '../../api/purchaseApi';
import { ASSET_TYPES, ASSET_CATEGORIES, BASES } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { searchFilter, paginate } from '../../utils/helpers';
import { useAuth } from '../../hooks/useAuth';

const Purchases = () => {
  const { hasPermission } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [baseFilter, setBaseFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [formError, setFormError] = useState('');
  const perPage = 10;

  // Form states
  const [formData, setFormData] = useState({
    assetName: '',
    assetType: ASSET_TYPES[0],
    category: ASSET_CATEGORIES[0],
    quantity: 1,
    unitPrice: '',
    vendor: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    baseId: '',
    reference: '',
    notes: '',
  });

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const data = await fetchPurchases();
      setPurchases(data);
    } catch (err) {
      console.error('Failed to load purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, []);

  const filteredData = useMemo(() => {
    let result = purchases;
    result = searchFilter(result, search, ['id', 'purchaseNumber', 'asset', 'assetType', 'vendor', 'base', 'reference']);
    if (statusFilter) result = result.filter((p) => p.status === statusFilter);
    if (typeFilter) result = result.filter((p) => p.assetType === typeFilter);
    if (baseFilter) result = result.filter((p) => p.base === baseFilter);
    return result;
  }, [purchases, search, statusFilter, typeFilter, baseFilter]);

  const paginatedData = paginate(filteredData, currentPage, perPage);

  const handleSubmitPurchase = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      // Find base ID from selected base name if user selected a base string
      const selectedBase = BASES.find((b) => b.name === formData.baseId || b.id === formData.baseId) || BASES[0];
      const baseUuid = selectedBase.id;

      const payload = {
        asset_name: formData.assetName,
        asset_type: formData.assetType,
        asset_category: formData.category,
        quantity: parseInt(formData.quantity, 10),
        unit_price: parseFloat(formData.unitPrice),
        vendor: formData.vendor,
        purchase_date: formData.purchaseDate,
        base_id: baseUuid,
        reference_number: formData.reference || `PO-${Date.now().toString().slice(-6)}`,
        notes: formData.notes,
      };

      const res = await purchaseApi.createPurchase(payload);
      if (res?.success) {
        setShowForm(false);
        setToast('Purchase order created successfully!');
        loadPurchases();
        setTimeout(() => setToast(null), 3000);
      } else {
        setFormError(res?.message || 'Failed to record purchase');
      }
    } catch (err) {
      setFormError(err.message || 'Error submitting purchase order');
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'Purchase ID', minWidth: '100px', render: (val) => <span className="font-mono text-xs text-navy-700 font-medium">{val}</span> },
    { key: 'asset', label: 'Asset', minWidth: '200px', render: (val, row) => (
      <div>
        <p className="font-medium text-slate-900 text-sm">{val}</p>
        <p className="text-xs text-slate-500">{row.category}</p>
      </div>
    )},
    { key: 'assetType', label: 'Type', minWidth: '100px' },
    { key: 'quantity', label: 'Qty', minWidth: '60px', render: (val) => <span className="font-medium">{val}</span> },
    { key: 'base', label: 'Base', minWidth: '130px' },
    { key: 'vendor', label: 'Vendor', minWidth: '150px', render: (val) => <span className="text-slate-600">{val}</span> },
    { key: 'purchaseDate', label: 'Date', minWidth: '100px', render: (val) => formatDate(val) },
    { key: 'totalCost', label: 'Total Cost', minWidth: '120px', render: (val) => <span className="font-semibold text-slate-900">{formatCurrency(val)}</span> },
    { key: 'status', label: 'Status', minWidth: '100px', render: (val) => <StatusBadge status={val} /> },
    { key: 'actions', label: '', sortable: false, minWidth: '50px', render: (_, row) => (
      <button onClick={(e) => { e.stopPropagation(); setSelectedPurchase(row); }} className="p-1.5 rounded-md text-slate-400 hover:text-navy-600 hover:bg-navy-50 transition-colors" title="View Details">
        <Eye size={15} />
      </button>
    )},
  ];

  const totalValue = filteredData.reduce((sum, p) => sum + p.totalCost, 0);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg animate-slide-in text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Purchases</h2>
          <p className="text-sm text-slate-500">{filteredData.length} records · Total: {formatCurrency(totalValue)}</p>
        </div>
        {hasPermission('purchases', 'create') && (
          <Button icon={Plus} onClick={() => setShowForm(true)}>New Purchase</Button>
        )}
      </div>

      {/* Search and filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search purchases..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:bg-white transition-all" />
          </div>
          <Button variant={showFilters ? 'primary' : 'secondary'} icon={Filter} onClick={() => setShowFilters(!showFilters)}>Filters</Button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select label="Status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">All Statuses</option>
              {Object.values(PURCHASE_STATUSES).map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select label="Asset Type" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}>
              <option value="">All Types</option>
              {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
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
        <Table columns={columns} data={paginatedData.data} onRowClick={(row) => setSelectedPurchase(row)} />
        <div className="px-4 pb-4">
          <Pagination currentPage={paginatedData.currentPage} totalPages={paginatedData.totalPages} totalItems={paginatedData.totalItems} perPage={perPage} onPageChange={setCurrentPage} />
        </div>
      </div>

      {/* New Purchase Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Record New Purchase" size="lg" footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button loading={formLoading} onClick={handleSubmitPurchase}>Record Purchase</Button>
        </div>
      }>
        <form onSubmit={handleSubmitPurchase} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Asset Name"
              required
              placeholder="e.g., M4A1 Carbine"
              value={formData.assetName}
              onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
            />
            <Select
              label="Asset Type"
              required
              value={formData.assetType}
              onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
            >
              <option value="">Select type</option>
              {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Input
              label="Equipment Category"
              placeholder="e.g., Assault Rifle"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
            <Input
              label="Quantity"
              type="number"
              required
              placeholder="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
            <Input
              label="Purchase Date"
              type="date"
              required
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            />
            <Input
              label="Unit Price ($)"
              type="number"
              required
              placeholder="0.00"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
            />
            <Input
              label="Vendor"
              required
              placeholder="e.g., Colt Defense LLC"
              value={formData.vendor}
              onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
            />
            <Select
              label="Base / Location"
              required
              value={formData.baseId}
              onChange={(e) => setFormData({ ...formData, baseId: e.target.value })}
            >
              <option value="">Select base</option>
              {BASES.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
            <Input
              label="Purchase Reference"
              placeholder="PO-YYYY-MMDD-X"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            />
          </div>
          <Textarea
            label="Notes"
            placeholder="Additional details about this purchase..."
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {formError}
            </div>
          )}
        </form>
      </Modal>

      {/* Purchase Details Drawer */}
      <Drawer isOpen={!!selectedPurchase} onClose={() => setSelectedPurchase(null)} title="Purchase Details" width="lg">
        {selectedPurchase && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{selectedPurchase.asset}</h3>
                <p className="text-sm text-slate-500 font-mono">{selectedPurchase.id}</p>
              </div>
              <StatusBadge status={selectedPurchase.status} size="md" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><p className="text-xs text-slate-500">Type</p><p className="text-sm font-medium">{selectedPurchase.assetType}</p></div>
              <div className="space-y-1"><p className="text-xs text-slate-500">Category</p><p className="text-sm font-medium">{selectedPurchase.category}</p></div>
              <div className="space-y-1"><p className="text-xs text-slate-500">Quantity</p><p className="text-sm font-medium">{selectedPurchase.quantity}</p></div>
              <div className="space-y-1"><p className="text-xs text-slate-500">Unit Price</p><p className="text-sm font-medium">{formatCurrency(selectedPurchase.unitPrice)}</p></div>
              <div className="space-y-1"><p className="text-xs text-slate-500">Total Cost</p><p className="text-sm font-bold text-slate-900">{formatCurrency(selectedPurchase.totalCost)}</p></div>
              <div className="space-y-1"><p className="text-xs text-slate-500">Purchase Date</p><p className="text-sm font-medium">{formatDate(selectedPurchase.purchaseDate)}</p></div>
              <div className="space-y-1"><p className="text-xs text-slate-500">Vendor</p><p className="text-sm font-medium">{selectedPurchase.vendor}</p></div>
              <div className="space-y-1"><p className="text-xs text-slate-500">Base</p><p className="text-sm font-medium">{selectedPurchase.base}</p></div>
              <div className="space-y-1 col-span-2"><p className="text-xs text-slate-500">Reference</p><p className="text-sm font-medium font-mono">{selectedPurchase.reference}</p></div>
              {selectedPurchase.notes && <div className="space-y-1 col-span-2"><p className="text-xs text-slate-500">Notes</p><p className="text-sm text-slate-600">{selectedPurchase.notes}</p></div>}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Purchases;
