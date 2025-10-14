import React, { useState, useRef, useMemo, useEffect } from 'react';
import type { Order } from '../../types';
import { PencilIcon, CameraIcon, ChevronLeftIcon, KeyIcon, LogoutIcon, ChevronRightIcon, CheckCircleIcon } from '../icons/Icons';
import { FeedbackModal } from './FeedbackModal';
import { formatDateTime, formatNumber } from '../../utils/helpers';
import { StarRating } from '../StarRating';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useAdmin } from '../../contexts/AdminContext';


export const ProfilePage: React.FC = () => {
    const { language, t, setIsChangePasswordModalOpen } = useUI();
    const { currentUser, logout, isAdmin, updateUserProfile } = useAuth();
    const { restaurantInfo } = useData();
    const { orders, updateOrder } = useAdmin();
    
    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState(currentUser?.name || '');
    const profilePicInputRef = useRef<HTMLInputElement>(null);
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
    
    const handleSaveName = () => {
        if (currentUser && name.trim() && name.trim() !== currentUser.name) {
            updateUserProfile(currentUser.id, { name: name.trim() });
        }
        setIsEditingName(false);
    };

    const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && currentUser) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateUserProfile(currentUser.id, { profilePicture: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
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

    const getStatusChipColor = (statusId: string) => {
        const color = restaurantInfo.orderStatusColumns.find(s => s.id === statusId)?.color || 'slate';
        return `bg-${color}-100 text-${color}-800 dark:bg-${color}-900/50 dark:text-${color}-300`;
    };

    const OrderStatusTracker: React.FC<{ order: Order }> = ({ order }) => {
        const statuses = restaurantInfo.orderStatusColumns.filter(s => !['cancelled', 'refused'].includes(s.id));
        const currentStatusIndex = statuses.findIndex(s => s.id === order.status);

        if (currentStatusIndex === -1) return null;

        return (
            <div className="flex items-center justify-between">
                {statuses.map((status, index) => {
                    const isCompleted = index < currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;
                    const stateClasses = { completed: 'bg-green-500 border-green-500', current: 'bg-blue-500 border-blue-500 animate-pulse', future: 'bg-slate-300 dark:bg-slate-600 border-slate-300 dark:border-slate-600' };
                    let currentState = isCompleted ? 'completed' : isCurrent ? 'current' : 'future';

                    return (
                        <React.Fragment key={status.id}>
                            <div className="flex flex-col items-center text-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 ${stateClasses[currentState as keyof typeof stateClasses]}`}>
                                    {isCompleted && <CheckCircleIcon className="w-6 h-6 text-white" />}
                                </div>
                                <p className={`mt-2 text-xs font-semibold ${isCurrent ? 'text-blue-600 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}`}>{status.name[language]}</p>
                            </div>
                            {index < statuses.length - 1 && <div className={`flex-1 h-1 mx-2 rounded ${isCompleted ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    };

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
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 text-center animate-fade-in-up">
                             <div className="relative w-32 h-32 mx-auto mb-4">
                                <img src={currentUser.profilePicture} alt={t.profilePicture} className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-lg"/>
                                <input type="file" ref={profilePicInputRef} onChange={handlePictureChange} accept="image/*" className="sr-only"/>
                                <button onClick={() => profilePicInputRef.current?.click()} className="absolute bottom-0 end-0 bg-primary-500 text-white rounded-full p-2 hover:bg-primary-600 transition-transform transform hover:scale-110 shadow-md" aria-label={t.changeProfilePicture} title={t.changeProfilePicture}><CameraIcon className="w-5 h-5"/></button>
                            </div>
                            {!isEditingName ? (
                                <div className="flex items-center justify-center gap-2"><h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{currentUser.name}</h2><button onClick={() => setIsEditingName(true)} className="text-slate-500 hover:text-primary-600 p-1"><PencilIcon className="w-5 h-5" /></button></div>
                            ) : (
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)} onBlur={handleSaveName} onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} className="text-2xl font-bold text-center bg-transparent border-b-2 border-primary-500 focus:outline-none w-full" autoFocus/>
                            )}
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{currentUser.mobile}</p>
                            <span className="mt-2 inline-block bg-primary-100 text-primary-800 text-xs font-semibold px-3 py-1 rounded-full dark:bg-primary-900/50 dark:text-primary-300">{t[currentUser.role as keyof typeof t]}</span>
                        </div>
                         <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                             <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 text-start mb-4">{t.security}</h2>
                            <div className="space-y-4">
                                <button onClick={() => setIsChangePasswordModalOpen(true)} className="w-full flex justify-between items-center text-start p-4 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 transition-colors">
                                    <div className="flex items-center gap-4"><KeyIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" /><span className="font-semibold text-slate-800 dark:text-slate-300">{t.changePassword}</span></div>
                                    <ChevronRightIcon className={`w-5 h-5 text-slate-500 dark:text-slate-400 ${language === 'ar' && 'transform -scale-x-100'}`} />
                                </button>
                                <button onClick={logout} className="w-full flex items-center gap-4 text-start p-4 rounded-lg text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors">
                                    <LogoutIcon className="w-6 h-6" /><span className="font-semibold">{t.logout}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                        {activeOrders.length > 0 && (
                             <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">{t.activeOrders}</h2>
                                <div className="space-y-6">{activeOrders.map(order => <div key={order.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6"><div className="flex justify-between items-start mb-4"><div><p className="font-bold text-slate-800 dark:text-slate-100">{t.orderId}: <span className="font-mono text-primary-600">{order.id}</span></p><p className="text-xs text-slate-500">{formatDateTime(order.timestamp)}</p></div><div className="text-end"><p className="text-2xl font-extrabold text-primary-600 dark:text-primary-400">{order.total.toFixed(2)}</p><p className="text-xs text-slate-500 -mt-1">{t.currency}</p></div></div><OrderStatusTracker order={order} /></div>)}</div>
                            </div>
                        )}
                         <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                             <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">{t.yourOrders}</h2>
                            <div className="space-y-4">
                                {pastOrders.length > 0 ? pastOrders.map(order => (
                                    <div key={order.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                            <div className="flex-1 space-y-1"><p className="font-semibold text-slate-800 dark:text-slate-100">{t.orderId}: <span className="font-mono text-slate-500">{order.id}</span></p><p className="text-sm text-slate-500">{formatDateTime(order.timestamp)}</p><p className="text-sm text-slate-500">{order.items.length} items - <span className="font-bold">{order.total.toFixed(2)} {t.currency}</span></p>{order.orderType === 'Delivery' && order.customer.address && (<p className="text-xs text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700 mt-2">{t.address}: {order.customer.address}</p>)}</div>
                                            <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
                                                 <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusChipColor(order.status)}`}>{restaurantInfo.orderStatusColumns.find(s => s.id === order.status)?.name[language] || order.status}</span>
                                                {order.status === 'completed' && (order.customerFeedback ? (<div className="flex items-center gap-1"><StarRating rating={order.customerFeedback.rating} size="sm" /><span className="text-xs text-slate-500">({t.customerFeedback})</span></div>) : (<button onClick={() => setFeedbackOrder(order)} className="text-sm font-semibold text-primary-600 hover:underline">{t.leaveFeedback}</button>))}
                                            </div>
                                        </div>
                                    </div>
                                )) : <p className="text-slate-500 text-center py-8">You have no past orders.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
             {feedbackOrder && <FeedbackModal order={feedbackOrder} onClose={() => setFeedbackOrder(null)} onSave={handleSaveFeedback} />}
        </div>
    );
};