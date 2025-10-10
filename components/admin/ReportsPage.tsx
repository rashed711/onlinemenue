import React, { useState, useMemo } from 'react';
import type { Language, Order, Product, Category, CartItem, OrderType, RestaurantInfo } from '../../types';
import { formatNumber } from '../../utils/helpers';
import { ArrowDownIcon, ArrowUpIcon, InformationCircleIcon } from '../icons/Icons';
import { useUI } from '../../contexts/UIContext';
import { useData } from '../../contexts/DataContext';
import { useAdmin } from '../../contexts/AdminContext';

type DateFilterPreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth';

const calculateItemRevenue = (item: CartItem): number => {
    let itemPrice = item.product.price;
    if (item.options && item.product.options) {
        Object.entries(item.options).forEach(([optionKey, valueKey]) => {
            const option = item.product.options?.find(opt => opt.name.en === optionKey);
            const value = option?.values.find(val => val.name.en === valueKey);
            if (value) {
                itemPrice += value.priceModifier;
            }
        });
    }
    return itemPrice * item.quantity;
}

// Reusable KPI Card component
const KpiCard: React.FC<{ title: string; value: string; change?: number; tooltip: string; language: Language }> = ({ title, value, change, tooltip, language }) => {
    const { t } = useUI();
    const isPositive = change !== undefined && change >= 0;
    const isNegative = change !== undefined && change < 0;

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-500 dark:text-slate-400">{title}</h3>
                <div className="relative group">
                    <InformationCircleIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <div className="absolute bottom-full mb-2 -translate-x-1/2 left-1/2 w-64 p-2 text-xs text-white bg-slate-800 dark:bg-slate-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {tooltip}
                    </div>
                </div>
            </div>
            <p className="text-3xl lg:text-4xl font-extrabold text-slate-800 dark:text-slate-100 mt-2">{value}</p>
            {change !== undefined && (
                <div className={`mt-2 flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isPositive ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
                    <span>{Math.abs(change).toFixed(1)}%</span>
                    <span className="text-slate-500 dark:text-slate-400 font-normal text-xs">{t.vsPreviousPeriod}</span>
                </div>
            )}
        </div>
    );
};

// Reusable Donut Chart component
const DonutChart: React.FC<{ data: { label: string, value: number, color: string }[], total: number }> = ({ data, total }) => {
    const { t } = useUI();
    if (total === 0) {
        return <div className="flex items-center justify-center h-48 text-slate-500">{t.noDataForPeriod}</div>;
    }
    const circumference = 2 * Math.PI * 45; // r=45
    let accumulatedAngle = 0;

    return (
        <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="-rotate-90">
                    {data.map((segment, index) => {
                        const percentage = (segment.value / total) * 100;
                        const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                        const strokeDashoffset = -accumulatedAngle * (circumference / 100);
                        accumulatedAngle += percentage;
                        return (
                            <circle
                                key={index}
                                cx="50" cy="50" r="45"
                                fill="transparent"
                                stroke={segment.color}
                                strokeWidth="10"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                            />
                        );
                    })}
                </svg>
            </div>
            <div className="space-y-2 text-sm">
                {data.map((segment, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }}></div>
                        <div className="flex justify-between w-full">
                            <span className="font-semibold">{segment.label}</span>
                            <span className="text-slate-500 dark:text-slate-400">{((segment.value / total) * 100).toFixed(1)}% ({formatNumber(segment.value)})</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export const ReportsPage: React.FC = () => {
    const { language, t } = useUI();
    const { products: allProducts, categories: allCategories, restaurantInfo } = useData();
    const { orders: allOrders } = useAdmin();

    const [activePreset, setActivePreset] = useState<DateFilterPreset>('last7days');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    if (!restaurantInfo) {
        return <div className="p-8 text-center">Loading reports...</div>;
    }

    const completedStatusId = useMemo(() => {
        const greenStatus = restaurantInfo.orderStatusColumns.find(col => col.color === 'green');
        return greenStatus ? greenStatus.id : 'completed';
    }, [restaurantInfo.orderStatusColumns]);

    const { currentRange, previousRange } = useMemo(() => {
        const toISO = (date: Date) => date.toISOString().split('T')[0];
        const now = new Date();
        now.setHours(23, 59, 59, 999);

        let start = new Date(now);
        start.setHours(0, 0, 0, 0);
        let end = new Date(now);

        let prevStart: Date, prevEnd: Date;

        switch (activePreset) {
            case 'today':
                prevStart = new Date(start); prevStart.setDate(start.getDate() - 1);
                prevEnd = new Date(end); prevEnd.setDate(end.getDate() - 1);
                break;
            case 'yesterday':
                start.setDate(now.getDate() - 1);
                end.setDate(now.getDate() - 1);
                prevStart = new Date(start); prevStart.setDate(start.getDate() - 1);
                prevEnd = new Date(end); prevEnd.setDate(end.getDate() - 1);
                break;
            case 'last7days':
                start.setDate(now.getDate() - 6);
                prevStart = new Date(start); prevStart.setDate(start.getDate() - 7);
                prevEnd = new Date(end); prevEnd.setDate(end.getDate() - 7);
                break;
            case 'last30days':
                start.setDate(now.getDate() - 29);
                prevStart = new Date(start); prevStart.setDate(start.getDate() - 30);
                prevEnd = new Date(end); prevEnd.setDate(end.getDate() - 30);
                break;
            case 'thisMonth':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                prevStart = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1);
                prevEnd = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0);
                prevEnd.setHours(23, 59, 59, 999);
                break;
        }

        if (customStartDate && customEndDate) {
            start = new Date(customStartDate); start.setHours(0,0,0,0);
            end = new Date(customEndDate); end.setHours(23,59,59,999);
            const diff = end.getTime() - start.getTime();
            prevStart = new Date(start.getTime() - diff - (24*60*60*1000));
            prevEnd = new Date(start.getTime() - (24*60*60*1000));
        }

        return { currentRange: { start, end }, previousRange: { start: prevStart, end: prevEnd } };
    }, [activePreset, customStartDate, customEndDate]);

    const getOrdersInRange = (start: Date, end: Date) => allOrders.filter(order => {
        const orderDate = new Date(order.timestamp);
        return orderDate >= start && orderDate <= end;
    });
    
    const currentOrders = useMemo(() => getOrdersInRange(currentRange.start, currentRange.end), [allOrders, currentRange]);
    const previousOrders = useMemo(() => getOrdersInRange(previousRange.start, previousRange.end), [allOrders, previousRange]);
    
    const calculateMetrics = (orders: Order[]) => {
        const completed = orders.filter(o => o.status === completedStatusId);
        const revenue = completed.reduce((sum, order) => sum + order.total, 0);
        const aov = completed.length > 0 ? revenue / completed.length : 0;
        return {
            totalRevenue: revenue,
            totalOrders: orders.length,
            completedOrders: completed.length,
            avgOrderValue: aov,
        };
    };

    const currentMetrics = useMemo(() => calculateMetrics(currentOrders), [currentOrders, completedStatusId]);
    const previousMetrics = useMemo(() => calculateMetrics(previousOrders), [previousOrders, completedStatusId]);
    
    const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };
    
    const topSellingProducts = useMemo(() => {
        const stats: { [key: number]: { quantity: number; revenue: number } } = {};
        currentOrders.filter(o => o.status === completedStatusId).forEach(order => {
            order.items.forEach(item => {
                const productId = item.product.id;
                if (!stats[productId]) stats[productId] = { quantity: 0, revenue: 0 };
                stats[productId].quantity += item.quantity;
                stats[productId].revenue += calculateItemRevenue(item);
            });
        });

        return Object.entries(stats)
            .map(([productId, data]) => ({ product: allProducts.find(p => p.id === parseInt(productId)), ...data }))
            .filter(p => p.product).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
    }, [currentOrders, allProducts, completedStatusId]);

    const salesByCategory = useMemo(() => {
        const stats: { [key: number]: { orders: Set<string>; revenue: number } } = {};
        currentOrders.filter(o => o.status === completedStatusId).forEach(order => {
            order.items.forEach(item => {
                const categoryId = item.product.categoryId;
                if (!stats[categoryId]) stats[categoryId] = { orders: new Set(), revenue: 0 };
                stats[categoryId].orders.add(order.id);
                stats[categoryId].revenue += calculateItemRevenue(item);
            });
        });
        return Object.entries(stats)
            .map(([categoryId, data]) => ({ category: allCategories.find(c => c.id === parseInt(categoryId)), orderCount: data.orders.size, revenue: data.revenue, }))
            .filter(c => c.category).sort((a, b) => b.revenue - a.revenue);
    }, [currentOrders, allCategories, completedStatusId]);

    const orderTypeDistribution = useMemo(() => {
        const stats: Record<OrderType, number> = { 'Dine-in': 0, 'Delivery': 0, 'Takeaway': 0 };
        currentOrders.forEach(order => {
            if (stats[order.orderType] !== undefined) stats[order.orderType]++;
        });
        return stats;
    }, [currentOrders]);
    
    const presets: { id: DateFilterPreset; label: string }[] = [
        { id: 'today', label: t.today }, { id: 'yesterday', label: t.yesterday }, { id: 'last7days', label: t.last7days },
        { id: 'last30days', label: t.last30days }, { id: 'thisMonth', label: t.thisMonth }
    ];
    
    const btnClasses = (preset: DateFilterPreset) => `px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
        activePreset === preset && !customStartDate ? 'bg-primary-600 text-white shadow' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
    }`;

    return (
        <div className='animate-fade-in'>
            <h2 className="text-3xl font-bold mb-6">{t.reports}</h2>
            
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg mb-8 border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                     <div className="flex flex-wrap items-center gap-2">
                        {presets.map(p => <button key={p.id} onClick={() => { setActivePreset(p.id); setCustomStartDate(''); setCustomEndDate(''); }} className={btnClasses(p.id)}>{p.label}</button>)}
                    </div>
                     <div className="flex items-center gap-2">
                        <input type="date" value={customStartDate} onChange={e => { setCustomStartDate(e.target.value); if(!customEndDate) setCustomEndDate(e.target.value); }} className="p-1.5 rounded-md border-slate-300 shadow-sm text-sm dark:bg-slate-700 dark:border-slate-600"/>
                        <span>-</span>
                        <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} min={customStartDate} className="p-1.5 rounded-md border-slate-300 shadow-sm text-sm dark:bg-slate-700 dark:border-slate-600"/>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
                <KpiCard title={t.totalRevenue} value={`${currentMetrics.totalRevenue.toFixed(2)} ${t.currency}`} change={calculateChange(currentMetrics.totalRevenue, previousMetrics.totalRevenue)} tooltip={t.totalRevenueTooltip} language={language} />
                <KpiCard title={t.totalOrders} value={formatNumber(currentMetrics.totalOrders)} change={calculateChange(currentMetrics.totalOrders, previousMetrics.totalOrders)} tooltip={t.totalOrdersTooltip} language={language} />
                <KpiCard title={t.avgOrderValue} value={`${currentMetrics.avgOrderValue.toFixed(2)} ${t.currency}`} change={calculateChange(currentMetrics.avgOrderValue, previousMetrics.avgOrderValue)} tooltip={t.avgOrderValueTooltip} language={language} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                    <h3 className="text-xl font-semibold mb-4">{t.topSellingProducts}</h3>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                       <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-700/50"><tr>
                                    <th className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.product}</th>
                                    <th className="px-4 py-3 text-end text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.quantitySold}</th>
                                    <th className="px-4 py-3 text-end text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.revenue}</th>
                                </tr></thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {topSellingProducts.map(({ product, quantity, revenue }) => (
                                        <tr key={product!.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-100">{product!.name[language]}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-end text-slate-600 dark:text-slate-300">{formatNumber(quantity)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-end text-slate-600 dark:text-slate-300">{revenue.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                             {topSellingProducts.length === 0 && <p className="p-6 text-center text-slate-500">{t.noDataForPeriod}</p>}
                       </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <h3 className="text-xl font-semibold mb-4">{t.orderTypeDistribution}</h3>
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                        <DonutChart 
                            data={[
                                {label: t.dineIn, value: orderTypeDistribution['Dine-in'], color: '#3b82f6'},
                                {label: t.takeaway, value: orderTypeDistribution['Takeaway'], color: '#f59e0b'},
                                {label: t.delivery, value: orderTypeDistribution['Delivery'], color: '#10b981'},
                            ]}
                            total={currentMetrics.totalOrders}
                        />
                    </div>
                </div>
                
                 <div className="lg:col-span-5">
                     <h3 className="text-xl font-semibold mb-4">{t.salesByCategory}</h3>
                     <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                       <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-700/50"><tr>
                                    <th className="px-4 py-3 text-start text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.category}</th>
                                    <th className="px-4 py-3 text-end text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.completedOrders}</th>
                                    <th className="px-4 py-3 text-end text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.revenue}</th>
                                </tr></thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {salesByCategory.map(({ category, orderCount, revenue }) => (
                                        <tr key={category!.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-100">{category!.name[language]}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-end text-slate-600 dark:text-slate-300">{formatNumber(orderCount)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-end text-slate-600 dark:text-slate-300">{revenue.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {salesByCategory.length === 0 && <p className="p-6 text-center text-slate-500">{t.noDataForPeriod}</p>}
                       </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
