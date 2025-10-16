import React, { useState, useEffect, useRef } from 'react';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from '../../firebase';

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.617-3.317-11.28-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C44.464,36.336,48,30.455,48,24C48,22.659,47.862,21.35,47.611,20.083z" />
    </svg>
);


export const LoginPage: React.FC = () => {
    const { language, t, isProcessing } = useUI();
    const { staffLogin, sendOtp, verifyOtp, confirmationResult } = useAuth();

    const [activeTab, setActiveTab] = useState<'customer' | 'staff'>('customer');
    const [error, setError] = useState('');

    // Staff state
    const [staffMobile, setStaffMobile] = useState('');
    const [staffPassword, setStaffPassword] = useState('');

    // Customer state
    const [customerMobile, setCustomerMobile] = useState('');
    const [showOtp, setShowOtp] = useState(false);
    const [otp, setOtp] = useState(new Array(6).fill(""));
    const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        setError('');
        if (confirmationResult === null) {
            setShowOtp(false);
            setOtp(new Array(6).fill(""));
        }
    }, [activeTab, confirmationResult]);

    const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        e.preventDefault();
        window.location.hash = path;
    };

    const handleStaffLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const errorMessage = await staffLogin(staffMobile, staffPassword);
        if (errorMessage) {
            setError(errorMessage);
        } else {
            window.location.hash = '#/admin';
        }
    };
    
    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            // This will trigger the onAuthStateChanged listener in AuthContext, which handles the rest.
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Google Sign-In Error", error);
            setError("Failed to sign in with Google.");
        }
    };


    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        let phoneNumber = customerMobile.replace(/\D/g, '');

        if (phoneNumber.startsWith('0')) {
            phoneNumber = '20' + phoneNumber.substring(1);
        }
        
        const result = await sendOtp(`+${phoneNumber}`);
        if (result.success) {
            setShowOtp(true);
        } else {
            setError(result.error || 'Failed to send OTP.');
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const code = otp.join('');
        if (code.length !== 6) {
            setError('Please enter the 6-digit code.');
            return;
        }
        const errorMessage = await verifyOtp(code);
        if (errorMessage) {
            setError(errorMessage);
        }
    };
    
    const handleOtpChange = (element: HTMLInputElement, index: number) => {
        if (isNaN(Number(element.value))) return;

        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

        if (element.nextSibling && element.value) {
            (element.nextSibling as HTMLInputElement).focus();
        }
    };

    const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && !otp[index] && e.currentTarget.previousSibling) {
            (e.currentTarget.previousSibling as HTMLInputElement).focus();
        }
    };

    const TabButton: React.FC<{ tabId: 'customer' | 'staff'; label: string }> = ({ tabId, label }) => (
        <button
            type="button"
            role="tab"
            aria-selected={activeTab === tabId}
            onClick={() => setActiveTab(tabId)}
            className={`w-1/2 py-3 text-sm font-bold text-center transition-colors rounded-t-lg ${activeTab === tabId
                ? 'bg-white dark:bg-slate-800 text-primary-600 border-b-2 border-primary-500'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
        >
            {label}
        </button>
    );

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
            <div className="w-full max-w-md">
                <div className="flex">
                    <TabButton tabId="customer" label={language === 'ar' ? 'العملاء' : 'Customers'} />
                    <TabButton tabId="staff" label={language === 'ar' ? 'الموظفين' : 'Staff'} />
                </div>
                <div className="p-8 space-y-6 bg-white dark:bg-slate-800 rounded-b-2xl shadow-xl border-x border-b border-slate-200 dark:border-slate-700">
                    {activeTab === 'customer' ? (
                        <div>
                            <h1 className="text-2xl font-bold text-center text-primary-600 dark:text-primary-400 mb-2">{language === 'ar' ? 'أهلاً بك' : 'Welcome!'}</h1>
                            <p className="text-center text-slate-500 text-sm mb-6">{language === 'ar' ? 'اختر طريقة تسجيل الدخول' : 'Choose a way to sign in'}</p>
                            
                             <button
                                type="button"
                                onClick={handleGoogleLogin}
                                disabled={isProcessing}
                                className="w-full flex items-center justify-center gap-3 px-5 py-3 font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50"
                            >
                                <GoogleIcon />
                                {language === 'ar' ? 'المتابعة باستخدام جوجل' : 'Continue with Google'}
                            </button>

                             <div className="my-6 flex items-center">
                                <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                                <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400">OR</span>
                                <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                            </div>

                            {!showOtp ? (
                                <form className="space-y-6" onSubmit={handleSendOtp}>
                                    <div>
                                        <label htmlFor="customer-mobile" className="sr-only">{t.mobileNumber}</label>
                                        <input
                                            type="tel"
                                            id="customer-mobile"
                                            value={customerMobile}
                                            onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, ''))}
                                            className="w-full p-3 text-center tracking-wider text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition"
                                            placeholder={language === 'ar' ? 'المتابعة باستخدام رقم الهاتف' : 'Continue with Phone Number'}
                                            required
                                        />
                                    </div>
                                    <button type="submit" disabled={isProcessing || !customerMobile} className="w-full px-5 py-3 font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-primary-400">
                                        {isProcessing ? (language === 'ar' ? 'جار الإرسال...' : 'Sending...') : (language === 'ar' ? 'إرسال الرمز' : 'Send Code')}
                                    </button>
                                </form>
                            ) : (
                                <form className="space-y-6" onSubmit={handleVerifyOtp}>
                                    <p className="text-center text-sm">{language === 'ar' ? `أدخل الرمز المكون من 6 أرقام المرسل إلى +${customerMobile}` : `Enter the 6-digit code sent to +${customerMobile}`}</p>
                                    <div className="flex justify-center gap-2" dir="ltr">
                                        {otp.map((data, index) => (
                                            <input
                                                key={index}
                                                type="text"
                                                maxLength={1}
                                                value={data}
                                                onChange={e => handleOtpChange(e.target, index)}
                                                onKeyDown={e => handleOtpKeyDown(e, index)}
                                                onFocus={e => e.target.select()}
                                                ref={el => { otpInputs.current[index] = el }}
                                                className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg bg-slate-50 dark:bg-slate-700 dark:text-slate-100 focus:border-primary-500 focus:ring-primary-500"
                                            />
                                        ))}
                                    </div>
                                    <button type="submit" disabled={isProcessing} className="w-full px-5 py-3 font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-400">
                                        {isProcessing ? (language === 'ar' ? 'جار التحقق...' : 'Verifying...') : (language === 'ar' ? 'تحقق من الرمز' : 'Verify Code')}
                                    </button>
                                </form>
                            )}
                        </div>
                    ) : (
                        <div>
                            <h1 className="text-2xl font-bold text-center text-primary-600 dark:text-primary-400">{language === 'ar' ? 'تسجيل دخول الموظفين' : 'Staff Login'}</h1>
                            <form className="space-y-6 mt-6" onSubmit={handleStaffLogin}>
                                <div>
                                    <label htmlFor="staff-mobile" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">{t.username}</label>
                                    <input
                                        type="text"
                                        id="staff-mobile"
                                        value={staffMobile}
                                        onChange={(e) => setStaffMobile(e.target.value)}
                                        className="w-full p-3 text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="staff-password" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">{t.password}</label>
                                    <input
                                        type="password"
                                        id="staff-password"
                                        value={staffPassword}
                                        onChange={(e) => setStaffPassword(e.target.value)}
                                        className="w-full p-3 text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition"
                                        required
                                    />
                                </div>
                                <button type="submit" disabled={isProcessing} className="w-full px-5 py-3 font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-primary-400">
                                    {isProcessing ? (language === 'ar' ? 'جار الدخول...' : 'Logging in...') : t.login}
                                </button>
                                <div className="text-sm text-end">
                                    <a href="#/forgot-password" onClick={(e) => handleNav(e, '/forgot-password')} className="font-medium text-primary-600 hover:underline dark:text-primary-500">
                                        {t.forgotPassword}
                                    </a>
                                </div>
                            </form>
                        </div>
                    )}
                    {error && <p className="text-sm text-red-500 text-center mt-4">{error}</p>}
                     <div className="text-center border-t border-slate-200 dark:border-slate-700 pt-4 mt-6">
                        <a href="#/" onClick={(e) => handleNav(e, '/')} className="text-sm text-primary-600 hover:underline dark:text-primary-500">
                            {t.backToMenu}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};