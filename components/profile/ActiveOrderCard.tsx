import React from 'react';
import type { Order } from '../../types';
import { useUI } from '../../contexts/UIContext';
import { useData } from '../../contexts/DataContext';
import { formatDateTime } from '../../utils/helpers';
import { CheckIcon, CloseIcon } from '../icons/Icons';

interface ActiveOrderCardProps {
    order: Order;
}

const OrderStatusTracker: React.FC<{ order: Order }> = ({ order }) => {
    const { restaurantInfo } = useData();
    const { language } = useUI();
    
    if (!restaurantInfo) return null;

    // Direct safety check: If an order is somehow 'cancelled' or 'refused', do not render its tracker in the active list.
    if (order.status === 'cancelled' || order.status === 'refused') {
        return null;
    }

    // [FIXED] Filter out terminal/inactive statuses (like 'cancelled') by their color property
    // instead of a hardcoded ID, which is more robust.
    const orderStages = restaurantInfo.orderStatusColumns.filter(
        s => s.color !== 'slate'
    );
    
    const currentStageIndex = orderStages.findIndex(s => s.id === order.status);

    // If the order's status is not a valid active stage, don't render the tracker.
    if (currentStageIndex === -1) {
        return null;
    }

    const completedStageId = orderStages.find(s => s.color === 'green')?.id;

    return (
        <div className="flex items-start -mx-2">
            {orderStages.map((stage, index) => {
                const isCurrent = index === currentStageIndex;
                const isCompleted = index < currentStageIndex || (isCurrent && order.status === completedStageId);
                
                let circleClasses = 'bg-slate-300 dark:bg-slate-600 border-slate-300 dark:border-slate-600';
                let icon = null;
                let textClasses = 'text-slate-600 dark:text-slate-400';

                if (isCompleted) {
                    circleClasses = 'bg-green-500 border-green-500';
                    icon = <CheckIcon className="w-6 h-6 text-white" strokeWidth={3} />;
                } else if (isCurrent) {
                    circleClasses = 'bg-blue-500 border-blue-500 animate-pulse';
                    textClasses = 'text-blue-600 dark:text-blue-300';
                }
                
                const isLineCompleted = index < currentStageIndex;

                return (
                    <React.Fragment key={stage.id}>
                        <div className="flex flex-col items-center text-center px-2 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${circleClasses}`}>
                                {icon}
                            </div>
                            <p className={`mt-2 text-xs font-semibold leading-tight ${textClasses}`}>{stage.name[language]}</p>
                        </div>
                        {index < orderStages.length - 1 && (
                            <div className={`flex-1 h-1.5 mt-4 rounded-full transition-colors duration-500 ${isLineCompleted ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                        )}
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