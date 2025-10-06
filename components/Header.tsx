
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Language, Theme, RestaurantInfo, User } from '../types';
import { useTranslations } from '../i18n/translations';
import { SunIcon, MoonIcon, CartIcon, LanguageIcon, UserIcon, LinkIcon } from './icons/Icons';

interface HeaderProps {
  language: Language;
  theme: Theme;
  toggleLanguage: () => void;
  toggleTheme: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  restaurantInfo: RestaurantInfo;
  currentUser: User | null;
  logout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  theme,
  toggleLanguage,
  toggleTheme,
  cartItemCount,
  onCartClick,
  restaurantInfo,
  currentUser,
  logout
}) => {
  const t = useTranslations(language);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    setIsUserMenuOpen(false); // Close menu on navigation
    window.location.hash = path;
  };

  // Close dropdown on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
      setIsUserMenuOpen(false); // Close on scroll
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superAdmin';

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-md border-b border-slate-200 dark:border-slate-800' : 'bg-transparent'}`}>
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex justify-between items-center h-20">
          <a href="#/" onClick={(e) => handleNav(e, '/')} className="flex items-center gap-3 cursor-pointer group">
            <img src={restaurantInfo.logo} alt="logo" className="h-12 w-12 rounded-full object-cover transition-transform group-hover:scale-110" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{restaurantInfo.name[language]}</h1>
          </a>
          <div className="flex items-center gap-1 sm:gap-2">
             <button onClick={toggleLanguage} className="p-2 h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors" aria-label="Toggle language">
              <LanguageIcon className="w-6 h-6" />
            </button>
            <button onClick={toggleTheme} className="p-2 h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors" aria-label="Toggle theme">
              {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6 text-yellow-400" />}
            </button>
            <button onClick={onCartClick} className="relative p-2 h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors" aria-label="Open cart">
              <CartIcon className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transform translate-x-1/4 -translate-y-1/4 ring-2 ring-white dark:ring-slate-900">
                  {cartItemCount}
                </span>
              )}
            </button>

            <div className="h-6 w-px mx-2 bg-slate-200 dark:bg-slate-700"></div>

            {/* User Menu Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setIsUserMenuOpen(prev => !prev)} 
                className="p-2 h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                aria-haspopup="true"
                aria-expanded={isUserMenuOpen}
                aria-label="User menu"
              >
                <UserIcon className="w-6 h-6" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute top-full mt-2 end-0 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in py-1">
                  {currentUser ? (
                    <>
                      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                        <p className="font-semibold text-sm truncate">{currentUser.name}</p>
                        <p className="text-xs text-slate-500 truncate">{currentUser.mobile}</p>
                      </div>
                      <a href={isAdmin ? '#/admin' : '#/profile'} onClick={(e) => handleNav(e, isAdmin ? '/admin' : '/profile')} className="block w-full text-start px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        {isAdmin ? t.adminPanel : t.profile}
                      </a>
                      <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="block w-full text-start px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 transition-colors">
                        {t.logout}
                      </button>
                    </>
                  ) : (
                    <>
                      <a href="#/login" onClick={(e) => handleNav(e, '/login')} className="block w-full text-start px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">{t.login}</a>
                      <a href="#/register" onClick={(e) => handleNav(e, '/register')} className="block w-full text-start px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">{t.register}</a>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
