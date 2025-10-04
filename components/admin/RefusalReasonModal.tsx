import React, { useState } from 'react';
import type { Order, Language } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { CloseIcon } from '../icons/Icons';

interface RefusalReasonModalProps {
    order: Order;
    onClose: () => void;
    onSave: (reason: string) => void;
    language: Language;
}

export const RefusalReasonModal: React.FC<RefusalReasonModalProps> = ({ order, onClose, onSave, language }) => {
    const t = useTranslations(language);
    const [reason, setReason] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(reason);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold">{t.reasonForRefusal}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p>Order ID: <span className="font-mono font-bold">{order.id}</span></p>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Customer did not answer, Wrong address..."
                        rows={4}
                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
                        required
                    />
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">{t.cancel}</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600">{t.submit}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
