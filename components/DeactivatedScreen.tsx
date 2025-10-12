
import React from 'react';
import { useUI } from '../contexts/UIContext';
import { useData } from '../contexts/DataContext';
// FIX: Replace inline SVG with LockClosedIcon component, which is now correctly exported.
import { LockClosedIcon } from './icons/Icons';

export const DeactivatedScreen: React.FC = () => {
    const { language } = useUI();
    const { restaurantInfo } = useData();

    if (!restaurantInfo) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-950">
                Loading...
            </div>
        );
    }
    
    const message = restaurantInfo.deactivationMessage 
        ? restaurantInfo.deactivationMessage[language] 
        : "System is deactivated.";

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-950 p-6 text-center">
            <div className="animate-fade-in-up">
                <img src={restaurantInfo.logo} alt="logo" className="w-24 h-24 rounded-full mx-auto mb-6 shadow-lg" />
                <div className="mx-auto w-16 h-16 flex items-center justify-center bg-red-100 dark:bg-red-900/50 rounded-full mb-4">
                    <LockClosedIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">
                    {language === 'ar' ? 'النظام متوقف' : 'System Deactivated'}
                </h1>
                <p className="max-w-md mx-auto text-slate-500 dark:text-slate-400">
                    {message}
                </p>
            </div>
        </div>
    );
};