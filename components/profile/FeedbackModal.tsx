import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import type { Order, Language } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { CloseIcon } from '../icons/Icons';
import { StarRating } from '../StarRating';

interface FeedbackModalProps {
    order: Order;
    onClose: () => void;
    onSave: (feedback: { rating: number; comment: string }) => void;
    language: Language;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ order, onClose, onSave, language }) => {
    const t = useTranslations(language);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ rating, comment });
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold">{t.leaveFeedback}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    <div>
                        <p className="text-sm font-medium mb-2">{t.yourRating}</p>
                        <div className="flex justify-center">
                            <StarRating rating={rating} onRatingChange={setRating} size="lg" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">{t.yourComment}</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">{t.cancel}</button>
                        <button type="submit" className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600">{t.submit}</button>
                    </div>
                </form>
            </div>
        </div>,
        portalRoot
    );
};