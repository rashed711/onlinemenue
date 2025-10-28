import React, { useState, useMemo } from 'react';
import type { PurchaseInvoiceItem, Supplier, Product } from '../../types';
import { Modal } from '../Modal';
import { useUI } from '../../contexts/UIContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useData } from '../../contexts/DataContext';
import { PlusIcon, TrashIcon } from '../icons/Icons';

interface PurchaseInvoiceModalProps {
    onClose: () => void;
}

export const PurchaseInvoiceModal: React.FC<PurchaseInvoiceModalProps> = ({ onClose }) => {
    const { t } = useUI();
    const { suppliers, addPurchaseInvoice } = useAdmin();
    const { products } = useData();
    
    const [supplierId, setSupplierId] = useState<number | ''>(suppliers[0]?.id || '');
    const [items, setItems] = useState<Partial<PurchaseInvoiceItem>[]>([{ product_id: undefined, quantity: 1, purchase_price: 0 }]);
    const [notes, setNotes] = useState('');

    const totalAmount = useMemo(() => {
        return items.reduce((total, item) => {
            const subtotal = (item.quantity || 0) * (item.purchase_price || 0);
            return total + subtotal;
        }, 0);
    }, [items]);

    const handleAddItem = () => {
        setItems(prev => [...prev, { product_id: undefined, quantity: 1, purchase_price: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof PurchaseInvoiceItem, value: any) => {
        setItems(prev => {
            const newItems = [...prev];
            const currentItem = { ...newItems[index] };
            
            if (field === 'product_id') {
                const productId = parseInt(value, 10);
                const product = products.find(p => p.id === productId);
                currentItem.product_id = productId;
                // Auto-fill purchase price with product's cost price if available
                currentItem.purchase_price = product?.cost_price || 0;
            } else {
                (currentItem as any)[field] = parseFloat(value) || 0;
            }

            // Calculate subtotal for the item
            currentItem.subtotal = (currentItem.quantity || 0) * (currentItem.purchase_price || 0);
            newItems[index] = currentItem;
            return newItems;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierId || items.some(item => !item.product_id)) {
            alert("Please select a supplier and ensure all items have a product selected.");
            return;
        }

        const finalItems = items.map(item => ({
            ...item,
            subtotal: (item.quantity || 0) * (item.purchase_price || 0)
        })) as PurchaseInvoiceItem[];

        addPurchaseInvoice({
            supplier_id: supplierId,
            total_amount: totalAmount,
            notes,
            items: finalItems,
        });
        onClose();
    };
    
    const formInputClasses = "w-full p-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500";


    return (
        <Modal title={t.addNewPurchaseInvoice} onClose={onClose} size="3xl">
            <form onSubmit={handleSubmit} className="p-5 flex flex-col max-h-[85vh]">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.supplier}</label>
                            <select value={supplierId} onChange={(e) => setSupplierId(parseInt(e.target.value, 10))} className={formInputClasses} required>
                                <option value="" disabled>Select a supplier</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.orderNotes}</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={formInputClasses}></textarea>
                    </div>
                </div>

                <div className="mt-6 flex-grow overflow-y-auto -mx-5 px-5">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">{t.invoiceItems}</h3>
                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 rounded-md bg-slate-50 dark:bg-slate-700/50">
                                <div className="col-span-5">
                                    <select value={item.product_id || ''} onChange={(e) => handleItemChange(index, 'product_id', e.target.value)} className={formInputClasses + " text-sm"} required>
                                        <option value="" disabled>{t.selectProduct}</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name.en}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                     <input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className={formInputClasses + " text-sm"} min="1" required />
                                </div>
                                <div className="col-span-2">
                                    <input type="number" value={item.purchase_price} onChange={(e) => handleItemChange(index, 'purchase_price', e.target.value)} className={formInputClasses + " text-sm"} step="0.01" min="0" required />
                                </div>
                                <div className="col-span-2 text-center font-semibold text-sm text-slate-700 dark:text-slate-200">
                                    {((item.quantity || 0) * (item.purchase_price || 0)).toFixed(2)}
                                </div>
                                <div className="col-span-1 text-center">
                                    <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={handleAddItem} className="mt-3 text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-semibold flex items-center gap-1">
                        <PlusIcon className="w-4 h-4" /> {t.addItemToInvoice}
                    </button>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div>
                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t.totalAmount}</span>
                        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{totalAmount.toFixed(2)} {t.currency}</p>
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold text-slate-800 dark:text-slate-300 transition-colors">{t.cancel}</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 font-semibold transition-colors">{t.save}</button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};
