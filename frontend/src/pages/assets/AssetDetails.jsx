import React, { useState, useEffect } from 'react';
import Drawer from '../../components/common/Drawer';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { assetApi } from '../../api/assetApi';
import { normalizeAssignment, normalizeTransfer, normalizeExpense, normalizeTransaction } from '../../utils/normalizers';
import { MapPin, User, DollarSign, Calendar, Hash, Tag, Shield, Wrench } from 'lucide-react';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-2.5">
    {Icon && <Icon size={15} className="text-slate-400 mt-0.5 shrink-0" />}
    <div className="min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value || '—'}</p>
    </div>
  </div>
);

const AssetDetails = ({ asset, isOpen, onClose }) => {
  const [assetAssignments, setAssetAssignments] = useState([]);
  const [assetTransfers, setAssetTransfers] = useState([]);
  const [assetExpenses, setAssetExpenses] = useState([]);
  const [assetTransactions, setAssetTransactions] = useState([]);

  useEffect(() => {
    if (!asset || !isOpen) return;

    const loadSubResources = async () => {
      try {
        const [asgRes, trfRes, expRes, histRes] = await Promise.all([
          assetApi.getAssetAssignments(asset.id),
          assetApi.getAssetTransfers(asset.id),
          assetApi.getAssetExpenses(asset.id),
          assetApi.getAssetHistory(asset.id),
        ]);

        if (asgRes?.success && Array.isArray(asgRes.data)) setAssetAssignments(asgRes.data.map(normalizeAssignment));
        if (trfRes?.success && Array.isArray(trfRes.data)) setAssetTransfers(trfRes.data.map(normalizeTransfer));
        if (expRes?.success && Array.isArray(expRes.data)) setAssetExpenses(expRes.data.map(normalizeExpense));
        if (histRes?.success && Array.isArray(histRes.data)) setAssetTransactions(histRes.data.map(normalizeTransaction));
      } catch (err) {
        console.error('Failed to load sub-resources for asset:', err);
      }
    };

    loadSubResources();
  }, [asset, isOpen]);

  if (!asset) return null;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Asset Details" width="xl">
      <div className="space-y-6">
        {/* Header info */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{asset.name}</h3>
            <p className="text-sm text-slate-500 font-mono">{asset.id}</p>
          </div>
          <StatusBadge status={asset.status} size="md" />
        </div>

        {/* Asset Information */}
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">Asset Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <InfoRow icon={Tag} label="Type" value={asset.type} />
            <InfoRow icon={Tag} label="Category" value={asset.category} />
            <InfoRow icon={Hash} label="Serial Number" value={asset.serialNumber} />
            <InfoRow icon={Wrench} label="Condition" value={asset.condition} />
          </div>
        </div>

        {/* Location & Assignment */}
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">Location & Assignment</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <InfoRow icon={MapPin} label="Current Base" value={asset.base} />
            <InfoRow icon={User} label="Assigned To" value={asset.assignedPersonnel} />
          </div>
        </div>

        {/* Financial */}
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">Financial Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <InfoRow icon={DollarSign} label="Purchase Value" value={formatCurrency(asset.purchaseValue)} />
            <InfoRow icon={Calendar} label="Purchase Date" value={formatDate(asset.purchaseDate)} />
            <InfoRow icon={Calendar} label="Last Inspection" value={formatDate(asset.lastInspection)} />
          </div>
        </div>

        {/* Assignment History */}
        {assetAssignments.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Assignment History</h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Personnel</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Date</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assetAssignments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-700">{a.personnel}</td>
                      <td className="px-3 py-2 text-slate-600">{formatDate(a.assignmentDate)}</td>
                      <td className="px-3 py-2"><StatusBadge status={a.status} size="xs" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transfer History */}
        {assetTransfers.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Transfer History</h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">From</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">To</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Date</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assetTransfers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-700">{t.sourceBase}</td>
                      <td className="px-3 py-2 text-slate-700">{t.destinationBase}</td>
                      <td className="px-3 py-2 text-slate-600">{formatDate(t.transferDate)}</td>
                      <td className="px-3 py-2"><StatusBadge status={t.status} size="xs" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Expenses */}
        {assetExpenses.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Expense Records</h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Type</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Description</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Amount</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assetExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-700">{e.expenseType}</td>
                      <td className="px-3 py-2 text-slate-600 text-xs">{e.description}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">{formatCurrency(e.amount)}</td>
                      <td className="px-3 py-2 text-slate-600">{formatDate(e.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transaction Log */}
        {assetTransactions.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Transaction Log</h4>
            <div className="space-y-3">
              {assetTransactions.map((txn) => (
                <div key={txn.id} className="flex gap-3 border-l-2 border-slate-200 pl-3 py-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">{txn.action}</p>
                    <p className="text-xs text-slate-500">{txn.details}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatDateTime(txn.date)} · {txn.user}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default AssetDetails;
