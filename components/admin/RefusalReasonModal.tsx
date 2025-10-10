import React, { useState } from 'react';
import type { Order } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { useUI } from '../../contexts/UIContext';
import { Modal } from '../Modal';

interface RefusalReasonModalProps {
    order: Order;
    onClose: () => void;
    onSave: (reason: string) => void;
}

export const RefusalReasonModal: React.FC<RefusalReasonModalProps> = ({ order, onClose, onSave }) => {
    const { language } = useUI();
    const t = useTranslations(language);
    const [reason, setReason] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(reason);
    };

    return (
        <Modal title={t.reasonForRefusal} onClose={onClose} size="sm">
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <p>Order ID: <span className="font-mono font-bold">{order.id}</span></p>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Customer did not answer, Wrong address..."
                    rows={4}
                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
                    required
                    autoFocus
                />
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">{t.cancel}</button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600">{t.submit}</button>
                </div>
            </form>
        </Modal>
    );
};
