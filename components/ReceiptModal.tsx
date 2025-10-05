import React, { useState, useEffect } from 'react';
import type { Language } from '../types';
import { useTranslations } from '../i18n/translations';
import { CloseIcon, DownloadIcon } from './icons/Icons';

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    receiptImageUrl: string;
    language: Language;
    whatsappNumber: string;
    clearCart: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, receiptImageUrl, language, whatsappNumber, clearCart }) => {
    const t = useTranslations(language);
    const [canShare, setCanShare] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    useEffect(() => {
        // Check for Web Share API support when component mounts
        if (navigator.share) {
            setCanShare(true);
        }
    }, []);

    if (!isOpen) return null;

    const handleCloseAndClear = () => {
        clearCart();
        onClose();
    };

    const handleShare = async () => {
        setIsSharing(true);
        const whatsAppMessage = language === 'ar' ? 'تفضل إيصال طلبي' : 'Here is my order receipt';
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsAppMessage)}`;
        
        try {
            const response = await fetch(receiptImageUrl);
            if (!response.ok) throw new Error('Failed to fetch receipt image.');
            const blob = await response.blob();
            const file = new File([blob], `receipt-${Date.now()}.png`, { type: 'image/png' });

            if (canShare && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: t.receiptTitle,
                    text: whatsAppMessage,
                });
                handleCloseAndClear();
            } else {
                // Fallback for browsers that claim to support share but can't share the file
                window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
                handleCloseAndClear();
            }
        } catch (error) {
            console.error('Error sharing receipt:', error);
            // Do not clear cart if sharing is cancelled or fails
            if ((error as DOMException)?.name !== 'AbortError') {
                alert(language === 'ar' ? 'فشلت المشاركة. يرجى محاولة تحميل الإيصال وإرساله يدوياً.' : 'Sharing failed. Please try downloading the receipt and sending it manually.');
                window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            }
        } finally {
            setIsSharing(false);
        }
    };

    const whatsAppMessage = language === 'ar' ? 'تفضل إيصال طلبي' : 'Here is my order receipt';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsAppMessage)}`;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-primary-600 dark:text-primary-400">{t.receiptTitle}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
                <div className="p-6">
                    <div className="mb-6 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                        <img src={receiptImageUrl} alt="Order Receipt" className="w-full h-auto" />
                    </div>

                    {canShare ? (
                        // Modern one-click share for supported devices
                        <>
                            <p className="mb-4 text-center font-semibold">{t.shareInstructions}</p>
                            <button
                                onClick={handleShare}
                                disabled={isSharing}
                                className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
                            >
                                {isSharing ? '...' : t.shareOnWhatsApp}
                            </button>
                        </>
                    ) : (
                        // Fallback for unsupported devices (e.g., desktop)
                        <>
                            <p className="mb-4 text-center font-semibold">{t.receiptInstructions}</p>
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4 text-sm space-y-2">
                                <p dangerouslySetInnerHTML={{ __html: t.receiptStep1 }} />
                                <p dangerouslySetInnerHTML={{ __html: t.receiptStep2 }} />
                            </div>
                            <div className="space-y-3">
                                <a
                                    href={receiptImageUrl}
                                    download={`receipt-${Date.now()}.png`}
                                    className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <DownloadIcon className="w-6 h-6"/>
                                    {t.downloadReceipt}
                                </a>
                                <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={handleCloseAndClear}
                                    className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors block text-center"
                                >
                                {t.openWhatsApp}
                                </a>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};