import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { PurchaseInvoiceItem, Supplier, Product, PurchaseInvoice } from '../../types';
import { Modal } from '../Modal';
import { useUI } from '../../contexts/UIContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useData } from '../../contexts/DataContext';
import { PlusIcon, TrashIcon } from '../icons/Icons';
import { SearchableSelect } from './SearchableSelect';

interface PurchaseInvoiceModalProps {
    invoiceToEdit?: PurchaseInvoice | null;
    onClose: () => void;
}

export const PurchaseInvoiceModal: React.FC<PurchaseInvoiceModalProps> = ({ invoiceToEdit, onClose }) => {
    const { t, language } = useUI();
    const { suppliers, addPurchaseInvoice, updatePurchaseInvoice } = useInventory();
    const { products } = useData();
    
    const [supplierId, setSupplierId] = useState<number | ''>('');
    const [items, setItems] = useState<Partial<PurchaseInvoiceItem>[]>([{ product_id: undefined, quantity: 1, purchase_price: 0 }]);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        // This effect runs only when the modal is opened with a new invoice to edit.
        // It sets the initial state from the prop.
        if (invoiceToEdit) {
            setSupplierId(invoiceToEdit.supplier_id);
            setNotes(invoiceToEdit.notes || '');
            setItems(invoiceToEdit.items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                purchase_price: item.purchase_price,
                subtotal: item.subtotal,
            })));
        } else {
            // Reset to a clean slate only when opening for a "new" invoice.
            // A separate effect will handle setting the default supplier when the list loads.
            setSupplierId('');
            setItems([{ product_id: undefined, quantity: 1, purchase_price: 0 }]);
            setNotes('');
        }
    }, [invoiceToEdit]);

    useEffect(() => {
        // This effect specifically handles setting the default supplier for a *new* invoice
        // once the suppliers list is available, without resetting the entire form state.
        if (!invoiceToEdit && !supplierId && suppliers.length > 0) {
            setSupplierId(suppliers[0].id);
        }
    }, [suppliers, supplierId, invoiceToEdit]);
    
    const productOptions = useMemo(() => {
        return products.map(p => ({
            value: p.id,
            label: p.name[language]
        })).sort((a, b) => a.label.localeCompare(b.label));
    }, [products, language]);


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
                const productId = typeof value === 'string' ? parseInt(value, 10) : value;
                if (!productId) { // Handle case where product is deselected
                    currentItem.product_id = undefined;
                    currentItem.purchase_price = 0;
                    newItems[index] = currentItem;
                    return newItems;
                }
    
                const duplicateIndex = newItems.findIndex((item, i) => i !== index && item.product_id === productId);
    
                if (duplicateIndex !== -1) {
                    const duplicateItem = { ...newItems[duplicateIndex] };
                    const currentQuantity = currentItem.quantity || 1;
                    
                    duplicateItem.quantity = (duplicateItem.quantity || 0) + currentQuantity;
                    duplicateItem.subtotal = (duplicateItem.quantity || 0) * (duplicateItem.purchase_price || 0);
                    
                    newItems[duplicateIndex] = duplicateItem;
                    newItems.splice(index, 1);
                    
                    return newItems;
                } else {
                    const product = products.find(p => p.id === productId);
                    currentItem.product_id = productId;
                    currentItem.purchase_price = product?.cost_price || 0;
                    currentItem.subtotal = (currentItem.quantity || 1) * (currentItem.purchase_price || 0);
                    newItems[index] = currentItem;
                    return newItems;
                }
            } else {
                (currentItem as any)[field] = parseFloat(value) || 0;
                currentItem.subtotal = (currentItem.quantity || 0) * (currentItem.purchase_price || 0);
                newItems[index] = currentItem;
                return newItems;
            }
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

        if (invoiceToEdit) {
            updatePurchaseInvoice({
                ...invoiceToEdit,
                supplier_id: supplierId,
                total_amount: totalAmount,
                notes,
                items: finalItems,
            });
        } else {
            addPurchaseInvoice({
                supplier_id: supplierId,
                total_amount: totalAmount,
                notes,
                items: finalItems,
            });
        }
        onClose();
    };
    
    const formInputClasses = "w-full p-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500";


    return (
        <Modal title={invoiceToEdit ? t.editPurchaseInvoice : t.addNewPurchaseInvoice} onClose={onClose} size="3xl">
            <form onSubmit={handleSubmit}>
                <div className="p-5 space-y-4">
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

                    <div className="mt-6 space-y-4">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">{t.invoiceItems}</h3>
                        
                        <div className="hidden md:grid grid-cols-12 gap-2 items-center px-2 pb-2">
                            <div className="col-span-5 text-xs font-medium text-slate-500 dark:text-slate-400">{t.product}</div>
                            <div className="col-span-2 text-xs font-medium text-slate-500 dark:text-slate-400">{t.quantity}</div>
                            <div className="col-span-2 text-xs font-medium text-slate-500 dark:text-slate-400">{t.purchasePrice}</div>
                            <div className="col-span-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400">{t.subtotal}</div>
                            <div className="col-span-1"></div>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={index} className="flex flex-col gap-3 md:grid md:grid-cols-12 md:gap-2 items-center p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                                    <div className="w-full md:col-span-5">
                                        <label className="text-xs font-medium text-slate-500 md:hidden">{t.product}</label>
                                        <SearchableSelect
                                            options={productOptions}
                                            value={item.product_id}
                                            onChange={(value) => handleItemChange(index, 'product_id', value)}
                                            placeholder={t.selectProduct}
                                        />
                                    </div>
                                    <div className="w-full md:col-span-2">
                                        <label className="text-xs font-medium text-slate-500 md:hidden">{t.quantity}</label>
                                        <input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className={formInputClasses + " text-sm"} min="1" required />
                                    </div>
                                    <div className="w-full md:col-span-2">
                                        <label className="text-xs font-medium text-slate-500 md:hidden">{t.purchasePrice}</label>
                                        <input type="number" value={item.purchase_price} onChange={(e) => handleItemChange(index, 'purchase_price', e.target.value)} className={formInputClasses + " text-sm"} step="0.01" min="0" required />
                                    </div>
                                    <div className="w-full md:col-span-2 text-start md:text-center">
                                        <label className="text-xs font-medium text-slate-500 md:hidden">{t.subtotal}</label>
                                        <p className="font-semibold text-sm text-slate-700 dark:text-slate-200 mt-1 md:mt-0">
                                            {((item.quantity || 0) * (item.purchase_price || 0)).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="w-full md:w-auto md:col-span-1 text-end md:text-center">
                                        <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={handleAddItem} className="mt-3 text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-semibold flex items-center gap-1">
                            <PlusIcon className="w-4 h-4" /> {t.addItemToInvoice}
                        </button>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
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