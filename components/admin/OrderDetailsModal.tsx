import React, { useState, useEffect } from 'react';
import type { Order } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { DocumentTextIcon, PencilIcon, ShareIcon, PrintIcon, TrashIcon, CloseIcon } from '../icons/Icons';
import { StarRating } from '../StarRating';
import { formatDateTime, formatNumber, generateReceiptImage } from '../../utils/helpers';
import { Modal } from '../Modal';
import { useUI } from '../../contexts/UIContext';
import { useData } from '../../contexts/DataContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';

interface OrderDetailsModalProps {
    order: Order;
    onClose: () => void;
    canEdit: boolean;
    onEdit: (order: Order) => void;
    canDelete: boolean;
    onDelete: (orderId: string) => void;
    creatorName?: string;
}

const getStatusChipColor = (status: string, restaurantInfo: any) => {
    const color = restaurantInfo.orderStatusColumns.find((s: any) => s.id === status)?.color || 'slate';
    return `bg-${color}-100 text-${color}-800 dark:bg-${color}-900/50 dark:text-${color}-300 border-${color}-200 dark:border-${color}-500/30`;
};

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, onClose, canEdit, onEdit, canDelete, onDelete, creatorName }) => {
    const { language } = useUI();
    const { restaurantInfo } = useData();
    const { updateOrder } = useAdmin();
    const { hasPermission } = useAuth();
    const t = useTranslations(language);
    
    const [isReceiptViewerOpen, setIsReceiptViewerOpen] = useState(false);
    const { isProcessing, setIsProcessing } = useUI();
    const [codPaymentDetail, setCodPaymentDetail] = useState('');
    const [isEditingPayment, setIsEditingPayment] = useState(false);

    const canEditPayment = hasPermission('edit_recorded_payment');

    useEffect(() => {
        // Automatically enter edit mode only if no payment is recorded AND the user has permission.
        setIsEditingPayment(!order.paymentDetail && canEditPayment);
        if (order.paymentDetail) {
            setCodPaymentDetail(order.paymentDetail);
        } else {
            setCodPaymentDetail('');
        }
    }, [order, canEditPayment]);

    const handleShare = async () => {
        setIsProcessing(true);
        try {
            if (!restaurantInfo) throw new Error("Restaurant info not available");
            const imageUrl = await generateReceiptImage(order, restaurantInfo, t, language, creatorName);
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const file = new File([blob], `order-${order.id}.png`, { type: 'image/png' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `${t.orderDetails} - ${order.id}`,
                    text: `Order details for ${order.id}`,
                });
            } else {
                alert('Web Share API is not supported in your browser.');
            }
        } catch (error) {
            console.error('Error sharing order:', error);
            if ((error as DOMException)?.name !== 'AbortError') {
                 alert('Could not share order.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePrint = async () => {
        setIsProcessing(true);
        try {
            if (!restaurantInfo) throw new Error("Restaurant info not available");
            const imageUrl = await generateReceiptImage(order, restaurantInfo, t, language, creatorName);
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                        <head>
                            <title>Print Order ${order.id}</title>
                            <style>
                                @media print {
                                    @page { size: 80mm auto; margin: 0; }
                                    body { margin: 0; padding: 10px; }
                                }
                                body { margin: 0; display: flex; justify-content: center; }
                                img { max-width: 100%; }
                            </style>
                        </head>
                        <body>
                            <img src="${imageUrl}" />
                            <script>
                                window.onload = function() {
                                    window.print();
                                    window.close();
                                }
                            </script>
                        </body>
                    </html>
                `);
                printWindow.document.close();
            }
        } catch (error) {
            console.error('Error printing order:', error);
            alert('Could not prepare order for printing.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveCodPayment = async () => {
        if (codPaymentDetail) {
            await updateOrder(order.id, { paymentDetail: codPaymentDetail });
            setIsEditingPayment(false);
        }
    }

    if (!restaurantInfo) return null;
    const statusDetails = restaurantInfo.orderStatusColumns.find(s => s.id === order.status);
    const availableOnlineMethods = restaurantInfo.onlinePaymentMethods?.filter(m => m.isVisible) || [];

    return (
        <>
            <Modal title={`${t.orderDetails} - ${order.id}`} onClose={onClose} size="xl">
                <div className="flex flex-col overflow-hidden h-full">
                    <div className="p-5 space-y-4 overflow-y-auto flex-grow">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                             <div className="sm:col-span-2">
                                <p className="font-semibold text-slate-500 dark:text-slate-400 mb-1">{t.customerInfo}</p>
                                <p className="font-bold truncate">{order.customer.name || 'Guest'}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-300">{order.customer.mobile}</p>
                                {order.customer.address && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 whitespace-pre-wrap">{order.customer.address}</p>
                                )}
                            </div>
                            <div>
                                <p className="font-semibold text-slate-500 dark:text-slate-400 mb-1">{t.date}</p>
                                <p>{formatDateTime(order.timestamp)}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-slate-500 dark:text-slate-400 mb-1">{t.orderType}</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="font-bold">{t[order.orderType === 'Dine-in' ? 'dineIn' : 'delivery']}</p>
                                    {order.tableNumber && <p className="text-xs text-slate-500 dark:text-slate-400">({t.table} {formatNumber(parseInt(order.tableNumber, 10))})</p>}
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <p className="font-semibold text-slate-500 dark:text-slate-400 mb-1">{t.paymentMethod}</p>
                                <p className="font-bold">{order.paymentMethod === 'cod' ? t.cashOnDelivery : t.onlinePayment || "N/A"}</p>
                                
                                {!isEditingPayment && order.paymentDetail ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{t.paymentCollectedVia} <span className="font-medium text-slate-700 dark:text-slate-200">{order.paymentDetail}</span></p>
                                        {canEditPayment && (
                                            <button onClick={() => setIsEditingPayment(true)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                                <PencilIcon className="w-4 h-4" /> {t.edit}
                                            </button>
                                        )}
                                    </div>
                                ) : null}

                                {order.paymentMethod === 'online' && order.paymentReceiptUrl && (
                                     <button onClick={() => setIsReceiptViewerOpen(true)} className="mt-1 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">
                                        {t.viewReceipt}
                                    </button>
                                )}
                            </div>
                            <div>
                                <p className="font-semibold text-slate-500 dark:text-slate-400 mb-1">{t.status}</p>
                                 <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusChipColor(order.status, restaurantInfo)}`}>
                                    {statusDetails?.name[language] || order.status}
                                </span>
                            </div>
                        </div>

                        {isEditingPayment && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700/50">
                                <label className="block text-sm font-semibold mb-2 text-blue-800 dark:text-blue-200">{order.paymentDetail ? t.edit : t.recordPayment}</label>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={codPaymentDetail}
                                        onChange={(e) => setCodPaymentDetail(e.target.value)}
                                        className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
                                    >
                                        <option value="">{t.selectMethod}</option>
                                        <option value={t.cash}>{t.cash}</option>
                                        {availableOnlineMethods.map(method => (
                                            <option key={method.id} value={method.name[language]}>{method.name[language]}</option>
                                        ))}
                                    </select>
                                    <button 
                                        onClick={handleSaveCodPayment} 
                                        disabled={!codPaymentDetail || isProcessing}
                                        className="bg-blue-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
                                    >
                                        {t.savePayment}
                                    </button>
                                    {order.paymentDetail && (
                                        <button 
                                            type="button"
                                            onClick={() => setIsEditingPayment(false)}
                                            className="bg-slate-200 text-slate-800 font-bold py-2 px-3 rounded-lg hover:bg-slate-300 transition-colors"
                                        >
                                            {t.cancel}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {order.notes && (
                            <div className="bg-blue-50 dark:bg-blue-900/40 p-4 rounded-lg border border-blue-200 dark:border-blue-500/30">
                                <h3 className="font-bold text-lg mb-2 text-blue-800 dark:text-blue-200 flex items-center gap-2">
                                    <DocumentTextIcon className="w-5 h-5" />
                                    {t.orderNotes}
                                </h3>
                                <p className="text-sm text-blue-700 dark:text-blue-200 whitespace-pre-wrap">{order.notes}</p>
                            </div>
                        )}

                        {order.refusalReason && (
                            <div className="bg-red-50 dark:bg-red-900/40 p-4 rounded-lg border border-red-200 dark:border-red-500/30">
                                <h3 className="font-bold text-lg mb-2 text-red-800 dark:text-red-200">{t.refusalInfo}</h3>
                                <p className="text-sm text-red-700 dark:text-red-200">{order.refusalReason}</p>
                            </div>
                        )}
                        
                        {order.customerFeedback && (
                             <div className="bg-green-50 dark:bg-green-900/40 p-4 rounded-lg border border-green-200 dark:border-green-500/30">
                                <h3 className="font-bold text-lg mb-2 text-green-800 dark:text-green-200">{t.customerFeedback}</h3>
                                <div className="flex items-center mb-2">
                                    <StarRating rating={order.customerFeedback.rating} />
                                </div>
                                <p className="text-sm text-green-700 dark:text-green-200 italic">"{order.customerFeedback.comment}"</p>
                            </div>
                        )}

                        <div className="space-y-2 pt-4 border-t dark:border-slate-700">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{t.orderItems}</h3>
                                <span className="text-sm font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
                                    {formatNumber(order.items.length)} {language === 'ar' ? 'أصناف' : 'Items'}
                                </span>
                            </div>
                            <div className="max-h-64 overflow-y-auto pr-2 space-y-3 -mr-2">
                                {order.items.map((item, index) => (
                                    <div key={`${item.product.id}-${index}`} className="flex items-start gap-4 py-3 border-b dark:border-slate-700 last:border-b-0">
                                        <img src={item.product.image} alt={item.product.name[language]} className="w-16 h-16 rounded-lg object-cover" />
                                        <div className="flex-grow">
                                            <p className="font-semibold text-slate-800 dark:text-slate-300">{item.product.name[language]}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{t.quantity}: {formatNumber(item.quantity)}</p>
                                            {item.options && (
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                    {Object.entries(item.options).map(([optionKey, valueKey]) => {
                                                        const option = item.product.options?.find(o => o.name.en === optionKey);
                                                        const value = option?.values.find(v => v.name.en === valueKey);
                                                        if (option && value) {
                                                            return <div key={optionKey}>+ {value.name[language]}</div>
                                                        }
                                                        return null;
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-end shrink-0">
                                            <p className="font-semibold text-slate-700 dark:text-slate-200">{(item.product.price * item.quantity).toFixed(2)} {t.currency}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t dark:border-slate-700 shrink-0 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
                        <div className="sm:flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                {canEdit && <button onClick={() => onEdit(order)} className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors font-semibold flex items-center gap-2"><PencilIcon className="w-5 h-5" />{t.editOrder}</button>}
                                {canDelete && <button onClick={() => onDelete(order.id)} className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors font-semibold flex items-center gap-2"><TrashIcon className="w-5 h-5" />{t.deleteOrder}</button>}
                                <button onClick={handleShare} disabled={isProcessing} className="p-2 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors font-semibold flex items-center gap-2 disabled:opacity-50"><ShareIcon className="w-5 h-5" />{t.share}</button>
                                <button onClick={handlePrint} disabled={isProcessing} className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold flex items-center gap-2 disabled:opacity-50"><PrintIcon className="w-5 h-5" />{t.print}</button>
                            </div>
                            <div className="text-end mt-4 sm:mt-0">
                                <p className="font-semibold text-slate-500 dark:text-slate-400 text-sm">{t.total}</p>
                                <p className="font-extrabold text-xl text-primary-600 dark:text-primary-400">{order.total.toFixed(2)} {t.currency}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
            {isReceiptViewerOpen && order.paymentReceiptUrl && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-80 z-[60] flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setIsReceiptViewerOpen(false)}
                >
                    <button 
                        onClick={() => setIsReceiptViewerOpen(false)}
                        className="absolute top-4 right-4 text-white p-2 rounded-full bg-black/50 hover:bg-black/80 transition-colors"
                        aria-label={t.close}
                    >
                        <CloseIcon className="w-8 h-8"/>
                    </button>
                    <img 
                        src={order.paymentReceiptUrl} 
                        alt="Payment Receipt" 
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
};