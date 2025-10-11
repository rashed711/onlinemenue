import React from 'react';
import type { Permission, User, UserRole, Role } from '../../types';
import { ClipboardListIcon, CollectionIcon, UsersIcon, CloseIcon, ShieldCheckIcon, BookmarkAltIcon, ChartBarIcon, TagIcon, CogIcon, CashRegisterIcon, LogoutIcon, HomeIcon } from '../icons/Icons';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useAdmin } from '../../contexts/AdminContext';

type AdminTab = 'orders' | 'cashier' | 'reports' | 'productList' | 'classifications' | 'promotions' | 'users' | 'roles' | 'settings';

interface AdminSidebarProps {
    activeTab: AdminTab;
    setActiveTab: (tab: AdminTab) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onChangePasswordClick: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = (props) => {
    const { activeTab, setActiveTab, isOpen, setIsOpen, onChangePasswordClick } = props;
    const { language, t } = useUI();
    const { currentUser, logout, hasPermission } = useAuth();
    const { restaurantInfo } = useData();
    const { roles } = useAdmin();

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
            { id: 'roles', label: t.manageRoles, icon: ShieldCheckIcon, permission: 'view_roles_page' as Permission },
            { id: 'settings', label: t.settings, icon: CogIcon, permission: 'view_settings_page' as Permission },
        ]
    };

    const NavLink: React.FC<{ item: { id: string; label: string; icon: React.FC<any>; }; }> = ({ item }) => (
        <button
            onClick={() => {
                setActiveTab(item.id as AdminTab);
                setIsOpen(false);
            }}
            className={`w-full flex items-center p-3 my-1 rounded-lg transition-all duration-200 text-sm font-medium border-s-4 text-start ${
                activeTab === item.id
                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 border-primary-500 font-semibold'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 border-transparent'
            }`}
        >
            <item.icon className="w-5 h-5" />
            <span className="mx-4">{item.label}</span>
        </button>
    );
    
    const handleButtonClickNav = (path: string) => {
        setIsOpen(false);
        window.location.hash = path;
    };

    if (!currentUser || !restaurantInfo) return null;

    const userRoleName = roles.find(r => r.key === currentUser?.role)?.name[language] || currentUser?.role;

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            ></div>

            <aside className={`fixed top-0 bottom-0 flex flex-col w-64 h-screen bg-white dark:bg-gray-800 border-e dark:border-gray-700 transition-transform z-40 start-0 md:translate-x-0 ${
                isOpen ? 'translate-x-0' : (language === 'ar' ? 'translate-x-full' : '-translate-x-full')
            }`}>
                <div className="flex items-center justify-between px-4 h-20 border-b dark:border-gray-700">
                    <button onClick={() => handleButtonClickNav('/')} className="flex items-center gap-3">
                        <img src={restaurantInfo.logo} alt="Logo" className="h-10 w-10 rounded-full" />
                        <span className="text-lg font-bold text-gray-800 dark:text-white">{restaurantInfo.name[language]}</span>
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-2 md:hidden">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                 
                 <div className="flex-1 overflow-y-auto">
                    <nav className="p-4 space-y-4">
                        {Object.values(navItems).map((group, index) => {
                            const visibleItems = group.filter(item => hasPermission(item.permission));
                            if (visibleItems.length === 0) return null;
                            return (
                                <div key={index}>
                                   <h3 className="px-3 text-xs font-semibold uppercase text-gray-400 mb-2">{t[`permission_group_${Object.keys(navItems)[index]}` as keyof typeof t] || ''}</h3>
                                   {visibleItems.map(item => <NavLink item={item} key={item.id} />)}
                                </div>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-4 border-t dark:border-gray-700">
                     <button onClick={() => handleButtonClickNav('/profile')} className="block w-full text-start p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <img src={currentUser.profilePicture} alt="User" className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
                            <div>
                                <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{currentUser.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{userRoleName}</p>
                            </div>
                        </div>
                     </button>
                     <div className="mt-2 space-y-1">
                        <button onClick={() => handleButtonClickNav('/')} className="w-full flex items-center p-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors">
                            <HomeIcon className="w-5 h-5"/>
                            <span className="mx-4">{t.backToMenu}</span>
                        </button>
                        <button onClick={logout} className="w-full flex items-center p-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors">
                            <LogoutIcon className="w-5 h-5"/>
                            <span className="mx-4">{t.logout}</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};