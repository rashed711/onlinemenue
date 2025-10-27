import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import type { Language } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { CloseIcon } from '../icons/Icons';

interface ChangePasswordModalProps {
    language: Language;
    onClose: () => void;
    onSave: (currentPassword: string, newPassword: string) => Promise<string | null>;
    isProcessing: boolean;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ language, onClose, onSave, isProcessing }) => {
    const t = useTranslations(language);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirmPassword) {
            setError(t.passwordsDoNotMatch);
            return;
        }
        if (newPassword.length < 6) {
             setError('Password must be at least 6 characters long.');
             return;
        }

        const errorMsg = await onSave(currentPassword, newPassword);
        if (errorMsg) {
            setError(errorMsg);
        } else {
            onClose();
        }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold">{t.changePassword}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t.currentPassword}</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            required
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">{t.newPassword}</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            required
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">{t.confirmNewPassword}</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">{t.cancel}</button>
                        <button type="submit" disabled={isProcessing} className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:bg-gray-400">
                            {isProcessing ? 'Saving...' : t.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        portalRoot
    );
};