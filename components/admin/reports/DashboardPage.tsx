import React, { useState, useMemo } from 'react';
import { useUI } from '../../../contexts/UIContext';
import { useAdmin } from '../../../contexts/AdminContext';
import { useData } from '../../../contexts/DataContext';
import { formatNumber, calculateTotal } from '../../../utils/helpers';
import { ArrowDownIcon, ArrowUpIcon, InformationCircleIcon } from '../../icons/Icons';
import type { Order, CartItem, OrderType, RestaurantInfo } from '../../../types';

// Simple, dependency-free components for data visualization
const KpiCard: React.FC<{ title: string; value: string; change?: number; tooltip: string }> = ({ title, value, change, tooltip }) => {
    const { t } = useUI();
    const isPositive = change !== undefined && change >= 0;

    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</h3>
                <div className="relative group">
                    <InformationCircleIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <div className="absolute bottom-full mb-2 -translate-x-1/2 left-1/2 w-60 p-2 text-xs text-white bg-slate-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {tooltip}
                    </div>
                </div>
            </div>
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">{value}</p>
            {change !== undefined && (
                <div className={`mt-1 flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
                    <span>{Math.abs(change).toFixed(1)}%</span>
                    <span className="text-slate-500 font-normal">{t.vsPreviousPeriod}</span>
                </div>
            )}
        </div>
    );
};

const BarChart: React.FC<{ data: { label: string, value: number }[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="space-y-3">
            {data.map((item, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                    <div className="w-28 truncate font-medium text-slate-600 dark:text-slate-300" title={item.label}>{item.label}</div>
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                        <div
                            className="bg-primary-500 h-4 rounded-full"
                            style={{ width: `${(item.value / maxValue) * 100}%` }}
                        />
                    </div>
                    <div className="w-12 text-right font-semibold text-slate-800 dark:text-slate-100">{formatNumber(item.value)}</div>
                </div>
            ))}
        </div>
    );
};

const DonutChart: React.FC<{ data: { label: string, value: number, color: string }[] }> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return <div className="flex items-center justify-center h-40 text-slate-500">{useUI().t.noDataForPeriod}</div>;
    
    let accumulatedAngle = 0;
    const circumference = 2 * Math.PI * 45; // r=45
    
    return (
        <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="-rotate-90">
                    {data.map((segment, index) => {
                        const percentage = (segment.value / total) * 100;
                        const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                        const strokeDashoffset = -accumulatedAngle * (circumference / 100);
                        accumulatedAngle += percentage;
                        return (
                            <circle key={index} cx="50" cy="50" r="45" fill="transparent" stroke={segment.color} strokeWidth="10" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
                        );
                    })}
                </svg>
            </div>
            <div className="space-y-2 text-sm w-full">
                {data.map((segment, index) => (
                    <div key={index} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }}></div>
                            <span className="font-semibold">{segment.label}</span>
                        </div>
                        <span className="text-slate-500 dark:text-slate-400">{((segment.value / total) * 100).toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const getStartAndEndDates = (dateRange: string, customStart?: string, customEnd?: string): { startDate: Date, endDate: Date } => {
    const now = new Date();
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    switch (dateRange) {
        case 'today':
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            return { startDate: todayStart, endDate: todayEnd };
        case 'yesterday':
            const yesterdayStart = new Date();
            yesterdayStart.setDate(now.getDate() - 1);
            yesterdayStart.setHours(0, 0, 0, 0);
            const yesterdayEnd = new Date(yesterdayStart);
            yesterdayEnd.setHours(23, 59, 59, 999);
            return { startDate: yesterdayStart, endDate: yesterdayEnd };
        case 'last7days':
            const last7Start = new Date();
            last7Start.setDate(now.getDate() - 6); // Including today
            last7Start.setHours(0, 0, 0, 0);
            return { startDate: last7Start, endDate: todayEnd };
        case 'thisMonth':
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            return { startDate: thisMonthStart, endDate: todayEnd };
        case 'last30days':
             const last30Start = new Date();
            last30Start.setDate(now.getDate() - 29); // Including today
            last30Start.setHours(0, 0, 0, 0);
            return { startDate: last30Start, endDate: todayEnd };
        case 'custom':
            const customStartDateObj = customStart ? new Date(customStart) : new Date(0);
            if (customStart) customStartDateObj.setHours(0, 0, 0, 0);
            const customEndDateObj = customEnd ? new Date(customEnd) : new Date();
            if (customEnd) customEndDateObj.setHours(23, 59, 59, 999);
            return { startDate: customStartDateObj, endDate: customEndDateObj };
        default:
             const defaultStart = new Date();
            defaultStart.setHours(0,0,0,0);
            return { startDate: defaultStart, endDate: todayEnd };
    }
}

export const DashboardPage: React.FC = () => {
    const { language, t } = useUI();
    const { orders: allOrders } = useAdmin();
    const { products: allProducts, restaurantInfo } = useData();
    const [dateRange, setDateRange] = useState('last7days');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    const completedStatusId = useMemo(() => {
        return restaurantInfo?.orderStatusColumns.find(col => col.color === 'green')?.id || 'completed';
    }, [restaurantInfo]);

    const filteredOrders = useMemo(() => {
        const { startDate, endDate } = getStartAndEndDates(dateRange, customStartDate, customEndDate);
        return allOrders.filter(o => {
            const orderDate = new Date(o.timestamp);
            return orderDate >= startDate && orderDate <= endDate;
        });
    }, [allOrders, dateRange, customStartDate, customEndDate]);

    const metrics = useMemo(() => {
        const completed = filteredOrders.filter(o => o.status === completedStatusId);
        const revenue = completed.reduce((sum, order) => sum + order.total, 0);
        return {
            totalRevenue: revenue,
            totalOrders: filteredOrders.length,
            avgOrderValue: completed.length > 0 ? revenue / completed.length : 0,
            completedOrders: completed.length,
        };
    }, [filteredOrders, completedStatusId]);

    const topProducts = useMemo(() => {
        const stats: { [key: number]: number } = {};
        filteredOrders.filter(o => o.status === completedStatusId).forEach(order => {
            order.items.forEach(item => {
                stats[item.product.id] = (stats[item.product.id] || 0) + item.quantity;
            });
        });
        return Object.entries(stats)
            .map(([id, quantity]) => ({ product: allProducts.find(p => p.id === +id), quantity }))
            .filter(p => p.product)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5)
            .map(p => ({ label: p.product!.name[language], value: p.quantity }));
    }, [filteredOrders, allProducts, completedStatusId, language]);
    
    const orderTypeDistribution = useMemo(() => {
        const stats: Record<OrderType, number> = { 'Dine-in': 0, 'Delivery': 0, 'Takeaway': 0 };
        filteredOrders.forEach(order => { stats[order.orderType]++; });
        return [
            { label: t.dineIn, value: stats['Dine-in'], color: '#3b82f6' },
            { label: t.takeaway, value: stats['Takeaway'], color: '#f59e0b' },
            { label: t.delivery, value: stats['Delivery'], color: '#10b981' },
        ];
    }, [filteredOrders, t]);

    const recentOrders = useMemo(() => {
        return [...allOrders].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
    }, [allOrders]);
    
    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 shrink-0">{t.dashboard}</h1>
                <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
                    {[
                        { id: 'today', label: t.today },
                        { id: 'yesterday', label: t.yesterday },
                        { id: 'last7days', label: t.last7days },
                        { id: 'thisMonth', label: t.thisMonth },
                    ].map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setDateRange(filter.id)}
                            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                                dateRange === filter.id 
                                ? 'bg-primary-600 text-white shadow' 
                                : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <KpiCard title={t.totalRevenue} value={`${metrics.totalRevenue.toFixed(2)} ${t.currency}`} tooltip={t.totalRevenueTooltip} />
                <KpiCard title={t.totalOrders} value={formatNumber(metrics.totalOrders)} tooltip={t.totalOrdersTooltip} />
                <KpiCard title={t.completedOrders} value={formatNumber(metrics.completedOrders)} tooltip={""} />
                <KpiCard title={t.avgOrderValue} value={`${metrics.avgOrderValue.toFixed(2)} ${t.currency}`} tooltip={t.avgOrderValueTooltip} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border dark:border-slate-700/80">
                    <h3 className="font-semibold mb-4">{t.topSellingProducts}</h3>
                    {topProducts.length > 0 ? <BarChart data={topProducts} /> : <div className="flex items-center justify-center h-40 text-slate-500">{t.noDataForPeriod}</div>}
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border dark:border-slate-700/80">
                    <h3 className="font-semibold mb-4">{t.orderTypeDistribution}</h3>
                    <DonutChart data={orderTypeDistribution} />
                </div>
            </div>

             <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border dark:border-slate-700/80">
                 <h3 className="font-semibold mb-4">Recent Activity</h3>
                 <div className="divide-y divide-slate-200 dark:divide-slate-700">
                     {recentOrders.map(order => (
                         <div key={order.id} className="py-3 flex justify-between items-center">
                             <div>
                                <p className="font-medium">{order.customer.name}</p>
                                <p className="text-sm text-slate-500">{order.items.length} items - {order.orderType}</p>
                             </div>
                             <div className="text-right">
                                <p className="font-semibold">{order.total.toFixed(2)} {t.currency}</p>
                                <p className="text-sm text-slate-500">{new Date(order.timestamp).toLocaleTimeString()}</p>
                             </div>
                         </div>
                     ))}
                 </div>
            </div>

        </div>
    );
};
