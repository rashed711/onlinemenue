import React from 'react';
import ReactDOM from 'react-dom';
import type { Order, Language, OrderStatus, RestaurantInfo } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { CloseIcon, DocumentTextIcon, PencilIcon } from '../icons/Icons';
import { StarRating } from '../StarRating';
import { formatDateTime, formatNumber } from '../../utils/helpers';

interface OrderDetailsModalProps {
    order: Order;
    onClose: () => void;
    language: Language;
    canEdit: boolean;
    onEdit: (order: Order) => void;
    restaurantInfo: RestaurantInfo;
}

const getStatusChipColor = (status: OrderStatus, restaurantInfo: RestaurantInfo) => {
    const color = restaurantInfo.orderStatusColumns.find(s => s.id === status)?.color || 'slate';
    // This is a TailwindCSS trick to make sure the dynamic classes are pre-compiled.
    // bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-500/30
    // bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-500/30
    // bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30
    // bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-500/30
    // bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-500/30
    // bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-500/30
    // bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30
    // bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-500/30
    // bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300 border-pink-200 dark:border-pink-500/30
    // bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-500/30
    return `bg-${color}-100 text-${color}-800 dark:bg-${color}-900/50 dark:text-${color}-300 border-${color}-200 dark:border-${color}-500/30`;
};

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, onClose, language, canEdit, onEdit, restaurantInfo }) => {
    const t = useTranslations(language);
    const statusDetails = restaurantInfo.orderStatusColumns.find(s => s.id === order.status);

    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.orderDetails}</h2>
                        <p className="font-mono text-sm text-slate-500 dark:text-slate-400">{order.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                         {canEdit && (
                            <button
                                onClick={() => onEdit(order)}
                                className="p-2 rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                title={t.editOrder}
                                aria-label={t.editOrder}
                            >
                                <PencilIcon className="w-5 h-5" />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label={t.close}>
                            <CloseIcon className="w-6 h-6"/>
                        </button>
                    </div>
                </div>
                
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
                         <div>
                            <p className="font-semibold text-slate-500 dark:text-slate-400 mb-1">{t.status}</p>
                             <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusChipColor(order.status, restaurantInfo)}`}>
                                {statusDetails?.name[language] || order.status}
                            </span>
                        </div>
                    </div>
                    
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
                            <h3 className="font-bold text-lg">{t.orderItems}</h3>
                            <span className="text-sm font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
                                {formatNumber(order.items.length)} {language === 'ar' ? 'أصناف' : 'Items'}
                            </span>
                        </div>
                        <div className="max-h-64 overflow-y-auto pr-2 space-y-3 -mr-2">
                            {order.items.map((item, index) => (
                                <div key={`${item.product.id}-${index}`} className="flex items-start gap-4 py-3 border-b dark:border-slate-700 last:border-b-0">
                                    <img src={item.product.image} alt={item.product.name[language]} className="w-16 h-16 rounded-lg object-cover" />
                                    <div className="flex-grow">
                                        <p className="font-semibold">{item.product.name[language]}</p>
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
                    <div className="text-end">
                        <p className="font-semibold text-slate-500 dark:text-slate-400 text-sm">{t.total}</p>
                        <p className="font-extrabold text-xl text-primary-600 dark:text-primary-400">{order.total.toFixed(2)} {t.currency}</p>
                    </div>
                </div>
            </div>
        </div>,
        portalRoot
    );
};