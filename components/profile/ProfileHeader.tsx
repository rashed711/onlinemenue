import React, { useState, useRef } from 'react';
import { PencilIcon, CameraIcon, KeyIcon, LogoutIcon } from '../icons/Icons';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';

export const ProfileHeader: React.FC = () => {
    const { t, setIsChangePasswordModalOpen } = useUI();
    const { currentUser, logout, updateUserProfile } = useAuth();
    
    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState(currentUser?.name || '');
    const profilePicInputRef = useRef<HTMLInputElement>(null);

    const handleSaveName = () => {
        if (currentUser && name.trim() && name.trim() !== currentUser.name) {
            updateUserProfile(currentUser.id, { name: name.trim() });
        }
        setIsEditingName(false);
    };

    const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && currentUser) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateUserProfile(currentUser.id, { profilePicture: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };
    
    if (!currentUser) return null;

    return (
        <>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 text-center animate-fade-in-up">
                <div className="relative w-32 h-32 mx-auto mb-4">
                    <img src={currentUser.profilePicture} alt={t.profilePicture} className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-lg"/>
                    <input type="file" ref={profilePicInputRef} onChange={handlePictureChange} accept="image/*" className="sr-only"/>
                    <button onClick={() => profilePicInputRef.current?.click()} className="absolute bottom-0 end-0 bg-primary-500 text-white rounded-full p-2 hover:bg-primary-600 transition-transform transform hover:scale-110 shadow-md" aria-label={t.changeProfilePicture} title={t.changeProfilePicture}><CameraIcon className="w-5 h-5"/></button>
                </div>
                {!isEditingName ? (
                    <div className="flex items-center justify-center gap-2 group">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{currentUser.name}</h2>
                        <button onClick={() => setIsEditingName(true)} className="text-slate-400 hover:text-primary-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <PencilIcon className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} onBlur={handleSaveName} onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} className="text-2xl font-bold text-center bg-transparent border-b-2 border-primary-500 focus:outline-none w-full max-w-[80%] mx-auto dark:text-slate-100" autoFocus/>
                )}
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{currentUser.mobile}</p>
                <span className="mt-2 inline-block bg-primary-100 text-primary-800 text-xs font-semibold px-3 py-1 rounded-full dark:bg-primary-900/50 dark:text-primary-300">{t[currentUser.role as keyof typeof t]}</span>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <div className="space-y-4">
                    <button onClick={() => setIsChangePasswordModalOpen(true)} className="w-full flex items-center gap-4 text-start p-4 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 transition-colors">
                        <KeyIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                        <span className="font-semibold text-slate-800 dark:text-slate-300">{t.changePassword}</span>
                    </button>
                    <button onClick={logout} className="w-full flex items-center gap-4 text-start p-4 rounded-lg text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors">
                        <LogoutIcon className="w-6 h-6" />
                        <span className="font-semibold">{t.logout}</span>
                    </button>
                </div>
            </div>
        </>
    );
};
