import React from 'react';
import type { Language, Permission, User, UserRole, RestaurantInfo } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { ClipboardListIcon, CollectionIcon, UsersIcon, CloseIcon, ShieldCheckIcon, BookmarkAltIcon, ChartBarIcon, TagIcon, CogIcon, CashRegisterIcon, LogoutIcon, HomeIcon, KeyIcon } from '../icons/Icons';
import { usePermissions } from '../../hooks/usePermissions';

type AdminTab = 'orders' | 'cashier' | 'reports' | 'productList' | 'classifications' | 'promotions' | 'users' | 'roles' | 'settings';

interface AdminSidebarProps {
    language: Language;
    currentUser: User | null;
    rolePermissions: Record<UserRole, Permission[]>;
    activeTab: AdminTab;
    setActiveTab: (tab: AdminTab) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    restaurantInfo: RestaurantInfo;
    logout: () => void;
    onChangePasswordClick: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = (props) => {
    const { language, currentUser, rolePermissions, activeTab, setActiveTab, isOpen, setIsOpen, restaurantInfo, logout, onChangePasswordClick } = props;
    const t = useTranslations(language);
    const { hasPermission } = usePermissions(currentUser, rolePermissions);

    const navItems = {
        operations: [
            { id: 'orders', label: t.manageOrders, icon: ClipboardListIcon, permission: 'view_orders_page' as Permission },
            { id: 'cashier', label: t.cashier, icon: CashRegisterIcon, permission: 'use_cashier_page' as Permission },
            { id: 'reports', label: t.reports, icon: ChartBarIcon, permission: 'view_reports_page' as Permission },
        ],
        management: [
            { id: 'productList', label: t.productList, icon: CollectionIcon, permission: 'view_products_page' as Permission },
            { id: 'classifications', label: t.classifications, icon: BookmarkAltIcon, permission: 'view_classifications_page' as Permission },
            { id: 'promotions', label: t.managePromotions, icon: TagIcon, permission: 'view_promotions_page' as Permission },
        ],
        administration: [
            { id: 'users', label: t.manageUsers, icon: UsersIcon, permission: 'view_users_page' as Permission },
            { id: 'roles', label: t.manageRoles, icon: ShieldCheckIcon, permission: 'manage_roles' as Permission },
            { id: 'settings', label: t.settings, icon: CogIcon, permission: 'view_settings_page' as Permission },
        ]
    };

    interface NavLinkProps {
        item: { id: string; label: string; icon: React.FC<any>; };
    }
    const NavLink: React.FC<NavLinkProps> = ({ item }) => (
        <button
            onClick={() => {
                setActiveTab(item.id as AdminTab);
                setIsOpen(false);
            }}
            className={`w-full flex items-center p-3 my-1 rounded-lg transition-all duration-200 text-sm font-medium border-s-4 ${
                activeTab === item.id
                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 border-primary-500 font-semibold'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border-transparent'
            }`}
        >
            <item.icon className="w-5 h-5" />
            <span className="mx-4">{item.label}</span>
        </button>
    );
    
    const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        e.preventDefault();
        setIsOpen(false);
        window.location.hash = path;
    };

    return (
        <>
            {/* Overlay for mobile */}
            <div
                className={`fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            ></div>

            {/* Sidebar */}
            <aside className={`fixed top-0 bottom-0 flex flex-col w-64 h-screen bg-white dark:bg-gray-800 border-e dark:border-gray-700 transition-transform z-40 start-0 md:translate-x-0 ${
                isOpen ? 'translate-x-0' : (language === 'ar' ? 'translate-x-full' : '-translate-x-full')
            }`}>
                <div className="flex items-center justify-between px-4 h-20 border-b dark:border-gray-700">
                    <a href="#/" onClick={(e) => handleNav(e, '/')} className="flex items-center gap-3">
                        <img src={restaurantInfo.logo} alt="Logo" className="h-10 w-10 rounded-full" />
                        <span className="text-lg font-bold text-gray-800 dark:text-white">{restaurantInfo.name[language]}</span>
                    </a>
                    <button onClick={() => setIsOpen(false)} className="p-2 md:hidden">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                 
                 <div className="flex-1 overflow-y-auto">
                    <nav className="p-4 space-y-4">
                        <div>
                           <h3 className="px-3 text-xs font-semibold uppercase text-gray-400 mb-2">Operations</h3>
                           {navItems.operations.map(item => hasPermission(item.permission) && <NavLink item={item} key={item.id} />)}
                        </div>
                         <div>
                           <h3 className="px-3 text-xs font-semibold uppercase text-gray-400 mb-2">Management</h3>
                           {navItems.management.map(item => hasPermission(item.permission) && <NavLink item={item} key={item.id} />)}
                        </div>
                         <div>
                           <h3 className="px-3 text-xs font-semibold uppercase text-gray-400 mb-2">Administration</h3>
                           {navItems.administration.map(item => hasPermission(item.permission) && <NavLink item={item} key={item.id} />)}
                        </div>
                    </nav>
                </div>

                <div className="p-4 border-t dark:border-gray-700">
                     <a href="#/profile" onClick={(e) => handleNav(e, '/profile')} className="block p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <img src={currentUser?.profilePicture} alt="User" className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
                            <div>
                                <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{currentUser?.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{t[currentUser?.role as keyof typeof t]}</p>
                            </div>
                        </div>
                     </a>
                     <a href="#/" onClick={(e) => handleNav(e, '/')} className="w-full flex items-center p-3 mt-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors">
                        <HomeIcon className="w-5 h-5"/>
                        <span className="mx-4">{t.backToMenu}</span>
                    </a>
                </div>
            </aside>
        </>
    );
};