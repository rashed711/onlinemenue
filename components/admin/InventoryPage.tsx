import React, { useState } from 'react';
import type { Supplier, PurchaseInvoice, SalesInvoice } from '../../types';
import { useUI } from '../../contexts/UIContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useAuth } from '../../contexts/AuthContext';
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon, ClipboardListIcon, CashRegisterIcon } from '../icons/Icons';
import { SupplierEditModal } from './SupplierEditModal';
import { PurchaseInvoiceModal } from './PurchaseInvoiceModal';
import { PurchaseInvoiceDetailsModal } from './PurchaseInvoiceDetailsModal';
import { SalesInvoiceModal } from './SalesInvoiceModal';
import { SalesInvoiceDetailsModal } from './SalesInvoiceDetailsModal';
import { formatDateTime } from '../../utils/helpers';

type InventoryTab = 'suppliers' | 'invoices' | 'salesInvoices';

export const InventoryPage: React.FC = () => {
    const { t, language } = useUI();
    const { hasPermission } = useAuth();
    const { suppliers, purchaseInvoices, salesInvoices, deleteSupplier, deletePurchaseInvoice, deleteSalesInvoice, isInventoryLoading } = useInventory();

    const [activeTab, setActiveTab] = useState<InventoryTab>('suppliers');
    const [editingSupplier, setEditingSupplier] = useState<Supplier | 'new' | null>(null);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | null>(null);
    const [viewingInvoice, setViewingInvoice] = useState<PurchaseInvoice | null>(null);
    const [isSalesInvoiceModalOpen, setIsSalesInvoiceModalOpen] = useState(false);
    const [editingSalesInvoice, setEditingSalesInvoice] = useState<SalesInvoice | null>(null);
    const [viewingSalesInvoice, setViewingSalesInvoice] = useState<SalesInvoice | null>(null);

    const canManageSuppliers = hasPermission('manage_suppliers');
    const canManagePurchaseInvoices = hasPermission('add_purchase_invoice');
    const canManageSalesInvoices = hasPermission('manage_sales_invoices');
    
    const handleDeletePurchaseInvoice = (invoiceId: number) => {
        if (window.confirm(t.confirmDeleteInvoice)) {
            deletePurchaseInvoice(invoiceId);
        }
    };

    const handleDeleteSalesInvoice = (invoiceId: number) => {
        if (window.confirm(t.confirmDeleteSalesInvoice)) {
            deleteSalesInvoice(invoiceId);
        }
    };

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
                        {isInventoryLoading ? (
                           <tr><td colSpan={canManageSuppliers ? 4 : 3} className="text-center py-10 text-slate-500">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</td></tr>
                        ) : suppliers.length > 0 ? suppliers.map((supplier) => (
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

    const renderPurchaseInvoices = () => (
        <div>
           <div className="flex justify-end mb-4">
               {canManagePurchaseInvoices && (
                   <button onClick={() => { setEditingInvoice(null); setIsInvoiceModalOpen(true); }} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2">
                       <PlusIcon className="w-5 h-5" />
                       {t.addNewPurchaseInvoice}
                   </button>
               )}
           </div>
           
           {/* Desktop Table View */}
           <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
               <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                       <tr>
                           <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">ID</th>
                           <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.supplier}</th>
                           <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.invoiceDate}</th>
                           <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.totalAmount}</th>
                           <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.items}</th>
                           <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.actions}</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {isInventoryLoading ? (
                            <tr><td colSpan={6} className="text-center py-10 text-slate-500">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</td></tr>
                        ) : purchaseInvoices.length > 0 ? purchaseInvoices.map((invoice) => (
                           <tr key={invoice.id} onClick={() => setViewingInvoice(invoice)} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">{invoice.id}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{invoice.supplier_name}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{formatDateTime(invoice.invoice_date)}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-700 dark:text-primary-400">{invoice.total_amount.toFixed(2)} {t.currency}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{invoice.items.length}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                   <div onClick={e => e.stopPropagation()} className="flex items-center gap-4">
                                       {canManagePurchaseInvoices && <button onClick={() => setEditingInvoice(invoice)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1"><PencilIcon className="w-4 h-4" /> {t.edit}</button>}
                                       {canManagePurchaseInvoices && <button onClick={() => handleDeletePurchaseInvoice(invoice.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 flex items-center gap-1"><TrashIcon className="w-4 h-4" /> {t.delete}</button>}
                                   </div>
                               </td>
                           </tr>
                       )) : (
                           <tr>
                               <td colSpan={6} className="text-center py-10 text-slate-500">{t.noInvoicesFound}</td>
                           </tr>
                       )}
                   </tbody>
               </table>
           </div>

           {/* Mobile Card View */}
           <div className="md:hidden space-y-4">
                {isInventoryLoading ? (
                    <div className="text-center py-10 text-slate-500 bg-white dark:bg-slate-800 rounded-lg">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
                ) : purchaseInvoices.length > 0 ? purchaseInvoices.map(invoice => (
                   <div key={invoice.id} onClick={() => setViewingInvoice(invoice)} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 space-y-3 border-l-4 border-primary-500">
                       <div className="flex justify-between items-start">
                            <div>
                               <p className="font-bold text-slate-900 dark:text-slate-100">{invoice.supplier_name}</p>
                               <p className="text-sm text-slate-500 dark:text-slate-400">ID: {invoice.id}</p>
                           </div>
                           <div className="text-end">
                               <p className="font-semibold text-lg text-primary-600 dark:text-primary-400">{invoice.total_amount.toFixed(2)}</p>
                               <p className="text-xs text-slate-400">{formatDateTime(invoice.invoice_date)}</p>
                           </div>
                       </div>
                        <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex justify-between items-center">
                           <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{invoice.items.length} {t.items}</span>
                           {canManagePurchaseInvoices && (
                               <div onClick={e => e.stopPropagation()} className="flex items-center gap-4">
                                   <button onClick={() => setEditingInvoice(invoice)} className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1"><PencilIcon className="w-4 h-4" /> {t.edit}</button>
                                   <button onClick={() => handleDeletePurchaseInvoice(invoice.id)} className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1"><TrashIcon className="w-4 h-4" /> {t.delete}</button>
                               </div>
                           )}
                       </div>
                   </div>
               )) : (
                   <div className="text-center py-10 text-slate-500 bg-white dark:bg-slate-800 rounded-lg">{t.noInvoicesFound}</div>
               )}
           </div>

       </div>
   );

    const renderSalesInvoices = () => (
        <div>
           <div className="flex justify-end mb-4">
               {canManageSalesInvoices && (
                   <button onClick={() => { setEditingSalesInvoice(null); setIsSalesInvoiceModalOpen(true); }} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2">
                       <PlusIcon className="w-5 h-5" />
                       {t.addNewSalesInvoice}
                   </button>
               )}
           </div>
           
           {/* Desktop Table View */}
           <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
               <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                       <tr>
                           <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">ID</th>
                           <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.customer}</th>
                           <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.invoiceDate}</th>
                           <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.totalAmount}</th>
                           <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.items}</th>
                           <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.actions}</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {isInventoryLoading ? (
                             <tr><td colSpan={6} className="text-center py-10 text-slate-500">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</td></tr>
                        ) : salesInvoices.length > 0 ? salesInvoices.map((invoice) => (
                           <tr key={invoice.id} onClick={() => setViewingSalesInvoice(invoice)} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">{invoice.invoice_number}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{invoice.customer_name}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{formatDateTime(invoice.invoice_date)}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700 dark:text-green-400">{invoice.total_amount.toFixed(2)} {t.currency}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{invoice.items.length}</td>
                               <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                   <div onClick={e => e.stopPropagation()} className="flex items-center gap-4">
                                       {canManageSalesInvoices && <button onClick={() => setEditingSalesInvoice(invoice)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1"><PencilIcon className="w-4 h-4" /> {t.edit}</button>}
                                       {canManageSalesInvoices && <button onClick={() => handleDeleteSalesInvoice(invoice.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 flex items-center gap-1"><TrashIcon className="w-4 h-4" /> {t.delete}</button>}
                                   </div>
                               </td>
                           </tr>
                       )) : (
                           <tr>
                               <td colSpan={6} className="text-center py-10 text-slate-500">{t.noInvoicesFound}</td>
                           </tr>
                       )}
                   </tbody>
               </table>
           </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {isInventoryLoading ? (
                    <div className="text-center py-10 text-slate-500 bg-white dark:bg-slate-800 rounded-lg">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
                ) : salesInvoices.length > 0 ? salesInvoices.map(invoice => (
                   <div key={invoice.id} onClick={() => setViewingSalesInvoice(invoice)} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 space-y-3 border-l-4 border-green-500">
                       <div className="flex justify-between items-start">
                            <div>
                               <p className="font-bold text-slate-900 dark:text-slate-100">{invoice.customer_name}</p>
                               <p className="text-sm text-slate-500 dark:text-slate-400">ID: {invoice.invoice_number}</p>
                           </div>
                           <div className="text-end">
                               <p className="font-semibold text-lg text-green-600 dark:text-green-400">{invoice.total_amount.toFixed(2)}</p>
                               <p className="text-xs text-slate-400">{formatDateTime(invoice.invoice_date)}</p>
                           </div>
                       </div>
                        <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex justify-between items-center">
                           <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{invoice.items.length} {t.items}</span>
                           {canManageSalesInvoices && (
                               <div onClick={e => e.stopPropagation()} className="flex items-center justify-end gap-4">
                                   <button onClick={() => setEditingSalesInvoice(invoice)} className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1"><PencilIcon className="w-4 h-4" /> {t.edit}</button>
                                   <button onClick={() => handleDeleteSalesInvoice(invoice.id)} className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1"><TrashIcon className="w-4 h-4" /> {t.delete}</button>
                               </div>
                           )}
                       </div>
                   </div>
               )) : (
                   <div className="text-center py-10 text-slate-500 bg-white dark:bg-slate-800 rounded-lg">{t.noInvoicesFound}</div>
               )}
            </div>
       </div>
   );

    const tabs = [
        { id: 'suppliers', label: t.suppliers, icon: UsersIcon, permission: 'manage_suppliers' },
        { id: 'invoices', label: 'فواتير الشراء', icon: ClipboardListIcon, permission: 'add_purchase_invoice' },
        { id: 'salesInvoices', label: 'فواتير البيع', icon: CashRegisterIcon, permission: 'manage_sales_invoices' },
    ];

    return (
        <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">{t.inventory}</h2>

            <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
                <nav className="-mb-px flex space-x-6 rtl:space-x-reverse overflow-x-auto" aria-label="Tabs">
                    {tabs.map(tab => (
                        hasPermission(tab.permission) && (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as InventoryTab)}
                                className={`whitespace-nowrap flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === tab.id
                                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                                }`}
                            >
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        )
                    ))}
                </nav>
            </div>

            {activeTab === 'suppliers' && renderSuppliers()}
            {activeTab === 'invoices' && renderPurchaseInvoices()}
            {activeTab === 'salesInvoices' && renderSalesInvoices()}
            
            {editingSupplier && <SupplierEditModal supplier={editingSupplier === 'new' ? null : editingSupplier} onClose={() => setEditingSupplier(null)} />}
            {isInvoiceModalOpen && <PurchaseInvoiceModal onClose={() => setIsInvoiceModalOpen(false)} />}
            {editingInvoice && <PurchaseInvoiceModal invoiceToEdit={editingInvoice} onClose={() => setEditingInvoice(null)} />}
            {viewingInvoice && <PurchaseInvoiceDetailsModal invoice={viewingInvoice} onClose={() => setViewingInvoice(null)} />}
            {isSalesInvoiceModalOpen && <SalesInvoiceModal onClose={() => setIsSalesInvoiceModalOpen(false)} />}
            {editingSalesInvoice && <SalesInvoiceModal invoiceToEdit={editingSalesInvoice} onClose={() => setEditingSalesInvoice(null)} />}
            {viewingSalesInvoice && <SalesInvoiceDetailsModal invoice={viewingSalesInvoice} onClose={() => setViewingSalesInvoice(null)} />}
        </div>
    );
};
