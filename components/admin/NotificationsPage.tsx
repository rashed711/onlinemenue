

import React, { useState, useCallback, DragEvent } from 'react';
import { useUI } from '../../contexts/UIContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE_URL } from '../../utils/config';
import { optimizeImage } from '../../utils/imageOptimizer';
import { PhotoIcon, TrashIcon } from '../icons/Icons';
import { resolveImageUrl } from '../../utils/helpers';

export const NotificationsPage: React.FC = () => {
    const { t, language, isProcessing, setIsProcessing, showToast } = useUI();
    const { roles } = useAdmin();
    const { hasPermission, currentUser } = useAuth();

    const [message, setMessage] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState('');
    const [targetRole, setTargetRole] = useState('all');
    const [withSound, setWithSound] = useState(true);
    const [isDragging, setIsDragging] = useState(false);

    const canSend = hasPermission('send_broadcast_notifications');
    const MAX_MESSAGE_LENGTH = 500;

    const handleFileSelect = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file.');
            return;
        }
        setIsProcessing(true);
        try {
            const optimizedFile = await optimizeImage(file, 512, 512, 0.9);
            setImageFile(optimizedFile);
            setImagePreview(URL.createObjectURL(optimizedFile));
        } catch (error) {
            console.error("Notification image optimization failed:", error);
            showToast("Image processing failed.");
        } finally {
            setIsProcessing(false);
        }
    }, [showToast, setIsProcessing]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleDragEvents = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSend || isProcessing || !message.trim()) return;

        // [FIX] Add guard clause to ensure user is logged in
        if (!currentUser) {
            showToast("You must be logged in to send notifications.");
            return;
        }

        setIsProcessing(true);
        try {
            let finalImageUrl = null;
            if (imageFile) {
                const formData = new FormData();
                formData.append('image', imageFile);
                formData.append('type', 'branding');
                const uploadRes = await fetch(`${API_BASE_URL}upload_image.php`, { method: 'POST', body: formData });
                
                const uploadResult = await uploadRes.json();
                if (!uploadRes.ok || !uploadResult.success) {
                    throw new Error(uploadResult.error || 'Image upload failed');
                }
                // Construct the full, absolute URL required by push notification services.
                finalImageUrl = resolveImageUrl(uploadResult.url.split('?v=')[0]);
            }

            const payload = {
                message,
                image_url: finalImageUrl,
                target_role: targetRole === 'all' ? null : targetRole,
                with_sound: withSound ? 1 : 0,
                created_by: currentUser.id,
            };
            
            const response = await fetch(`${API_BASE_URL}send_notification.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Notification Error Response Body:", errorText);
                let errorMessage = t.notificationSendFailed; // Default message
                
                if (response.status === 500) {
                     errorMessage = `Server Error (500). Please check server logs for details.`;
                     if (language === 'ar') {
                        errorMessage = `خطأ في الخادم (500). يرجى مراجعة سجلات الخادم للحصول على التفاصيل.`;
                     }
                } else {
                    try {
                        const errorJson = JSON.parse(errorText);
                        errorMessage = errorJson.error || `${t.notificationSendFailed} (Status: ${response.status})`;
                    } catch (e) {
                         if (errorText) {
                            errorMessage = errorText.substring(0, 150);
                         }
                    }
                }
                throw new Error(errorMessage);
            }
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to send notification.');
            }

            showToast(t.notificationSentSuccess.replace('{count}', result.sent_count || result.sent));
            setMessage('');
            setImageFile(null);
            setImagePreview('');
            setTargetRole('all');
            setWithSound(true);
        } catch (error) {
            console.error('Failed to send notification:', error);
            showToast((error as Error).message || t.notificationSendFailed);
        } finally {
            setIsProcessing(false);
        }
    };

    const formInputClasses = "w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 dark:bg-slate-700/50 dark:border-slate-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 text-slate-900 dark:text-slate-100";

    return (
        <div className="max-w-3xl mx-auto animate-fade-in-up">
            <h2 className="text-3xl font-bold mb-6 text-slate-800 dark:text-slate-100">{t.sendNotifications}</h2>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                <div className="p-6 space-y-6">
                    <div>
                        <label htmlFor="message" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            {t.notificationMessage}
                        </label>
                        <div className="relative">
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={6}
                                className={formInputClasses}
                                placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                                maxLength={MAX_MESSAGE_LENGTH}
                                required
                                disabled={!canSend}
                            />
                            <span className="absolute bottom-2 end-3 text-xs text-slate-400 dark:text-slate-500">{message.length} / {MAX_MESSAGE_LENGTH}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t.imageOptional}</label>
                        {!imagePreview ? (
                             <div 
                                onDragEnter={handleDragEvents} 
                                onDragLeave={handleDragEvents} 
                                onDragOver={handleDragEvents}
                                onDrop={handleDrop}
                                className={`relative block w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                                    isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-primary-400'
                                }`}
                            >
                                <input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="sr-only" disabled={!canSend} />
                                <label htmlFor="image-upload" className="cursor-pointer">
                                    <PhotoIcon className="mx-auto h-12 w-12 text-slate-400" />
                                    <span className="mt-2 block text-sm font-semibold text-slate-600 dark:text-slate-300">
                                        {language === 'ar' ? 'اسحب وأفلت أو انقر للرفع' : 'Drag & drop or click to upload'}
                                    </span>
                                    <span className="mt-1 block text-xs text-slate-500">{language === 'ar' ? 'PNG, JPG, WEBP حتى 1 ميجا' : 'PNG, JPG, WEBP up to 1MB'}</span>
                                </label>
                            </div>
                        ) : (
                            <div className="relative w-40 h-40">
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg shadow-md" />
                                <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-transform hover:scale-110">
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div>
                            <label htmlFor="targetRole" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t.targetAudience}</label>
                            <select
                                id="targetRole"
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                className={formInputClasses}
                                disabled={!canSend}
                            >
                                <option value="all">{t.allUsers}</option>
                                {roles.map(role => (
                                    <option key={role.key} value={role.key}>{role.name[language]}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end pb-1.5">
                             <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    id="withSound"
                                    type="checkbox"
                                    checked={withSound}
                                    onChange={(e) => setWithSound(e.target.checked)}
                                    className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500 dark:bg-slate-900 dark:border-slate-600"
                                    disabled={!canSend}
                                />
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t.withSound}</span>
                            </label>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 rounded-b-xl">
                    <button
                        type="submit"
                        disabled={!canSend || isProcessing || !message.trim()}
                        className="w-full bg-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>{language === 'ar' ? 'جار الإرسال...' : 'Sending...'}</span>
                            </>
                        ) : t.send}
                    </button>
                </div>
            </form>
             {!canSend && (
                <div className="p-4 mt-4 text-center text-sm bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-xl">
                    {t.permissionDenied}
                </div>
            )}
        </div>
    );
};