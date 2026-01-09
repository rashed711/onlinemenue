import React, { useState, useEffect, useCallback } from 'react';
import { BellIcon, BellSlashIcon } from './icons/Icons';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../utils/config';
import { getMessaging, getToken } from '../firebase';

// ====================================================================
// ACTION REQUIRED: Go to your Firebase Project Settings -> Cloud Messaging
// and generate a "Web push certificate" key pair. Paste the public key here.
// ====================================================================
const VAPID_PUBLIC_KEY = 'BNt0Bp3CeeM0T2jM1u0F7FNxbXmkMwxmgFpDXv-oJ_nXhn_CYENMzQPHq9RaxU3zScp3t_CdLw6lS9XmgDSE7D0';
// ====================================================================


export const NotificationBell: React.FC = () => {
    const { showToast, t } = useUI();
    const { currentUser } = useAuth();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const updateTokenOnServer = useCallback((token: string | null) => {
        if (token && currentUser) {
            return fetch(`${API_BASE_URL}subscribe_fcm.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, userId: currentUser.id }),
            });
        }
        // TODO: Handle unsubscription if needed by sending null token
        return Promise.resolve();
    }, [currentUser]);
    
    const subscribeToNotifications = useCallback(async () => {
        if (VAPID_PUBLIC_KEY.includes('...')) {
            alert("VAPID Public Key is not set in components/NotificationBell.tsx");
            return;
        }
        
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const messaging = await getMessaging();
                if (!messaging) {
                    showToast(t.subscribeFailed);
                    return;
                }
                const swRegistration = await navigator.serviceWorker.ready;
                const currentToken = await getToken(messaging, { 
                    vapidKey: VAPID_PUBLIC_KEY,
                    serviceWorkerRegistration: swRegistration
                });
                if (currentToken) {
                    console.log('FCM Token:', currentToken);
                    setIsSubscribed(true);
                    await updateTokenOnServer(currentToken);
                    showToast(t.subscribedSuccess);
                } else {
                    setIsSubscribed(false);
                    showToast(t.subscribeFailed);
                }
            } else {
                showToast(t.notificationPermissionDenied);
            }
        } catch (err) {
            console.error('An error occurred while retrieving token. ', err);
            showToast(t.subscribeFailed);
            setIsSubscribed(false);
        }
    }, [showToast, t, updateTokenOnServer]);


    const handleBellClick = () => {
        if (!currentUser) {
            showToast(t.language === 'ar' ? 'يجب تسجيل الدخول للاشتراك.' : 'You must be logged in to subscribe.');
            window.location.hash = '#/login';
            return;
        }

        if (isSubscribed) {
            // Unsubscribing (deleting the token) is more complex with FCM and usually handled server-side.
            // For simplicity, we'll just inform the user. A full implementation would involve deleting the token.
            showToast(t.language === 'ar' ? 'لإلغاء الاشتراك، قم بإلغاء إذن الإشعارات من إعدادات المتصفح.' : 'To unsubscribe, revoke notification permission in your browser settings.');
        } else {
            if (Notification.permission === 'denied') {
                showToast(t.notificationPermissionDenied);
                return;
            }
            subscribeToNotifications();
        }
    };

    useEffect(() => {
        const checkCurrentSubscription = async () => {
            setIsLoading(true);
            if (currentUser && 'serviceWorker' in navigator && 'PushManager' in window && Notification.permission === 'granted') {
                const messaging = await getMessaging();
                if (messaging) {
                    try {
                        const swRegistration = await navigator.serviceWorker.ready;
                        const currentToken = await getToken(messaging, { 
                            vapidKey: VAPID_PUBLIC_KEY,
                            serviceWorkerRegistration: swRegistration
                        });
                        setIsSubscribed(!!currentToken);
                    } catch (err) {
                        console.error('Could not get notification token silently.', err);
                        setIsSubscribed(false);
                    }
                } else {
                    setIsSubscribed(false);
                }
            } else {
                setIsSubscribed(false);
            }
            setIsLoading(false);
        };

        checkCurrentSubscription();
    }, [currentUser]); // Re-check when user logs in

    if (!('serviceWorker' in navigator && 'PushManager' in window)) {
        return null; // Don't show the bell if not supported
    }

    if (isLoading) {
        return (
             <div className="p-2 h-10 w-10 flex items-center justify-center rounded-full">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-400"></div>
            </div>
        )
    }
    
    const title = isSubscribed ? (t.language === 'ar' ? 'أنت مشترك في الإشعارات' : 'You are subscribed') : (t.language === 'ar' ? 'الاشتراك في الإشعارات' : 'Subscribe to notifications');

    return (
        <button 
            onClick={handleBellClick} 
            className="p-2 h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
            aria-label={title}
            title={title}
        >
            {isSubscribed ? <BellIcon className="w-6 h-6 text-primary-500" /> : <BellSlashIcon className="w-6 h-6 text-slate-400" />}
        </button>
    );
};