import React from 'react';
import type { Order } from '../../types';
import { useUI } from '../../contexts/UIContext';
import { useData } from '../../contexts/DataContext';
import { formatDateTime } from '../../utils/helpers';
import { CheckCircleIcon } from '../icons/Icons';

interface ActiveOrderCardProps {
    order: Order;
}

const OrderStatusTracker: React.FC<{ order: Order }> = ({ order }) => {
    const { restaurantInfo } = useData();
    const { language } = useUI();
    
    if (!restaurantInfo) return null;

    const statuses = restaurantInfo.orderStatusColumns.filter(s => !['cancelled', 'refused', 'completed'].includes(s.id));
    const currentStatusIndex = statuses.findIndex(s => s.id === order.status);

    if (currentStatusIndex === -1) return null;

    return (
        <div className="flex items-start -mx-2">
            {statuses.map((status, index) => {
                const isCompleted = index < currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                
                return (
                    <React.Fragment key={status.id}>
                        <div className="flex flex-col items-center text-center px-2 w-1/4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${isCompleted ? 'bg-green-500 border-green-500' : isCurrent ? 'bg-blue-500 border-blue-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600 border-slate-300 dark:border-slate-600'}`}>
                                {isCompleted && <CheckCircleIcon className="w-8 h-8 text-white" />}
                            </div>
                            <p className={`mt-2 text-xs font-semibold leading-tight ${isCurrent ? 'text-blue-600 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}`}>{status.name[language]}</p>
                        </div>
                        {index < statuses.length - 1 && <div className={`flex-1 h-1.5 mt-4 rounded transition-colors duration-500 ${isCompleted ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>}
                    </React.Fragment>
                );
            })}
        </div>
    );
};


export const ActiveOrderCard: React.FC<ActiveOrderCardProps> = ({ order }) => {
    const { t } = useUI();
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{t.orderId}: <span className="font-mono text-primary-600">{order.id}</span></p>
                    <p className="text-xs text-slate-500">{formatDateTime(order.timestamp)}</p>
                </div>
                <div className="text-end">
                    <p className="text-2xl font-extrabold text-primary-600 dark:text-primary-400">{order.total.toFixed(2)}</p>
                    <p className="text-xs text-slate-500 -mt-1">{t.currency}</p>
                </div>
            </div>
            <OrderStatusTracker order={order} />
        </div>
    );
};