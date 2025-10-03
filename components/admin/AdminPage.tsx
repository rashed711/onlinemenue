import React, { useState } from 'react';
import type { Language, Product, RestaurantInfo, Order, OrderStatus, User, UserRole, Promotion, Permission } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { MenuAlt2Icon, PlusIcon, PencilIcon, TrashIcon, BellIcon, FireIcon, CheckBadgeIcon, XCircleIcon } from '../icons/Icons';
import { OrderDetailsModal } from './OrderDetailsModal';
import { ProductEditModal } from './ProductEditModal';
import { PromotionEditModal } from './PromotionEditModal';
import { AdminSidebar } from './AdminSidebar';
import { UserEditModal } from './UserEditModal';
import { usePermissions } from '../../hooks/usePermissions';
import { PermissionsEditModal } from './PermissionsEditModal';

interface AdminPageProps {
    language: Language;
    currentUser: User | null;
    allProducts: Product[];
    allUsers: User[];
    restaurantInfo: RestaurantInfo;
    allOrders: Order[];
    allPromotions: Promotion[];
    updateOrderStatus: (orderId: string, status: OrderStatus) => void;
    logout: () => void;
    addProduct: (productData: Omit<Product, 'id' | 'rating'>) => void;
    updateProduct: (product: Product) => void;
    deleteProduct: (productId: number) => void;
    addPromotion: (promotionData: Omit<Promotion, 'id'>) => void;
    updatePromotion: (promotion: Promotion) => void;
    deletePromotion: (promotionId: number) => void;
    addUser: (userData: Omit<User, 'id'>) => void;
    updateUser: (user: User) => void;
    deleteUser: (userId: number) => void;
    rolePermissions: Record<UserRole, Permission[]>;
    updateRolePermissions: (role: UserRole, permissions: Permission[]) => void;
}

type AdminTab = 'orders' | 'menu' | 'promotions' | 'users' | 'roles';

export const AdminPage: React.FC<AdminPageProps> = (props) => {
    const { 
        language, currentUser, allProducts, allUsers, restaurantInfo, allOrders, allPromotions,
        updateOrderStatus, logout, addProduct, updateProduct, deleteProduct, 
        addPromotion, updatePromotion, deletePromotion, addUser, updateUser, deleteUser,
        rolePermissions, updateRolePermissions
    } = props;

    const t = useTranslations(language);
    const { hasPermission } = usePermissions(currentUser, rolePermissions);
    
    const [activeTab, setActiveTab] = useState<AdminTab>('orders');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | 'new' | null>(null);
    const [editingPromotion, setEditingPromotion] = useState<Promotion | 'new' | null>(null);
    const [editingUser, setEditingUser] = useState<User | 'new' | null>(null);
    const [editingRole, setEditingRole] = useState<UserRole | null>(null);


    const handleSaveProduct = (productData: Product | Omit<Product, 'id' | 'rating'>) => {
        if ('id' in productData) {
            updateProduct(productData);
        } else {
            addProduct(productData);
        }
        setEditingProduct(null);
    };

    const handleDeleteProduct = (productId: number) => {
        if (window.confirm(t.confirmDelete)) {
            deleteProduct(productId);
        }
    };

    const handleToggleProductFlag = (product: Product, flag: 'isPopular' | 'isNew') => {
        updateProduct({ ...product, [flag]: !product[flag] });
    };
    
    const handleSavePromotion = (promotionData: Promotion | Omit<Promotion, 'id'>) => {
        if ('id' in promotionData) {
            updatePromotion(promotionData);
        } else {
            addPromotion(promotionData);
        }
        setEditingPromotion(null);
    };
    
    const handleDeletePromotion = (promotionId: number) => {
        if (window.confirm(t.confirmDeletePromotion)) {
            deletePromotion(promotionId);
        }
    };

    const handleTogglePromotionStatus = (promotion: Promotion) => {
        updatePromotion({ ...promotion, isActive: !promotion.isActive });
    };
    
    const handleSaveUser = (userData: User | Omit<User, 'id'>) => {
        if ('id' in userData) {
            updateUser(userData);
        } else {
            addUser(userData);
        }
        setEditingUser(null);
    };
    
    const handleDeleteUser = (userId: number) => {
        if (window.confirm(t.confirmDeleteUser)) {
            deleteUser(userId);
        }
    };

    const handleSavePermissions = (role: UserRole, permissions: Permission[]) => {
        updateRolePermissions(role, permissions);
        setEditingRole(null);
    };
    
    const OrderCard = ({ order }: { order: Order }) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 space-y-3 relative transition-all hover:shadow-lg hover:scale-[1.02]">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold font-mono cursor-pointer hover:text-primary-600" onClick={() => setViewingOrder(order)}>{order.id}</p>
                    <p className="text-sm font-semibold">{order.customer.name || 'Guest'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(order.timestamp).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute:'2-digit' })}</p>
                </div>
                <p className="font-bold text-lg">{order.total.toFixed(2)}</p>
            </div>
            <div>
                <ul className="text-xs text-gray-600 dark:text-gray-300 list-disc list-inside">
                    {order.items.slice(0, 2).map((item, index) => <li key={index} className="truncate">{item.quantity}x {item.product.name[language]}</li>)}
                    {order.items.length > 2 && <li className="font-semibold">... and {order.items.length - 2} more</li>}
                </ul>
            </div>
            <div className="flex justify-between items-center border-t dark:border-gray-700 pt-3">
                 <button onClick={() => setViewingOrder(order)} className="text-sm text-primary-600 hover:underline">{t.viewOrderDetails}</button>
                <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                    disabled={!hasPermission('manage_orders')}
                    className="text-sm rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-70"
                >
                    <option value="Pending">{t.pending}</option>
                    <option value="In Progress">{t.inProgress}</option>
                    <option value="Completed">{t.completed}</option>
                    <option value="Cancelled">{t.cancelled}</option>
                </select>
            </div>
        </div>
    );

    const renderContent = () => {
        switch(activeTab) {
            case 'orders': {
                if (!hasPermission('view_orders')) return null;
                const pendingOrders = allOrders.filter(o => o.status === 'Pending');
                const inProgressOrders = allOrders.filter(o => o.status === 'In Progress');
                const completedOrders = allOrders.filter(o => o.status === 'Completed');
                const cancelledOrders = allOrders.filter(o => o.status === 'Cancelled');
            
                const pendingDineIn = pendingOrders.filter(o => o.orderType === 'Dine-in');
                const pendingDelivery = pendingOrders.filter(o => o.orderType === 'Delivery');

                return (
                     <div>
                        <h2 className="text-2xl font-bold mb-6">{t.manageOrders}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* New Orders Column */}
                            <div className="flex flex-col space-y-4">
                                <h3 className="text-lg font-bold flex items-center gap-2 sticky top-20 bg-slate-100 dark:bg-slate-900 py-2 z-10"><BellIcon className="w-6 h-6 text-yellow-500" /> {t.newOrders} ({pendingOrders.length})</h3>
                                <div className="bg-slate-200/50 dark:bg-gray-900/50 p-2 sm:p-4 rounded-lg space-y-4 min-h-[200px] flex-grow">
                                    <h4 className="font-semibold text-gray-600 dark:text-gray-300 px-2">{t.dineIn} ({pendingDineIn.length})</h4>
                                    {pendingDineIn.map(order => <OrderCard key={order.id} order={order} />)}
                                    <h4 className="font-semibold text-gray-600 dark:text-gray-300 px-2 mt-4 border-t dark:border-gray-700 pt-2">{t.delivery} ({pendingDelivery.length})</h4>
                                    {pendingDelivery.map(order => <OrderCard key={order.id} order={order} />)}
                                    {pendingOrders.length === 0 && <p className="text-center text-gray-500 pt-8">No new orders.</p>}
                                </div>
                            </div>

                            {/* In the Kitchen Column */}
                            <div className="flex flex-col space-y-4">
                                <h3 className="text-lg font-bold flex items-center gap-2 sticky top-20 bg-slate-100 dark:bg-slate-900 py-2 z-10"><FireIcon className="w-6 h-6 text-orange-500" /> {t.inTheKitchen} ({inProgressOrders.length})</h3>
                                <div className="bg-slate-200/50 dark:bg-gray-900/50 p-2 sm:p-4 rounded-lg space-y-4 min-h-[200px] flex-grow">
                                    {inProgressOrders.map(order => <OrderCard key={order.id} order={order} />)}
                                    {inProgressOrders.length === 0 && <p className="text-center text-gray-500 pt-8">No orders in progress.</p>}
                                </div>
                            </div>
                           
                           {/* Ready for Pickup Column */}
                            <div className="flex flex-col space-y-4">
                                <h3 className="text-lg font-bold flex items-center gap-2 sticky top-20 bg-slate-100 dark:bg-slate-900 py-2 z-10"><CheckBadgeIcon className="w-6 h-6 text-green-500" /> {t.readyForPickup} ({completedOrders.length})</h3>
                                <div className="bg-slate-200/50 dark:bg-gray-900/50 p-2 sm:p-4 rounded-lg space-y-4 min-h-[200px] flex-grow">
                                    {completedOrders.map(order => (
                                         <div key={order.id} className="relative">
                                            <OrderCard order={order} />
                                            <div className={`absolute top-2 ${language === 'ar' ? 'left-2' : 'right-2'} text-xs font-bold px-2 py-1 rounded-full ${order.orderType === 'Dine-in' ? 'bg-blue-200 text-blue-800 dark:bg-blue-900/70 dark:text-blue-200' : 'bg-green-200 text-green-800 dark:bg-green-900/70 dark:text-green-200'}`}>
                                                {order.orderType === 'Dine-in' ? t.forWaiter : t.forDriver}
                                            </div>
                                        </div>
                                    ))}
                                    {completedOrders.length === 0 && <p className="text-center text-gray-500 pt-8">No orders ready.</p>}
                                </div>
                            </div>
                           
                           {/* Cancelled Column */}
                            <div className="flex flex-col space-y-4">
                               <h3 className="text-lg font-bold flex items-center gap-2 sticky top-20 bg-slate-100 dark:bg-slate-900 py-2 z-10"><XCircleIcon className="w-6 h-6 text-gray-500" /> {t.cancelledOrders} ({cancelledOrders.length})</h3>
                                <div className="bg-slate-200/50 dark:bg-gray-900/50 p-2 sm:p-4 rounded-lg space-y-4 min-h-[200px] flex-grow">
                                    {cancelledOrders.map(order => <OrderCard key={order.id} order={order} />)}
                                    {cancelledOrders.length === 0 && <p className="text-center text-gray-500 pt-8">No cancelled orders.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }
            case 'menu':
                if (!hasPermission('manage_menu')) return null;
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">{t.manageMenu}</h2>
                            <button onClick={() => setEditingProduct('new')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2">
                                <PlusIcon className="w-5 h-5" />
                                {t.addNewProduct}
                            </button>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                             <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.product}</th>
                                        <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.price}</th>
                                        <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.popular}</th>
                                        <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.new}</th>
                                        <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.actions}</th>
                                    </tr>
                                </thead>
                                 <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {allProducts.map((product, index) => (
                                        <tr key={product.id} className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-slate-50 dark:bg-gray-800/60'} hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors`}>
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><img src={product.image} alt={product.name[language]} className="w-12 h-12 rounded-md object-cover me-4" /><div><div className="text-sm font-semibold">{product.name[language]}</div><div className="text-xs text-gray-500 dark:text-gray-400">{product.code}</div></div></div></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm">{product.price.toFixed(2)} {t.currency}</div></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={product.isPopular} onChange={() => handleToggleProductFlag(product, 'isPopular')} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div></label></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={product.isNew} onChange={() => handleToggleProductFlag(product, 'isNew')} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div></label></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><div className="flex items-center gap-4"><button onClick={() => setEditingProduct(product)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1"><PencilIcon className="w-4 h-4" /> Edit</button><button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 flex items-center gap-1"><TrashIcon className="w-4 h-4" /> Delete</button></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'promotions':
                 if (!hasPermission('manage_promotions')) return null;
                 return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">{t.managePromotions}</h2>
                            <button onClick={() => setEditingPromotion('new')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"><PlusIcon className="w-5 h-5" /> {t.addNewPromotion}</button>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.product}</th><th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.discountPercent}</th><th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">{t.endDate}</th><th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.isActive}</th><th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.actions}</th></tr></thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">{allPromotions.map((promo, index) => {const product = allProducts.find(p => p.id === promo.productId); return (<tr key={promo.id} className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-slate-50 dark:bg-gray-800/60'} hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors`}><td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-semibold">{promo.title[language]}</div><div className="text-xs text-gray-500">{product?.name[language] || 'N/A'}</div></td><td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600 dark:text-red-400">{promo.discountPercent}%</td><td className="px-6 py-4 whitespace-nowrap text-sm hidden sm:table-cell">{new Date(promo.endDate).toLocaleDateString()}</td><td className="px-6 py-4 whitespace-nowrap"><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={promo.isActive} onChange={() => handleTogglePromotionStatus(promo)} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div></label></td><td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><div className="flex items-center gap-4"><button onClick={() => setEditingPromotion(promo)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1"><PencilIcon className="w-4 h-4" /> Edit</button><button onClick={() => handleDeletePromotion(promo.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 flex items-center gap-1"><TrashIcon className="w-4 h-4" /> Delete</button></div></td></tr>)})}</tbody>
                            </table>
                        </div>
                    </div>
                );
             case 'users':
                if (!hasPermission('manage_users')) return null;
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold">{t.manageUsers}</h2><button onClick={() => setEditingUser('new')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"><PlusIcon className="w-5 h-5" />{t.addNewUser}</button></div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
                           <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                               <thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.user}</th><th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">{t.mobileNumber}</th><th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.role}</th><th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.actions}</th></tr></thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">{allUsers.map((user, index) => (<tr key={user.id} className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-slate-50 dark:bg-gray-800/60'} hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors`}><td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{user.name}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">{user.mobile}</td><td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{t[user.role as keyof typeof t] || user.role}</td><td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><div className="flex items-center gap-4"><button onClick={() => setEditingUser(user)} disabled={user.id === 1 && user.role === 'superAdmin'} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"><PencilIcon className="w-4 h-4" /> Edit</button><button onClick={() => handleDeleteUser(user.id)} disabled={user.id === 1} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"><TrashIcon className="w-4 h-4" /> Delete</button></div></td></tr>))}</tbody>
                           </table>
                       </div>
                    </div>
                );
            case 'roles':
                if (!hasPermission('manage_roles')) return null;
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">{t.manageRoles}</h2>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
                           <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                               <thead className="bg-gray-50 dark:bg-gray-700/50">
                                   <tr>
                                       <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.role}</th>
                                       <th className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.actions}</th>
                                   </tr>
                               </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                   {Object.keys(rolePermissions).map((role, index) => (
                                       <tr key={role} className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-slate-50 dark:bg-gray-800/60'} hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors`}>
                                           <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{t[role as keyof typeof t] || role}</td>
                                           <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button onClick={() => setEditingRole(role as UserRole)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1"><PencilIcon className="w-4 h-4" /> {t.editPermissions}</button>
                                           </td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       </div>
                    </div>
                );
            default: return null;
        }
    }
    
    return (
        <div className={`relative min-h-screen bg-slate-100 dark:bg-slate-900 md:flex ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <AdminSidebar 
                language={language}
                currentUser={currentUser}
                rolePermissions={rolePermissions}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isOpen={isSidebarOpen}
                setIsOpen={setSidebarOpen}
            />
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-20">
                    <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <button className="p-2 md:hidden" onClick={() => setSidebarOpen(true)}><MenuAlt2Icon className="w-6 h-6" /></button>
                            <img src={restaurantInfo.logo} alt="logo" className="h-10 w-10 rounded-full object-cover hidden sm:block" />
                            <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">{t.adminPanel}</h1>
                        </div>
                        <button onClick={logout} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">{t.logout}</button>
                    </div>
                </header>
                <main className="container mx-auto max-w-7xl px-4 py-8 flex-1">
                    {renderContent()}
                </main>
            </div>
            
            {viewingOrder && hasPermission('view_orders') && (
                <OrderDetailsModal order={viewingOrder} onClose={() => setViewingOrder(null)} language={language}/>
            )}
            {editingProduct && hasPermission('manage_menu') && (
                <ProductEditModal product={editingProduct === 'new' ? null : editingProduct} onClose={() => setEditingProduct(null)} onSave={handleSaveProduct} language={language}/>
            )}
            {editingPromotion && hasPermission('manage_promotions') && (
                 <PromotionEditModal promotion={editingPromotion === 'new' ? null : editingPromotion} allProducts={allProducts} onClose={() => setEditingPromotion(null)} onSave={handleSavePromotion} language={language}/>
            )}
            {editingUser && hasPermission('manage_users') && (
                <UserEditModal user={editingUser === 'new' ? null : editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveUser} language={language}/>
            )}
            {editingRole && hasPermission('manage_roles') && (
                <PermissionsEditModal
                    role={editingRole}
                    currentPermissions={rolePermissions[editingRole]}
                    onClose={() => setEditingRole(null)}
                    onSave={handleSavePermissions}
                    language={language}
                />
            )}
        </div>
    );
};