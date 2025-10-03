import React from 'react';
import type { Language, Order, User, OrderStatus } from '../../types';
import { useTranslations } from '../../i18n/translations';

interface ProfilePageProps {
    language: Language;
    currentUser: User;
    orders: Order[];
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ language, currentUser, orders }) => {
    const t = useTranslations(language);

    const userOrders = orders.filter(order => order.customer.userId === currentUser.id);

    const getStatusChipColor = (status: OrderStatus) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 text-primary-600 dark:text-primary-400">{t.profile}</h1>
            <h2 className="text-2xl font-semibold mb-4">{t.yourOrders}</h2>
            
            <div className="space-y-6">
                {userOrders.length > 0 ? (
                    userOrders.map(order => (
                        <div key={order.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
                                <div>
                                    <p className="font-bold text-lg">{t.orderId}: <span className="font-mono text-gray-700 dark:text-gray-300">{order.id}</span></p>
                                    <p className="text-sm text-gray-500">{new Date(order.timestamp).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
                                </div>
                                <div className="mt-4 sm:mt-0">
                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusChipColor(order.status)}`}>
                                        {t[order.status.toLowerCase().replace(' ', '') as keyof typeof t] || order.status}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                {order.items.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center text-sm py-1">
                                        <span className="text-gray-800 dark:text-gray-200">{item.quantity} x {item.product.name[language]}</span>
                                        <span className="text-gray-600 dark:text-gray-400">{(item.product.price * item.quantity).toFixed(2)} {t.currency}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4 text-right">
                                <p className="font-bold text-lg">{t.total}: <span className="text-primary-600 dark:text-primary-400">{order.total.toFixed(2)} {t.currency}</span></p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500">{language === 'ar' ? 'لا يوجد لديك طلبات بعد.' : 'You have no orders yet.'}</p>
                )}
            </div>
        </div>
    );
};
