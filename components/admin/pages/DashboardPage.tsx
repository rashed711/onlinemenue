import React, { useMemo } from 'react';
import { useUI } from '../../../contexts/UIContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useOrders } from '../../../contexts/OrderContext';
import { useData } from '../../../contexts/DataContext';
import { useUserManagement } from '../../../contexts/UserManagementContext';
import { useTreasury } from '../../../contexts/TreasuryContext';
import { formatNumber } from '../../../utils/helpers';
import { CurrencyDollarIcon, ShoppingCartIcon, UserGroupIcon, ClipboardListIcon, CollectionIcon, UsersIcon, CogIcon } from '../../icons/Icons';
import type { Order } from '../../../types';

// KPI Card Component
const KpiCard: React.FC<{ title: string; value: string; icon: React.FC<any>; color: string }> = ({ title, value, icon: Icon, color }) => {
    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex items-center gap-4 transition-transform transform hover:-translate-y-1">
            <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900/50`}>
                <Icon className={`w-7 h-7 text-${color}-600 dark:text-${color}-400`} />
            </div>
            <div>
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</h3>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{value}</p>
            </div>
        </div>
    );
};

// Quick Link Component
const QuickLink: React.FC<{ title: string; path: string; icon: React.FC<any>; }> = ({ title, path, icon: Icon }) => {
    const handleNav = (e: React.MouseEvent) => {
        e.preventDefault();
        window.location.hash = path;
    };
    return (
        <a href={path} onClick={handleNav} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:shadow-xl transition-all transform hover:-translate-y-1">
            <Icon className="w-8 h-8 text-primary-500" />
            <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{title}</span>
        </a>
    );
};

// Main Dashboard Component
export const DashboardPage: React.FC = () => {
    const { t, language } = useUI();
    const { hasPermission, roles } = useAuth();
    const { orders, setViewingOrder } = useOrders();
    const { users } = useUserManagement();
    const { treasuries } = useTreasury();
    const { restaurantInfo } = useData();

    // Memoized KPI Calculations
    const totalSales = useMemo(() => orders.filter(o => o.status === 'completed').reduce((sum, order) => sum + order.total, 0), [orders]);
    const newOrdersCount = useMemo(() => orders.filter(o => o.status === 'pending').length, [orders]);
    const totalCustomers = useMemo(() => {
        const customerRole = roles.find(r => r.name.en.toLowerCase() === 'customer');
        return users.filter(u => u.role === customerRole?.key).length;
    }, [users, roles]);
    const totalBalance = useMemo(() => treasuries.reduce((sum, t) => sum + t.current_balance, 0), [treasuries]);

    // Recent Orders
    const recentOrders = useMemo(() => [...orders].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5), [orders]);

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t.dashboard}</h1>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {hasPermission('view_sales_report') && <KpiCard title={t.totalSales} value={`${totalSales.toFixed(2)} ${t.currency}`} icon={CurrencyDollarIcon} color="green" />}
                {hasPermission('view_orders_page') && <KpiCard title={t.newOrders} value={formatNumber(newOrdersCount)} icon={ShoppingCartIcon} color="blue" />}
                {hasPermission('view_users_page') && <KpiCard title={t.totalCustomers} value={formatNumber(totalCustomers)} icon={UserGroupIcon} color="indigo" />}
                {hasPermission('view_treasury_page') && <KpiCard title={t.currentBalance} value={`${totalBalance.toFixed(2)} ${t.currency}`} icon={CurrencyDollarIcon} color="amber" />}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">{t.quickActions}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {hasPermission('view_orders_page') && <QuickLink title={t.manageOrders} path="#/admin/orders" icon={ClipboardListIcon} />}
                    {hasPermission('view_products_page') && <QuickLink title={t.productList} path="#/admin/productList" icon={CollectionIcon} />}
                    {hasPermission('view_users_page') && <QuickLink title={t.staff} path="#/admin/staff" icon={UsersIcon} />}
                    {hasPermission('view_settings_page') && <QuickLink title={t.settings} path="#/admin/settings" icon={CogIcon} />}
                </div>
            </div>

            {/* Recent Orders */}
            {hasPermission('view_orders_page') && (
                 <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.recentOrders}</h2>
                        <a href="#/admin/orders" onClick={(e) => { e.preventDefault(); window.location.hash = '#/admin/orders'; }} className="text-sm font-semibold text-primary-600 hover:underline">{t.viewAll}</a>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {recentOrders.map(order => {
                                    const statusDetails = restaurantInfo?.orderStatusColumns.find(s => s.id === order.status);
                                    const statusColor = statusDetails?.color || 'slate';
                                    return (
                                        <tr key={order.id} onClick={() => setViewingOrder(order)} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
                                            <td className="p-3"><span className="font-semibold text-slate-700 dark:text-slate-200">{order.customer.name || 'Guest'}</span><br/><span className="text-xs text-slate-500">{order.customer.mobile}</span></td>
                                            <td className="p-3 text-center"><span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{order.items.length} {t.items}</span></td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-${statusColor}-100 text-${statusColor}-800 dark:bg-${statusColor}-900/50 dark:text-${statusColor}-300`}>
                                                    {statusDetails?.name[language] || order.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-end font-bold text-slate-800 dark:text-slate-100">{order.total.toFixed(2)} {t.currency}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {recentOrders.length === 0 && <p className="text-center text-slate-500 py-8">{t.noRecentOrders}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};
