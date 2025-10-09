import React, { useState, useMemo, useEffect } from 'react';
import type { Language, Product, RestaurantInfo, Order, OrderStatus, User, UserRole, Promotion, Permission, Category, Tag, CartItem, SocialLink, LocalizedString, OrderStatusColumn } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { MenuAlt2Icon, PlusIcon, PencilIcon, TrashIcon, ShieldCheckIcon, SearchIcon } from '../icons/Icons';
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
    setProgress: (progress: number | ((prev: number) => number)) => void;
    setShowProgress: (show: boolean) => void;
    onChangePasswordClick: () => void;
}

type AdminTab = 'orders' | 'cashier' | 'reports' | 'productList' | 'classifications' | 'promotions' | 'users' | 'roles' | 'settings';

export const AdminPage: React.FC<AdminPageProps> = (props) => {
    const { 
        language, currentUser, allProducts, allCategories, allTags, allUsers, restaurantInfo, allOrders, allPromotions,
        placeOrder, showToast, updateOrder, logout, addProduct, updateProduct, deleteProduct, 
        addPromotion, updatePromotion, deletePromotion, addUser, updateUser, deleteUser,
        rolePermissions, updateRolePermissions,
        addCategory, updateCategory, deleteCategory, addTag, updateTag, deleteTag,
        updateRestaurantInfo,
        setProgress, setShowProgress, onChangePasswordClick
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

    // Order filter states
    const [orderSearchTerm, setOrderSearchTerm] = useState('');
    const [orderFilterDate, setOrderFilterDate] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    });
    const [orderFilterType, setOrderFilterType] = useState<'all' | 'Dine-in' | 'Delivery'>('all');
    const [orderFilterCreator, setOrderFilterCreator] = useState<string>('all');

    // Transition state for tabs
    const [transitionStage, setTransitionStage] = useState<'in' | 'out'>('in');
    const [displayedTab, setDisplayedTab] = useState(activeTab);

    const PermissionDeniedComponent = () => (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-dashed border-yellow-300 dark:border-yellow-700 rounded-lg max-w-2xl mx-auto mt-10">
            <ShieldCheckIcon className="w-16 h-16 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{t.permissionDenied}</h2>
            <p className="mt-2 text-yellow-600 dark:text-yellow-300">You do not have the necessary permissions to view this page.</p>
        </div>
    );

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
        if (!currentUser || !hasPermission('view_orders_page')) {
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
    
    const orderCreators = useMemo(() => {
        const creatorIds = new Set(allOrders.map(o => o.createdBy).filter((id): id is number => id !== undefined));
        return allUsers.filter(u => creatorIds.has(u.id));
    }, [allOrders, allUsers]);

    const filteredOrders = useMemo(() => {
        const start = new Date(orderFilterDate.start);
        start.setHours(0, 0, 0, 0);
        const end = new Date(orderFilterDate.end);
        end.setHours(23, 59, 59, 999);

        const lowercasedTerm = orderSearchTerm.toLowerCase();

        return ordersToDisplay.filter(order => {
            // Date filter
            const orderDate = new Date(order.timestamp);
            if (orderDate < start || orderDate > end) return false;

            // Type filter
            if (orderFilterType !== 'all' && order.orderType !== orderFilterType) return false;

            // Creator filter
            if (orderFilterCreator !== 'all' && order.createdBy?.toString() !== orderFilterCreator) return false;

            // Search filter
            if (lowercasedTerm) {
                const matchesSearch = 
                    order.id.toLowerCase().includes(lowercasedTerm) ||
                    order.customer.name?.toLowerCase().includes(lowercasedTerm) ||
                    order.customer.mobile.toLowerCase().includes(lowercasedTerm) ||
                    (order.tableNumber && order.tableNumber.includes(lowercasedTerm));
                if (!matchesSearch) return false;
            }

            return true;
        });
    }, [ordersToDisplay, orderFilterDate, orderFilterType, orderFilterCreator, orderSearchTerm]);

    const usersToDisplay = useMemo(() => {
        if (currentUser?.role === 'superAdmin') {
            return allUsers; // Super admin sees everyone
        }
        // Other roles don't see super admins at all
        return allUsers.filter(user => user.role !== 'superAdmin');
    }, [allUsers, currentUser]);


    const handleSaveProduct = (productData: Product | Omit<Product, 'id' | 'rating'>) => {
        if ('id' in productData) {
            updateProduct(productData);
        } else {
            addProduct(productData);
        }
        setEditingProduct(null);
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
        const canManage = hasPermission('manage_order_status');

        const currentStatusDetails = restaurantInfo.orderStatusColumns.find(s => s.id === order.status);
        const creator = order.createdBy ? allUsers.find(u => u.id === order.createdBy) : null;
        const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

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
            <div onClick={() => setViewingOrder(order)} style={style} className={`bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 flex flex-col cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border border-slate-200 dark:border-slate-700 ${className || ''}`}>
                <div className="flex justify-between items-center mb-3">
                    <p className="font-extrabold text-lg text-amber-800 bg-amber-300 dark:bg-amber-400 dark:text-amber-900 px-3 py-0.5 rounded-md">
                        {order.total.toFixed(2)}
                    </p>
                    <p className="font-bold font-mono text-slate-500 dark:text-slate-400 text-sm">
                        {order.id}
                    </p>
                </div>

                <div className="space-y-3 flex-grow">
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
                     <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
                        <span>
                            {creator ? `${t.creator}: ${creator.name}` : ''}
                        </span>
                        <span className="font-semibold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                            {totalItems} {t.items}
                        </span>
                    </div>
                </div>

                <div className="flex justify-between items-center pt-3 mt-3 border-t dark:border-slate-700">
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
                if (!hasPermission('view_orders_page')) return <PermissionDeniedComponent />;
                const visibleColumns = restaurantInfo.orderStatusColumns.filter(
                    col => hasPermission(`view_status_${col.id}`)
                );
                
                return (
                     <div>
                        <h2 className="text-2xl font-bold mb-6">{t.manageOrders}</h2>

                        {/* Filter Bar */}
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md mb-6 border border-slate-200 dark:border-slate-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                                <div className="md:col-span-2 lg:col-span-1">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.search}</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder={`${t.orderId}, ${t.name}...`}
                                            value={orderSearchTerm}
                                            onChange={(e) => setOrderSearchTerm(e.target.value)}
                                            className="w-full p-2 ps-10 rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600"
                                        />
                                        <div className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400">
                                            <SearchIcon className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.startDate}</label>
                                    <input type="date" value={orderFilterDate.start} onChange={(e) => setOrderFilterDate(prev => ({ ...prev, start: e.target.value }))} className="w-full p-2 rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.endDate}</label>
                                    <input type="date" value={orderFilterDate.end} onChange={(e) => setOrderFilterDate(prev => ({ ...prev, end: e.target.value }))} className="w-full p-2 rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.orderType}</label>
                                    <select value={orderFilterType} onChange={(e) => setOrderFilterType(e.target.value as any)} className="w-full p-2 rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600">
                                        <option value="all">{t.all}</option>
                                        <option value="Dine-in">{t.dineIn}</option>
                                        <option value="Delivery">{t.delivery}</option>
                                    </select>
                                </div>
                                 {orderCreators.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.creator}</label>
                                        <select value={orderFilterCreator} onChange={(e) => setOrderFilterCreator(e.target.value)} className="w-full p-2 rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600">
                                            <option value="all">{t.all}</option>
                                            {orderCreators.map(user => (
                                                <option key={user.id} value={user.id}>{user.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="w-full overflow-x-auto pb-4">
                          <div className="inline-grid gap-6 min-w-max" style={{ gridTemplateColumns: `repeat(${visibleColumns.length}, 20rem)` }}>
                              {visibleColumns.map(col => {
                                const colOrders = filteredOrders.filter(o => o.status === col.id || (col.id === 'cancelled' && o.status === 'Refused'));
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
                if (!hasPermission('use_cashier_page')) return <PermissionDeniedComponent />;
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
                if (!hasPermission('view_reports_page')) return <PermissionDeniedComponent />;
                return (
                    <ReportsPage
                        language={language}
                        allOrders={allOrders}
                        allProducts={allProducts}
                        allCategories={allCategories}
                    />
                );
            case 'productList':
                if (!hasPermission('view_products_page')) return <PermissionDeniedComponent />;
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">{t.productList}</h2>
                            {hasPermission('add_product') && (
                                <button onClick={() => setEditingProduct('new')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2">
                                    <PlusIcon className="w-5 h-5" />
                                    {t.addNewProduct}
                                </button>
                            )}
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
                                            {hasPermission('edit_product') && (
                                                <>
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
                                                </>
                                            )}
                                        </div>
                                         <div className="flex items-center gap-2">
                                            {hasPermission('edit_product') && <button onClick={() => setEditingProduct(product)} className="p-2 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"><PencilIcon className="w-5 h-5" /></button>}
                                            {hasPermission('delete_product') && <button onClick={() => deleteProduct(product.id)} className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"><TrashIcon className="w-5 h-5" /></button>}
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
                                        {(hasPermission('edit_product') || hasPermission('delete_product')) && <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.actions}</th>}
                                    </tr>
                                </thead>
                                 <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {allProducts.map((product) => (
                                        <tr key={product.id} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-800 dark:even:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><img src={product.image} alt={product.name[language]} className="w-12 h-12 rounded-md object-cover me-4" /><div><div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{product.name[language]}</div><div className="text-xs text-slate-500 dark:text-slate-400">{product.code}</div></div></div></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300"><div className="text-sm">{product.price.toFixed(2)} {t.currency}</div></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center"><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={product.isPopular} onChange={() => hasPermission('edit_product') && handleToggleProductFlag(product, 'isPopular')} disabled={!hasPermission('edit_product')} className="sr-only peer" /><div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div></label></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center"><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={product.isNew} onChange={() => hasPermission('edit_product') && handleToggleProductFlag(product, 'isNew')} disabled={!hasPermission('edit_product')} className="sr-only peer" /><div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div></label></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center"><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={product.isVisible} onChange={() => hasPermission('edit_product') && handleToggleProductFlag(product, 'isVisible')} disabled={!hasPermission('edit_product')} className="sr-only peer" /><div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div></label></td>
                                            {(hasPermission('edit_product') || hasPermission('delete_product')) && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><div className="flex items-center gap-4">{hasPermission('edit_product') && <button onClick={() => setEditingProduct(product)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1"><PencilIcon className="w-4 h-4" /> {t.actions}</button>}{hasPermission('delete_product') && <button onClick={() => deleteProduct(product.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 flex items-center gap-1"><TrashIcon className="w-4 h-4" /> Delete</button>}</div></td>}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'classifications':
                if (!hasPermission('view_classifications_page')) return <PermissionDeniedComponent />;
                return (
                   <ClassificationsPage
                        language={language}
                        categories={allCategories}
                        tags={allTags}
                        onEditCategory={(category) => setEditingCategory(category)}
                        onDeleteCategory={deleteCategory}
                        onAddCategory={() => setEditingCategory('new')}
                        onEditTag={(tag) => setEditingTag(tag)}
                        onDeleteTag={deleteTag}
                        onAddTag={() => setEditingTag('new')}
                        canAddCategory={hasPermission('add_category')}
                        canEditCategory={hasPermission('edit_category')}
                        canDeleteCategory={hasPermission('delete_category')}
                        canAddTag={hasPermission('add_tag')}
                        canEditTag={hasPermission('edit_tag')}
                        canDeleteTag={hasPermission('delete_tag')}
                   />
                );
            case 'promotions':
                 if (!hasPermission('view_promotions_page')) return <PermissionDeniedComponent />;
                 return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">{t.managePromotions}</h2>
                            {hasPermission('add_promotion') && (
                                <button onClick={() => setEditingPromotion('new')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"><PlusIcon className="w-5 h-5" /> {t.addNewPromotion}</button>
                            )}
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-x-auto border border-slate-200 dark:border-slate-700">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-700/50"><tr><th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.product}</th><th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.discountPercent}</th><th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden sm:table-cell">{t.endDate}</th><th className="px-6 py-4 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.isActive}</th>{(hasPermission('edit_promotion') || hasPermission('delete_promotion')) && <th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.actions}</th>}</tr></thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">{allPromotions.map((promo) => {const product = allProducts.find(p => p.id === promo.productId); return (<tr key={promo.id} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-800 dark:even:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"><td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{promo.title[language]}</div><div className="text-xs text-slate-500 dark:text-slate-400">{product?.name[language] || 'N/A'}</div></td><td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600 dark:text-red-400">{formatNumber(promo.discountPercent)}%</td><td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{formatDate(promo.endDate)}</td><td className="px-6 py-4 whitespace-nowrap text-center"><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={promo.isActive} onChange={() => hasPermission('edit_promotion') && handleTogglePromotionStatus(promo)} disabled={!hasPermission('edit_promotion')} className="sr-only peer" /><div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div></label></td>{(hasPermission('edit_promotion') || hasPermission('delete_promotion')) && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><div className="flex items-center gap-4">{hasPermission('edit_promotion') && <button onClick={() => setEditingPromotion(promo)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1"><PencilIcon className="w-4 h-4" /> Edit</button>}{hasPermission('delete_promotion') && <button onClick={() => deletePromotion(promo.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 flex items-center gap-1"><TrashIcon className="w-4 h-4" /> Delete</button>}</div></td>}</tr>)})}</tbody>
                            </table>
                        </div>
                    </div>
                );
             case 'users':
                if (!hasPermission('view_users_page')) return <PermissionDeniedComponent />;
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold">{t.manageUsers}</h2>{hasPermission('add_user') && <button onClick={() => setEditingUser('new')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"><PlusIcon className="w-5 h-5" />{t.addNewUser}</button>}</div>
                        {/* Mobile Card View */}
                        <div className="space-y-4 md:hidden">
                            {usersToDisplay.map(user => (
                                <div key={user.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 space-y-3 border border-slate-200 dark:border-slate-700">
                                     <div className="flex items-center gap-4">
                                        <img src={user.profilePicture} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-slate-100">{user.name}</div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400">{user.mobile}</div>
                                            <div className="text-sm font-semibold text-primary-600 dark:text-primary-400">{t[user.role as keyof typeof t] || user.role}</div>
                                        </div>
                                    </div>
                                     <div className="flex justify-end items-center border-t dark:border-slate-700 pt-3">
                                         <div className="flex items-center gap-2">
                                            {hasPermission('edit_user') && <button onClick={() => setEditingUser(user)} disabled={user.role === 'superAdmin'} className="p-2 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"><PencilIcon className="w-5 h-5" /></button>}
                                            {hasPermission('delete_user') && <button onClick={() => deleteUser(user.id)} disabled={user.role === 'superAdmin'} className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 disabled:opacity-50 disabled:cursor-not-allowed"><TrashIcon className="w-5 h-5" /></button>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Desktop Table View */}
                        <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-x-auto border border-slate-200 dark:border-slate-700">
                           <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                               <thead className="bg-slate-50 dark:bg-slate-700/50"><tr><th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.user}</th><th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden sm:table-cell">{t.mobileNumber}</th><th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.role}</th>{(hasPermission('edit_user') || hasPermission('delete_user')) && <th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.actions}</th>}</tr></thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">{usersToDisplay.map((user) => (<tr key={user.id} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-800 dark:even:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"><td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{user.mobile}</td><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-300">{t[user.role as keyof typeof t] || user.role}</td>{(hasPermission('edit_user') || hasPermission('delete_user')) && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><div className="flex items-center gap-4">{hasPermission('edit_user') && <button onClick={() => setEditingUser(user)} disabled={user.role === 'superAdmin'} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"><PencilIcon className="w-4 h-4" /> Edit</button>}{hasPermission('delete_user') && <button onClick={() => deleteUser(user.id)} disabled={user.role === 'superAdmin'} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"><TrashIcon className="w-4 h-4" /> Delete</button>}</div></td>}</tr>))}</tbody>
                           </table>
                       </div>
                    </div>
                );
            case 'roles':
                if (!hasPermission('manage_roles')) return <PermissionDeniedComponent />;
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
                if (!hasPermission('view_settings_page')) return <PermissionDeniedComponent />;
                return (
                    <SettingsPage
                        language={language}
                        restaurantInfo={restaurantInfo}
                        updateRestaurantInfo={updateRestaurantInfo}
                        allOrders={allOrders}
                        showToast={showToast}
                        hasPermission={hasPermission}
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
                onChangePasswordClick={onChangePasswordClick}
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
            
            {viewingOrder && hasPermission('view_orders_page') && (
                <OrderDetailsModal 
                    order={viewingOrder} 
                    onClose={() => setViewingOrder(null)} 
                    language={language}
                    canEdit={hasPermission('edit_order_content')}
                    onEdit={(order) => {
                        setViewingOrder(null);
                        setEditingOrder(order);
                    }}
                    restaurantInfo={restaurantInfo}
                />
            )}
            {editingOrder && hasPermission('edit_order_content') && (
                <OrderEditModal
                    order={editingOrder}
                    allProducts={allProducts}
                    onClose={() => setEditingOrder(null)}
                    onSave={handleSaveOrder}
                    language={language}
                />
            )}
            {editingProduct && (hasPermission('add_product') || hasPermission('edit_product')) && (
                <ProductEditModal product={editingProduct === 'new' ? null : editingProduct} categories={allCategories} onClose={() => setEditingProduct(null)} onSave={handleSaveProduct} language={language}/>
            )}
            {editingPromotion && (hasPermission('add_promotion') || hasPermission('edit_promotion')) && (
                 <PromotionEditModal promotion={editingPromotion === 'new' ? null : editingPromotion} allProducts={allProducts} onClose={() => setEditingPromotion(null)} onSave={handleSavePromotion} language={language}/>
            )}
            {editingUser && (hasPermission('add_user') || hasPermission('edit_user')) && (
                <UserEditModal
                    user={editingUser === 'new' ? null : editingUser}
                    currentUser={currentUser}
                    onClose={() => setEditingUser(null)}
                    onSave={handleSaveUser}
                    language={language}
                />
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
            {editingCategory && (hasPermission('add_category') || hasPermission('edit_category')) && (
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
             {editingTag && (hasPermission('add_tag') || hasPermission('edit_tag')) && (
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
        </div>
    );
};