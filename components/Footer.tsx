import React from 'react';
import type { Language, RestaurantInfo } from '../types';
import { useTranslations } from '../i18n/translations';

interface FooterProps {
    language: Language;
    restaurantInfo: RestaurantInfo;
}

export const Footer: React.FC<FooterProps> = ({ language, restaurantInfo }) => {
    const t = useTranslations(language);
    
    return (
        <footer className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-16 py-8">
            <div className="container mx-auto max-w-7xl px-4 text-center text-slate-500 dark:text-slate-400">
                 <div className="flex flex-col items-center gap-4">
                    <img src={restaurantInfo.logo} alt="logo" className="h-12 w-12 rounded-full" />
                    <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">{restaurantInfo.name[language]}</p>
                    <p className="text-sm">&copy; {new Date().getFullYear()} {restaurantInfo.name[language]}. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};