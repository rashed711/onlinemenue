import React from 'react';
import type { PurchaseInvoice } from '../../types';
import { Modal } from '../Modal';
import { useUI } from '../../contexts/UIContext';
import { formatDateTime } from '../../utils/helpers';

interface PurchaseInvoiceDetailsModalProps {
    invoice: PurchaseInvoice;
    onClose: () => void;
}

export const PurchaseInvoiceDetailsModal: React.FC<PurchaseInvoiceDetailsModalProps> = ({ invoice, onClose }) => {
    const { t, language } = useUI();
    
    return (
        <Modal title={`${t.invoiceDetails} - #${invoice.id}`} onClose={onClose} size="2xl">
            <div className="p-5 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* Invoice Summary */}
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.supplier}</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{invoice.supplier_name}</p>
                    </div>
                     <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.invoiceDate}</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{formatDateTime(invoice.invoice_date)}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.totalAmount}</p>
                        <p className="font-bold text-lg text-primary-600 dark:text-primary-400">{invoice.total_amount.toFixed(2)} {t.currency}</p>
                    </div>
                    {invoice.notes && (
                        <div className="sm:col-span-3">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.orderNotes}</p>
                            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{invoice.notes}</p>
                        </div>
                    )}
                </div>

                {/* Items Table */}
                <div>
                     <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">{t.invoiceItems}</h3>
                     <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                            <thead className="bg-slate-100 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-4 py-2 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">{t.product}</th>
                                    <th className="px-4 py-2 text-end text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">{t.quantity}</th>
                                    <th className="px-4 py-2 text-end text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">{t.purchasePrice}</th>
                                    <th className="px-4 py-2 text-end text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">{t.subtotal}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {invoice.items.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-100">{item.product_name?.[language] || `Product ID: ${item.product_id}`}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-end text-slate-600 dark:text-slate-300">{item.quantity}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-end text-slate-600 dark:text-slate-300">{item.purchase_price.toFixed(2)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-end font-semibold text-slate-800 dark:text-slate-100">{item.subtotal.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                </div>
            </div>
             <div className="flex justify-end gap-4 p-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold text-slate-800 dark:text-slate-300 transition-colors">{t.close}</button>
            </div>
        </Modal>
    );
};
