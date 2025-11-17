import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useCart } from '../../contexts/CartContext';
import { useOrders } from '../../contexts/OrderContext';

import type { Order, OrderType, PaymentMethod, OnlinePaymentMethod } from '../../types';

import { Header } from '../Header';
import { Footer } from '../Footer';
import { CheckoutStepper } from './CheckoutStepper';
import { OrderSummary } from './OrderSummary';
import { OrderSuccessScreen } from './OrderSuccessScreen';
import { calculateTotal } from '../../utils/helpers';
import { ChevronRightIcon, UploadIcon, CopyIcon, CheckIcon, CreditCardIcon } from '../icons/Icons';
import { GovernorateSelector } from './GovernorateSelector';
import { APP_CONFIG } from '../../utils/config';
// FIX: Import the 'CopiedButton' component.
import { CopiedButton } from '../CopiedButton';


type CheckoutStep = 'delivery' | 'payment' | 'confirm';

const PAYMOB_IFRAME_ID = '321143';

export const CheckoutPage: React.FC = () => {
    const { language, t, isProcessing, setIsProcessing, showToast } = useUI();
    const { currentUser, isAuthenticating } = useAuth();
    const { restaurantInfo } = useData();
    const { cartItems, clearCart } = useCart();
    const { placeOrder } = useOrders();

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
    const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);

    const [isPaymobLoading, setIsPaymobLoading] = useState(false);
    const [paymobToken, setPaymobToken] = useState<string | null>(null);

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name);
            setMobile(currentUser.mobile);
            if (currentUser.governorate) {
                setGovernorate(currentUser.governorate);
            }
            if (currentUser.address_details) {
                setAddressDetails(currentUser.address_details);
            }
        }
    }, [currentUser]);

    useEffect(() => {
        if (cartItems.length === 0 && !isProcessing && !completedOrderId && !paymobToken) {
            window.location.hash = '#/';
        }
    }, [cartItems, isProcessing, completedOrderId, paymobToken]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [step, completedOrderId]);

    // Event listener for Paymob iframe communication
    useEffect(() => {
        const handlePaymobMessage = (event: MessageEvent) => {
            // Security: Check the origin of the message
            if (event.origin !== 'https://accept.paymob.com') {
                return;
            }

            let data;
            try {
                if (typeof event.data === 'string') {
                    // Paymob often sends a query string-like message, e.g., "success=true&id=123..."
                    const params = new URLSearchParams(event.data);
                    data = Object.fromEntries(params.entries());
                } else if (typeof event.data === 'object' && event.data !== null && event.data.type === 'TRANSACTION') {
                     // Sometimes it sends a structured object
                    data = event.data.obj;
                } else {
                    return; // Ignore messages with unknown format
                }

                // The key property is `success` which is a string "true" or "false".
                if (data && typeof data.success === 'string') {
                    const isSuccess = data.success.toLowerCase() === 'true';
                    const orderId = data.order || ''; // Paymob's internal order ID

                    // Clear our app's cart if successful
                    if (isSuccess) {
                        clearCart();
                    }

                    // Redirect to a user-friendly status page
                    window.location.hash = `#/payment-status?success=${isSuccess}&order=${orderId}`;
                }
            } catch (e) {
                console.error("Error handling Paymob iframe message:", e);
                // Fallback to a generic failure page if message parsing fails
                window.location.hash = `#/payment-status?success=false`;
            }
        };

        window.addEventListener('message', handlePaymobMessage);

        return () => {
            window.removeEventListener('message', handlePaymobMessage);
        };
    }, [clearCart]); // Add clearCart to dependency array


    const subtotal = useMemo(() => calculateTotal(cartItems), [cartItems]);

    const canProceedToPayment = useMemo(() => {
        return name.trim() !== '' && mobile.trim() !== '' && governorate.trim() !== '' && addressDetails.trim() !== '';
    }, [name, mobile, governorate, addressDetails]);

    const canProceedToConfirm = useMemo(() => {
        if (paymentMethod === 'cod' || paymentMethod === 'paymob') return true;
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
                    email: currentUser?.email,
                    address: fullAddress,
                    governorate: governorate,
                },
                createdBy: currentUser?.id,
                paymentMethod: paymentMethod,
                paymentDetail: paymentMethod === 'online' ? selectedOnlineMethod?.name[language] : paymentMethod === 'paymob' ? 'Paymob' : t.cashOnDelivery,
                paymentReceiptUrl: receiptDataUrl,
            };

            const newOrder = await placeOrder(orderData);

            if (paymentMethod === 'paymob') {
                setIsPaymobLoading(true);
                const paymobResponse = await fetch(`${APP_CONFIG.API_BASE_URL}paymob_initiate.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        order_id: newOrder.id,
                        amount_egp: newOrder.total,
                        customer: {
                            name: newOrder.customer.name,
                            mobile: newOrder.customer.mobile,
                            email: newOrder.customer.email || 'test@test.com',
                            address: newOrder.customer.address,
                            governorate: newOrder.customer.governorate,
                        }
                    })
                });

                let paymobData;
                try {
                    paymobData = await paymobResponse.json();
                } catch (e) {
                    console.error("Failed to parse server response as JSON:", await paymobResponse.text());
                    throw new Error('Received an invalid response from the server.');
                }

                if (!paymobResponse.ok) {
                    const errorMessage = paymobData.details || paymobData.error || 'Failed to connect to payment provider.';
                    console.error('Paymob initiation failed:', paymobData);
                    throw new Error(errorMessage);
                }

                if (paymobData.token) {
                    setPaymobToken(paymobData.token);
                } else {
                    throw new Error(paymobData.error || 'Failed to get payment token.');
                }
                setIsPaymobLoading(false);

            } else {
                clearCart();
                setCompletedOrderId(newOrder.id);
            }
            
        } catch (error: any) {
            console.error('Failed to place order:', error);
            showToast(error.message || t.orderSubmitFailed);
            setIsProcessing(false);
            setIsPaymobLoading(false);
        } finally {
            if (paymentMethod !== 'paymob') {
                setIsProcessing(false);
            }
        }
    };
    
    if (!restaurantInfo) return null;

    if (isPaymobLoading) {
        return <div className="fixed inset-0 bg-white dark:bg-slate-900 z-50 flex flex-col items-center justify-center gap-4"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div><p className="font-semibold text-slate-600 dark:text-slate-300">{t.processingPayment}</p></div>;
    }

    if (paymobToken) {
        return (
            <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 z-50 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-lg h-[90vh] bg-white dark:bg-slate-800 rounded-xl shadow-2xl flex flex-col">
                    <div className="p-3 border-b dark:border-slate-700 text-center"><p className="text-sm font-semibold text-slate-500">{t.paymentIframeLoading}</p></div>
                    <iframe
                        src={`https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymobToken}`}
                        className="w-full h-full border-0"
                        title="Paymob Secure Payment"
                    ></iframe>
                </div>
            </div>
        );
    }
    
    if (completedOrderId) {
        return (
            <>
                <Header onCartClick={() => window.location.hash = '#/'} />
                <main className="container mx-auto max-w-7xl px-4 py-16 lg:py-24">
                    <OrderSuccessScreen orderId={completedOrderId} />
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
                                        <div onClick={() => { setPaymentMethod('cod'); setSelectedOnlineMethod(null); }} className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-600'}`}>
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100">{t.cashOnDelivery}</h3>
                                            {restaurantInfo.codNotes?.[language] && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{restaurantInfo.codNotes[language]}</p>}
                                        </div>

                                        {restaurantInfo.isPaymobVisible && (
                                            <div onClick={() => { setPaymentMethod('paymob'); setSelectedOnlineMethod(null); }} className={`p-4 border-2 rounded-lg cursor-pointer flex items-center gap-4 transition-colors ${paymentMethod === 'paymob' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-600'}`}>
                                                <CreditCardIcon className="w-8 h-8 text-slate-600 dark:text-slate-300 flex-shrink-0" />
                                                <div>
                                                    <h3 className="font-bold text-slate-800 dark:text-slate-100">{t.payWithCard}</h3>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.paymobNotice}</p>
                                                </div>
                                            </div>
                                        )}
                                        
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
                                                        onChange={() => {
                                                            setPaymentMethod('online');
                                                            setSelectedOnlineMethod(method);
                                                        }}
                                                        className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 dark:checked:bg-primary-500"
                                                    />
                                                </div>
                                            </label>
                                        ))}
                                    </div>

                                    {paymentMethod === 'online' && selectedOnlineMethod && (
                                        <div className="mt-6 border-t pt-6 space-y-4 dark:border-slate-700 animate-fade-in">
                                            <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-500/30">
                                                <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2 whitespace-pre-wrap">{selectedOnlineMethod.instructions?.[language]}</p>
                                                {selectedOnlineMethod.type === 'link' ? (
                                                    <a
                                                        href={selectedOnlineMethod.details}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                                                    >
                                                        {t.goToPaymentLink}
                                                        <ChevronRightIcon className={`w-4 h-4 ${language === 'ar' ? 'transform -scale-x-100' : ''}`} />
                                                    </a>
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        <p className="font-mono text-base font-bold text-blue-900 dark:text-blue-100">{selectedOnlineMethod.details}</p>
                                                        <CopiedButton textToCopy={selectedOnlineMethod.details} className="text-xs font-semibold py-1 px-2 rounded-md shadow-sm">
                                                            {t.copy}
                                                        </CopiedButton>
                                                    </div>
                                                )}
                                            </div>
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
                                                <p className="font-bold text-slate-800 dark:text-slate-100">
                                                    {paymentMethod === 'cod' ? t.cashOnDelivery : 
                                                     paymentMethod === 'paymob' ? t.payWithCard : 
                                                     t.onlinePayment}
                                                </p>
                                                {paymentMethod === 'online' && selectedOnlineMethod && <p>{selectedOnlineMethod.name[language]}</p>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-8 flex justify-between">
                                        <button onClick={handlePreviousStep} className="font-bold py-3 px-6 rounded-lg text-slate-700 dark:text-slate-200">{t.previousStep}</button>
                                        <button onClick={handleConfirmPurchase} disabled={isProcessing || isAuthenticating} className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 disabled:bg-slate-400">
                                            {isProcessing || isAuthenticating ? (language === 'ar' ? 'جار التأكيد...' : 'Confirming...') : t.confirmPurchase}
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