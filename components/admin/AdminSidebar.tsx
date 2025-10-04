import React from 'react';
import type { Language, Permission, User, UserRole } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { ClipboardListIcon, CollectionIcon, UsersIcon, CloseIcon, ShieldCheckIcon, BookmarkAltIcon, ChartBarIcon, TagIcon, CogIcon } from '../icons/Icons';
import { usePermissions } from '../../hooks/usePermissions';

type AdminTab = 'orders' | 'reports' | 'productList' | 'classifications' | 'promotions' | 'users' | 'roles' | 'settings';

interface AdminSidebarProps {
    language: Language;
    currentUser: User | null;
    rolePermissions: Record<UserRole, Permission[]>;
    activeTab: AdminTab;
    setActiveTab: (tab: AdminTab) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ language, currentUser, rolePermissions, activeTab, setActiveTab, isOpen, setIsOpen }) => {
    const t = useTranslations(language);
    const { hasPermission } = usePermissions(currentUser, rolePermissions);

    const navItems = [
        { id: 'orders', label: t.manageOrders, icon: ClipboardListIcon, permission: 'view_orders' as Permission },
        { id: 'reports', label: t.reports, icon: ChartBarIcon, permission: 'view_reports' as Permission },
        { id: 'productList', label: t.productList, icon: CollectionIcon, permission: 'manage_menu' as Permission },
        { id: 'classifications', label: t.classifications, icon: BookmarkAltIcon, permission: 'manage_classifications' as Permission },
        { id: 'promotions', label: t.managePromotions, icon: TagIcon, permission: 'manage_promotions' as Permission },
        { id: 'users', label: t.manageUsers, icon: UsersIcon, permission: 'manage_users' as Permission },
        { id: 'roles', label: t.manageRoles, icon: ShieldCheckIcon, permission: 'manage_roles' as Permission },
        { id: 'settings', label: t.settings, icon: CogIcon, permission: 'manage_roles' as Permission },
    ];

    // FIX: Explicitly type NavLink as a React.FC with a props interface
    // to resolve TypeScript error regarding the 'key' prop.
    interface NavLinkProps {
        item: (typeof navItems)[0];
    }
    const NavLink: React.FC<NavLinkProps> = ({ item }) => (
        <button
            onClick={() => {
                setActiveTab(item.id as AdminTab);
                setIsOpen(false);
            }}
            className={`w-full flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${
                activeTab === item.id
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
            <item.icon className="w-6 h-6" />
            <span className="mx-4 font-medium">{item.label}</span>
        </button>
    );
    
    const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        e.preventDefault();
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
            <aside className={`fixed top-0 bottom-0 flex flex-col w-64 h-screen px-4 py-8 bg-white dark:bg-gray-800 border-e dark:border-gray-700 transition-transform z-40 start-0 md:translate-x-0 ${
                isOpen ? 'translate-x-0' : (language === 'ar' ? 'translate-x-full' : '-translate-x-full')
            }`}>
                <div className="flex justify-between items-center md:hidden">
                    <h2 className="text-xl font-semibold text-primary-600 dark:text-primary-400">Admin Menu</h2>
                    <button onClick={() => setIsOpen(false)} className="p-2">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                 <div className="flex-1 mt-6 flex flex-col justify-between">
                    <nav>
                        {navItems.map(item => (
                           hasPermission(item.permission) && <NavLink item={item} key={item.id} />
                        ))}
                    </nav>
                     <a href="#/" onClick={(e) => handleNav(e, '/')} className="text-center text-sm text-gray-500 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400">
                        {t.backToMenu}
                    </a>
                </div>
            </aside>
        </>
    );
};