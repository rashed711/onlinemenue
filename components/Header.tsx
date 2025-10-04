
import React, { useState, useEffect, useMemo } from 'react';
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

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    window.location.hash = path;
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superAdmin';
  const hasVisibleSocialLinks = useMemo(() => restaurantInfo.socialLinks.some(link => link.isVisible), [restaurantInfo.socialLinks]);

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-md border-b border-slate-200 dark:border-slate-800' : 'bg-transparent'}`}>
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex justify-between items-center h-20">
          <a href="#/" onClick={(e) => handleNav(e, '/')} className="flex items-center gap-3 cursor-pointer group">
            <img src={restaurantInfo.logo} alt="logo" className="h-12 w-12 rounded-full object-cover transition-transform group-hover:scale-110" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{restaurantInfo.name[language]}</h1>
          </a>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden sm:flex items-center gap-4">
              {currentUser ? (
                 <div className="flex items-center gap-4">
                    <a href={isAdmin ? '#/admin' : '#/profile'} onClick={(e) => handleNav(e, isAdmin ? '/admin' : '/profile')} className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors" title={t.profile}>
                        <UserIcon className="w-5 h-5" />
                        <span>{currentUser.name}</span>
                    </a>
                    <button onClick={logout} className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      {t.logout}
                    </button>
                 </div>
              ) : (
                <>
                    <a href="#/login" onClick={(e) => handleNav(e, '/login')} className="text-sm font-semibold hover:text-primary-500 transition-colors px-3 py-2">{t.login}</a>
                    <a href="#/register" onClick={(e) => handleNav(e, '/register')} className="text-sm font-semibold bg-primary-500 text-white px-4 py-2 rounded-full hover:bg-primary-600 transition-colors shadow-sm hover:shadow-md">{t.register}</a>
                </>
              )}
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
            </div>
            
            {hasVisibleSocialLinks && (
                <a 
                    href="#/social" 
                    onClick={(e) => handleNav(e, '/social')} 
                    className="p-2 h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors" 
                    aria-label={t.contactUs}
                    title={t.contactUs}
                >
                    <LinkIcon className="w-6 h-6" />
                </a>
            )}
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
             <div className="sm:hidden">
                 <a href={currentUser ? (isAdmin ? '#/admin' : '#/profile') : '#/login'} onClick={(e) => handleNav(e, currentUser ? (isAdmin ? '/admin' : '/profile') : '/login')} className="p-2 h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors" title={t.profile}>
                    <UserIcon className="w-6 h-6" />
                </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
