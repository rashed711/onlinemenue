import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Language, Product, RestaurantInfo, Order, OrderStatus, User, UserRole, Promotion, Permission, Category, Tag, CartItem, SocialLink, LocalizedString, OrderStatusColumn, OrderType, Role } from '../../types';
import { MenuAlt2Icon, PlusIcon, PencilIcon, TrashIcon, ShieldCheckIcon, SearchIcon, FilterIcon, ChevronUpIcon, ChevronDownIcon, ChevronRightIcon } from '../icons/Icons';
import { OrderDetailsModal } from './OrderDetailsModal';
import { ProductEditModal } from './ProductEditModal';
import { PromotionEditModal } from './PromotionEditModal';
import { AdminSidebar } from './AdminSidebar';
import { UserEditModal } from './UserEditModal';
import { PermissionsEditModal } from './PermissionsEditModal';
import { ClassificationsPage } from './ClassificationsPage';
import { CategoryEditModal } from './CategoryEditModal';
import { TagEditModal } from './TagEditModal';
import { RefusalReasonModal } from './RefusalReasonModal';
import { OrderEditModal } from './OrderEditModal';
import { CashierPage } from './CashierPage';
import { SettingsPage } from './SettingsPage';
import { NotificationsPage } from './NotificationsPage';
import { formatDate, formatNumber } from '../../utils/helpers';
import { OrderCard } from './OrderCard';
import { RoleEditModal } from './RoleEditModal';
import { ReportsRootPage } from './reports/ReportsRootPage';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useAdmin } from '../../contexts/AdminContext';

interface AdminPageProps {
    activeSubRoute: string;
    reportSubRoute?: string;
}

type AdminTab = 'orders' | 'cashier' | 'reports' | 'productList' | 'classifications' | 'promotions' | 'notifications' | 'users' | 'roles' | 'settings';
type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'custom';
type UserTab = 'customers' | 'staff';

const NAV_ITEMS_WITH_PERMS = [
    { id: 'orders', permission: 'view_orders_page' },
    { id: 'cashier', permission: 'use_cashier_page' },
    { id: 'reports', permission: 'view_reports_page' },
    { id: 'productList', permission: 'view_products_page' },
    { id: 'classifications', permission: 'view_classifications_page' },
    { id: 'promotions', permission: 'view_promotions_page' },
    { id: 'notifications', permission: 'view_notifications_page' },
    { id: 'users', permission: 'view_users_page' },
    { id: 'roles', permission: 'view_roles_page' },
    { id: 'settings', permission: 'view_settings_page' },
];

const getDescendantCategoryIds = (categoryId: number, categories: Category[]): number[] => {
    const ids: number[] = [];

    // Helper to find a category by its ID in the tree
    const findCategory = (cats: Category[], id: number): Category | null => {
        for (const cat of cats) {
            if (cat.id === id) {
                return cat;
            }
            if (cat.children) {
                const foundInChildren = findCategory(cat.children, id);
                if (foundInChildren) {
                    return foundInChildren;
                }
            }
        }
        return null;
    };

    // Helper to recursively collect all child IDs, including the parent's
    const collectAllIds = (category: Category) => {
        ids.push(category.id);
        if (category.children) {
            for (const child of category.children) {
                collectAllIds(child);
            }
        }
    };

    const startCategory = findCategory(categories, categoryId);

    if (startCategory) {
        collectAllIds(startCategory);
    }
    
    return ids;
};


export const AdminPage: React.FC<AdminPageProps> = ({ activeSubRoute, reportSubRoute }) => {
    const { language, t, showToast, setProgress, setShowProgress, setIsChangePasswordModalOpen } = useUI();
    const { currentUser, hasPermission } = useAuth();
    const { 
        products: allProducts, 
        promotions: allPromotions, 
        restaurantInfo, 
        categories,
        tags
    } = useData();
    const {
        orders: allOrders, 
        users: allUsers, 
        roles, 
        rolePermissions,
        updateOrder, deleteOrder, addProduct, updateProduct, deleteProduct, 
        addPromotion, updatePromotion, deletePromotion, addUser, updateUser, deleteUser,
        updateRolePermissions,
        addCategory, updateCategory, deleteCategory, addTag, updateTag, deleteTag,
        addRole, updateRole, deleteRole,
        viewingOrder, setViewingOrder,
        refusingOrder, setRefusingOrder,
    } = useAdmin();

    const [activeTab, setActiveTab] = useState<AdminTab>(activeSubRoute as AdminTab);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | 'new' | null>(null);
    const [editingPromotion, setEditingPromotion] = useState<Promotion | 'new' | null>(null);
    const [editingUser, setEditingUser] = useState<User | 'new' | null>(null);
    const [editingPermissionsForRole, setEditingPermissionsForRole] = useState<UserRole | null>(null);
    const [editingRole, setEditingRole] = useState<Role | 'new' | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | 'new' | null>(null);
    const [editingTag, setEditingTag] = useState<Tag | 'new' | null>(null);

    // Order Filters
    const [orderSearchTerm, setOrderSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [activeDateFilter, setActiveDateFilter] = useState<DateFilter>('today');
    const [orderFilterType, setOrderFilterType] = useState<'all' | 'Dine-in' | 'Delivery' | 'Takeaway'>('all');
    const [orderFilterCreator, setOrderFilterCreator] = useState<string>('all');
    const [isOrderFilterExpanded, setIsOrderFilterExpanded] = useState(false);

    // Product Filters
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [productFilterCategory, setProductFilterCategory] = useState<number | null>(null);
    const [productFilterTags, setProductFilterTags] = useState<string[]>([]);
    const [isProductFilterExpanded, setIsProductFilterExpanded] = useState(false);
    const [openCategoryDropdown, setOpenCategoryDropdown] = useState<number | null>(null);
    const categoryDropdownRef = useRef<HTMLDivElement>(null);
    
    // User Filters
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [userTab, setUserTab] = useState<UserTab>('customers');


    const [transitionStage, setTransitionStage] = useState<'in' | 'out'>('in');
    const [displayedTab, setDisplayedTab] = useState(activeTab);

     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
            setOpenCategoryDropdown(null);
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        setActiveTab(activeSubRoute as AdminTab);
    }, [activeSubRoute]);

    const setTab = (tab: AdminTab) => {
        window.location.hash = `#/admin/${tab}`;
    };

    const onChangePasswordClick = () => setIsChangePasswordModalOpen(true);
    
    const isCategoryOrChildSelected = useCallback((category: Category): boolean => {
        if (productFilterCategory === null) return false;
        const categoryIdsToMatch = getDescendantCategoryIds(category.id, categories);
        return categoryIdsToMatch.includes(productFilterCategory);
    }, [productFilterCategory, categories]);

    useEffect(() => {
        const currentTabInfo = NAV_ITEMS_WITH_PERMS.find(item => item.id === activeTab);
        if (currentTabInfo && !hasPermission(currentTabInfo.permission as Permission)) {
            const firstAvailableTab = NAV_ITEMS_WITH_PERMS.find(item => hasPermission(item.permission as Permission));
            if (firstAvailableTab) {
                setTab(firstAvailableTab.id as AdminTab);
                showToast(t.permissionsUpdatedRedirect);
            } else {
                window.location.hash = '#/profile';
            }
        }
    }, [activeTab, hasPermission, showToast, t.permissionsUpdatedRedirect]);

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
            }, 300);

            return () => {
                clearTimeout(timer);
                clearInterval(progressInterval);
            };
        }
    }, [activeTab, displayedTab, setProgress, setShowProgress]);
    
    const setDateFilter = (filter: DateFilter) => {
        setActiveDateFilter(filter);
        const today = new Date();
        const toISO = (date: Date) => date.toISOString().split('T')[0];

        switch(filter) {
            case 'today': setStartDate(toISO(today)); setEndDate(toISO(today)); break;
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                setStartDate(toISO(yesterday)); setEndDate(toISO(yesterday)); break;
            case 'week':
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                setStartDate(toISO(startOfWeek)); setEndDate(toISO(today)); break;
            case 'month':
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                setStartDate(toISO(startOfMonth)); setEndDate(toISO(today)); break;
            default: break;
        }
    };
    
    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => { setActiveDateFilter('custom'); setStartDate(e.target.value); };
    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => { setActiveDateFilter('custom'); setEndDate(e.target.value); };

    const ordersToDisplay = useMemo(() => {
        if (!currentUser || !hasPermission('view_orders_page')) return [];
        let baseOrders: Order[];
        if (currentUser.role === 'waiter') { // Example logic, use role name/key
            baseOrders = allOrders.filter(order => order.createdBy === currentUser.id);
        } else {
            baseOrders = allOrders;
        }
        
        const canViewDineIn = hasPermission('view_dine_in_orders');
        const canViewTakeaway = hasPermission('view_takeaway_orders');
        const canViewDelivery = hasPermission('view_delivery_orders');
        const hasSpecificOrderTypePermission = canViewDineIn || canViewTakeaway || canViewDelivery;
    
        if (!hasSpecificOrderTypePermission) return baseOrders;
    
        const allowedTypes: OrderType[] = [];
        if (canViewDineIn) allowedTypes.push('Dine-in');
        if (canViewTakeaway) allowedTypes.push('Takeaway');
        if (canViewDelivery) allowedTypes.push('Delivery');
    
        return baseOrders.filter(order => allowedTypes.includes(order.orderType));
    
    }, [allOrders, currentUser, hasPermission]);
    
    const orderCreators = useMemo(() => {
        const creatorIds = new Set(allOrders.map(o => o.createdBy).filter((id): id is number => id !== undefined));
        return allUsers.filter(u => creatorIds.has(u.id));
    }, [allOrders, allUsers]);

    const filteredOrders = useMemo(() => {
        const lowercasedTerm = orderSearchTerm.toLowerCase();
        const filtered = ordersToDisplay.filter(order => {
            const orderDateString = new Date(order.timestamp).toISOString().split('T')[0];
            if (orderDateString < startDate || orderDateString > endDate) return false;
            if (orderFilterType !== 'all' && order.orderType !== orderFilterType) return false;
            if (orderFilterCreator !== 'all' && String(order.createdBy) !== orderFilterCreator) return false;
            if (lowercasedTerm) {
                return order.id.toLowerCase().includes(lowercasedTerm) ||
                    (order.customer.name && order.customer.name.toLowerCase().includes(lowercasedTerm)) ||
                    order.customer.mobile.toLowerCase().includes(lowercasedTerm) ||
                    (order.tableNumber && order.tableNumber.includes(lowercasedTerm));
            }
            return true;
        });
        return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [ordersToDisplay, startDate, endDate, orderFilterType, orderFilterCreator, orderSearchTerm]);

    const filteredProducts = useMemo(() => {
        const lowercasedTerm = productSearchTerm.toLowerCase();
        const filtered = allProducts.filter(product => {
            const nameEn = product.name.en.toLowerCase();
            const nameAr = product.name.ar.toLowerCase();
            const code = product.code.toLowerCase();

            const matchesSearch = nameEn.includes(lowercasedTerm) || nameAr.includes(lowercasedTerm) || code.includes(lowercasedTerm);
            
            let matchesCategory = true;
            if (productFilterCategory !== null) {
                const categoryIdsToMatch = getDescendantCategoryIds(productFilterCategory, categories);
                matchesCategory = categoryIdsToMatch.includes(product.categoryId);
            }

            const matchesTags = productFilterTags.length === 0 || productFilterTags.every(tag => product.tags.includes(tag));
            
            return matchesSearch && matchesCategory && matchesTags;
        });

        return filtered.sort((a, b) => a.name[language].localeCompare(b.name[language], language));
    }, [allProducts, productSearchTerm, productFilterCategory, productFilterTags, language, categories]);

    const handleProductTagChange = (tagId: string) => {
        setProductFilterTags(prev => 
            prev.includes(tagId) 
            ? prev.filter(t => t !== tagId) 
            : [...prev, tagId]
        );
    };

    const usersToDisplay = useMemo(() => {
        if (!currentUser) return [];
        const superAdminRole = roles.find(r => r.name.en.toLowerCase() === 'superadmin');
        const customerRole = roles.find(r => r.name.en.toLowerCase() === 'customer');
        
        const currentUserIsSuperAdmin = currentUser.role === superAdminRole?.key;
        const customerRoleKey = customerRole ? customerRole.key : '___non_existent_key___';

        let baseUsers = currentUserIsSuperAdmin
            ? allUsers
            : allUsers.filter(user => user.role !== superAdminRole?.key);

        // Tab filtering
        if (userTab === 'customers') {
            baseUsers = baseUsers.filter(user => user.role === customerRoleKey);
        } else { // staff
            baseUsers = baseUsers.filter(user => user.role !== customerRoleKey);
        }

        const lowercasedTerm = userSearchTerm.toLowerCase();
        if (lowercasedTerm) {
            baseUsers = baseUsers.filter(user =>
                user.name.toLowerCase().includes(lowercasedTerm) ||
                user.mobile.toLowerCase().includes(lowercasedTerm) ||
                (user.email && user.email.toLowerCase().includes(lowercasedTerm))
            );
        }
        
        return baseUsers.sort((a, b) => a.name.localeCompare(b.name, language));
    }, [allUsers, currentUser, roles, userSearchTerm, language, userTab]);

    const viewingOrderCreatorName = useMemo(() => {
        if (!viewingOrder || !viewingOrder.createdBy) return undefined;
        return allUsers.find(u => u.id === viewingOrder.createdBy)?.name;
    }, [viewingOrder, allUsers]);

    const handleSaveProduct = (productData: Product | Omit<Product, 'id' | 'rating'>, imageFile?: File | null) => {
        if ('id' in productData) {
            updateProduct(productData as Product, imageFile);
        } else {
            addProduct(productData as Omit<Product, 'id' | 'rating'>, imageFile);
        }
        setEditingProduct(null);
    };

    const handleToggleProductFlag = (product: Product, flag: 'isPopular' | 'isNew' | 'isVisible') => {
        updateProduct({ ...product, [flag]: !product[flag] });
    };
    
    const handleSavePromotion = (promotionData: Promotion | Omit<Promotion, 'id'>) => {
        if ('id' in promotionData) updatePromotion(promotionData); else addPromotion(promotionData);
        setEditingPromotion(null);
    };
    
    const handleTogglePromotionStatus = (promotion: Promotion) => {
        updatePromotion({ ...promotion, isActive: !promotion.isActive });
    };
    
    const handleSaveUser = (userData: User | Omit<User, 'id'>) => {
        if ('id' in userData) updateUser(userData as User); else addUser(userData as Omit<User, 'id'>);
        setEditingUser(null);
    };
    
    const handleSavePermissions = (role: UserRole, permissions: Permission[]) => {
        updateRolePermissions(role, permissions);
        setEditingPermissionsForRole(null);
    };

    const handleSaveOrder = (updatedOrderData: {items: CartItem[], notes: string, tableNumber?: string}) => {
        if (editingOrder) updateOrder(editingOrder.id, updatedOrderData);
        setEditingOrder(null);
    };

    const handleSaveRole = (roleData: Role | Omit<Role, 'isSystem' | 'key'>) => {
        if ('isSystem' in roleData) updateRole(roleData); else addRole(roleData);
        setEditingRole(null);
    };

    const getStatusColorClass = (color: string) => `text-${color}-500`;
    
    if (!currentUser || !restaurantInfo) return <div className="p-8 text-center">Loading...</div>;

    const renderContent = () => {
        switch(displayedTab) {
            case 'orders': {
                if (!hasPermission('view_orders_page')) return <PermissionDeniedComponent />;
                const dateFilterButtonClasses = (filter: DateFilter) => `px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${activeDateFilter === filter ? 'bg-primary-600 text-white shadow' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'}`;
                
                return (
                     <div>
                        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">{t.manageOrders}</h2>

                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg mb-6 border border-slate-200 dark:border-slate-700">
                            <div className="p-4 flex justify-between items-center cursor-pointer select-none" onClick={() => setIsOrderFilterExpanded(!isOrderFilterExpanded)}>
                                <div className="flex items-center gap-2">
                                    <FilterIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                                    <h3 className="font-semibold text-slate-700 dark:text-slate-200">{t.filter}</h3>
                                </div>
                                <button className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                                    {isOrderFilterExpanded ? <ChevronUpIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" /> : <ChevronDownIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />}
                                </button>
                            </div>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOrderFilterExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                        <div className="md:col-span-2 lg:col-span-4">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.search}</label>
                                            <div className="relative">
                                                <input type="text" placeholder={`${t.orderId}, ${t.name}, ${t.mobileNumber}...`} value={orderSearchTerm} onChange={(e) => setOrderSearchTerm(e.target.value)} className="w-full p-2 ps-10 rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"/>
                                                <div className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400"><SearchIcon className="w-5 h-5" /></div>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-2">
                                            <button onClick={() => setDateFilter('today')} className={dateFilterButtonClasses('today')}>{t.today}</button>
                                            <button onClick={() => setDateFilter('yesterday')} className={dateFilterButtonClasses('yesterday')}>{t.yesterday}</button>
                                            <button onClick={() => setDateFilter('week')} className={dateFilterButtonClasses('week')}>{language === 'ar' ? 'هذا الأسبوع' : 'This Week'}</button>
                                            <button onClick={() => setDateFilter('month')} className={dateFilterButtonClasses('month')}>{t.thisMonth}</button>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.startDate}</label>
                                            <input type="date" value={startDate} onChange={handleStartDateChange} className="w-full p-2 rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"/>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.endDate}</label>
                                            <input type="date" value={endDate} onChange={handleEndDateChange} className="w-full p-2 rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"/>
                                        </div>
                                        <div className="min-w-[150px]">
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.orderType}</label>
                                            <select value={orderFilterType} onChange={(e) => setOrderFilterType(e.target.value as any)} className="w-full p-2 rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                                                <option value="all">{t.all}</option>
                                                <option value="Dine-in">{t.dineIn}</option>
                                                <option value="Takeaway">{t.takeaway}</option>
                                                <option value="Delivery">{t.delivery}</option>
                                            </select>
                                        </div>
                                        {orderCreators.length > 0 && (
                                            <div className="min-w-[150px]">
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.creator}</label>
                                                <select value={orderFilterCreator} onChange={(e) => setOrderFilterCreator(e.target.value)} className="w-full p-2 rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                                                    <option value="all">{t.all}</option>
                                                    {orderCreators.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>


                        <div className="w-full overflow-x-auto pb-4">
                          <div className="inline-grid gap-6 min-w-max" style={{ gridTemplateColumns: `repeat(${restaurantInfo.orderStatusColumns.length}, 20rem)` }}>
                              {restaurantInfo.orderStatusColumns.map(col => {
                                const colOrders = filteredOrders.filter(o => o.status === col.id || (col.id === 'cancelled' && o.status === 'refused'));
                                return (
                                <div key={col.id} className="w-80 flex flex-col">
                                  <h3 className={`text-lg font-bold flex items-center gap-2 p-3 sticky bg-white dark:bg-slate-800 z-10 border-b-2 border-slate-200 dark:border-slate-700 ${getStatusColorClass(col.color)}`}>
                                     {col.name[language]} ({formatNumber(colOrders.length)})
                                  </h3>
                                  <div className="bg-slate-200/50 dark:bg-slate-900/50 p-2 sm:p-4 rounded-b-lg space-y-4 min-h-[calc(100vh-250px)] flex-grow">
                                      {colOrders.map((order, index) => (
                                        <OrderCard order={order} key={order.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-fade-in-up" />
                                      ))}
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
            case 'cashier': return hasPermission('use_cashier_page') ? <CashierPage /> : <PermissionDeniedComponent />;
            case 'reports': return hasPermission('view_reports_page') ? <ReportsRootPage activeSubRoute={reportSubRoute} /> : <PermissionDeniedComponent />;
            case 'productList':
                if (!hasPermission('view_products_page')) return <PermissionDeniedComponent />;
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.productList}</h2>
                            {hasPermission('add_product') && <button onClick={() => setEditingProduct('new')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"><PlusIcon className="w-5 h-5" />{t.addNewProduct}</button>}
                        </div>

                        <div className="relative z-10 bg-white dark:bg-slate-800 rounded-xl shadow-lg mb-6 border border-slate-200 dark:border-slate-700">
                            <div className="p-4 flex justify-between items-center cursor-pointer select-none" onClick={() => setIsProductFilterExpanded(!isProductFilterExpanded)}>
                                <div className="flex items-center gap-2">
                                    <FilterIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                                    <h3 className="font-semibold text-slate-700 dark:text-slate-200">{t.filter}</h3>
                                </div>
                                <button className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                                    {isProductFilterExpanded ? <ChevronUpIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" /> : <ChevronDownIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />}
                                </button>
                            </div>
                            <div className={`transition-all duration-300 ease-in-out ${isProductFilterExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.search}</label>
                                        <div className="relative">
                                            <input type="text" placeholder={`${t.productNameEn}, ${t.code}...`} value={productSearchTerm} onChange={(e) => setProductSearchTerm(e.target.value)} className="w-full p-2 ps-10 rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"/>
                                            <div className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400"><SearchIcon className="w-5 h-5" /></div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.category}</label>
                                        <div className="flex flex-wrap items-start gap-2">
                                            <button
                                                onClick={() => setProductFilterCategory(null)}
                                                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap ${productFilterCategory === null ? 'bg-primary-600 text-white shadow' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                                            >
                                                {t.allCategories}
                                            </button>
                                            {categories.map(category => {
                                                const hasChildren = category.children && category.children.length > 0;
                                                const isActive = isCategoryOrChildSelected(category);

                                                if (hasChildren) {
                                                    return (
                                                        <div key={category.id} className="relative" ref={openCategoryDropdown === category.id ? categoryDropdownRef : null}>
                                                            <button
                                                                onClick={() => setOpenCategoryDropdown(openCategoryDropdown === category.id ? null : category.id)}
                                                                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${isActive ? 'bg-primary-600 text-white shadow' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                                                            >
                                                                <span>{category.name[language]}</span>
                                                                <ChevronRightIcon className={`w-4 h-4 transition-transform ${language === 'ar' ? 'transform -scale-x-100' : ''} ${openCategoryDropdown === category.id ? 'rotate-90' : ''}`} />
                                                            </button>
                                                            {openCategoryDropdown === category.id && (
                                                                <div className="absolute top-full mt-2 z-20 min-w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in py-1">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setProductFilterCategory(category.id); setOpenCategoryDropdown(null); }}
                                                                        className={`block w-full text-start px-4 py-2 text-sm transition-colors ${productFilterCategory === category.id && (!category.children || !category.children.some(c => c.id === productFilterCategory)) ? 'font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/40' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                                                    >
                                                                        {t.all} {category.name[language]}
                                                                    </button>
                                                                    {category.children!.map(child => (
                                                                        <button
                                                                            key={child.id}
                                                                            onClick={(e) => { e.stopPropagation(); setProductFilterCategory(child.id); setOpenCategoryDropdown(null); }}
                                                                            className={`block w-full text-start px-4 py-2 text-sm transition-colors ${productFilterCategory === child.id ? 'font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/40' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                                                        >
                                                                            {child.name[language]}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <button
                                                        key={category.id}
                                                        onClick={() => setProductFilterCategory(category.id)}
                                                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 whitespace-nowrap ${productFilterCategory === category.id ? 'bg-primary-600 text-white shadow' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
                                                    >
                                                        {category.name[language]}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.tags}</label>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                            {tags.map(tag => (
                                                <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={productFilterTags.includes(tag.id)}
                                                        onChange={() => handleProductTagChange(tag.id)}
                                                        className="sr-only peer"
                                                    />
                                                    <span className="px-3 py-1.5 rounded-full text-xs font-semibold border-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 peer-checked:bg-primary-100 dark:peer-checked:bg-primary-900/50 peer-checked:border-primary-500 peer-checked:text-primary-700 dark:peer-checked:text-primary-300 transition-colors">
                                                        {tag.name[language]}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-slate-200 dark:border-slate-700">
                             <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.product}</th><th scope="col" className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.price}</th><th scope="col" className="px-6 py-4 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.popular}</th><th scope="col" className="px-6 py-4 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.new}</th><th scope="col" className="px-6 py-4 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.visibleInMenu}</th>
                                        {(hasPermission('edit_product') || hasPermission('delete_product')) && <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.actions}</th>}
                                    </tr>
                                </thead>
                                 <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {filteredProducts.map((product) => (
                                        <tr key={product.id} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-800 dark:even:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><img src={product.image} alt={product.name[language]} className="w-12 h-12 rounded-md object-cover me-4" loading="lazy" /><div><div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{product.name[language]}</div><div className="text-xs text-slate-500 dark:text-slate-400">{product.code}</div></div></div></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300"><div className="text-sm">{product.price.toFixed(2)} {t.currency}</div></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center"><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={product.isPopular} onChange={() => hasPermission('edit_product') && handleToggleProductFlag(product, 'isPopular')} disabled={!hasPermission('edit_product')} className="sr-only peer" /><div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div></label></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center"><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={product.isNew} onChange={() => hasPermission('edit_product') && handleToggleProductFlag(product, 'isNew')} disabled={!hasPermission('edit_product')} className="sr-only peer" /><div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div></label></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center"><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={product.isVisible} onChange={() => hasPermission('edit_product') && handleToggleProductFlag(product, 'isVisible')} disabled={!hasPermission('edit_product')} className="sr-only peer" /><div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div></label></td>
                                            {(hasPermission('edit_product') || hasPermission('delete_product')) && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><div className="flex items-center gap-4">{hasPermission('edit_product') && <button onClick={() => setEditingProduct(product)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1"><PencilIcon className="w-4 h-4" /> {t.edit}</button>}{hasPermission('delete_product') && <button onClick={() => deleteProduct(product.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 flex items-center gap-1"><TrashIcon className="w-4 h-4" /> {t.delete}</button>}</div></td>}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4">
                            {filteredProducts.map(product => (
                                <div key={product.id} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 space-y-4 border-l-4 border-primary-500">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <img src={product.image} alt={product.name[language]} className="w-16 h-16 rounded-md object-cover flex-shrink-0" loading="lazy" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{product.name[language]}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{product.code}</p>
                                            </div>
                                        </div>
                                        <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{product.price.toFixed(2)}</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 border-y border-slate-100 dark:border-slate-700">
                                        {[ { flag: 'isPopular', label: t.popular, color: 'primary' }, { flag: 'isNew', label: t.new, color: 'green' }, { flag: 'isVisible', label: t.visibleInMenu, color: 'blue' } ].map(({ flag, label, color }) => (
                                            <div key={flag}>
                                                <label className="flex flex-col items-center gap-1 cursor-pointer">
                                                    <span className="font-medium text-slate-600 dark:text-slate-300">{label}</span>
                                                    <input type="checkbox" checked={product[flag as keyof Product] as boolean} onChange={() => hasPermission('edit_product') && handleToggleProductFlag(product, flag as any)} disabled={!hasPermission('edit_product')} className={`sr-only peer peer-checked:bg-${color}-600`}/>
                                                    <div className={`relative w-10 h-5 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-${color}-600`}></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    {(hasPermission('edit_product') || hasPermission('delete_product')) && (
                                        <div className="flex items-center justify-end gap-4">
                                            {hasPermission('edit_product') && <button onClick={() => setEditingProduct(product)} className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1"><PencilIcon className="w-4 h-4" /> {t.edit}</button>}
                                            {hasPermission('delete_product') && <button onClick={() => deleteProduct(product.id)} className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1"><TrashIcon className="w-4 h-4" /> {t.delete}</button>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'classifications': return hasPermission('view_classifications_page') ? <ClassificationsPage onEditCategory={setEditingCategory} onAddCategory={() => setEditingCategory('new')} onEditTag={setEditingTag} onAddTag={() => setEditingTag('new')} /> : <PermissionDeniedComponent />;
            case 'promotions':
                 if (!hasPermission('view_promotions_page')) return <PermissionDeniedComponent />;
                 return (
                    <div>
                        <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.managePromotions}</h2>{hasPermission('add_promotion') && <button onClick={() => setEditingPromotion('new')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"><PlusIcon className="w-5 h-5" /> {t.addNewPromotion}</button>}</div>
                        {/* Desktop Table */}
                        <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-x-auto border border-slate-200 dark:border-slate-700">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-700/50"><tr><th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.product}</th><th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.discountPercent}</th><th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden sm:table-cell">{t.endDate}</th><th className="px-6 py-4 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.isActive}</th>{(hasPermission('edit_promotion') || hasPermission('delete_promotion')) && <th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.actions}</th>}</tr></thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">{allPromotions.map((promo) => (<tr key={promo.id} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-800 dark:even:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"><td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{promo.title[language]}</div><div className="text-xs text-slate-500 dark:text-slate-400">{allProducts.find(p => p.id === promo.productId)?.name[language] || 'N/A'}</div></td><td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600 dark:text-red-400">{formatNumber(promo.discountPercent)}%</td><td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{formatDate(promo.endDate)}</td><td className="px-6 py-4 whitespace-nowrap text-center"><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={promo.isActive} onChange={() => hasPermission('edit_promotion') && handleTogglePromotionStatus(promo)} disabled={!hasPermission('edit_promotion')} className="sr-only peer" /><div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div></label></td>{(hasPermission('edit_promotion') || hasPermission('delete_promotion')) && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><div className="flex items-center gap-4">{hasPermission('edit_promotion') && <button onClick={() => setEditingPromotion(promo)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1"><PencilIcon className="w-4 h-4" /> {t.edit}</button>}{hasPermission('delete_promotion') && <button onClick={() => deletePromotion(promo.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 flex items-center gap-1"><TrashIcon className="w-4 h-4" /> {t.delete}</button>}</div></td>}</tr>))}</tbody>
                            </table>
                        </div>
                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4">
                            {allPromotions.map(promo => (
                                <div key={promo.id} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 space-y-3">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-slate-100">{promo.title[language]}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{allProducts.find(p => p.id === promo.productId)?.name[language] || 'N/A'}</p>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-red-600 dark:text-red-400">{formatNumber(promo.discountPercent)}% OFF</span>
                                        <span className="text-slate-600 dark:text-slate-300">{formatDate(promo.endDate)}</span>
                                    </div>
                                    <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex justify-between items-center">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={promo.isActive} onChange={() => hasPermission('edit_promotion') && handleTogglePromotionStatus(promo)} disabled={!hasPermission('edit_promotion')} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                            <span className="text-sm font-medium">{t.isActive}</span>
                                        </label>
                                        {(hasPermission('edit_promotion') || hasPermission('delete_promotion')) && (
                                            <div className="flex items-center gap-2">
                                                {hasPermission('edit_promotion') && <button onClick={() => setEditingPromotion(promo)} className="text-indigo-600 dark:text-indigo-400"><PencilIcon className="w-5 h-5" /></button>}
                                                {hasPermission('delete_promotion') && <button onClick={() => deletePromotion(promo.id)} className="text-red-600 dark:text-red-400"><TrashIcon className="w-5 h-5" /></button>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
             case 'notifications': return hasPermission('view_notifications_page') ? <NotificationsPage /> : <PermissionDeniedComponent />;
             case 'users':
                if (!hasPermission('view_users_page')) return <PermissionDeniedComponent />;
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.manageUsers}</h2>{hasPermission('add_user') && <button onClick={() => setEditingUser('new')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"><PlusIcon className="w-5 h-5" />{t.addNewUser}</button>}</div>
                        
                        <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
                            <nav className="-mb-px flex space-x-6 rtl:space-x-reverse" aria-label="Tabs">
                                <button
                                    onClick={() => setUserTab('customers')}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${userTab === 'customers' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'}`}
                                >
                                    {t.customers}
                                </button>
                                <button
                                    onClick={() => setUserTab('staff')}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${userTab === 'staff' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'}`}
                                >
                                    {t.staff}
                                </button>
                            </nav>
                        </div>

                        <div className="mb-6">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={`${t.search} ${t.name}, ${t.mobileNumber}, ${t.email}...`}
                                    value={userSearchTerm}
                                    onChange={(e) => setUserSearchTerm(e.target.value)}
                                    className="w-full p-2 ps-10 rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
                                />
                                <div className="absolute top-1/2 -translate-y-1/2 start-3 text-slate-400"><SearchIcon className="w-5 h-5" /></div>
                            </div>
                        </div>
                        {/* Desktop Table */}
                        <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-x-auto border border-slate-200 dark:border-slate-700">
                           <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                               <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.user}</th>
                                    <th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden sm:table-cell">{t.mobileNumber}</th>
                                    {userTab === 'customers' && <th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider hidden sm:table-cell">{t.email}</th>}
                                    <th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.role}</th>
                                    {(hasPermission('edit_user') || hasPermission('delete_user')) && <th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.actions}</th>}
                                </tr>
                               </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">{usersToDisplay.map((user) => {
                                    const userRole = roles.find(r => r.key === user.role);
                                    return (
                                    <tr key={user.id} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-800 dark:even:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{user.mobile}</td>
                                        {userTab === 'customers' && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{user.email || 'N/A'}</td>}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-300">{userRole?.name[language] || user.role}</td>
                                        {(hasPermission('edit_user') || hasPermission('delete_user')) && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><div className="flex items-center gap-4">{hasPermission('edit_user') && <button onClick={() => setEditingUser(user)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1"><PencilIcon className="w-4 h-4" /> {t.edit}</button>}{hasPermission('delete_user') && <button onClick={() => deleteUser(user.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 flex items-center gap-1"><TrashIcon className="w-4 h-4" /> {t.delete}</button>}</div></td>}</tr>
                                )})}</tbody>
                           </table>
                       </div>
                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4">
                            {usersToDisplay.map(user => {
                                const userRole = roles.find(r => r.key === user.role);
                                return (
                                <div key={user.id} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-slate-100">{user.name}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{user.mobile}</p>
                                            {userTab === 'customers' && user.email && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                                            )}
                                        </div>
                                        <span className="text-xs font-semibold bg-primary-100 text-primary-800 px-2 py-1 rounded-full dark:bg-primary-900/50 dark:text-primary-300">{userRole?.name[language] || user.role}</span>
                                    </div>
                                    {(hasPermission('edit_user') || hasPermission('delete_user')) && (
                                    <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex items-center justify-end gap-4">
                                        {hasPermission('edit_user') && <button onClick={() => setEditingUser(user)} className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1"><PencilIcon className="w-4 h-4" /> {t.edit}</button>}
                                        {hasPermission('delete_user') && <button onClick={() => deleteUser(user.id)} className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1"><TrashIcon className="w-4 h-4" /> {t.delete}</button>}
                                    </div>
                                    )}
                                </div>
                            )})}
                        </div>
                    </div>
                );
            case 'roles':
                if (!hasPermission('view_roles_page')) return <PermissionDeniedComponent />;
                const superAdminRole = roles.find(r => r.name.en.toLowerCase() === 'superadmin');
                const currentUserIsSuperAdmin = currentUser?.role === superAdminRole?.key;
                const rolesToDisplay = currentUserIsSuperAdmin ? roles : roles.filter(r => r.name.en.toLowerCase() !== 'superadmin');
                
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.manageRoles}</h2>{hasPermission('add_role') && <button onClick={() => setEditingRole('new')} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"><PlusIcon className="w-5 h-5" />Add New Role</button>}</div>
                        {/* Desktop Table */}
                        <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-x-auto border border-slate-200 dark:border-slate-700">
                           <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                               <thead className="bg-slate-50 dark:bg-slate-700/50">
                                   <tr>
                                       <th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.role}</th><th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Role Key</th>
                                       {(hasPermission('manage_permissions') || hasPermission('edit_role') || hasPermission('delete_role')) && <th className="px-6 py-4 text-start text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{t.actions}</th>}
                                   </tr>
                               </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                   {rolesToDisplay.map((role) => (
                                       <tr key={role.key} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-800 dark:even:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                           <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">{role.name[language]}</td><td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500 dark:text-slate-400">{role.key}</td>
                                            {(hasPermission('manage_permissions') || hasPermission('edit_role') || hasPermission('delete_role')) && (<td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><div className="flex items-center gap-4">{hasPermission('manage_permissions') && <button onClick={() => setEditingPermissionsForRole(role.key)} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200 flex items-center gap-1"><ShieldCheckIcon className="w-4 h-4" /> {t.editPermissions}</button>}{hasPermission('edit_role') && <button onClick={() => setEditingRole(role)} disabled={role.isSystem} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"><PencilIcon className="w-4 h-4" /> {t.edit}</button>}{hasPermission('delete_role') && <button onClick={() => deleteRole(role.key)} disabled={role.isSystem} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"><TrashIcon className="w-4 h-4" /> {t.delete}</button>}</div></td>)}
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       </div>
                       {/* Mobile Cards */}
                       <div className="md:hidden space-y-4">
                           {rolesToDisplay.map(role => (
                               <div key={role.key} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 space-y-3">
                                   <div>
                                       <p className="font-bold text-slate-900 dark:text-slate-100">{role.name[language]}</p>
                                       <p className="text-sm font-mono text-slate-500 dark:text-slate-400">{role.key}</p>
                                   </div>
                                    {(hasPermission('manage_permissions') || hasPermission('edit_role') || hasPermission('delete_role')) && (
                                        <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex items-center justify-end flex-wrap gap-x-4 gap-y-2">
                                            {hasPermission('manage_permissions') && <button onClick={() => setEditingPermissionsForRole(role.key)} className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-1 text-sm"><ShieldCheckIcon className="w-4 h-4" /> {t.editPermissions}</button>}
                                            {hasPermission('edit_role') && <button onClick={() => setEditingRole(role)} disabled={role.isSystem} className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 text-sm disabled:opacity-50"><PencilIcon className="w-4 h-4" /> {t.edit}</button>}
                                            {hasPermission('delete_role') && <button onClick={() => deleteRole(role.key)} disabled={role.isSystem} className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1 text-sm disabled:opacity-50"><TrashIcon className="w-4 h-4" /> {t.delete}</button>}
                                        </div>
                                    )}
                               </div>
                           ))}
                       </div>
                    </div>
                );
             case 'settings': return hasPermission('view_settings_page') ? <SettingsPage /> : <PermissionDeniedComponent />;
            default: return null;
        }
    }
    
    return (
        <div className={`relative min-h-screen bg-slate-100 dark:bg-slate-900`}>
            <AdminSidebar activeTab={activeTab} setActiveTab={setTab} isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} onChangePasswordClick={onChangePasswordClick} />
            <div className={`flex flex-col min-h-screen transition-all duration-300 ${language === 'ar' ? 'md:mr-64' : 'md:ml-64'}`}>
                <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-sm sticky top-0 z-20 border-b border-slate-200 dark:border-slate-700" id="admin-header">
                    <div className="px-4 h-20 flex justify-between items-center"><div className="flex items-center gap-3"><button className="p-2 md:hidden rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors" onClick={() => setSidebarOpen(true)}><MenuAlt2Icon className="w-6 h-6 text-slate-600 dark:text-slate-300" /></button><h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.adminPanel}</h1></div></div>
                </header>
                <main className="container mx-auto max-w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
                    <div className={`transition-opacity duration-300 ease-in-out ${transitionStage === 'out' ? 'opacity-0' : 'opacity-100'}`}>{renderContent()}</div>
                </main>
            </div>
            
            {viewingOrder && hasPermission('view_orders_page') && <OrderDetailsModal order={viewingOrder} onClose={() => setViewingOrder(null)} canEdit={hasPermission('edit_order_content')} onEdit={(order) => { setViewingOrder(null); setEditingOrder(order); }} canDelete={hasPermission('delete_order')} onDelete={(orderId) => { deleteOrder(orderId); setViewingOrder(null); }} creatorName={viewingOrderCreatorName} />}
            {editingOrder && hasPermission('edit_order_content') && <OrderEditModal order={editingOrder} onClose={() => setEditingOrder(null)} onSave={handleSaveOrder} />}
            {editingProduct && (hasPermission('add_product') || hasPermission('edit_product')) && <ProductEditModal product={editingProduct === 'new' ? null : editingProduct} onClose={() => setEditingProduct(null)} onSave={handleSaveProduct} />}
            {editingPromotion && (hasPermission('add_promotion') || hasPermission('edit_promotion')) && <PromotionEditModal promotion={editingPromotion === 'new' ? null : editingPromotion} onClose={() => setEditingPromotion(null)} onSave={handleSavePromotion} />}
            {editingUser && (hasPermission('add_user') || hasPermission('edit_user')) && <UserEditModal user={editingUser === 'new' ? null : editingUser} onClose={() => setEditingUser(null)} onSave={handleSaveUser} />}
            {editingPermissionsForRole && hasPermission('manage_permissions') && <PermissionsEditModal roleId={editingPermissionsForRole} onClose={() => setEditingPermissionsForRole(null)} onSave={handleSavePermissions} />}
            {editingRole && (hasPermission('add_role') || hasPermission('edit_role')) && <RoleEditModal role={editingRole === 'new' ? null : editingRole} onClose={() => setEditingRole(null)} onSave={handleSaveRole} />}
            {editingCategory && (hasPermission('add_category') || hasPermission('edit_category')) && <CategoryEditModal category={editingCategory === 'new' ? null : editingCategory} categories={categories} onClose={() => setEditingCategory(null)} onSave={(data) => { if ('id' in data) updateCategory(data); else addCategory(data); setEditingCategory(null); }} />}
            {editingTag && (hasPermission('add_tag') || hasPermission('edit_tag')) && <TagEditModal tag={editingTag === 'new' ? null : editingTag} onClose={() => setEditingTag(null)} onSave={(data) => { if (editingTag !== 'new' && 'id' in data) updateTag(data); else addTag(data as Tag); setEditingTag(null); }} />}
            {refusingOrder && <RefusalReasonModal order={refusingOrder} onClose={() => setRefusingOrder(null)} onSave={(reason) => { updateOrder(refusingOrder.id, { status: 'refused', refusalReason: reason }); setRefusingOrder(null); }} />}
        </div>
    );
};