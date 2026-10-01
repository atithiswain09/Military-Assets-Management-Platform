import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Eye, Edit, ArrowLeftRight, UserCheck, History, X, Loader2 } from 'lucide-react';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { Select } from '../../components/common/Input';
import AssetDetails from './AssetDetails';
import { fetchAssets } from '../../services/api';
import { ASSET_TYPES, ASSET_STATUSES, BASES } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { searchFilter, paginate } from '../../utils/helpers';
import { useAuth } from '../../hooks/useAuth';

const Assets = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [baseFilter, setBaseFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const perPage = 10;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchAssets();
        setAssets(data);
      } catch (err) {
        console.error('Failed to fetch assets:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredAssets = useMemo(() => {
    let result = assets;

    // Search
    result = searchFilter(result, search, ['id', 'assetCode', 'name', 'type', 'category', 'serialNumber', 'base', 'assignedPersonnel']);

    // Status filter
    if (statusFilter) result = result.filter((a) => a.status === statusFilter);

    // Type filter
    if (typeFilter) result = result.filter((a) => a.type === typeFilter);

    // Base filter
    if (baseFilter) result = result.filter((a) => a.base === baseFilter);

    return result;
  }, [assets, search, statusFilter, typeFilter, baseFilter]);

  const paginatedData = paginate(filteredAssets, currentPage, perPage);

  const clearFilters = () => {
    setStatusFilter('');
    setTypeFilter('');
    setBaseFilter('');
    setSearch('');
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter || typeFilter || baseFilter;

  const columns = [
    {
      key: 'id',
      label: 'Asset ID',
      minWidth: '110px',
      render: (val) => <span className="font-mono text-xs text-navy-700 font-medium">{val}</span>,
    },
    {
      key: 'name',
      label: 'Asset Name',
      minWidth: '200px',
      render: (val, row) => (
        <div>
          <p className="font-medium text-slate-900 text-sm">{val}</p>
          <p className="text-xs text-slate-500">{row.category}</p>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      minWidth: '100px',
    },
    {
      key: 'serialNumber',
      label: 'Serial No.',
      minWidth: '130px',
      render: (val) => <span className="font-mono text-xs text-slate-600">{val}</span>,
    },
    {
      key: 'base',
      label: 'Current Base',
      minWidth: '130px',
    },
    {
      key: 'status',
      label: 'Status',
      minWidth: '110px',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'assignedPersonnel',
      label: 'Assigned To',
      minWidth: '140px',
      render: (val) => val || <span className="text-slate-400">—</span>,
    },
    {
      key: 'purchaseValue',
      label: 'Value',
      minWidth: '110px',
      render: (val) => <span className="font-medium">{formatCurrency(val)}</span>,
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      minWidth: '120px',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedAsset(row); }}
            className="p-1.5 rounded-md text-slate-400 hover:text-navy-600 hover:bg-navy-50 transition-colors"
            title="View Details"
          >
            <Eye size={15} />
          </button>
          {hasPermission('assets', 'transfer') && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/transfers'); }}
              className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Transfer"
            >
              <ArrowLeftRight size={15} />
            </button>
          )}
          {hasPermission('assets', 'assign') && (
            <button
              onClick={(e) => { e.stopPropagation(); navigate('/assignments'); }}
              className="p-1.5 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Assign"
            >
              <UserCheck size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Assets</h2>
          <p className="text-sm text-slate-500">{filteredAssets.length} total assets</p>
        </div>
        {hasPermission('assets', 'create') && (
          <Button icon={Plus} size="md">
            New Asset
          </Button>
        )}
      </div>

      {/* Search and filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, name, serial number, base..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:bg-white transition-all"
            />
          </div>
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            icon={Filter}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
            {hasActiveFilters && (
              <span className="w-5 h-5 bg-navy-600 text-white text-2xs rounded-full flex items-center justify-center ml-1">
                {[statusFilter, typeFilter, baseFilter].filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Statuses</option>
              {Object.values(ASSET_STATUSES).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
            <Select
              label="Asset Type"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Types</option>
              {ASSET_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
            <Select
              label="Base"
              value={baseFilter}
              onChange={(e) => { setBaseFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="">All Bases</option>
              {BASES.map((b) => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </Select>
            {hasActiveFilters && (
              <div className="sm:col-span-3">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  <X size={12} /> Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <Table
          columns={columns}
          data={paginatedData.data}
          onRowClick={(row) => setSelectedAsset(row)}
        />
        <div className="px-4 pb-4">
          <Pagination
            currentPage={paginatedData.currentPage}
            totalPages={paginatedData.totalPages}
            totalItems={paginatedData.totalItems}
            perPage={perPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Asset Details Drawer */}
      {selectedAsset && (
        <AssetDetails
          asset={selectedAsset}
          isOpen={!!selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
};

export default Assets;
