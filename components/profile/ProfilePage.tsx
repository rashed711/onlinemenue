import React, { useState } from 'react';
import type { Language, Order, User, OrderStatus, RestaurantInfo } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { UserIcon } from '../icons/Icons';
import { FeedbackModal } from './FeedbackModal';
import { formatDateTime, formatNumber } from '../../utils/helpers';

interface ProfilePageProps {
    language: Language;
    currentUser: User;
    orders: Order[];
    logout: () => void;
    restaurantInfo: RestaurantInfo;
    updateOrder: (orderId: string, payload: { customerFeedback: { rating: number; comment: string; } }) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ language, currentUser, orders, logout, restaurantInfo, updateOrder }) => {
    const t = useTranslations(language);
    const [feedbackOrder, setFeedbackOrder] = useState<Order | null>(null);

    const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        e.preventDefault();
        window.location.hash = path;
    };

    const userOrders = orders.filter(order => order.customer.userId === currentUser.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const getStatusDetails = (statusId: OrderStatus) => {
        return restaurantInfo.orderStatusColumns.find(s => s.id === statusId);
    };

    const getStatusChipColor = (statusId: OrderStatus) => {
        const status = getStatusDetails(statusId);
        const color = status?.color || 'slate';
        return `bg-${color}-100 text-${color}-800 dark:bg-${color}-900/50 dark:text-${color}-300 border-${color}-200 dark:border-${color}-500/30`;
    };
    
    const handleSaveFeedback = (feedback: { rating: number; comment: string; }) => {
        if (feedbackOrder) {
            updateOrder(feedbackOrder.id, { customerFeedback: feedback });
            setFeedbackOrder(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
             <header className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                <div className="container mx-auto max-w-5xl px-4 py-3 h-20 flex justify-between items-center">
                    <a href="#/" onClick={(e) => handleNav(e, '/')} className="flex items-center gap-3 cursor-pointer group">
                        <img src={restaurantInfo.logo} alt="logo" className="h-12 w-12 rounded-full object-cover transition-transform group-hover:scale-110" />
                        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-primary-600 transition-colors">{restaurantInfo.name[language]}</h1>
                    </a>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-200">
                            <UserIcon className="w-6 h-6" />
                            <span className="font-semibold">{currentUser.name}</span>
                        </div>
                        <button
                            onClick={logout}
                            className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                            {t.logout}
                        </button>
                    </div>
                </div>
            </header>
            <main className="container mx-auto max-w-5xl px-4 py-8">
                <h1 className="text-3xl font-bold mb-8 text-slate-800 dark:text-slate-100">{t.yourOrders}</h1>

                {userOrders.length > 0 ? (
                    <div className="space-y-6">
                        {userOrders.map(order => {
                            const statusDetails = getStatusDetails(order.status);
                            return (
                            <div key={order.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden transition-shadow hover:shadow-xl animate-fade-in-up">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{t.orderId}</p>
                                        <p className="font-bold font-mono text-slate-800 dark:text-slate-100">{order.id}</p>
                                    </div>
                                    <div className='flex-grow'>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{t.date}</p>
                                        <p className="font-semibold text-slate-800 dark:text-slate-100">{formatDateTime(order.timestamp)}</p>
                                    </div>
                                    <div className="text-start sm:text-end">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{t.total}</p>
                                        <p className="font-bold text-lg text-primary-600 dark:text-primary-400">{order.total.toFixed(2)} {t.currency}</p>
                                    </div>
                                    <div className='w-full sm:w-auto'>
                                        <span className={`px-3 py-1 text-sm leading-5 font-semibold rounded-full border ${getStatusChipColor(order.status)}`}>
                                            {statusDetails?.name[language] || order.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <ul className="space-y-3">
                                        {order.items.map((item, index) => (
                                            <li key={`${item.product.id}-${index}`} className="flex items-center gap-4">
                                                <img src={item.product.image} alt={item.product.name[language]} className="w-12 h-12 rounded-md object-cover" />
                                                <div className="flex-grow">
                                                    <p className="font-semibold">{item.product.name[language]}</p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">{t.quantity}: {formatNumber(item.quantity)}</p>
                                                </div>
                                                <p className="font-semibold text-slate-700 dark:text-slate-200">{(item.product.price * item.quantity).toFixed(2)} {t.currency}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {order.status === 'completed' && (
                                     <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-center bg-slate-50 dark:bg-slate-800/50">
                                        {order.customerFeedback ? (
                                            <p className='text-sm text-green-600 dark:text-green-400 font-semibold'>Thank you for your feedback!</p>
                                        ) : (
                                            <button 
                                                onClick={() => setFeedbackOrder(order)}
                                                className="bg-primary-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-600 transition-all shadow-sm hover:shadow-md transform hover:scale-105"
                                            >
                                                {t.leaveFeedback}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )})}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                        <p className="text-slate-500 dark:text-slate-400 text-lg">You have no orders yet.</p>
                        <a href="#/" onClick={(e) => handleNav(e, '/')} className="mt-4 inline-block bg-primary-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-600 transition-transform transform hover:scale-105 shadow-lg">Start Shopping</a>
                    </div>
                )}
            </main>
            {feedbackOrder && (
                <FeedbackModal
                    order={feedbackOrder}
                    onClose={() => setFeedbackOrder(null)}
                    onSave={handleSaveFeedback}
                    language={language}
                />
            )}
        </div>
    );
};
