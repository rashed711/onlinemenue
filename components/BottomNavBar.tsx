import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { HomeIcon, MenuAlt2Icon, CartIcon, ClockIcon, UserIcon, ShieldCheckIcon, LogoutIcon, LanguageIcon, SunIcon, MoonIcon, CloseIcon } from './icons/Icons';
import { useUI } from '../contexts/UIContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { formatNumber } from '../utils/helpers';

interface BottomNavBarProps {
    onCartClick: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ onCartClick }) => {
    const { t, language, theme, toggleLanguage, toggleTheme } = useUI();
    const { cartItems } = useCart();
    const { currentUser, logout, isAdmin } = useAuth();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    const navItems = [
        { id: 'home', href: '#/', label: t.home, icon: HomeIcon },
        { id: 'menu', href: '#/menu', label: t.fullMenu, icon: MenuAlt2Icon },
        { id: 'cart', label: t.cart, icon: CartIcon, isButton: true, badge: cartItemCount },
        { id: 'orders', href: '#/profile', label: t.orders, icon: ClockIcon },
        { id: 'profile', label: t.myProfile, icon: UserIcon, isButton: true },
    ];
    
    const currentHash = window.location.hash || '#/';
    
    const handleNav = (path: string) => {
        setIsUserMenuOpen(false);
        window.location.hash = path;
    };

    const portalRoot = document.getElementById('portal-root');

    return (
        <>
            <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm z-40 md:hidden">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 dark:border-slate-700/50">
                    <nav className="flex justify-around items-center h-20">
                        {navItems.map((item) => {
                            const isActive = item.href === currentHash;
                            const iconClasses = `w-7 h-7 mb-1 transition-all ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'}`;
                            const labelClasses = `text-xs font-bold transition-colors ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'}`;

                            const content = (
                                <>
                                    <item.icon className={iconClasses} />
                                    <span className={labelClasses}>{item.label}</span>
                                    {item.badge > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-white dark:ring-slate-800">
                                            {formatNumber(item.badge)}
                                        </span>
                                    )}
                                </>
                            );

                            if (item.isButton) {
                                let clickHandler = () => {};
                                if (item.id === 'cart') clickHandler = onCartClick;
                                if (item.id === 'profile') clickHandler = () => setIsUserMenuOpen(true);
                                
                                return (
                                    <button key={item.label} onClick={clickHandler} className="relative flex-1 flex flex-col items-center justify-center group">
                                        {content}
                                    </button>
                                );
                            }

                            return (
                                <a key={item.label} href={item.href} className="relative flex-1 flex flex-col items-center justify-center group">
                                    {content}
                                </a>
                            );
                        })}
                    </nav>
                </div>
            </footer>
            {isUserMenuOpen && portalRoot && ReactDOM.createPortal(
                <>
                    <div
                        className="fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity duration-300 opacity-100 animate-fade-in"
                        onClick={() => setIsUserMenuOpen(false)}
                        aria-hidden="true"
                    />
                    <div
                        className="fixed bottom-0 inset-x-0 bg-cream dark:bg-slate-900 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out rounded-t-2xl max-h-[85vh] animate-slide-up"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="usermenu-heading"
                    >
                         <div className="relative flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" aria-hidden="true"></div>
                            <h2 id="usermenu-heading" className="text-xl font-bold text-slate-800 dark:text-slate-100">{t.myProfile}</h2>
                            <button onClick={() => setIsUserMenuOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={t.close}>
                                <CloseIcon className="w-6 h-6"/>
                            </button>
                        </div>
                        <div className="overflow-y-auto p-2">
                             {currentUser ? (
                                <>
                                  <div className="px-3 py-4 flex items-center gap-4 border-b border-slate-200 dark:border-slate-700">
                                    <img src={currentUser.profilePicture} alt="profile" className="w-12 h-12 rounded-full object-cover"/>
                                    <div>
                                      <p className="font-semibold text-base truncate text-slate-800 dark:text-slate-100">{currentUser.name}</p>
                                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{t[currentUser.role as keyof typeof t] || currentUser.role}</p>
                                    </div>
                                  </div>
                                   {isAdmin && (
                                    <a href="#/admin" onClick={() => handleNav('/admin')} className="flex items-center gap-4 w-full text-start px-3 py-3 text-base text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                                      <ShieldCheckIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                                      <span>{t.adminPanel}</span>
                                    </a>
                                  )}
                                  <a href="#/profile" onClick={() => handleNav('/profile')} className="flex items-center gap-4 w-full text-start px-3 py-3 text-base text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                                    <UserIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                                    <span>{t.myProfile}</span>
                                  </a>
                                  <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="flex items-center gap-4 w-full text-start px-3 py-3 text-base text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors">
                                    <LogoutIcon className="w-6 h-6" />
                                    <span>{t.logout}</span>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <a href="#/login" onClick={() => handleNav('/login')} className="flex items-center gap-4 w-full text-start px-3 py-3 text-base text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors">{t.login}</a>
                                </>
                              )}
                              <hr className="my-2 border-slate-200 dark:border-slate-700" />
                              <button onClick={() => { toggleLanguage(); setIsUserMenuOpen(false); }} className="flex items-center gap-4 w-full text-start px-3 py-3 text-base text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                                <LanguageIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                                <span>{t.language}</span>
                                <span className="ms-auto text-sm font-semibold text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded-full">{language === 'en' ? 'عربي' : 'English'}</span>
                              </button>
                              <button onClick={() => { toggleTheme(); setIsUserMenuOpen(false); }} className="flex items-center gap-4 w-full text-start px-3 py-3 text-base text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                                 {theme === 'light' ? <MoonIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" /> : <SunIcon className="w-6 h-6 text-yellow-400" />}
                                <span>{t.theme}</span>
                              </button>
                        </div>
                    </div>
                </>,
                portalRoot
            )}
        </>
    );
};