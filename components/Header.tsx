import React, { useState, useEffect } from 'react';
import type { Language, Theme, RestaurantInfo, User } from '../types';
import { useTranslations } from '../i18n/translations';
import { SunIcon, MoonIcon, CartIcon, LanguageIcon, UserIcon } from './icons/Icons';

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

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg shadow-md' : 'bg-transparent'}`}>
      <div className="container mx-auto max-w-7xl px-4 py-3">
        <div className="flex justify-between items-center">
          <a href="#/" onClick={(e) => handleNav(e, '/')} className="flex items-center gap-3 cursor-pointer">
            <img src={restaurantInfo.logo} alt="logo" className="h-12 w-12 rounded-full object-cover" />
            <h1 className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400">{restaurantInfo.name[language]}</h1>
          </a>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-4">
              {currentUser ? (
                 <>
                    <a href={currentUser.role === 'admin' ? '#/admin' : '#/profile'} onClick={(e) => handleNav(e, currentUser.role === 'admin' ? '/admin' : '/profile')} className="flex items-center gap-2 text-sm font-semibold hover:text-primary-500 transition-colors" title={t.profile}>
                        <UserIcon className="w-5 h-5" />
                        <span>{currentUser.name}</span>
                    </a>
                    <button onClick={logout} className="text-sm font-semibold hover:text-primary-500 transition-colors">
                      {t.logout}
                    </button>
                 </>
              ) : (
                <>
                    <a href="#/login" onClick={(e) => handleNav(e, '/login')} className="text-sm font-semibold hover:text-primary-500 transition-colors">{t.login}</a>
                    <a href="#/register" onClick={(e) => handleNav(e, '/register')} className="text-sm font-semibold bg-primary-500 text-white px-4 py-2 rounded-full hover:bg-primary-600 transition-colors">{t.register}</a>
                </>
              )}
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
            </div>
            
            <button onClick={toggleLanguage} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <LanguageIcon className="w-6 h-6" />
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6 text-yellow-400" />}
            </button>
            <button onClick={onCartClick} className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors lg:hidden">
              <CartIcon className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
             <div className="sm:hidden">
                 <a href={currentUser ? (currentUser.role === 'admin' ? '#/admin' : '#/profile') : '#/login'} onClick={(e) => handleNav(e, currentUser ? (currentUser.role === 'admin' ? '/admin' : '/profile') : '/login')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title={t.profile}>
                    <UserIcon className="w-6 h-6" />
                </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};