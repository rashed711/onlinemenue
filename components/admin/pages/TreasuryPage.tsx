
import React, { useState, useEffect } from 'react';
import { useTreasury } from '../../../contexts/TreasuryContext';
import { useUI } from '../../../contexts/UIContext';
import { useAuth } from '../../../contexts/AuthContext';
import { formatNumber, formatDateTime } from '../../../utils/helpers';
import { PlusIcon, CurrencyDollarIcon } from '../../icons/Icons';
import { ManualTransactionModal } from '../ManualTransactionModal';
import type { TreasuryTransaction } from '../../../types';

export const TreasuryPage: React.FC = () => {
    const { t } = useUI();
    const { hasPermission } = useAuth();
    const { treasuries, transactions, isTreasuryLoading, fetchTreasuryData } = useTreasury();
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchTreasuryData();
    }, [fetchTreasuryData]);
    
    const canAddTransaction = hasPermission('add_manual_transaction');

    const getTransactionTypeTranslation = (type: TreasuryTransaction['transaction_type']) => {
        const key = type as 'deposit' | 'withdrawal' | 'sales' | 'purchase';
        return t[key] || type;
    };
    
    return (
        <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.treasury}</h2>
                {canAddTransaction && (
                     <button onClick={() => setIsModalOpen(true)} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2">
                        <PlusIcon className="w-5 h-5" />
                        {t.addNewTransaction}
                    </button>
                )}
            </div>

            {/* Balances */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {treasuries.map(treasury => (
                    <div key={treasury.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary-100 dark:bg-primary-900/50 rounded-full">
                                <CurrencyDollarIcon className="w-6 h-6 text-primary-600 dark:text-primary-400"/>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">{treasury.name}</h3>
                                <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{formatNumber(treasury.current_balance)} <span className="text-base font-semibold">{t.currency}</span></p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Transactions Table */}
            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">{t.treasuryTransactions}</h3>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-4 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">{t.date}</th>
                                <th className="px-4 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">{t.transactionType}</th>
                                <th className="px-4 py-3 text-end text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">{t.amount}</th>
                                <th className="px-4 py-3 text-end text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">{t.balanceAfter}</th>
                                <th className="px-4 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">{t.details}</th>
                                <th className="px-4 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">{t.createdBy}</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {isTreasuryLoading ? (
                                <tr><td colSpan={6} className="text-center py-10 text-slate-500">{t.loading}</td></tr>
                            ) : transactions.length > 0 ? transactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{formatDateTime(tx.created_at)}</td>
                                    <td className="px-4 py-3 text-sm font-medium">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            tx.transaction_type === 'deposit' || tx.transaction_type === 'sales' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                        }`}>
                                            {getTransactionTypeTranslation(tx.transaction_type)}
                                        </span>
                                    </td>
                                    <td className={`px-4 py-3 text-sm text-end font-semibold ${tx.transaction_type === 'deposit' || tx.transaction_type === 'sales' ? 'text-green-600' : 'text-red-600'}`}>
                                        {tx.transaction_type === 'deposit' || tx.transaction_type === 'sales' ? '+' : '-'} {formatNumber(tx.amount)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-end font-mono text-slate-600 dark:text-slate-300">{formatNumber(tx.balance_after)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                        {tx.related_invoice_id ? (
                                            <a href={`#/admin/inventory?view_${tx.invoice_type}=${tx.related_invoice_id}`} className="text-blue-600 hover:underline">
                                                {t.invoiceLink} #{tx.related_invoice_id}
                                            </a>
                                        ) : tx.description || <span className="text-slate-400">{t.manualEntry}</span>}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{tx.created_by_name || 'System'}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={6} className="text-center py-10 text-slate-500">{t.noTransactionsFound}</td></tr>
                            )}
                         </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && canAddTransaction && <ManualTransactionModal onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};
