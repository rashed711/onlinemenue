import React, { useState } from 'react';
import type { Language } from '../types';
import { useTranslations } from '../i18n/translations';
import { CloseIcon } from './icons/Icons';

interface GuestCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (mobile: string) => void;
    language: Language;
}

export const GuestCheckoutModal: React.FC<GuestCheckoutModalProps> = ({ isOpen, onClose, onConfirm, language }) => {
    const t = useTranslations(language);
    const [mobile, setMobile] = useState('');
    
    if (!isOpen) return null;

    const handleConfirm = () => {
        if (mobile.trim()) {
            onConfirm(mobile.trim());
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                 <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-primary-600 dark:text-primary-400">{t.guestCheckout}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                <div className="p-6">
                    <p className="mb-4 text-center">{t.guestCheckoutPrompt}</p>
                    <input
                        type="tel"
                        placeholder={t.mobileNumber}
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        className="w-full p-3 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                    <button
                        onClick={handleConfirm}
                        disabled={!mobile.trim()}
                        className="w-full mt-4 bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {t.confirmOrder}
                    </button>
                </div>
            </div>
        </div>
    );
};
