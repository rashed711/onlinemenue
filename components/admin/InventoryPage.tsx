import React, { useState } from 'react';
import type { Supplier } from '../../types';
import { useUI } from '../../contexts/UIContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon, ClipboardListIcon } from '../icons/Icons';
import { SupplierEditModal } from './SupplierEditModal';
import { PurchaseInvoiceModal } from './PurchaseInvoiceModal';

type InventoryTab = 'suppliers' | 'invoices';

export const InventoryPage: React.FC = () => {
    const { t } = useUI();
    const { hasPermission } = useAuth();
    const { suppliers, deleteSupplier } = useAdmin();

    const [activeTab, setActiveTab] = useState<InventoryTab>('suppliers');
    const [editingSupplier, setEditingSupplier] = useState<Supplier | 'new' | null>(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

    const canManageSuppliers = hasPermission('manage_suppliers');
    const canAddInvoices = hasPermission('add_purchase_invoice');

    const renderSuppliers = () => (
        <div>
            <div className="flex justify-end mb-4">
                {canManageSuppliers && (
                    <button onClick={() => setEditingSupplier('new')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2">
                        <PlusIcon className="w-5 h-5" />
                        {t.addNewSupplier}
                    </button>
                )}
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.supplierName}</th>
                            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden sm:table-cell">{t.contactPerson}</th>
                            <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden md:table-cell">{t.mobileNumber}</th>
                            {canManageSuppliers && <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.actions}</th>}
                        </tr>
                    </thead>
                     <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {suppliers.length > 0 ? suppliers.map((supplier) => (
                            <tr key={supplier.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{supplier.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{supplier.contact_person || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 hidden md:table-cell">{supplier.mobile || 'N/A'}</td>
                                {canManageSuppliers && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => setEditingSupplier(supplier)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1"><PencilIcon className="w-4 h-4" /> {t.edit}</button>
                                            <button onClick={() => deleteSupplier(supplier.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 flex items-center gap-1"><TrashIcon className="w-4 h-4" /> {t.delete}</button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={canManageSuppliers ? 4 : 3} className="text-center py-10 text-slate-500">{t.noSuppliersFound}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderInvoices = () => (
         <div>
            <div className="flex justify-end mb-4">
                {canAddInvoices && (
                    <button onClick={() => setIsInvoiceModalOpen(true)} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2">
                        <PlusIcon className="w-5 h-5" />
                        {t.addNewPurchaseInvoice}
                    </button>
                )}
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 min-h-[200px] flex items-center justify-center">
                 <p className="text-slate-500">{t.noInvoicesFound}</p>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">{t.inventory}</h2>

            <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-6 rtl:space-x-reverse" aria-label="Tabs">
                    {canManageSuppliers && (
                         <button
                            onClick={() => setActiveTab('suppliers')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'suppliers' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'}`}
                        >
                            <UsersIcon className="w-5 h-5"/> {t.suppliers}
                        </button>
                    )}
                    {canAddInvoices && (
                         <button
                            onClick={() => setActiveTab('invoices')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === 'invoices' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'}`}
                        >
                            <ClipboardListIcon className="w-5 h-5"/> {t.purchaseInvoices}
                        </button>
                    )}
                </nav>
            </div>

            {activeTab === 'suppliers' ? renderSuppliers() : renderInvoices()}

            {editingSupplier && (
                <SupplierEditModal 
                    supplier={editingSupplier === 'new' ? null : editingSupplier}
                    onClose={() => setEditingSupplier(null)}
                />
            )}
            {isInvoiceModalOpen && (
                <PurchaseInvoiceModal onClose={() => setIsInvoiceModalOpen(false)} />
            )}
        </div>
    );
};
