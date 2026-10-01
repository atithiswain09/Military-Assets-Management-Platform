import React from 'react';
import { formatDateTime, formatCurrency } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';

const RecentTransactions = ({ transactions = [] }) => {
  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Recent Transactions</h3>
        <span className="text-xs text-slate-400">{transactions.length} records</span>
      </div>
      <div className="divide-y divide-slate-100">
        {transactions.length === 0 ? (
          <p className="p-5 text-center text-xs text-slate-400">No transactions found.</p>
        ) : (
          transactions.slice(0, 6).map((txn) => (
            <div key={txn.id} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-900">{txn.action}</span>
                  </div>
                  <p className="text-xs text-slate-600 truncate">{txn.asset}</p>
                  <p className="text-xs text-slate-400 mt-0.5">by {txn.user} · {txn.base}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-500">{formatDateTime(txn.date)}</p>
                  <p className="text-2xs text-slate-400 mt-0.5 font-mono">{txn.id}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;
