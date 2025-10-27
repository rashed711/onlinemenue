import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import type { Language, User } from '../types';
import { useTranslations } from '../i18n/translations';
import { CloseIcon } from './icons/Icons';

interface DeliveryDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (details: { mobile: string; address: string }) => void;
    language: Language;
    currentUser: User | null;
}

export const DeliveryDetailsModal: React.FC<DeliveryDetailsModalProps> = ({ isOpen, onClose, onConfirm, language, currentUser }) => {
    const t = useTranslations(language);
    const [mobile, setMobile] = useState('');
    const [address, setAddress] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (currentUser) {
                setMobile(currentUser.mobile);
            } else {
                setMobile('');
            }
            setAddress('');
        }
    }, [isOpen, currentUser]);


    const portalRoot = document.getElementById('portal-root');
    
    if (!isOpen || !portalRoot) return null;

    const handleConfirm = () => {
        if (mobile.trim() && address.trim()) {
            onConfirm({ mobile: mobile.trim(), address: address.trim() });
        }
    }

    const isConfirmDisabled = !mobile.trim() || !address.trim();

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                 <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-primary-600 dark:text-primary-400">{t.deliveryDetails}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label htmlFor="delivery-mobile" className="block text-sm font-medium mb-1">{t.mobileNumber}</label>
                        <input
                            id="delivery-mobile"
                            type="tel"
                            placeholder={t.mobileNumber}
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            className="w-full p-3 text-base border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-slate-200 dark:disabled:bg-slate-700"
                            disabled={!!currentUser}
                            required
                        />
                    </div>
                     <div>
                        <label htmlFor="delivery-address" className="block text-sm font-medium mb-1">{t.address}</label>
                        <textarea
                            id="delivery-address"
                            placeholder={t.enterAddressPrompt}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            rows={3}
                            className="w-full p-3 text-base border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                            required
                        />
                    </div>
                    <button
                        onClick={handleConfirm}
                        disabled={isConfirmDisabled}
                        className="w-full mt-4 bg-green-500 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {t.confirmOrder}
                    </button>
                </div>
            </div>
        </div>,
        portalRoot
    );
};
