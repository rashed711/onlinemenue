import React from 'react';
import type { Language } from '../types';
import { useTranslations } from '../i18n/translations';

interface FooterProps {
    language: Language;
}

export const Footer: React.FC<FooterProps> = ({ language }) => {
    const t = useTranslations(language);
    
    return (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12 py-6">
            <div className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400">
                <p>&copy; {new Date().getFullYear()} {t.restaurantName}. All rights reserved.</p>
            </div>
        </footer>
    );
};
