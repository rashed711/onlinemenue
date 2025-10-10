import React from 'react';
import type { Order, User, RestaurantInfo, Language, Permission, OrderStatus, OrderType } from '../../types';
import { HomeIcon, TakeawayIcon, TruckIcon, ClockIcon, UserCircleIcon, EyeIcon } from '../icons/Icons';
import { useTimeAgo } from '../../hooks/useTimeAgo';
import { useUI } from '../../contexts/UIContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { formatNumber } from '../../utils/helpers';

interface OrderCardProps {
    order: Order;
    style?: React.CSSProperties;
    className?: string;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, style, className }) => {
    const { language, t } = useUI();
    const { currentUser, hasPermission } = useAuth();
    const { restaurantInfo } = useData();
    const { users: allUsers, updateOrder, setRefusingOrder, setViewingOrder } = useAdmin();

    const isDriver = currentUser?.role === 'driver';
    const canManage = hasPermission('manage_order_status');
    const timeAgo = useTimeAgo(order.timestamp, language);

    const currentStatusDetails = restaurantInfo?.orderStatusColumns.find(s => s.id === order.status);
    const creator = order.createdBy ? allUsers.find(u => u.id === order.createdBy) : null;
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    
    const OrderTypeIcon: React.FC<{ type: OrderType }> = ({ type }) => {
        switch (type) {
            case 'Dine-in': return <HomeIcon className="w-5 h-5 flex-shrink-0" />;
            case 'Takeaway': return <TakeawayIcon className="w-5 h-5 flex-shrink-0" />;
            case 'Delivery': return <TruckIcon className="w-5 h-5 flex-shrink-0" />;
            default: return null;
        }
    };

    const renderActions = () => {
        if (!restaurantInfo) return null;
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
    
    // Dynamically set border color based on status
    const statusColor = currentStatusDetails?.color || 'slate';
    const borderColorClass = `border-${statusColor}-500`;
    
    // New: Dynamically set background color based on order type
    const getOrderTypeColorClasses = (orderType: OrderType): string => {
        switch (orderType) {
            case 'Dine-in':
                return 'bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900';
            case 'Takeaway':
                return 'bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 dark:hover:bg-amber-900';
            case 'Delivery':
                return 'bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900';
            default:
                return 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50';
        }
    };
    
    return (
        <div 
            onClick={() => setViewingOrder(order)} 
            style={style} 
            className={`rounded-lg shadow-md p-3.5 flex flex-col cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 border-s-4 ${borderColorClass} ${getOrderTypeColorClasses(order.orderType)} ${className || ''}`}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
                <p className="font-bold font-mono text-slate-500 dark:text-slate-400 text-sm">{order.id}</p>
                <div className="text-end">
                    <p className="font-extrabold text-lg text-slate-800 dark:text-slate-100 leading-tight">{order.total.toFixed(2)}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">{t.currency}</p>
                </div>
            </div>

            {/* Body */}
            <div className="space-y-3 flex-grow my-2">
                <div className="flex items-center gap-2 font-bold text-base text-slate-700 dark:text-slate-200">
                    <OrderTypeIcon type={order.orderType} />
                    <span className="truncate" title={order.customer.name}>
                         {order.orderType === 'Dine-in' && order.tableNumber ? (
                            `${t.table}: ${formatNumber(parseInt(order.tableNumber, 10))}`
                        ) : (
                            order.customer.name || 'Guest'
                        )}
                    </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pl-1">
                     <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 flex-shrink-0" />
                        <span>{timeAgo}</span>
                     </div>
                     {creator && (
                         <div className="flex items-center gap-2">
                            <UserCircleIcon className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{creator.name}</span>
                         </div>
                     )}
                </div>
            </div>
            
            {/* Footer */}
            <div className="flex justify-between items-center pt-3 mt-auto border-t border-slate-200/80 dark:border-slate-700/80">
                <span className="text-xs font-semibold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                    {totalItems} {t.items}
                </span>
                <div className="flex items-center gap-1 sm:gap-2">
                     {renderActions()}
                     <button onClick={(e) => { e.stopPropagation(); setViewingOrder(order); }} className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full" title={t.viewOrderDetails}>
                        <EyeIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
