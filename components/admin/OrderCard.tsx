import React from 'react';
import type { Order, User, RestaurantInfo, Language, Permission, OrderStatus } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { formatNumber } from '../../utils/helpers';

interface OrderCardProps {
    order: Order;
    style?: React.CSSProperties;
    className?: string;
    currentUser: User | null;
    hasPermission: (permission: Permission) => boolean;
    updateOrder: (orderId: string, payload: Partial<Omit<Order, 'id' | 'timestamp' | 'customer'>>) => void;
    setRefusingOrder: (order: Order | null) => void;
    setViewingOrder: (order: Order | null) => void;
    restaurantInfo: RestaurantInfo;
    allUsers: User[];
    language: Language;
}

export const OrderCard: React.FC<OrderCardProps> = ({ 
    order, 
    style, 
    className, 
    currentUser, 
    hasPermission, 
    updateOrder, 
    setRefusingOrder, 
    setViewingOrder,
    restaurantInfo,
    allUsers,
    language
}) => {
    const t = useTranslations(language);
    const isDriver = currentUser?.role === 'driver';
    const canManage = hasPermission('manage_order_status');

    const getStatusColorClass = (color: string) => {
        const colorMap: Record<string, string> = {
            yellow: 'text-yellow-500',
            orange: 'text-orange-500',
            cyan: 'text-cyan-500',
            blue: 'text-blue-500',
            green: 'text-green-500',
            slate: 'text-slate-500',
            red: 'text-red-500',
            indigo: 'text-indigo-500',
            purple: 'text-purple-500',
            pink: 'text-pink-500',
        };
        return colorMap[color] || 'text-gray-500';
    };

    const currentStatusDetails = restaurantInfo.orderStatusColumns.find(s => s.id === order.status);
    const creator = order.createdBy ? allUsers.find(u => u.id === order.createdBy) : null;
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

    const renderActions = () => {
        if (isDriver && order.status === 'out_for_delivery') {
            return (
                <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); updateOrder(order.id, { status: 'completed' }); }} className="text-xs font-bold bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">{t.markAsDelivered}</button>
                    <button onClick={(e) => { e.stopPropagation(); setRefusingOrder(order); }} className="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">{t.markAsRefused}</button>
                </div>
            );
        }
        if (canManage) {
            return (
                <select
                    value={order.status}
                    onChange={(e) => {
                        e.stopPropagation();
                        const newStatus = e.target.value as OrderStatus;
                        // When marking refused from dropdown, also show modal
                        if (newStatus === 'refused' && order.status !== 'refused') {
                            setRefusingOrder(order);
                        } else {
                            updateOrder(order.id, { status: newStatus });
                        }
                    }}
                    onClick={(e) => e.stopPropagation()} // Prevent card click
                    className="text-sm rounded-full border-slate-300 dark:bg-slate-700 dark:border-slate-600 focus:ring-primary-500 focus:border-primary-500 px-3 py-1 font-semibold bg-slate-100 hover:bg-slate-200"
                >
                   {restaurantInfo.orderStatusColumns.map(status => (
                        <option key={status.id} value={status.id}>{status.name[language]}</option>
                   ))}
                </select>
            );
        }
        return null;
    };

    return (
        <div onClick={() => setViewingOrder(order)} style={style} className={`bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 flex flex-col cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border border-slate-200 dark:border-slate-700 ${className || ''}`}>
            <div className="flex justify-between items-center mb-3">
                <p className="font-extrabold text-lg text-amber-800 bg-amber-300 dark:bg-amber-400 dark:text-amber-900 px-3 py-0.5 rounded-md">
                    {order.total.toFixed(2)}
                </p>
                <p className="font-bold font-mono text-slate-500 dark:text-slate-400 text-sm">
                    {order.id}
                </p>
            </div>

            <div className="space-y-3 flex-grow">
                {currentStatusDetails && (
                    <div className={`flex items-center gap-2 font-bold text-base ${getStatusColorClass(currentStatusDetails.color)}`}>
                        <span>{currentStatusDetails.name[language]}</span>
                    </div>
                )}
                <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {order.orderType === 'Dine-in' && order.tableNumber ? (
                        `${t.table}: ${formatNumber(parseInt(order.tableNumber, 10))}`
                    ) : (
                        order.customer.name || 'Guest'
                    )}
                </div>
                 <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
                    <span>
                        {creator ? `${t.creator}: ${creator.name}` : ''}
                    </span>
                    <span className="font-semibold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                        {totalItems} {t.items}
                    </span>
                </div>
            </div>

            <div className="flex justify-between items-center pt-3 mt-3 border-t dark:border-slate-700">
                <div>
                    {renderActions()}
                </div>
                <button onClick={(e) => { e.stopPropagation(); setViewingOrder(order); }} className="text-sm font-bold text-primary-600 hover:underline dark:text-primary-400">
                    {t.viewOrderDetails}
                </button>
            </div>
        </div>
    );
};
