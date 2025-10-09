import React, { useState, useEffect, useMemo } from 'react';
import type { Language, CartItem, User, RestaurantInfo, CheckoutDetails, PaymentMethod, Order, OnlinePaymentMethod } from '../../types';
import { useTranslations } from '../../i18n/translations';
import { usePersistentState } from '../../hooks/usePersistentState';
import { calculateTotal } from '../../utils/helpers';
import { ChevronRightIcon, ChevronLeftIcon, UploadIcon, CopyIcon, CheckIcon } from '../icons/Icons';
import { OrderSummary } from './OrderSummary';
import { CheckoutStepper } from './CheckoutStepper';

interface CheckoutPageProps {
  language: Language;
  cartItems: CartItem[];
  clearCart: () => void;
  currentUser: User | null;
  restaurantInfo: RestaurantInfo;
  placeOrder: (order: Omit<Order, 'id' | 'timestamp'>) => Order;
  showToast: (message: string) => void;
}

type CheckoutStep = 'delivery' | 'payment' | 'confirm';

export const CheckoutPage: React.FC<CheckoutPageProps> = (props) => {
    const { language, cartItems, clearCart, currentUser, restaurantInfo, placeOrder, showToast } = props;
    const t = useTranslations(language);
  
    const [step, setStep] = useState<CheckoutStep>('delivery');
    const [deliveryDetails, setDeliveryDetails] = usePersistentState<CheckoutDetails>('checkout_details', {
        name: '',
        mobile: '',
        address: '',
    });
    const [paymentMethod, setPaymentMethod] = usePersistentState<PaymentMethod>('checkout_payment_method', 'cod');
    const [receiptImage, setReceiptImage] = usePersistentState<string | null>('checkout_receipt', null);
    const [copiedMethodId, setCopiedMethodId] = useState<number | null>(null);
    
    useEffect(() => {
        // Pre-fill user data if logged in, but only if the fields are empty
        if (currentUser) {
            setDeliveryDetails(prev => ({
                name: prev.name || currentUser.name,
                mobile: prev.mobile || currentUser.mobile,
                address: prev.address || ''
            }));
        }
    }, [currentUser, setDeliveryDetails]);

    useEffect(() => {
        // Redirect to home if cart is empty
        if (cartItems.length === 0) {
            window.location.hash = '#/';
        }
    }, [cartItems]);

    const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDeliveryDetails(prev => ({ ...prev, [name]: value }));
    };
    
    const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setReceiptImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleCopy = (text: string, id: number) => {
        navigator.clipboard.writeText(text);
        setCopiedMethodId(id);
        setTimeout(() => setCopiedMethodId(null), 2000);
    };

    const isDeliveryStepValid = useMemo(() => {
        return deliveryDetails.name.trim() !== '' && deliveryDetails.mobile.trim() !== '' && deliveryDetails.address.trim() !== '';
    }, [deliveryDetails]);
    
    const isPaymentStepValid = useMemo(() => {
        if (paymentMethod === 'cod') return true;
        if (paymentMethod === 'online' && receiptImage) return true;
        return false;
    }, [paymentMethod, receiptImage]);

    const handleNextStep = () => {
        if (step === 'delivery' && isDeliveryStepValid) setStep('payment');
        if (step === 'payment' && isPaymentStepValid) setStep('confirm');
    };

    const handlePrevStep = () => {
        if (step === 'confirm') setStep('payment');
        if (step === 'payment') setStep('delivery');
    };

    const handleConfirmOrder = () => {
        const orderData: Omit<Order, 'id' | 'timestamp'> = {
            items: cartItems,
            total: calculateTotal(cartItems),
            status: 'pending',
            orderType: 'Delivery',
            customer: {
                userId: currentUser?.id,
                name: deliveryDetails.name,
                mobile: deliveryDetails.mobile,
                address: deliveryDetails.address,
            },
            paymentMethod: paymentMethod,
            paymentReceiptUrl: receiptImage || undefined,
        };
        
        placeOrder(orderData);
        showToast(t.orderPlacedSuccess);
        
        // Clear persistent state after successful order
        clearCart();
        localStorage.removeItem('checkout_details');
        localStorage.removeItem('checkout_payment_method');
        localStorage.removeItem('checkout_receipt');

        window.location.hash = '#/profile';
    };

    if (cartItems.length === 0) return null; // Or a loading/redirecting state

    const BackButton = () => (
         <a href="#/" onClick={(e) => { e.preventDefault(); window.location.hash = '#/'; }} className="text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
            <ChevronLeftIcon className={`w-5 h-5 ${language === 'ar' ? 'transform scale-x-[-1]' : ''}`} />
            {t.backToMenu}
        </a>
    );

    const visiblePaymentMethods = restaurantInfo.onlinePaymentMethods?.filter(m => m.isVisible) || [];

    return (
        <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
            <header className="bg-white dark:bg-slate-900 shadow-sm border-b dark:border-slate-800">
                <div className="container mx-auto max-w-7xl px-4 h-20 flex items-center justify-between">
                    <a href="#/" className="flex items-center gap-3">
                        <img src={restaurantInfo.logo} alt="logo" className="h-12 w-12 rounded-full"/>
                        <h1 className="text-xl font-bold">{restaurantInfo.name[language]}</h1>
                    </a>
                    <div className="hidden md:block">
                        <BackButton />
                    </div>
                </div>
            </header>
            
            <main className="container mx-auto max-w-7xl px-4 py-8">
                <div className="md:hidden mb-6">
                    <BackButton />
                </div>
                <CheckoutStepper currentStep={step} language={language} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mt-8">
                    {/* Left/Main Column: Steps */}
                    <div className="lg:col-span-2 space-y-8">
                        {step === 'delivery' && (
                             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border dark:border-slate-700">
                                <h2 className="text-2xl font-bold mb-6">{t.deliveryInformation}</h2>
                                <div className="space-y-4">
                                     <input type="text" name="name" value={deliveryDetails.name} onChange={handleDetailsChange} placeholder={t.fullName} className="w-full p-3 border-2 rounded-lg dark:bg-slate-700 dark:border-slate-600" required/>
                                     <input type="tel" name="mobile" value={deliveryDetails.mobile} onChange={handleDetailsChange} placeholder={t.mobileNumber} className="w-full p-3 border-2 rounded-lg dark:bg-slate-700 dark:border-slate-600" required/>
                                     <textarea name="address" value={deliveryDetails.address} onChange={handleDetailsChange} placeholder={t.completeAddress} rows={3} className="w-full p-3 border-2 rounded-lg dark:bg-slate-700 dark:border-slate-600" required />
                                </div>
                            </div>
                        )}
                        {step === 'payment' && (
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border dark:border-slate-700">
                                <h2 className="text-2xl font-bold mb-6">{t.paymentMethod}</h2>
                                <div className="space-y-4">
                                    <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'dark:border-slate-600'}`}>
                                        <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="sr-only"/>
                                        <span className="font-bold text-lg">{t.cashOnDelivery}</span>
                                    </label>
                                     <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${paymentMethod === 'online' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'dark:border-slate-600'}`}>
                                        <input type="radio" name="paymentMethod" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} className="sr-only"/>
                                        <span className="font-bold text-lg">{t.onlinePayment}</span>
                                    </label>
                                    
                                    {paymentMethod === 'online' && (
                                        <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-lg space-y-6">
                                            <div>
                                                <h3 className="font-semibold mb-3">{t.paymentInstructions}</h3>
                                                <div className="space-y-3">
                                                    {visiblePaymentMethods.map(method => (
                                                        <div key={method.id} className="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm">
                                                            <img src={method.icon} alt={method.name[language]} className="w-10 h-10 object-contain flex-shrink-0" />
                                                            <div className="flex-grow">
                                                                <p className="font-semibold">{method.name[language]}</p>
                                                                {method.type === 'number' && <p className="text-sm font-mono text-slate-600 dark:text-slate-300">{method.details}</p>}
                                                            </div>
                                                            {method.type === 'number' ? (
                                                                <button type="button" onClick={() => handleCopy(method.details, method.id)} className="flex items-center gap-1.5 text-sm font-semibold bg-slate-200 dark:bg-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                                                                    {copiedMethodId === method.id ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                                                                    {copiedMethodId === method.id ? t.copied : t.copy}
                                                                </button>
                                                            ) : (
                                                                <a href={method.details} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold bg-primary-500 text-white px-3 py-1.5 rounded-md hover:bg-primary-600 transition-colors">
                                                                    {t.payNow}
                                                                </a>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            {receiptImage ? (
                                                <div className="flex items-center gap-4">
                                                    <img src={receiptImage} alt="Receipt Preview" className="w-20 h-20 rounded-lg object-cover border"/>
                                                    <div>
                                                        <p className="font-semibold">{t.receiptPreview}</p>
                                                        <button type="button" onClick={() => setReceiptImage(null)} className="text-sm text-primary-600 hover:underline">{t.changeReceipt}</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="relative border-2 border-dashed dark:border-slate-600 rounded-lg p-6 text-center">
                                                    <UploadIcon className="w-8 h-8 mx-auto text-slate-400 mb-2"/>
                                                    <label htmlFor="receipt-upload" className="font-semibold text-primary-600 cursor-pointer hover:underline">{t.uploadReceipt}</label>
                                                    <input id="receipt-upload" type="file" accept="image/*" onChange={handleReceiptUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {step === 'confirm' && (
                             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border dark:border-slate-700">
                                <h2 className="text-2xl font-bold mb-6">{t.orderSummary}</h2>
                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between items-start p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                        <div><span className="font-semibold">{t.shipTo}:</span><p className="text-slate-600 dark:text-slate-300">{deliveryDetails.name}<br/>{deliveryDetails.address}</p></div>
                                        <button onClick={() => setStep('delivery')} className="text-primary-600 hover:underline font-semibold">{t.edit}</button>
                                    </div>
                                    <div className="flex justify-between items-start p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                         <div><span className="font-semibold">{t.payWith}:</span><p className="text-slate-600 dark:text-slate-300">{paymentMethod === 'cod' ? t.cashOnDelivery : t.onlinePayment}</p></div>
                                        <button onClick={() => setStep('payment')} className="text-primary-600 hover:underline font-semibold">{t.edit}</button>
                                    </div>
                                </div>
                            </div>
                        )}
                         <div className="flex justify-between items-center mt-8">
                            <button onClick={handlePrevStep} disabled={step === 'delivery'} className="flex items-center gap-1 font-bold text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                                <ChevronLeftIcon className={`w-5 h-5 ${language === 'ar' ? 'transform scale-x-[-1]' : ''}`} />
                                {t.previousStep}
                            </button>
                             {step !== 'confirm' ? (
                                <button onClick={handleNextStep} disabled={(step === 'delivery' && !isDeliveryStepValid) || (step === 'payment' && !isPaymentStepValid)} className="bg-primary-600 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-1 hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:bg-slate-400 disabled:shadow-none disabled:transform-none">
                                    {t.nextStep}
                                    <ChevronRightIcon className={`w-5 h-5 ${language === 'ar' ? 'transform scale-x-[-1]' : ''}`} />
                                </button>
                             ) : (
                                  <button onClick={handleConfirmOrder} className="bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                                    {t.confirmPurchase}
                                </button>
                             )}
                        </div>
                    </div>
                    {/* Right/Side Column: Order Summary */}
                    <div className="lg:col-span-1">
                        <OrderSummary cartItems={cartItems} language={language} />
                    </div>
                </div>
            </main>
        </div>
    );
};