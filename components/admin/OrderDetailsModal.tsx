
import React from 'react';
import type { Order, Language, OrderStatus } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { CloseIcon, DocumentTextIcon, PencilIcon } from '../icons/Icons';
import { StarRating } from '../StarRating';

interface OrderDetailsModalProps {
    order: Order;
    onClose: () => void;
    language: Language;
    canEdit: boolean;
    onEdit: (order: Order) => void;
}

const statusToTranslationKey = (status: OrderStatus, t: ReturnType<typeof useTranslations>): keyof typeof t => {
    const key = status.charAt(0).toLowerCase() + status.slice(1).replace(/ /g, '');
    return key as keyof typeof t;
};


const getStatusChipColor = (status: OrderStatus) => {
    switch (status) {
        case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        case 'Ready for Pickup': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
        case 'Out for Delivery': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
        case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'Refused':
        case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
};

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({ order, onClose, language, canEdit, onEdit }) => {
    const t = useTranslations(language);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in-up" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 shrink-0">
                    <div className='flex items-center gap-4'>
                        <h2 className="text-xl font-bold">{t.orderDetails} - <span className="font-mono text-primary-600">{order.id}</span></h2>
                        {canEdit && (
                            <button onClick={() => onEdit(order)} className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold py-1.5 px-3 rounded-md transition-colors">
                                <PencilIcon className="w-4 h-4" />
                                {t.editOrder}
                            </button>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                     <div className="bg-slate-50 dark:bg-gray-700/50 p-4 rounded-lg">
                        <h3 className="font-bold text-lg mb-4">{t.customerInfo}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-semibold text-gray-500 dark:text-gray-400">{t.name}</p>
                                <p className="font-bold text-base">{order.customer.name || 'Guest'}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-500 dark:text-gray-400">{t.mobileNumber}</p>
                                <p className="font-bold text-base">{order.customer.mobile}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                         <div>
                            <p className="font-semibold text-gray-500 dark:text-gray-400 mb-1">{t.date}</p>
                            <p>{new Date(order.timestamp).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-500 dark:text-gray-400 mb-1">{t.orderType}</p>
                            <p className="font-bold">{t[order.orderType === 'Dine-in' ? 'dineIn' : 'delivery']}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-500 dark:text-gray-400 mb-1">{t.status}</p>
                            <p>
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChipColor(order.status)}`}>
                                    {t[statusToTranslationKey(order.status, t)] || order.status}
                                </span>
                            </p>
                        </div>
                    </div>
                    
                    {order.notes && (
                        <div className="bg-blue-50 dark:bg-blue-900/40 p-4 rounded-lg">
                            <h3 className="font-bold text-lg mb-2 text-blue-800 dark:text-blue-200 flex items-center gap-2">
                                <DocumentTextIcon className="w-5 h-5" />
                                {t.orderNotes}
                            </h3>
                            <p className="text-sm text-blue-700 dark:text-blue-200 whitespace-pre-wrap">{order.notes}</p>
                        </div>
                    )}

                    {order.refusalReason && (
                        <div className="bg-red-50 dark:bg-red-900/40 p-4 rounded-lg">
                            <h3 className="font-bold text-lg mb-2 text-red-800 dark:text-red-200">{t.refusalInfo}</h3>
                            <p className="text-sm text-red-700 dark:text-red-200">{order.refusalReason}</p>
                        </div>
                    )}
                    
                    {order.customerFeedback && (
                         <div className="bg-green-50 dark:bg-green-900/40 p-4 rounded-lg">
                            <h3 className="font-bold text-lg mb-2 text-green-800 dark:text-green-200">{t.customerFeedback}</h3>
                            <div className="flex items-center mb-2">
                                <StarRating rating={order.customerFeedback.rating} />
                            </div>
                            <p className="text-sm text-green-700 dark:text-green-200 italic">"{order.customerFeedback.comment}"</p>
                        </div>
                    )}

                    <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                        <div className="flex justify-between items-baseline">
                            <h3 className="font-bold text-lg">{t.orderItems}</h3>
                             <div className="text-end">
                                <p className="font-semibold text-gray-500 dark:text-gray-400 text-sm">{t.total}</p>
                                <p className="font-extrabold text-xl text-primary-600 dark:text-primary-400">{order.total.toFixed(2)} {t.currency}</p>
                            </div>
                        </div>
                        {order.items.map((item, index) => (
                            <div key={`${item.product.id}-${index}`} className="flex items-start gap-4 py-3 border-b dark:border-gray-700 last:border-b-0">
                                <img src={item.product.image} alt={item.product.name[language]} className="w-20 h-20 rounded-lg object-cover" />
                                <div className="flex-grow">
                                    <p className="font-semibold">{item.product.name[language]}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.quantity}: {item.quantity}</p>
                                    {item.options && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                                <div className="text-end">
                                    <p className="font-semibold text-gray-700 dark:text-gray-200">{(item.product.price * item.quantity).toFixed(2)} {t.currency}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};