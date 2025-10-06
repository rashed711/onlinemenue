

import React, { useState, useMemo, useEffect } from 'react';
import type { Language, Product, RestaurantInfo, Order, OrderStatus, User, UserRole, Promotion, Permission, Category, Tag, CartItem, SocialLink, LocalizedString, OrderStatusColumn } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { MenuAlt2Icon, PlusIcon, PencilIcon, TrashIcon } from '../icons/Icons';
import { OrderDetailsModal } from './OrderDetailsModal';
import { ProductEditModal } from './ProductEditModal';
import { PromotionEditModal } from './PromotionEditModal';
import { AdminSidebar } from './AdminSidebar';
import { UserEditModal } from './UserEditModal';
import { usePermissions } from '../../hooks/usePermissions';
import { PermissionsEditModal } from './PermissionsEditModal';
import { ClassificationsPage } from './ClassificationsPage';
import { CategoryEditModal } from './CategoryEditModal';
import { TagEditModal } from './TagEditModal';
import { RefusalReasonModal } from './RefusalReasonModal';
import { OrderEditModal } from './OrderEditModal';
import { ReportsPage } from './ReportsPage';
import { CashierPage } from './CashierPage';
import { OrderStatusEditModal } from './OrderStatusEditModal';
import { SettingsPage } from './SettingsPage';
import { formatDate, formatNumber } from '../../utils/helpers';

interface AdminPageProps {
    language: Language;
    currentUser: User | null;
    allProducts: Product[];
    allCategories: Category[];
    allTags: Tag[];
    allUsers: User[];
    restaurantInfo: RestaurantInfo;
    allOrders: Order[];
    allPromotions: Promotion[];
    placeOrder: (order: Omit<Order, 'id' | 'timestamp'>) => Order;
    showToast: (message: string) => void;
    updateOrder: (orderId: string, payload: Partial<Omit<Order, 'id' | 'timestamp' | 'customer'>>) => void;
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
    addCategory: (categoryData: Omit<Category, 'id'>) => void;
    updateCategory: (category: Category) => void;
    deleteCategory: (categoryId: number) => void;
    addTag: (tagData: Omit<Tag, 'id'> & {id: string}) => void;
    updateTag: (tag: Tag) => void;
    deleteTag: (tagId: string) => void;
    updateRestaurantInfo: (updatedInfo: Partial<RestaurantInfo>) => void;
    addOrderStatusColumn: (column: OrderStatusColumn) => void;
    updateOrderStatusColumn: (column: OrderStatusColumn) => void;
    deleteOrderStatusColumn: (columnId: string) => void;
    setProgress: (progress: number | ((prev: number) => number)) => void;
    setShowProgress: (show: boolean) => void;
}

type AdminTab = 'orders' | 'cashier' | 'reports' | 'productList' | 'classifications' | 'promotions' | 'users' | 'roles' | 'settings';

export const AdminPage: React.FC<AdminPageProps> = (props) => {
    const { 
        language, currentUser, allProducts, allCategories, allTags, allUsers, restaurantInfo, allOrders, allPromotions,
        placeOrder, showToast, updateOrder, logout, addProduct, updateProduct, deleteProduct, 
        addPromotion, updatePromotion, deletePromotion, addUser, updateUser, deleteUser,
        rolePermissions, updateRolePermissions,
        addCategory, updateCategory, deleteCategory, addTag, updateTag, deleteTag,
        updateRestaurantInfo, addOrderStatusColumn, updateOrderStatusColumn, deleteOrderStatusColumn,
        setProgress, setShowProgress,
    } = props;

    const t = useTranslations(language);
    const { hasPermission } = usePermissions(currentUser, rolePermissions);
    
    const [activeTab, setActiveTab] = useState<AdminTab>('orders');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | 'new' | null>(null);
    const [editingPromotion, setEditingPromotion] = useState<Promotion | 'new' | null>(null);
    const [editingUser, setEditingUser] = useState<User | 'new' | null>(null);
    const [editingRole, setEditingRole] = useState<UserRole | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | 'new' | null>(null);
    const [editingTag, setEditingTag] = useState<Tag | 'new' | null>(null);
    const [refusingOrder, setRefusingOrder] = useState<Order | null>(null);
    const [editingOrderStatus, setEditingOrderStatus] = useState<OrderStatusColumn | 'new' | null>(null);

    // Transition state for tabs
    const [transitionStage, setTransitionStage] = useState<'in' | 'out'>('in');
    const [displayedTab, setDisplayedTab] = useState(activeTab);

    useEffect(() => {
        if (activeTab !== displayedTab) {
            setShowProgress(true);
            setProgress(0);
            setTransitionStage('out');

            const progressInterval = setInterval(() => {
                setProgress(p => Math.min(p + 20, 90));
            }, 60);

            const timer = setTimeout(() => {
                clearInterval(progressInterval);
                setDisplayedTab(activeTab);
                setTransitionStage('in');
                setProgress(100);
                setTimeout(() => setShowProgress(false), 400);
            }, 300); // Corresponds to CSS transition duration

            return () => {
                clearTimeout(timer);
                clearInterval(progressInterval);
            };
        }
    }, [activeTab, displayedTab, setProgress, setShowProgress]);

    const ordersToDisplay = useMemo(() => {
        if (!currentUser || !hasPermission('view_orders')) {
            return [];
        }
        
        const { role, id: userId } = currentUser;
    
        if (role === 'waiter') {
            return allOrders.filter(order => order.createdBy === userId);
        }
        
        if (role === 'waiterSupervisor') {
            const waiterIds = allUsers.filter(user => user.role === 'waiter').map(user => user.id);
            return allOrders.filter(order => order.createdBy && waiterIds.includes(order.createdBy));
        }
    
        // All other roles with 'view_orders' permission see all orders.
        return allOrders;
    
    }, [allOrders, currentUser, allUsers, hasPermission]);


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

    const handleToggleProductFlag = (product: Product, flag: 'isPopular' | 'isNew' | 'isVisible') => {
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

    const handleSaveOrder = (updatedOrderData: {items: CartItem[], notes: string, tableNumber?: string}) => {
        if (editingOrder) {
            updateOrder(editingOrder.id, updatedOrderData);
        }
        setEditingOrder(null);
    };
    
    interface OrderCardProps {
        order: Order;
        style?: React.CSSProperties;
        className?: string;
    }

    const getStatusColorClass = (color: string) => {
        const colorMap: Record<string, string> = {
            yellow: 'text-yellow-500',
            orange: 'text-orange-500',
            cyan: 'text-cyan-500',
            blue: 'text-blue-500',
            green: 'text-green-500',
            slate: 'text-slate-500',
            red: 'text-red-500',
            indigo: 'text-indigo-500',
            purple: 'text-purple-500',
            pink: 'text-pink-500',
        };
        return colorMap[color] || 'text-gray-500';
    };

    const OrderCard: React.FC<OrderCardProps> = ({ order, style, className }) => {
        const isDriver = currentUser?.role === 'driver';
        const canManage = hasPermission('manage_orders');

        const currentStatusDetails = restaurantInfo.orderStatusColumns.find(s => s.id === order.status);

        const renderActions = () => {
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

        return (
            <div onClick={() => setViewingOrder(order)} style={style} className={`bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 space-y-3 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border border-slate-200 dark:border-slate-700 ${className || ''}`}>
                <div className="flex justify-between items-center">
                    <p className="font-extrabold text-lg text-amber-800 bg-amber-300 dark:bg-amber-400 dark:text-amber-900 px-3 py-0.5 rounded-md">
                        {order.total.toFixed(2)}
                    </p>
                    <p className="font-bold font-mono text-slate-500 dark:text-slate-400 text-sm">
                        {order.id}
                    </p>
                </div>

                <div className="space-y-2">
                    {currentStatusDetails && (
                        <div className={`flex items-center gap-2 font-bold text-base ${getStatusColorClass(currentStatusDetails.color)}`}>
                            <span>{currentStatusDetails.name[language]}</span>
                        </div>
                    )}
                    <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                        {order.orderType === 'Dine-in' && order.tableNumber ? (
                            `${t.table}: ${formatNumber(parseInt(order.tableNumber, 10))}`
                        ) : (
                            order.customer.name || 'Guest'
                        )}
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 my-1 rounded-md border border-slate-200 dark:border-slate-700/50">
                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                        {order.items.slice(0, 2).map((item, index) => (
                            <div key={index} className="flex justify-between items-center">
                                <span className="truncate flex-1 pr-2">{item.product.name[language]}</span>
                                <span className="font-mono font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] px-1.5 py-0.5 rounded">x{formatNumber(item.quantity)}</span>
                            </div>
                        ))}
                        {order.items.length > 2 && <p className="text-center font-semibold text-slate-400 text-[11px] pt-1">... and {formatNumber(order.items.length - 2)} more</p>}
                    </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                    <div>
                        {renderActions()}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setViewingOrder(order); }} className="text-sm font-bold text-primary-600 hover:underline dark:text-primary-400">
                        {t.viewOrderDetails}
                    </button>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch(displayedTab) {
            case 'orders': {
                if (!hasPermission('view_orders')) return null;
                const visibleColumns = restaurantInfo.orderStatusColumns.filter(
                    col => hasPermission(`view_status_${col.id}`)
                );
                
                return (
                     <div>
                        <h2 className="text-2xl font-bold mb-6">{t.manageOrders}</h2>
                        <div className="w-full overflow-x-auto pb-4">
                          <div className={`inline-grid grid-cols-${visibleColumns.length} gap-6 min-w-max`}>
                              {visibleColumns.map(col => {
                                const colOrders = allOrders.filter(o => o.status === col.id || (col.id === 'cancelled' && o.status === 'Refused'));
                                return (
                                <div key={col.id} className="w-80 flex flex-col">
                                  <h3 className={`text-lg font-bold flex items-center gap-2 p-3 sticky bg-white dark:bg-slate-800 z-10 border-b-2 border-slate-200 dark:border-slate-700 ${getStatusColorClass(col.color)}`}>
                                     {col.name[language]} ({formatNumber(colOrders.length)})
                                  </h3>
                                  <div className="bg-slate-200/50 dark:bg-slate-900/50 p-2 sm:p-4 rounded-b-lg space-y-4 min-h-[calc(100vh-250px)] flex-grow">
                                      {colOrders.map((order, index) => <OrderCard order={order} key={order.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-fade-in-up" />)}
                                      {colOrders.length === 0 && <div className="h-full flex items-center justify-center"><p className="text-center text-slate-500 p-8">No orders.</p></div>}
                                  </div>
                                </div>
                                )
                              })}
                          </div>
                        </div>
                    </div>
                );
            }
            case 'cashier':
                if (!hasPermission('use_cashier_pos')) return null;
                return (
                    <CashierPage
                        language={language}
                        currentUser={currentUser}
                        allProducts={allProducts}
                        allCategories={allCategories}
                        placeOrder={placeOrder}
                        showToast={showToast}
                        restaurantInfo={restaurantInfo}
                    />
                );
            case 'reports':
                if (!hasPermission('view_reports')) return null;
                return (
                    <ReportsPage
                        language={language}
                        allOrders={allOrders}
                        allProducts={allProducts}
                        allCategories={allCategories}
                    />
                );
            case 'productList':
                if (!hasPermission('manage_menu')) return null;
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">{t.productList}</h2>
                            <button onClick={() => setEditingProduct('new')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2">
                                <PlusIcon className="w-5 h-5" />
                                {t.addNewProduct}
                            </button>
                        </div>
                        {/* Mobile Card View */}
                        <div className="space-y-4 md:hidden">
                            {allProducts.map(product => (
                                <div key={product.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 space-y-4 border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-4">
                                        <img src={product.image} alt={product.name[language]} className="w-16 h-16 rounded-md object-cover" />
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-slate-100">{product.name[language]}</div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400">{product.code}</div>
                                            <div className="text-sm font-semibold text-primary-600 dark:text-primary-400">{product.price.toFixed(2)} {t.currency}</div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center border-t dark:border-slate-700 pt-3">
                                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                                {t.popular}
                                                <input type="checkbox" checked={product.isPopular} onChange={() => handleToggleProductFlag(product, 'isPopular')} className="sr-only peer" />
                                                <div className="relative w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                                {t.visibleInMenu}
                                                <input type="checkbox" checked={product.isVisible} onChange={() => handleToggleProductFlag(product, 'isVisible')} className="sr-only peer" />
                                                <div className="relative w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                         <div className="flex items-center gap-2">
                                            <button onClick={() => setEditingProduct(product)} className="p-2 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"><PencilIcon className="w-5 h-5" /></button>
                                            <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"><TrashIcon className="w-5 h-5" /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Desktop Table View */}
                        <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
                             <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.product}</th>
                                        <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.price}</th>
                                        <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.popular}</th>
                                        <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.new}</th>
                                        <th scope="col" className="px-6 py-4 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.visibleInMenu}</th>
                                        <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.actions}</th>
                                    </tr>
                                </thead>
                                 <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {allProducts.map((product) => (
                                        <tr key={product.id} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-800 dark:even:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><img src={product.image} alt={product.name[language]} className="w-12 h-12 rounded-md object-cover me-4" /><div><div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{product.name[language]}</div><div className="text-xs text-slate-500 dark:text-slate-400">{product.code}</div></div></div></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300"><div className="text-sm">{product.price.toFixed(2)} {t.currency}</div></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center"><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={product.isPopular} onChange={() => handleToggleProductFlag(product, 'isPopular')} className="sr-only peer" /><div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div></label></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center"><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={product.isNew} onChange={() => handleToggleProductFlag(product, 'isNew')} className="sr-only peer" /><div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div></label></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center"><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={product.isVisible} onChange={() => handleToggleProductFlag(product, 'isVisible')} className="sr-only peer" /><div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div></label></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><div className="flex items-center gap-4"><button onClick={() => setEditingProduct(product)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1"><PencilIcon className="w-4 h-4" /> {t.actions}</button><button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 flex items-center gap-1"><TrashIcon className="w-4 h-4" /> Delete</button></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'classifications':
                if (!hasPermission('manage_classifications')) return null;
                return (
                   <ClassificationsPage
                        language={language}
                        categories={allCategories}
                        tags={allTags}
                        onEditCategory={(category) => setEditingCategory(category)}
                        onDeleteCategory={(categoryId) => { if(window.confirm(t.confirmDeleteCategory)) deleteCategory(categoryId) }}
                        onAddCategory={() => setEditingCategory('new')}
                        onEditTag={(tag) => setEditingTag(tag)}
                        onDeleteTag={(tagId) => { if(window.confirm(t.confirmDeleteTag)) deleteTag(tagId) }}
                        onAddTag={() => setEditingTag('new')}
                   />
                );
            case 'promotions':
                 if (!hasPermission('manage_promotions')) return null;
                 return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">{t.managePromotions}</h2>
                            <button onClick={() => setEditingPromotion('new')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"><PlusIcon className="w-5 h-5" /> {t.addNewPromotion}</button>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-x-auto border border-slate-200 dark:border-slate-700">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-700/50"><tr><th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.product}</th><th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.discountPercent}</th><th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden sm:table-cell">{t.endDate}</th><th className="px-6 py-4 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.isActive}</th><th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.actions}</th></tr></thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">{allPromotions.map((promo) => {const product = allProducts.find(p => p.id === promo.productId); return (<tr key={promo.id} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-800 dark:even:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"><td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{promo.title[language]}</div><div className="text-xs text-slate-500 dark:text-slate-400">{product?.name[language] || 'N/A'}</div></td><td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600 dark:text-red-400">{formatNumber(promo.discountPercent)}%</td><td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{formatDate(promo.endDate)}</td><td className="px-6 py-4 whitespace-nowrap text-center"><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={promo.isActive} onChange={() => handleTogglePromotionStatus(promo)} className="sr-only peer" /><div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div></label></td><td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><div className="flex items-center gap-4"><button onClick={() => setEditingPromotion(promo)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1"><PencilIcon className="w-4 h-4" /> Edit</button><button onClick={() => handleDeletePromotion(promo.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 flex items-center gap-1"><TrashIcon className="w-4 h-4" /> Delete</button></div></td></tr>)})}</tbody>
                            </table>
                        </div>
                    </div>
                );
             case 'users':
                if (!hasPermission('manage_users')) return null;
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold">{t.manageUsers}</h2><button onClick={() => setEditingUser('new')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"><PlusIcon className="w-5 h-5" />{t.addNewUser}</button></div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-x-auto border border-slate-200 dark:border-slate-700">
                           <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                               <thead className="bg-slate-50 dark:bg-slate-700/50"><tr><th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.user}</th><th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden sm:table-cell">{t.mobileNumber}</th><th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.role}</th><th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.actions}</th></tr></thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">{allUsers.map((user) => (<tr key={user.id} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-800 dark:even:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"><td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{user.mobile}</td><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-300">{t[user.role as keyof typeof t] || user.role}</td><td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><div className="flex items-center gap-4"><button onClick={() => setEditingUser(user)} disabled={user.id === 1 && user.role === 'superAdmin'} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"><PencilIcon className="w-4 h-4" /> Edit</button><button onClick={() => handleDeleteUser(user.id)} disabled={user.id === 1} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"><TrashIcon className="w-4 h-4" /> Delete</button></div></td></tr>))}</tbody>
                           </table>
                       </div>
                    </div>
                );
            case 'roles':
                if (!hasPermission('manage_roles')) return null;
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">{t.manageRoles}</h2>
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-x-auto border border-slate-200 dark:border-slate-700">
                           <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                               <thead className="bg-slate-50 dark:bg-slate-700/50">
                                   <tr>
                                       <th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.role}</th>
                                       <th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.actions}</th>
                                   </tr>
                               </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                   {Object.keys(rolePermissions).map((role) => (
                                       <tr key={role} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-800 dark:even:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                           <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">{t[role as keyof typeof t] || role}</td>
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
             case 'settings':
                if (!hasPermission('manage_roles')) return null;
                return (
                    <SettingsPage
                        language={language}
                        restaurantInfo={restaurantInfo}
                        updateRestaurantInfo={updateRestaurantInfo}
                        onAddOrderStatus={() => setEditingOrderStatus('new')}
                        onEditOrderStatus={(col) => setEditingOrderStatus(col)}
                        onDeleteOrderStatus={deleteOrderStatusColumn}
                    />
                );
            default: return null;
        }
    }
    
    return (
        <div className={`relative min-h-screen bg-slate-100 dark:bg-slate-900`}>
            <AdminSidebar 
                language={language}
                currentUser={currentUser}
                rolePermissions={rolePermissions}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isOpen={isSidebarOpen}
                setIsOpen={setSidebarOpen}
                restaurantInfo={restaurantInfo}
                logout={logout}
            />
            <div className={`flex flex-col min-h-screen transition-all duration-300 ${language === 'ar' ? 'md:mr-64' : 'md:ml-64'}`}>
                <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-sm sticky top-0 z-20 border-b border-slate-200 dark:border-slate-700" id="admin-header">
                    <div className="px-4 h-20 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <button className="p-2 md:hidden" onClick={() => setSidebarOpen(true)}><MenuAlt2Icon className="w-6 h-6" /></button>
                            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.adminPanel}</h1>
                        </div>
                    </div>
                </header>
                <main className="container mx-auto max-w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
                    <div className={`transition-all duration-300 ease-in-out ${
                        transitionStage === 'out' 
                            ? 'opacity-0 -translate-y-5' 
                            : 'opacity-100 translate-y-0'
                    }`}>
                        {renderContent()}
                    </div>
                </main>
            </div>
            
            {viewingOrder && hasPermission('view_orders') && (
                <OrderDetailsModal 
                    order={viewingOrder} 
                    onClose={() => setViewingOrder(null)} 
                    language={language}
                    canEdit={hasPermission('edit_orders')}
                    onEdit={(order) => {
                        setViewingOrder(null);
                        setEditingOrder(order);
                    }}
                    restaurantInfo={restaurantInfo}
                />
            )}
            {editingOrder && hasPermission('edit_orders') && (
                <OrderEditModal
                    order={editingOrder}
                    allProducts={allProducts}
                    onClose={() => setEditingOrder(null)}
                    onSave={handleSaveOrder}
                    language={language}
                />
            )}
            {editingProduct && hasPermission('manage_menu') && (
                <ProductEditModal product={editingProduct === 'new' ? null : editingProduct} categories={allCategories} onClose={() => setEditingProduct(null)} onSave={handleSaveProduct} language={language}/>
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
                    restaurantInfo={restaurantInfo}
                />
            )}
            {editingCategory && hasPermission('manage_classifications') && (
                <CategoryEditModal
                    category={editingCategory === 'new' ? null : editingCategory}
                    onClose={() => setEditingCategory(null)}
                    onSave={(data) => {
                        if ('id' in data) updateCategory(data); else addCategory(data);
                        setEditingCategory(null);
                    }}
                    language={language}
                />
            )}
             {editingTag && hasPermission('manage_classifications') && (
                <TagEditModal
                    tag={editingTag === 'new' ? null : editingTag}
                    onClose={() => setEditingTag(null)}
                    onSave={(data) => {
                        if (editingTag !== 'new' && 'id' in data) updateTag(data); else addTag(data as Tag);
                        setEditingTag(null);
                    }}
                    language={language}
                />
            )}
             {refusingOrder && (
                <RefusalReasonModal
                    order={refusingOrder}
                    onClose={() => setRefusingOrder(null)}
                    onSave={(reason) => {
                        updateOrder(refusingOrder.id, { status: 'refused', refusalReason: reason });
                        setRefusingOrder(null);
                    }}
                    language={language}
                />
            )}
            {editingOrderStatus && hasPermission('manage_roles') && (
                <OrderStatusEditModal
                    statusColumn={editingOrderStatus === 'new' ? null : editingOrderStatus}
                    onClose={() => setEditingOrderStatus(null)}
                    onSave={(data) => {
                        if (editingOrderStatus !== 'new' && 'id' in data) {
                           updateOrderStatusColumn(data as OrderStatusColumn);
                        } else {
                           addOrderStatusColumn(data as OrderStatusColumn);
                        }
                        setEditingOrderStatus(null);
                    }}
                    language={language}
                    existingIds={restaurantInfo.orderStatusColumns.map(c => c.id)}
                />
            )}
        </div>
    );
};