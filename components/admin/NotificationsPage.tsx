import React, { useState } from 'react';
import { useUI } from '../../contexts/UIContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../utils/config';
import { optimizeImage } from '../../utils/imageOptimizer';
import { UploadIcon } from '../icons/Icons';

export const NotificationsPage: React.FC = () => {
    const { t, isProcessing, setIsProcessing, showToast } = useUI();
    const { roles } = useAdmin();
    const { hasPermission } = useAuth();

    const [message, setMessage] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState('');
    const [targetRole, setTargetRole] = useState('all');
    const [withSound, setWithSound] = useState(true);

    const canSend = hasPermission('send_broadcast_notifications');

    const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsProcessing(true);
            try {
                const optimizedFile = await optimizeImage(file, 512, 512);
                setImageFile(optimizedFile);
                setImagePreview(URL.createObjectURL(optimizedFile));
                setImageUrl(''); // Clear manual URL if file is chosen
            } catch (error) {
                console.error("Notification image optimization failed:", error);
                showToast("Image processing failed.");
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSend || isProcessing || !message.trim()) return;

        setIsProcessing(true);
        try {
            let finalImageUrl = imageUrl;
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                formData.append('type', 'notifications');
                const uploadRes = await fetch(`${API_BASE_URL}upload_image.php`, { method: 'POST', body: formData });
                const result = await uploadRes.json();
                if (!uploadRes.ok || !result.success) throw new Error(result.error || 'Image upload failed');
                finalImageUrl = new URL(result.url, new URL(API_BASE_URL).origin).href;
            }

            const payload = {
                message,
                image_url: finalImageUrl || null,
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

            showToast(t.notificationSentSuccess.replace('{count}', result.sent));
            setMessage('');
            setImageUrl('');
            setImageFile(null);
            setImagePreview('');
            setTargetRole('all');
        } catch (error) {
            console.error('Failed to send notification:', error);
            showToast((error as Error).message || t.notificationSendFailed);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">{t.sendNotifications}</h2>

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
                                className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
                                placeholder={t.language === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                                required
                                disabled={!canSend}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.imageOptional}</label>
                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                                <div className="flex-1 w-full">
                                    <input
                                        type="text"
                                        value={imageUrl}
                                        onChange={(e) => { setImageUrl(e.target.value); setImageFile(null); setImagePreview(''); }}
                                        className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                                        placeholder="Or paste an image URL"
                                        disabled={!canSend}
                                    />
                                </div>
                                <div className="text-center text-sm text-slate-500 font-semibold my-1 sm:my-0">{t.or.toUpperCase()}</div>
                                <div className="flex-1 w-full">
                                    <label htmlFor="image-upload" className={`w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer ${canSend ? 'hover:border-primary-500' : ''}`}>
                                        <UploadIcon className="w-5 h-5" />
                                        <span>{t.language === 'ar' ? 'رفع صورة' : 'Upload Image'}</span>
                                    </label>
                                    <input id="image-upload" type="file" accept="image/*" onChange={handleImageFileChange} className="sr-only" disabled={!canSend} />
                                </div>
                            </div>
                            {(imagePreview || imageUrl) && (
                                <div className="mt-4">
                                    <img src={imagePreview || imageUrl} alt="Preview" className="max-h-40 rounded-lg mx-auto shadow-md" />
                                </div>
                            )}
                        </div>


                        <div>
                            <label htmlFor="targetRole" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                {t.targetAudience}
                            </label>
                            <select
                                id="targetRole"
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
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