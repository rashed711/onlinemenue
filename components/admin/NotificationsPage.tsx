import React, { useState } from 'react';
import { useUI } from '../../contexts/UIContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../utils/config';

export const NotificationsPage: React.FC = () => {
    const { t, isProcessing, setIsProcessing, showToast } = useUI();
    const { roles } = useAdmin();
    const { hasPermission } = useAuth();

    const [message, setMessage] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [targetRole, setTargetRole] = useState('all');
    const [withSound, setWithSound] = useState(true);

    const canSend = hasPermission('send_broadcast_notifications');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSend || isProcessing || !message.trim()) return;

        setIsProcessing(true);
        try {
            const payload = {
                message,
                image_url: imageUrl || null,
                target_role: targetRole,
                with_sound: withSound,
            };
            
            const response = await fetch(`${API_BASE_URL}send_notification.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to send notification.');
            }

            showToast(t.language === 'ar' ? `تم إرسال الإشعار إلى ${result.sent} مشترك!` : `Notification sent to ${result.sent} subscribers!`);
            setMessage('');
            setImageUrl('');
            setTargetRole('all');
        } catch (error) {
            console.error('Failed to send notification:', error);
            showToast((error as Error).message || (t.language === 'ar' ? 'فشل إرسال الإشعار.' : 'Failed to send notification.'));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">{t.sendNotifications}</h2>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-5">
                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                {t.notificationMessage}
                            </label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={5}
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
                                placeholder={t.language === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                                required
                                disabled={!canSend}
                            />
                        </div>

                        <div>
                            <label htmlFor="imageUrl" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                {t.imageOptional}
                            </label>
                            <input
                                type="text"
                                id="imageUrl"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="https://example.com/image.png"
                                disabled={!canSend}
                            />
                        </div>

                        <div>
                            <label htmlFor="targetRole" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                {t.targetAudience}
                            </label>
                            <select
                                id="targetRole"
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
                                disabled={!canSend}
                            >
                                <option value="all">{t.allUsers}</option>
                                {roles.map(role => (
                                    <option key={role.key} value={role.key}>{role.name[t.language]}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex items-center">
                            <input
                                id="withSound"
                                type="checkbox"
                                checked={withSound}
                                onChange={(e) => setWithSound(e.target.checked)}
                                className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
                                disabled={!canSend}
                            />
                            <label htmlFor="withSound" className="ms-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                                {t.withSound}
                            </label>
                        </div>

                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 rounded-b-xl text-right">
                        <button
                            type="submit"
                            disabled={!canSend || isProcessing || !message.trim()}
                            className="bg-primary-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (t.language === 'ar' ? 'جار الإرسال...' : 'Sending...') : t.send}
                        </button>
                    </div>
                </form>
                 {!canSend && (
                    <div className="p-4 text-center text-sm bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-b-xl">
                        {t.permissionDenied}
                    </div>
                )}
            </div>
        </div>
    );
};