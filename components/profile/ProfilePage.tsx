import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Order } from '../../types';
import { PencilIcon, CameraIcon, KeyIcon, LogoutIcon, CheckIcon, CloseIcon, DevicePhoneMobileIcon, EnvelopeIcon } from '../icons/Icons';
import { FeedbackModal } from './FeedbackModal';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useOrders } from '../../contexts/OrderContext';
import { OrderHistory } from './OrderHistory';
import { Header } from '../Header'; // Import the main header
import { optimizeImage } from '../../utils/imageOptimizer';
import { ReceiptModal } from '../ReceiptModal';
import { generateReceiptImage } from '../../utils/helpers';

export const ProfilePage: React.FC = () => {
    const { language, t, setIsChangePasswordModalOpen, setIsProcessing, showToast } = useUI();
    const { currentUser, logout, updateUserProfile } = useAuth();
    const { restaurantInfo } = useData();
    const { orders, updateOrder } = useOrders();
    
    const [feedbackOrder, setFeedbackOrder] = useState<Order | null>(null);
    const [receiptImageUrl, setReceiptImageUrl] = useState<string>('');
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    
    // State for inline editing
    const [isEditingName, setIsEditingName] = useState(false);
    const [name, setName] = useState(currentUser?.name || '');
    const [isEditingMobile, setIsEditingMobile] = useState(false);
    const [mobile, setMobile] = useState(currentUser?.mobile || '');
    const profilePicInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!currentUser) {
            window.location.hash = '#/login';
        } else {
            setName(currentUser.name);
            setMobile(currentUser.mobile);
        }
    }, [currentUser]);

    const handleSaveName = () => {
        if (currentUser && name.trim() && name.trim() !== currentUser.name) {
            updateUserProfile(currentUser.id, { name: name.trim() });
        }
        setIsEditingName(false);
    };
    
    const handleSaveMobile = () => {
        if (currentUser && mobile.trim() && mobile.trim() !== currentUser.mobile) {
            updateUserProfile(currentUser.id, { mobile: mobile.trim() });
        }
        setIsEditingMobile(false);
    };

    const handlePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && currentUser) {
            setIsProcessing(true);
            try {
                const optimizedFile = await optimizeImage(file, 256, 256, 0.9);
                const reader = new FileReader();
                reader.onloadend = () => {
                    updateUserProfile(currentUser.id, { profilePicture: reader.result as string });
                };
                reader.readAsDataURL(optimizedFile);
            } catch (error) {
                console.error("Profile picture optimization failed:", error);
                showToast("Failed to process image. Please try another one.");
                setIsProcessing(false);
            }
        }
    };

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

    const handleSaveFeedback = (feedback: { rating: number; comment: string }) => {
        if (feedbackOrder) {
            updateOrder(feedbackOrder.id, { customerFeedback: feedback });
            setFeedbackOrder(null);
        }
    };

    const handleShareInvoice = async (order: Order) => {
        if (!restaurantInfo) return;
        setIsProcessing(true);
        try {
            const imageUrl = await generateReceiptImage(order, restaurantInfo, t, language);
            setReceiptImageUrl(imageUrl);
            setIsReceiptModalOpen(true);
        } catch (error) {
            console.error("Error generating receipt for sharing:", error);
            showToast("Failed to generate receipt image.");
        } finally {
            setIsProcessing(false);
        }
    };
    
    if (!currentUser || !restaurantInfo) {
        return null;
    }

    const renderEditableField = (
        label: string, 
        Icon: React.FC<any>, 
        value: string, 
        isEditing: boolean, 
        setValue: (val: string) => void, 
        handleSave: () => void, 
        handleCancel: () => void,
        inputType: 'text' | 'tel' = 'text'
    ) => (
        <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
                <Icon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                <div className="text-sm">
                    <p className="font-medium text-slate-500 dark:text-slate-400">{label}</p>
                    {!isEditing ? (
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{value}</p>
                    ) : (
                        <input 
                            type={inputType}
                            value={value} 
                            onChange={(e) => setValue(e.target.value)} 
                            className="text-sm font-semibold bg-transparent border-b-2 border-primary-500 focus:outline-none dark:text-slate-100" 
                            autoFocus 
                        />
                    )}
                </div>
            </div>
            {!isEditing ? (
                <button onClick={() => { if(label === t.name) setIsEditingName(true); else setIsEditingMobile(true); }} className="p-2 text-slate-400 hover:text-primary-600 rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/50 transition-colors">
                    <PencilIcon className="w-5 h-5" />
                </button>
            ) : (
                <div className="flex items-center gap-2">
                    <button onClick={handleSave} className="p-2 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-full"><CheckIcon className="w-5 h-5" /></button>
                    <button onClick={handleCancel} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><CloseIcon className="w-5 h-5" /></button>
                </div>
            )}
        </div>
    );
    
    return (
        <>
            <Header onCartClick={() => window.location.hash = '#/'} />
            <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 md:p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-slate-100 mb-8">{t.myProfile}</h1>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Left Column for Profile & Security */}
                        <div className="lg:col-span-1 space-y-8 animate-fade-in-up">
                            
                            {/* Profile Card */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                                <div className="p-6 text-center border-b border-slate-200 dark:border-slate-700">
                                    <div className="relative w-28 h-28 mx-auto mb-4">
                                        <img src={currentUser.profilePicture} alt={t.profilePicture} className="w-full h-full rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-lg"/>
                                        <input type="file" ref={profilePicInputRef} onChange={handlePictureChange} accept="image/*" className="sr-only"/>
                                        <button onClick={() => profilePicInputRef.current?.click()} className="absolute bottom-0 end-0 bg-primary-500 text-white rounded-full p-2 hover:bg-primary-600 transition-transform transform hover:scale-110 shadow-md" aria-label={t.changeProfilePicture} title={t.changeProfilePicture}><CameraIcon className="w-5 h-5"/></button>
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{currentUser.name}</h2>
                                    <span className="mt-2 inline-block bg-primary-100 text-primary-800 text-xs font-semibold px-3 py-1 rounded-full dark:bg-primary-900/50 dark:text-primary-300">{t[currentUser.role as keyof typeof t]}</span>
                                </div>
                                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {renderEditableField(t.name, PencilIcon, name, isEditingName, setName, handleSaveName, () => { setIsEditingName(false); setName(currentUser.name); })}
                                    {renderEditableField(t.mobileNumber, DevicePhoneMobileIcon, mobile, isEditingMobile, setMobile, handleSaveMobile, () => { setIsEditingMobile(false); setMobile(currentUser.mobile); }, 'tel')}
                                    <div className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-4">
                                            <EnvelopeIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                                            <div className="text-sm">
                                                <p className="font-medium text-slate-500 dark:text-slate-400">{t.email}</p>
                                                <p className="font-semibold text-slate-800 dark:text-slate-100">{currentUser.email}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">{language === 'ar' ? 'للقراءة فقط' : 'Read-only'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Security Card */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                                 <h2 className="p-4 text-lg font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700">{t.security}</h2>
                                 <div className="divide-y divide-slate-200 dark:divide-slate-700">
                                    <div className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-4">
                                            <KeyIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                                            <div className="text-sm">
                                                <p className="font-medium text-slate-500 dark:text-slate-400">{t.password}</p>
                                                <p className="font-semibold text-slate-800 dark:text-slate-100">••••••••</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setIsChangePasswordModalOpen(true)} className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">{t.change}</button>
                                    </div>
                                    <button onClick={logout} className="w-full flex items-center gap-4 text-start p-4 rounded-b-2xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors">
                                        <LogoutIcon className="w-6 h-6" />
                                        <span className="font-semibold">{t.logout}</span>
                                    </button>
                                 </div>
                            </div>
                        </div>

                        {/* Right Column for Order History */}
                        <div className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                                <h2 className="p-4 text-lg font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700">{t.yourOrders}</h2>
                                <div className="p-4 sm:p-6">
                                    <OrderHistory 
                                        activeOrders={activeOrders}
                                        pastOrders={pastOrders}
                                        onLeaveFeedback={setFeedbackOrder}
                                        onShareInvoice={handleShareInvoice}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {feedbackOrder && <FeedbackModal order={feedbackOrder} onClose={() => setFeedbackOrder(null)} onSave={handleSaveFeedback} />}
                {isReceiptModalOpen && receiptImageUrl && (
                    <ReceiptModal
                        isOpen={isReceiptModalOpen}
                        onClose={() => setIsReceiptModalOpen(false)}
                        receiptImageUrl={receiptImageUrl}
                        isFromCheckout={false}
                    />
                )}
            </div>
        </>
    );
};