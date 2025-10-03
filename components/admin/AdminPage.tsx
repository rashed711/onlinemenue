
import React, { useState } from 'react';
import type { Language, Product, RestaurantInfo, Order, OrderStatus, User, UserRole, Promotion } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { PlusIcon, UsersIcon, PencilIcon, TrashIcon } from '../icons/Icons';
import { OrderDetailsModal } from './OrderDetailsModal';
import { ProductEditModal } from './ProductEditModal';
import { PromotionEditModal } from './PromotionEditModal';

interface AdminPageProps {
    language: Language;
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
    updateUserRole: (userId: number, role: UserRole) => void;
}

type AdminTab = 'orders' | 'menu' | 'promotions' | 'users';

export const AdminPage: React.FC<AdminPageProps> = ({ 
    language, allProducts, allUsers, restaurantInfo, allOrders, allPromotions,
    updateOrderStatus, logout, addProduct, updateProduct, deleteProduct, 
    addPromotion, updatePromotion, deletePromotion, updateUserRole 
}) => {
    const t = useTranslations(language);
    const [activeTab, setActiveTab] = useState<AdminTab>('orders');
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | 'new' | null>(null);
    const [editingPromotion, setEditingPromotion] = useState<Promotion | 'new' | null>(null);
    
    const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        e.preventDefault();
        window.location.hash = path;
    };

    const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
        updateOrderStatus(orderId, newStatus);
    };
    
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
        <>
        <div className="min-h-screen bg-slate-100 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-40">
                <div className="container mx-auto max-w-7xl px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src={restaurantInfo.logo} alt="logo" className="h-10 w-10 rounded-full object-cover" />
                        <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">{t.adminPanel}</h1>
                    </div>
                     <div className="flex items-center gap-4">
                        <a href="#/" onClick={(e) => handleNav(e, '/')} className="text-sm font-semibold hover:text-primary-500">Back to Menu</a>
                        <button
                            onClick={logout}
                            className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                        >
                            {t.logout}
                        </button>
                    </div>
                </div>
            </header>
            <main className="container mx-auto max-w-7xl px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">{t.welcomeAdmin}</h1>
                 <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('orders')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'orders' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300'}`}>
                            {t.manageOrders} <span className="bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 text-xs font-semibold ms-2 px-2 py-0.5 rounded-full">{allOrders.length}</span>
                        </button>
                        <button onClick={() => setActiveTab('menu')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'menu' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300'}`}>
                            {t.manageMenu}
                        </button>
                         <button onClick={() => setActiveTab('promotions')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'promotions' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300'}`}>
                            {t.managePromotions}
                        </button>
                         <button onClick={() => setActiveTab('users')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'users' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300'}`}>
                            {t.manageUsers}
                        </button>
                    </nav>
                </div>

                {activeTab === 'orders' && (
                     <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.orderId}</th>
                                    <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.customer}</th>
                                    <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.total}</th>
                                    <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.status}</th>
                                    <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.actions}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {allOrders.map((order, index) => (
                                    <tr key={order.id} className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-slate-50 dark:bg-gray-800/60'} hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors`}>
                                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm cursor-pointer hover:text-primary-600" onClick={() => setViewingOrder(order)}>{order.id}</td>
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
                                            <div className='flex items-center gap-2'>
                                                <button onClick={() => setViewingOrder(order)} className="text-sm text-primary-600 hover:underline dark:text-primary-400">{t.viewOrderDetails}</button>
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
                                            </div>
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
                                        <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.actions}</th>
                                    </tr>
                                </thead>
                                 <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {allProducts.map((product, index) => (
                                        <tr key={product.id} className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-slate-50 dark:bg-gray-800/60'} hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <img src={product.image} alt={product.name[language]} className="w-12 h-12 rounded-md object-cover me-4" />
                                                    <div>
                                                        <div className="text-sm font-semibold">{product.name[language]}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{product.code}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm">{product.price.toFixed(2)} {t.currency}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-4">
                                                    <button onClick={() => setEditingProduct(product)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1">
                                                        <PencilIcon className="w-4 h-4" /> Edit
                                                    </button>
                                                    <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 flex items-center gap-1">
                                                        <TrashIcon className="w-4 h-4" /> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                
                {activeTab === 'promotions' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">{t.managePromotions}</h2>
                            <button onClick={() => setEditingPromotion('new')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2">
                                <PlusIcon className="w-5 h-5" />
                                {t.addNewPromotion}
                            </button>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.product}</th>
                                        <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.discountPercent}</th>
                                        <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.endDate}</th>
                                        <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.isActive}</th>
                                        <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.actions}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {allPromotions.map((promo, index) => {
                                        const product = allProducts.find(p => p.id === promo.productId);
                                        return (
                                            <tr key={promo.id} className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-slate-50 dark:bg-gray-800/60'} hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors`}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold">{promo.title[language]}</div>
                                                    <div className="text-xs text-gray-500">{product?.name[language] || 'N/A'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600 dark:text-red-400">{promo.discountPercent}%</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(promo.endDate).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" checked={promo.isActive} onChange={() => handleTogglePromotionStatus(promo)} className="sr-only peer" />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                                                    </label>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center gap-4">
                                                        <button onClick={() => setEditingPromotion(promo)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1">
                                                            <PencilIcon className="w-4 h-4" /> Edit
                                                        </button>
                                                        <button onClick={() => handleDeletePromotion(promo.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 flex items-center gap-1">
                                                            <TrashIcon className="w-4 h-4" /> Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                     <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.user}</th>
                                    <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.mobileNumber}</th>
                                    <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t.role}</th>
                                </tr>
                            </thead>
                             <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {allUsers.map((user, index) => (
                                    <tr key={user.id} className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-slate-50 dark:bg-gray-800/60'} hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors`}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{user.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{user.mobile}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select 
                                                value={user.role} 
                                                onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                                                disabled={user.id === 1} // Don't allow changing the main admin's role
                                                className="text-sm rounded-md border-gray-300 dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                                            >
                                                <option value="customer">Customer</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </main>
        </div>
        
        {viewingOrder && (
            <OrderDetailsModal 
                order={viewingOrder} 
                onClose={() => setViewingOrder(null)} 
                language={language}
            />
        )}
        {editingProduct && (
            <ProductEditModal
                product={editingProduct === 'new' ? null : editingProduct}
                onClose={() => setEditingProduct(null)}
                onSave={handleSaveProduct}
                language={language}
            />
        )}
        {editingPromotion && (
             <PromotionEditModal
                promotion={editingPromotion === 'new' ? null : editingPromotion}
                allProducts={allProducts}
                onClose={() => setEditingPromotion(null)}
                onSave={handleSavePromotion}
                language={language}
            />
        )}
        </>
    );
};