import React, { useState, useMemo, useEffect } from 'react';
import type { Order } from '../../types';
import { ChevronLeftIcon } from '../icons/Icons';
import { FeedbackModal } from './FeedbackModal';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useAdmin } from '../../contexts/AdminContext';
import { ProfileHeader } from './ProfileHeader';
import { OrderHistory } from './OrderHistory';


export const ProfilePage: React.FC = () => {
    const { language, t } = useUI();
    const { currentUser, isAdmin } = useAuth();
    const { restaurantInfo } = useData();
    const { orders, updateOrder } = useAdmin();
    
    const [feedbackOrder, setFeedbackOrder] = useState<Order | null>(null);

    useEffect(() => {
        if (!currentUser) {
            window.location.hash = '#/login';
        }
    }, [currentUser]);

    const userOrders = useMemo(() => {
        if (!currentUser) return [];
        return orders.filter(o => o.customer.userId === currentUser.id);
    }, [orders, currentUser]);

    const { activeOrders, pastOrders } = useMemo(() => {
        const active: Order[] = [];
        const past: Order[] = [];
        const terminalStatuses = ['completed', 'cancelled', 'refused'];
        const sortedOrders = [...userOrders].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        for (const order of sortedOrders) {
            if (terminalStatuses.includes(order.status)) {
                past.push(order);
            } else {
                active.push(order);
            }
        }
        return { activeOrders: active, pastOrders: past };
    }, [userOrders]);

    const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        e.preventDefault();
        window.location.hash = path;
    };

     const handleSaveFeedback = (feedback: { rating: number; comment: string }) => {
        if (feedbackOrder) {
            updateOrder(feedbackOrder.id, { customerFeedback: feedback });
            setFeedbackOrder(null);
        }
    };
    
    if (!currentUser || !restaurantInfo) {
        return null; // or a loading state, though the redirect should handle it
    }

    const backLinkPath = isAdmin ? '/admin' : '/';
    const backLinkText = isAdmin ? t.backToAdminPanel : t.backToMenu;


    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <a href={`#${backLinkPath}`} onClick={(e) => handleNav(e, backLinkPath)} className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold hover:underline mb-6">
                    <ChevronLeftIcon className={`w-5 h-5 ${language === 'ar' && 'transform -scale-x-100'}`} />
                    {backLinkText}
                </a>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-slate-100 mb-8">{t.myProfile}</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    
                    <div className="lg:col-span-1 space-y-8 sticky top-24">
                        <ProfileHeader />
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                       <OrderHistory 
                          activeOrders={activeOrders}
                          pastOrders={pastOrders}
                          onLeaveFeedback={setFeedbackOrder}
                       />
                    </div>
                </div>
            </div>
             {feedbackOrder && <FeedbackModal order={feedbackOrder} onClose={() => setFeedbackOrder(null)} onSave={handleSaveFeedback} />}
        </div>
    );
};