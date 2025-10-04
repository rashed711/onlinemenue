import React, { useState } from 'react';
import type { Language, Order, User, OrderStatus, RestaurantInfo } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { UserIcon } from '../icons/Icons';
import { FeedbackModal } from './FeedbackModal';

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

    const userOrders = orders.filter(order => order.customer.userId === currentUser.id);

    const statusToTranslationKey = (status: OrderStatus): keyof typeof t => {
        const key = status.charAt(0).toLowerCase() + status.slice(1).replace(/ /g, '');
        return key as keyof typeof t;
    };

    const getStatusChipColor = (status: OrderStatus) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'Ready for Pickup': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300';
            case 'Out for Delivery': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
            case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'Refused':
            case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };
    
    const handleSaveFeedback = (feedback: { rating: number; comment: string; }) => {
        if (feedbackOrder) {
            updateOrder(feedbackOrder.id, { customerFeedback: feedback });
            setFeedbackOrder(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-gray-900">
             <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
                <div className="container mx-auto max-w-5xl px-4 py-3 flex justify-between items-center">
                    <a href="#/" onClick={(e) => handleNav(e, '/')} className="flex items-center gap-3 cursor-pointer">
                        <img src={restaurantInfo.logo} alt="logo" className="h-10 w-10 rounded-full object-cover" />
                        <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">{restaurantInfo.name[language]}</h1>
                    </a>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <UserIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                            <span className="font-semibold">{currentUser.name}</span>
                        </div>
                        <button
                            onClick={logout}
                            className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                        >
                            {t.logout}
                        </button>
                    </div>
                </div>
            </header>
            <main className="container mx-auto max-w-5xl px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">{t.yourOrders}</h1>

                {userOrders.length > 0 ? (
                    <div className="space-y-6">
                        {userOrders.map(order => (
                            <div key={order.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-shadow hover:shadow-xl">
                                <div className="p-4 bg-slate-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex flex-wrap justify-between items-center gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.orderId}</p>
                                        <p className="font-bold font-mono text-gray-800 dark:text-gray-100">{order.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.date}</p>
                                        <p className="font-semibold text-gray-800 dark:text-gray-100">{new Date(order.timestamp).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.total}</p>
                                        <p className="font-bold text-lg text-primary-600 dark:text-primary-400">{order.total.toFixed(2)} {t.currency}</p>
                                    </div>
                                    <div>
                                        <span className={`px-3 py-1 text-sm leading-5 font-semibold rounded-full ${getStatusChipColor(order.status)}`}>
                                            {t[statusToTranslationKey(order.status)] || order.status}
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
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.quantity}: {item.quantity}</p>
                                                </div>
                                                <p className="font-semibold text-gray-700 dark:text-gray-200">{(item.product.price * item.quantity).toFixed(2)} {t.currency}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {order.status === 'Completed' && !order.customerFeedback && (
                                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
                                        <button 
                                            onClick={() => setFeedbackOrder(order)}
                                            className="bg-primary-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors"
                                        >
                                            {t.leaveFeedback}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <p className="text-gray-500 dark:text-gray-400 text-lg">You have no orders yet.</p>
                        <a href="#/" onClick={(e) => handleNav(e, '/')} className="mt-4 inline-block bg-primary-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-600 transition-transform transform hover:scale-105">Start Shopping</a>
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