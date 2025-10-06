import React, { useState, useRef } from 'react';
import type { Language, User } from '../../types';
import { useTranslations } from '../../i18n/translations';
// FIX: Import ChevronRightIcon
import { PencilIcon, CameraIcon, ChevronLeftIcon, KeyIcon, LogoutIcon, ChevronRightIcon } from '../icons/Icons';

interface ProfilePageProps {
    language: Language;
    currentUser: User;
    logout: () => void;
    onChangePasswordClick: () => void;
    onUpdateProfile: (userId: number, updates: { name?: string; profilePicture?: string }) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ language, currentUser, logout, onChangePasswordClick, onUpdateProfile }) => {
    const t = useTranslations(language);
    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState(currentUser.name);
    const profilePicInputRef = useRef<HTMLInputElement>(null);
    
    const isAdminOrStaff = currentUser.role !== 'customer';

    const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        e.preventDefault();
        window.location.hash = path;
    };
    
    const handleSaveName = () => {
        if (name.trim() && name.trim() !== currentUser.name) {
            onUpdateProfile(currentUser.id, { name: name.trim() });
        }
        setIsEditingName(false);
    };

    const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpdateProfile(currentUser.id, { profilePicture: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };
    
    const backLinkPath = isAdminOrStaff ? '/admin' : '/';
    const backLinkText = isAdminOrStaff ? t.backToAdminPanel : t.backToMenu;

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 md:p-8">
            <div className="max-w-2xl mx-auto">
                <a href={`#${backLinkPath}`} onClick={(e) => handleNav(e, backLinkPath)} className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold hover:underline mb-6">
                    <ChevronLeftIcon className={`w-5 h-5 ${language === 'ar' && 'transform -scale-x-100'}`} />
                    {backLinkText}
                </a>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 text-center animate-fade-in-up">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                        <img 
                            src={currentUser.profilePicture} 
                            alt={t.profilePicture} 
                            className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-lg"
                        />
                        <input
                            type="file"
                            ref={profilePicInputRef}
                            onChange={handlePictureChange}
                            accept="image/*"
                            className="sr-only"
                        />
                        <button 
                            onClick={() => profilePicInputRef.current?.click()}
                            className="absolute bottom-0 end-0 bg-primary-500 text-white rounded-full p-2 hover:bg-primary-600 transition-transform transform hover:scale-110 shadow-md"
                            aria-label={t.changeProfilePicture}
                            title={t.changeProfilePicture}
                        >
                            <CameraIcon className="w-5 h-5"/>
                        </button>
                    </div>

                    {!isEditingName ? (
                        <div className="flex items-center justify-center gap-2">
                            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{currentUser.name}</h1>
                            <button onClick={() => setIsEditingName(true)} className="text-slate-500 hover:text-primary-600 p-1">
                                <PencilIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2">
                             <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onBlur={handleSaveName}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                className="text-3xl font-bold text-center bg-transparent border-b-2 border-primary-500 focus:outline-none"
                                autoFocus
                            />
                        </div>
                    )}

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{currentUser.mobile}</p>
                    <span className="mt-2 inline-block bg-primary-100 text-primary-800 text-xs font-semibold px-3 py-1 rounded-full dark:bg-primary-900/50 dark:text-primary-300">
                        {t[currentUser.role as keyof typeof t]}
                    </span>

                    <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700 space-y-4">
                         <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 text-start">{t.security}</h2>
                         <button 
                            onClick={onChangePasswordClick}
                            className="w-full flex justify-between items-center text-start p-4 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <KeyIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                                <span className="font-semibold">{t.changePassword}</span>
                            </div>
                            <ChevronRightIcon className={`w-5 h-5 text-slate-500 dark:text-slate-400 ${language === 'ar' && 'transform -scale-x-100'}`} />
                        </button>
                        
                        <button 
                            onClick={logout}
                            className="w-full flex justify-between items-center text-start p-4 rounded-lg text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <LogoutIcon className="w-6 h-6" />
                                <span className="font-semibold">{t.logout}</span>
                            </div>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};