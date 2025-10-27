import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useCart } from '../../contexts/CartContext';
import { useAdmin } from '../../contexts/AdminContext';

import type { Order, OrderType, PaymentMethod, OnlinePaymentMethod } from '../../types';

import { Header } from '../Header';
import { Footer } from '../Footer';
import { CheckoutStepper } from './CheckoutStepper';
import { OrderSummary } from './OrderSummary';
import { calculateTotal } from '../../utils/helpers';
import { ChevronRightIcon, UploadIcon, CopyIcon, CheckIcon, CheckCircleIcon, UserIcon } from '../icons/Icons';
import { GovernorateSelector } from './GovernorateSelector';

type CheckoutStep = 'delivery' | 'payment' | 'confirm';

const CopiedButton: React.FC<{ textToCopy: string, children: React.ReactNode }> = ({ textToCopy, children }) => {
    const [copied, setCopied] = useState(false);
    const { t } = useUI();
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent parent onClick
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button 
            type="button" 
            onClick={handleClick}
            className={`flex items-center gap-2 text-sm font-semibold py-1.5 px-3 rounded-lg transition-all duration-300 shadow-sm ${
                copied 
                ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' 
                : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transform hover:-translate-y-0.5'
            }`}
        >
            {copied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
            <span>{copied ? t.copied : children}</span>
        </button>
    );
};

const OrderSuccessScreen: React.FC = () => {
    const { t, language } = useUI();
    const { currentUser } = useAuth();
    const { restaurantInfo } = useData();

    const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        e.preventDefault();
        window.location.hash = path;
    };

    return (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-lg mx-auto animate-fade-in-up">
            <CheckCircleIcon className="w-20 h-20 text-green-500 mb-4" />
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">{t.orderReceived}</h1>
            <p className="text-slate-600 dark:text-slate-300 mb-4">{t.willContactSoon}</p>
            {restaurantInfo?.whatsappNumber && (
                 <p className="text-slate-600 dark:text-slate-300 mb-8">
                    {t.forInquiries}
                    <a 
                        href={`https://wa.me/${restaurantInfo.whatsappNumber}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="font-bold text-primary-600 dark:text-primary-400 underline decoration-dotted ltr:ml-1 rtl:mr-1"
                        dir="ltr"
                    >
                        {restaurantInfo.whatsappNumber}
                    </a>
                </p>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                <a 
                    href="#/"
                    onClick={(e) => handleNav(e, '/')}
                    className="w-full sm:w-auto bg-primary-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors shadow-md"
                >
                    {t.backToMenu.replace('←', '').trim()}
                </a>
                {currentUser && (
                     <a 
                        href="#/profile"
                        onClick={(e) => handleNav(e, '/profile')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold py-3 px-6 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                       <UserIcon className="w-5 h-5"/> {t.myOrders}
                    </a>
                )}
            </div>
        </div>
    );
};


export const CheckoutPage: React.FC = () => {
    const { language, t, isProcessing, setIsProcessing } = useUI();
    const { currentUser } = useAuth();
    const { restaurantInfo } = useData();
    const { cartItems, clearCart } = useCart();
    const { placeOrder } = useAdmin();

    const [step, setStep] = useState<CheckoutStep>('delivery');
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [governorate, setGovernorate] = useState('');
    const [addressDetails, setAddressDetails] = useState('');
    const orderType: OrderType = 'Delivery';
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
    const [selectedOnlineMethod, setSelectedOnlineMethod] = useState<OnlinePaymentMethod | null>(null);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [orderSuccess, setOrderSuccess] = useState(false);


    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name);
            setMobile(currentUser.mobile);
        }
    }, [currentUser]);

    useEffect(() => {
        if (cartItems.length === 0 && !isProcessing && !orderSuccess) {
            window.location.hash = '#/';
        }
    }, [cartItems, isProcessing, orderSuccess]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step, orderSuccess]);

    const subtotal = useMemo(() => calculateTotal(cartItems), [cartItems]);

    const canProceedToPayment = useMemo(() => {
        return name.trim() !== '' && mobile.trim() !== '' && governorate.trim() !== '' && addressDetails.trim() !== '';
    }, [name, mobile, governorate, addressDetails]);

    const canProceedToConfirm = useMemo(() => {
        if (paymentMethod === 'cod') return true;
        if (paymentMethod === 'online') return selectedOnlineMethod && receiptFile;
        return false;
    }, [paymentMethod, selectedOnlineMethod, receiptFile]);

    const handleNextStep = () => {
        if (step === 'delivery' && canProceedToPayment) setStep('payment');
        if (step === 'payment' && canProceedToConfirm) setStep('confirm');
    };

    const handlePreviousStep = () => {
        if (step === 'confirm') setStep('payment');
        if (step === 'payment') setStep('delivery');
    };

    const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setReceiptFile(file);
            const reader = new FileReader();
            reader.onloadend = () => { setReceiptPreview(reader.result as string); };
            reader.readAsDataURL(file);
        }
    };

    const handleConfirmPurchase = async () => {
        if (!restaurantInfo) return;
        setIsProcessing(true);
        try {
            let receiptDataUrl: string | undefined = undefined;
            if (receiptFile) {
                receiptDataUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(receiptFile);
                });
            }

            const fullAddress = `${addressDetails}, ${governorate}`;

            const orderData: Omit<Order, 'id' | 'timestamp'> = {
                items: cartItems,
                total: subtotal,
                status: restaurantInfo.orderStatusColumns[0]?.id || 'pending',
                orderType: 'Delivery',
                customer: {
                    userId: currentUser?.id,
                    name: name,
                    mobile: mobile,
                    address: fullAddress,
                },
                createdBy: currentUser?.id,
                paymentMethod: paymentMethod,
                paymentDetail: paymentMethod === 'online' ? selectedOnlineMethod?.name[language] : t.cashOnDelivery,
                paymentReceiptUrl: receiptDataUrl,
            };

            await placeOrder(orderData);
            clearCart();
            setOrderSuccess(true);
            
        } catch (error) {
            console.error('Failed to place order:', error);
        } finally {
            setIsProcessing(false);
        }
    };
    
    if (!restaurantInfo) return null;

    if (orderSuccess) {
        return (
            <>
                <Header onCartClick={() => window.location.hash = '#/'} />
                <main className="container mx-auto max-w-7xl px-4 py-16 lg:py-24">
                    <OrderSuccessScreen />
                </main>
                <Footer />
            </>
        )
    }

    return (
        <>
            <Header onCartClick={() => {}} />
            <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
                <main className="container mx-auto max-w-7xl px-4 py-8 lg:py-16">
                    <div className="max-w-xl mx-auto mb-8 lg:mb-12">
                        <CheckoutStepper currentStep={step} language={language} />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
                        <div className="lg:col-span-2 space-y-8">
                            {step === 'delivery' && (
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border dark:border-slate-700">
                                    <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">{t.deliveryInformation}</h2>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.fullName}</label>
                                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.mobileNumber}</label>
                                                <input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.governorate}</label>
                                            <GovernorateSelector
                                                selectedGovernorate={governorate}
                                                onSelectGovernorate={setGovernorate}
                                                language={language}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.addressDetailsLabel}</label>
                                            <textarea value={addressDetails} onChange={e => setAddressDetails(e.target.value)} rows={3} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                                        </div>
                                    </div>
                                    <div className="mt-6 text-end">
                                        <button onClick={handleNextStep} disabled={!canProceedToPayment} className="bg-primary-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-700 disabled:bg-slate-400">
                                            {t.nextStep} <ChevronRightIcon className={`inline-block w-5 h-5 ${language === 'ar' ? 'transform -scale-x-100' : ''}`} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 'payment' && (
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border dark:border-slate-700">
                                    <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">{t.choosePaymentMethod}</h2>
                                    <div className="space-y-4">
                                        <div onClick={() => setPaymentMethod('cod')} className={`p-4 border-2 rounded-lg cursor-pointer ${paymentMethod === 'cod' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-600'}`}>
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100">{t.cashOnDelivery}</h3>
                                            {restaurantInfo.codNotes && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{restaurantInfo.codNotes[language]}</p>}
                                        </div>
                                        <div onClick={() => { setPaymentMethod('online'); setSelectedOnlineMethod(null); }} className={`p-4 border-2 rounded-lg cursor-pointer ${paymentMethod === 'online' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-600'}`}>
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100">{t.onlinePayment}</h3>
                                            {restaurantInfo.onlinePaymentNotes && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{restaurantInfo.onlinePaymentNotes[language]}</p>}
                                        </div>
                                    </div>
                                    {paymentMethod === 'online' && (
                                        <div className="mt-6 border-t pt-6 space-y-4 dark:border-slate-700">
                                            <h3 className="font-semibold text-slate-800 dark:text-slate-100">{t.choosePaymentMethod}</h3>
                                            {restaurantInfo.onlinePaymentMethods?.filter(m => m.isVisible).map(method => (
                                                <label 
                                                    key={method.id} 
                                                    className={`p-4 border-2 rounded-lg cursor-pointer flex flex-col gap-3 transition-colors duration-200 ${
                                                        selectedOnlineMethod?.id === method.id
                                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                        : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 dark:hover:border-primary-500/50'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-4">
                                                            <img src={method.icon} alt={method.name[language]} className="w-10 h-10 object-contain"/>
                                                            <span className="font-semibold text-slate-800 dark:text-slate-100">{method.name[language]}</span>
                                                        </div>
                                                        <input 
                                                            type="radio" 
                                                            name="online-payment-method"
                                                            checked={selectedOnlineMethod?.id === method.id}
                                                            onChange={() => setSelectedOnlineMethod(method)}
                                                            className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:checked:bg-primary-500"
                                                        />
                                                    </div>
                                                    {selectedOnlineMethod?.id === method.id && (
                                                        <div className="mt-2 pt-3 border-t dark:border-slate-600 space-y-3">
                                                            {method.instructions?.[language] && <p className="text-sm text-slate-600 dark:text-slate-300">{method.instructions[language]}</p>}
                                                            
                                                            <div className="flex items-center justify-between">
                                                                {method.type === 'number' ? (
                                                                    <>
                                                                        <span className="font-mono text-base bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg text-slate-800 dark:text-slate-100">{method.details}</span>
                                                                        <CopiedButton textToCopy={method.details}>{t.copy}</CopiedButton>
                                                                    </>
                                                                ) : (
                                                                    <a 
                                                                        href={method.details} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer" 
                                                                        className="w-full text-center bg-green-500 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                                                    >
                                                                        {t.payNow}
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </label>
                                            ))}
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.uploadReceipt}</label>
                                                <div className="mt-2 flex items-center gap-4 p-4 border-2 border-dashed rounded-lg dark:border-slate-600">
                                                    {receiptPreview && <img src={receiptPreview} alt={t.receiptPreview} className="w-20 h-20 object-cover rounded-lg" />}
                                                    <div className="flex-grow">
                                                        <input id="receipt-upload" type="file" accept="image/*" onChange={handleReceiptUpload} className="sr-only"/>
                                                        <label htmlFor="receipt-upload" className="cursor-pointer bg-white dark:bg-slate-700 text-sm text-primary-600 dark:text-primary-400 font-semibold py-2 px-4 border border-primary-300 dark:border-primary-600 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/50">
                                                            <UploadIcon className="w-5 h-5 inline-block me-2" /> {receiptFile ? t.changeReceipt : t.uploadReceipt}
                                                        </label>
                                                        {receiptFile && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{receiptFile.name}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="mt-6 flex justify-between">
                                        <button onClick={handlePreviousStep} className="font-bold py-2 px-6 rounded-lg text-slate-700 dark:text-slate-200">{t.previousStep}</button>
                                        <button onClick={handleNextStep} disabled={!canProceedToConfirm} className="bg-primary-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-700 disabled:bg-slate-400">
                                            {t.nextStep} <ChevronRightIcon className={`inline-block w-5 h-5 ${language === 'ar' ? 'transform -scale-x-100' : ''}`} />
                                        </button>
                                    </div>
                                </div>
                            )}

                             {step === 'confirm' && (
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border dark:border-slate-700">
                                    <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">{t.stepConfirm}</h2>
                                    <div className="space-y-6 divide-y divide-slate-200 dark:divide-slate-700">
                                        <div className="pt-4 first:pt-0">
                                            <div className="flex justify-between items-baseline">
                                                <h3 className="font-semibold text-slate-500 dark:text-slate-400">{t.shipTo}</h3>
                                                <button onClick={() => setStep('delivery')} className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">{t.edit}</button>
                                            </div>
                                            <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                                                <p className="font-bold text-slate-800 dark:text-slate-100">{name}</p>
                                                <p>{mobile}</p>
                                                {orderType === 'Delivery' && <p>{addressDetails}, {governorate}</p>}
                                            </div>
                                        </div>
                                        <div className="pt-4">
                                            <div className="flex justify-between items-baseline">
                                                <h3 className="font-semibold text-slate-500 dark:text-slate-400">{t.payWith}</h3>
                                                <button onClick={() => setStep('payment')} className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">{t.edit}</button>
                                            </div>
                                            <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                                                <p className="font-bold text-slate-800 dark:text-slate-100">{paymentMethod === 'cod' ? t.cashOnDelivery : t.onlinePayment}</p>
                                                {paymentMethod === 'online' && selectedOnlineMethod && <p>{selectedOnlineMethod.name[language]}</p>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-8 flex justify-between">
                                        <button onClick={handlePreviousStep} className="font-bold py-3 px-6 rounded-lg text-slate-700 dark:text-slate-200">{t.previousStep}</button>
                                        <button onClick={handleConfirmPurchase} disabled={isProcessing} className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 disabled:bg-slate-400">
                                            {isProcessing ? '...' : t.confirmPurchase}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="lg:col-span-1">
                            <OrderSummary />
                        </div>
                    </div>
                </main>
            </div>
            <Footer />
        </>
    );
};