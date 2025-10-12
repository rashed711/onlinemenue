import React, { useState } from 'react';
import type { Language, User } from '../../types';
import { useTranslations } from '../../i18n/translations';

interface ForgotPasswordPageProps {
    language: Language;
    users: User[];
    onPasswordReset: (user: User, newPassword: string) => Promise<boolean>;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ language, users, onPasswordReset }) => {
    const t = useTranslations(language);
    const [step, setStep] = useState(1); // 1 for mobile input, 2 for password reset
    const [mobile, setMobile] = useState('');
    const [userToReset, setUserToReset] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        e.preventDefault();
        window.location.hash = path;
    };

    const handleMobileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const userExists = users.find(u => u.mobile === mobile);
        if (userExists) {
            setUserToReset(userExists);
            setStep(2);
        } else {
            setError(t.mobileNotFound);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!userToReset) {
            setError('An unexpected error occurred.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError(t.passwordsDoNotMatch);
            return;
        }
        if (newPassword.length < 6) { // Basic validation
            setError('Password must be at least 6 characters long.');
            return;
        }
        
        const resetSuccess = await onPasswordReset(userToReset, newPassword);
        if (resetSuccess) {
            setSuccess(t.passwordResetSuccess);
            // Don't redirect immediately, show the success message
        } else {
            setError('Failed to reset password. Please try again.'); 
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                <h1 className="text-3xl font-bold text-center text-primary-600 dark:text-primary-400">{t.resetPassword}</h1>
                
                {success ? (
                    <div className="text-center">
                        <p className="text-green-600 dark:text-green-400 mb-4">{success}</p>
                        <a href="#/login" onClick={(e) => handleNav(e, '/login')} className="font-medium text-primary-600 hover:underline dark:text-primary-500">
                            {t.backToLogin}
                        </a>
                    </div>
                ) : step === 1 ? (
                    <form className="space-y-6" onSubmit={handleMobileSubmit}>
                        <p className="text-center text-slate-600 dark:text-slate-300">{t.enterMobilePrompt}</p>
                        <div>
                            <label htmlFor="mobile" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">
                                {t.mobileNumber}
                            </label>
                            <input
                                type="text"
                                id="mobile"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                className="w-full p-3 text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition"
                                required
                            />
                        </div>
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <button type="submit" className="w-full px-5 py-3 text-base font-medium text-center text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-800 transition shadow-md">
                            Continue
                        </button>
                    </form>
                ) : (
                    <form className="space-y-6" onSubmit={handlePasswordSubmit}>
                        <div>
                            <label htmlFor="newPassword" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">
                                {t.newPassword}
                            </label>
                            <input
                                type="password"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full p-3 text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">
                                {t.confirmNewPassword}
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full p-3 text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition"
                                required
                            />
                        </div>
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                        <button type="submit" className="w-full px-5 py-3 text-base font-medium text-center text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-800 transition shadow-md">
                            {t.resetPassword}
                        </button>
                    </form>
                )}

                {!success && (
                    <div className="text-center border-t border-slate-200 dark:border-slate-700 pt-4">
                        <a href="#/login" onClick={(e) => handleNav(e, '/login')} className="text-sm text-primary-600 hover:underline dark:text-primary-500">
                            {t.backToLogin}
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};