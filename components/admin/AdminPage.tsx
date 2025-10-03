import React, { useState } from 'react';
import type { Language, Product, RestaurantInfo, Order, OrderStatus } from '../../types';
import { useTranslations } from '../../i18n/translations';

interface AdminPageProps {
    language: Language;
    allProducts: Product[];
    restaurantInfo: RestaurantInfo;
    allOrders: Order[];
    updateOrderStatus: (orderId: string, status: OrderStatus) => void;
}

type AdminTab = 'menu' | 'orders';

export const AdminPage: React.FC<AdminPageProps> = ({ language, allProducts, restaurantInfo, allOrders, updateOrderStatus }) => {
    const t = useTranslations(language);
    const [activeTab, setActiveTab] = useState<AdminTab>('orders');

    const handleLogout = () => {
        sessionStorage.removeItem('restaurant_currentUser');
        window.location.hash = '#/login';
    };

    const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
        updateOrderStatus(orderId, newStatus);
    };

    const getStatusChipColor = (status: OrderStatus) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };
    
    return (
        <div>
            <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src={restaurantInfo.logo} alt="logo" className="h-10 w-10 rounded-full object-cover" />
                        <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">{t.adminPanel}</h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                    >
                        {t.logout}
                    </button>
                </div>
            </header>
            <main className="container mx-auto px-4 py-8">
                 <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                    <nav className="flex space-x-4" aria-label="Tabs">
                        <button onClick={() => setActiveTab('orders')} className={`px-3 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'orders' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                            {t.manageOrders} ({allOrders.length})
                        </button>
                        <button onClick={() => setActiveTab('menu')} className={`px-3 py-2 font-medium text-sm rounded-t-lg ${activeTab === 'menu' ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                            {t.manageMenu}
                        </button>
                    </nav>
                </div>

                {activeTab === 'orders' && (
                     <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-100 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.orderId}</th>
                                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.customer}</th>
                                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.total}</th>
                                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.status}</th>
                                    {/* FIX: The 'actions' key was missing from translations. It has been added in translations.ts to fix this error. */}
                                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.actions}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                {allOrders.map(order => (
                                    <tr key={order.id}>
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{order.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold">{order.customer.name || 'Guest'}</div>
                                            <div className="text-xs text-gray-500">{order.customer.mobile}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">{order.total.toFixed(2)} {t.currency}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChipColor(order.status)}`}>
                                                {t[order.status.toLowerCase().replace(' ', '') as keyof typeof t] || order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select 
                                                value={order.status} 
                                                onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                                                className="text-sm rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
                                            >
                                                <option value="Pending">{t.pending}</option>
                                                <option value="In Progress">{t.inProgress}</option>
                                                <option value="Completed">{t.completed}</option>
                                                <option value="Cancelled">{t.cancelled}</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'menu' && (
                     <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold">{t.manageMenu}</h2>
                            <button className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
                                Add New Product
                            </button>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                            <table className="min-w-full">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        {/* FIX: Use translation keys for table headers for consistency and internationalization. */}
                                        <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.product}</th>
                                        <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.price}</th>
                                        <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.actions}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                    {allProducts.map(product => (
                                        <tr key={product.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <img src={product.image} alt={product.name[language]} className="w-12 h-12 rounded-md object-cover me-4" />
                                                    <div>
                                                        <div className="text-sm font-semibold">{product.name[language]}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{product.name.en}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm">{product.price.toFixed(2)} {t.currency}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <a href="#" className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 me-4">Edit</a>
                                                <a href="#" className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200">Delete</a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};