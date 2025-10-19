import React, { useState, useEffect, useCallback } from 'react';
import { BellIcon, BellSlashIcon } from './icons/Icons';
import { useUI } from '../contexts/UIContext';
import { API_BASE_URL } from '../utils/config';

// ====================================================================
// ACTION REQUIRED: Replace this with the Public Key you generated.
// ====================================================================
const VAPID_PUBLIC_KEY = 'BGvGJjrIF5hse5btEpDw6BWFBQZP67ZuCkPLXHXxKv9rz_lfBFSrLfo7rgYs2qhCQl7HHRYjD1BcQ2r-AsDTiB8';
// ====================================================================


function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const NotificationBell: React.FC = () => {
    const { showToast, t } = useUI();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const updateSubscriptionOnServer = (sub: PushSubscription | null) => {
        if (sub) {
            // Send subscription to backend
            return fetch(`${API_BASE_URL}subscribe_push.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sub),
            });
        } else {
            // TODO: Optionally send unsubscription event to backend
            return Promise.resolve();
        }
    };

    const subscribeUser = useCallback(() => {
        if (!('serviceWorker' in navigator)) return;
        
        if (VAPID_PUBLIC_KEY.includes('...')) {
            alert("VAPID Public Key is not set in components/NotificationBell.tsx");
            return;
        }

        navigator.serviceWorker.ready.then(registration => {
            const subscribeOptions = {
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            };

            registration.pushManager.subscribe(subscribeOptions)
                .then(pushSubscription => {
                    console.log('Received PushSubscription: ', JSON.stringify(pushSubscription));
                    setSubscription(pushSubscription);
                    setIsSubscribed(true);
                    updateSubscriptionOnServer(pushSubscription);
                    showToast(t.subscribedSuccess);
                })
                .catch(err => {
                    console.error('Failed to subscribe the user: ', err);
                    showToast(t.subscribeFailed);
                });
        });
    }, [showToast, t]);

    const unsubscribeUser = useCallback(() => {
        if (subscription) {
            subscription.unsubscribe().then(() => {
                updateSubscriptionOnServer(null);
                setSubscription(null);
                setIsSubscribed(false);
                showToast(t.unsubscribedSuccess);
            });
        }
    }, [subscription, showToast, t]);

    const handleBellClick = () => {
        if (isSubscribed) {
            unsubscribeUser();
        } else {
            if (Notification.permission === 'denied') {
                showToast(t.notificationPermissionDenied);
                return;
            }
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    subscribeUser();
                }
            });
        }
    };

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.ready.then(registration => {
                registration.pushManager.getSubscription().then(sub => {
                    if (sub) {
                        setSubscription(sub);
                        setIsSubscribed(true);
                    }
                    setIsLoading(false);
                });
            });
        } else {
            setIsLoading(false); // Not supported
        }
    }, []);

    if (isLoading || !('serviceWorker' in navigator && 'PushManager' in window)) {
        return null; // Don't show the bell if not supported or still loading
    }
    
    const title = isSubscribed ? t.language === 'ar' ? 'إلغاء الاشتراك' : 'Unsubscribe' : t.language === 'ar' ? 'الاشتراك في الإشعارات' : 'Subscribe to notifications';

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