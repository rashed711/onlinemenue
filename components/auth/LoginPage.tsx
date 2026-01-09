import React, { useState, useEffect } from 'react';
import { useUI } from '../../contexts/UIContext';
import { useAuth } from '../../contexts/AuthContext';

export const LoginPage: React.FC = () => {
    const { t, isProcessing } = useUI();
    const { unifiedLogin, registerWithEmailPassword } = useAuth();

    const [formType, setFormType] = useState<'login' | 'register'>('login');
    const [error, setError] = useState('');

    // Unified login state
    const [identifier, setIdentifier] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register state
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        setError('');
    }, [formType]);

    const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        e.preventDefault();
        window.location.hash = path;
    };

    const handleUnifiedLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const errorMessage = await unifiedLogin(identifier, loginPassword);
        if (errorMessage) {
            setError(errorMessage);
        }
        // On success, context handles redirect
    };

    const handleCustomerRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (registerPassword !== confirmPassword) {
            setError(t.passwordsDoNotMatch);
            return;
        }
        const errorMessage = await registerWithEmailPassword({ name, mobile, email, password: registerPassword });
        if (errorMessage) {
            setError(errorMessage);
        } else {
            // Success toast is shown from AuthContext.
            // Switch to login form for a better UX.
            setFormType('login');
            setName('');
            setMobile('');
            setEmail('');
            setRegisterPassword('');
            setConfirmPassword('');
        }
    };

    const renderLoginForm = () => (
        <form className="space-y-4" onSubmit={handleUnifiedLogin}>
            <div>
                <label htmlFor="identifier" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">{t.emailOrMobile}</label>
                <input 
                    type="text" 
                    id="identifier" 
                    value={identifier} 
                    onChange={(e) => setIdentifier(e.target.value)} 
                    className="w-full p-3 text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition" 
                    required 
                />
            </div>
            <div>
                <label htmlFor="login-password" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">{t.password}</label>
                <input 
                    type="password" 
                    id="login-password" 
                    value={loginPassword} 
                    onChange={(e) => setLoginPassword(e.target.value)} 
                    className="w-full p-3 text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition" 
                    required 
                />
            </div>
            <button type="submit" disabled={isProcessing} className="w-full px-5 py-3 font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-primary-400">
                {isProcessing ? '...' : t.login}
            </button>
        </form>
    );

    const renderRegisterForm = () => (
        <form className="space-y-4" onSubmit={handleCustomerRegister}>
            <div>
                <label htmlFor="name" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">{t.name}</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition" required />
            </div>
            <div>
                <label htmlFor="mobile" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">{t.mobileNumber}</label>
                <input type="tel" id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full p-3 text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition" required />
            </div>
            <div>
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">{t.email}</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition" required />
            </div>
            <div>
                <label htmlFor="register-password" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">{t.password}</label>
                <input type="password" id="register-password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} className="w-full p-3 text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition" required />
            </div>
            <div>
                <label htmlFor="confirmPassword" className="block mb-2 text-sm font-medium text-slate-800 dark:text-slate-300">{t.confirmNewPassword}</label>
                <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-3 text-slate-900 bg-slate-50 dark:bg-slate-700 dark:text-white border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition" required />
            </div>
            <button type="submit" disabled={isProcessing} className="w-full px-5 py-3 font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-primary-400">
                {isProcessing ? '...' : t.createAccount}
            </button>
        </form>
    );

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 p-4">
            <div className="w-full max-w-sm">
                <div className="p-8 space-y-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                    <h1 className="text-2xl font-bold text-center text-primary-600 dark:text-primary-400 mb-6">
                        {formType === 'login' ? t.login : t.createAccount}
                    </h1>

                    {formType === 'login' ? renderLoginForm() : renderRegisterForm()}
                    
                    {error && <p className="text-sm text-red-500 text-center mt-4">{error}</p>}
                    
                    <div className="space-y-2 text-sm text-center mt-4">
                        {formType === 'login' ? (
                            <p>
                                <span className="text-slate-600 dark:text-slate-400">{t.dontHaveAccount} </span>
                                <button onClick={() => setFormType('register')} className="font-medium text-primary-600 hover:underline dark:text-primary-500">{t.createAccount}</button>
                            </p>
                        ) : (
                            <p>
                                <span className="text-slate-600 dark:text-slate-400">{t.alreadyHaveAccount} </span>
                                <button onClick={() => setFormType('login')} className="font-medium text-primary-600 hover:underline dark:text-primary-500">{t.login}</button>
                            </p>
                        )}
                        {formType === 'login' && (
                            <p>
                                <a href="#/forgot-password" onClick={(e) => handleNav(e, '/forgot-password')} className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-500">
                                    {t.forgotPassword}
                                </a>
                            </p>
                        )}
                    </div>

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