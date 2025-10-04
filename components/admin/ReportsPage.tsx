import React, { useState, useMemo } from 'react';
import type { Language, Order, Product, Category, CartItem } from '../../types';
import { useTranslations } from '../../i18n/translations';

interface ReportsPageProps {
    language: Language;
    allOrders: Order[];
    allProducts: Product[];
    allCategories: Category[];
}

const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
const today = new Date();

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

export const ReportsPage: React.FC<ReportsPageProps> = ({ language, allOrders, allProducts, allCategories }) => {
    const t = useTranslations(language);
    const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

    const filteredOrders = useMemo(() => {
        if (!startDate || !endDate) return allOrders;
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        return allOrders.filter(order => {
            const orderDate = new Date(order.timestamp);
            return orderDate >= start && orderDate <= end;
        });
    }, [allOrders, startDate, endDate]);

    const completedOrders = useMemo(() => filteredOrders.filter(o => o.status === 'Completed'), [filteredOrders]);

    const salesSummary = useMemo(() => {
        const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
        const totalOrdersCount = filteredOrders.length;
        const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
        return { totalRevenue, totalOrdersCount, avgOrderValue };
    }, [completedOrders, filteredOrders]);

    const topSellingProducts = useMemo(() => {
        const stats: { [key: number]: { quantity: number; revenue: number } } = {};
        completedOrders.forEach(order => {
            order.items.forEach(item => {
                const productId = item.product.id;
                if (!stats[productId]) stats[productId] = { quantity: 0, revenue: 0 };
                stats[productId].quantity += item.quantity;
                stats[productId].revenue += calculateItemRevenue(item);
            });
        });

        return Object.entries(stats)
            .map(([productId, data]) => ({
                product: allProducts.find(p => p.id === parseInt(productId)),
                ...data,
            }))
            .filter(p => p.product)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
    }, [completedOrders, allProducts]);

    const salesByCategory = useMemo(() => {
        const stats: { [key: number]: { orders: Set<string>; revenue: number } } = {};
        completedOrders.forEach(order => {
            order.items.forEach(item => {
                const categoryId = item.product.categoryId;
                if (!stats[categoryId]) stats[categoryId] = { orders: new Set(), revenue: 0 };
                stats[categoryId].orders.add(order.id);
                stats[categoryId].revenue += calculateItemRevenue(item);
            });
        });

        return Object.entries(stats)
            .map(([categoryId, data]) => ({
                category: allCategories.find(c => c.id === parseInt(categoryId)),
                orderCount: data.orders.size,
                revenue: data.revenue,
            }))
            .filter(c => c.category)
            .sort((a, b) => b.revenue - a.revenue);
    }, [completedOrders, allCategories]);

    const orderTypeDistribution = useMemo(() => {
        const stats = {
            'Dine-in': { orderCount: 0, revenue: 0 },
            'Delivery': { orderCount: 0, revenue: 0 },
        };
        filteredOrders.forEach(order => {
            stats[order.orderType].orderCount++;
        });
        completedOrders.forEach(order => {
             stats[order.orderType].revenue += order.total;
        });
        return stats;
    }, [filteredOrders, completedOrders]);

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">{t.reports}</h2>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.startDate}</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.endDate}</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                </div>
            </div>

            <h3 className="text-xl font-semibold mb-4">{t.salesSummary}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.totalRevenue}</p>
                    <p className="text-3xl font-bold mt-1">{salesSummary.totalRevenue.toFixed(2)} <span className="text-lg">{t.currency}</span></p>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.totalOrders}</p>
                    <p className="text-3xl font-bold mt-1">{salesSummary.totalOrdersCount}</p>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.avgOrderValue}</p>
                    <p className="text-3xl font-bold mt-1">{salesSummary.avgOrderValue.toFixed(2)} <span className="text-lg">{t.currency}</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-semibold mb-4">{t.topSellingProducts}</h3>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t.product}</th>
                                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t.quantitySold}</th>
                                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t.revenue}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {topSellingProducts.map(({ product, quantity, revenue }) => (
                                    <tr key={product!.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{product!.name[language]}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{quantity}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{revenue.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-semibold mb-4">{t.salesByCategory}</h3>
                     <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                             <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t.category}</th>
                                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t.orders}</th>
                                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t.revenue}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {salesByCategory.map(({ category, orderCount, revenue }) => (
                                    <tr key={category!.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{category!.name[language]}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{orderCount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{revenue.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <h3 className="text-xl font-semibold mb-4 mt-8">{t.orderTypeDistribution}</h3>
                     <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                             <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t.orderType}</th>
                                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t.orders}</th>
                                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t.revenue}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{t.dineIn}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{orderTypeDistribution['Dine-in'].orderCount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{orderTypeDistribution['Dine-in'].revenue.toFixed(2)}</td>
                                </tr>
                                 <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{t.delivery}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{orderTypeDistribution['Delivery'].orderCount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{orderTypeDistribution['Delivery'].revenue.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};