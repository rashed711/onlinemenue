import React, { useState, useEffect, useRef } from 'react';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';

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

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        // The '+' is prepended in the AuthContext, so the user should not enter it.
        const result = await sendOtp(`+${customerMobile}`);
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
        // Success is handled by AuthContext (redirect or show profile modal)
    };
    
    const handleOtpChange = (element: HTMLInputElement, index: number) => {
        if (isNaN(Number(element.value))) return;

        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

        // Focus next input
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
                            <p className="text-center text-slate-500 text-sm mb-6">{language === 'ar' ? 'أدخل رقم هاتفك للمتابعة' : 'Enter your phone number to continue'}</p>
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
                                            placeholder={language === 'ar' ? 'مثال: 201012345678 (مع كود الدولة)' : 'e.g., 201012345678 (with country code)'}
                                            required
                                        />
                                    </div>
                                    <button type="submit" disabled={isProcessing} className="w-full px-5 py-3 font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-primary-400">
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
